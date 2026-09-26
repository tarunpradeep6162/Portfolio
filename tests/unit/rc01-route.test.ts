// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Exercises /api/rc01 end to end against a scripted fake of the Anthropic
 * SDK - the tool loop, validation, streaming wire format and failure paths
 * - without network access or API spend.
 */
type ScriptedTurn = {
  deltas: string[];
  final: {
    stop_reason: string;
    content: Array<Record<string, unknown>>;
  };
};

const script: { turns: ScriptedTurn[]; calls: Array<Record<string, unknown>>; throwError?: Error } = {
  turns: [],
  calls: [],
};

vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  class RateLimitError extends APIError {}
  class AuthenticationError extends APIError {}

  class Anthropic {
    static APIError = APIError;
    static RateLimitError = RateLimitError;
    static AuthenticationError = AuthenticationError;
    beta = {
      messages: {
        stream: (params: Record<string, unknown>) => {
          // Snapshot: the route mutates its messages array between calls.
          script.calls.push(structuredClone(params));
          if (script.throwError) throw script.throwError;
          const turn = script.turns.shift();
          if (!turn) throw new Error("no scripted turn left");
          return {
            async *[Symbol.asyncIterator]() {
              for (const text of turn.deltas) {
                yield { type: "content_block_delta", delta: { type: "text_delta", text } };
              }
            },
            finalMessage: async () => ({
              model: "claude-opus-5",
              usage: { input_tokens: 10, output_tokens: 5 },
              ...turn.final,
            }),
          };
        },
      },
    };
  }
  return { default: Anthropic };
});

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/rc01/route");
}

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/rc01", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost", ...headers },
    body: JSON.stringify(body),
  });
}

async function readEvents(response: Response) {
  const text = await response.text();
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const question = {
  messages: [{ role: "user", content: "Show me Project Aurora" }],
  context: { path: "/", section: null, audience: null, dwellSeconds: 0 },
};

describe("/api/rc01", () => {
  beforeEach(() => {
    script.turns = [];
    script.calls = [];
    script.throwError = undefined;
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.RC01_DISABLED;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("reports offline and refuses chat when no API key is configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { GET, POST } = await loadRoute();
    expect(await (await GET()).json()).toEqual({ enabled: false });
    const res = await POST(post(question) as never);
    expect(res.status).toBe(503);
    expect(script.calls).toHaveLength(0);
  });

  it("streams text, relays valid actions, rejects invalid ones back to the model, then finishes", async () => {
    script.turns = [
      {
        deltas: ["Opening ", "it now. "],
        final: {
          stop_reason: "tool_use",
          content: [
            { type: "text", text: "Opening it now. " },
            { type: "tool_use", id: "t1", name: "navigate", input: { path: "/work/project-aurora" } },
            { type: "tool_use", id: "t2", name: "gesture", input: { gesture: "moonwalk" } },
          ],
        },
      },
      {
        deltas: ["Here it is."],
        final: { stop_reason: "end_turn", content: [{ type: "text", text: "Here it is." }] },
      },
    ];
    const { POST } = await loadRoute();
    const res = await POST(post(question) as never);
    expect(res.headers.get("content-type")).toMatch(/ndjson/);

    expect(await readEvents(res)).toEqual([
      { type: "text", text: "Opening " },
      { type: "text", text: "it now. " },
      { type: "action", action: { type: "navigate", path: "/work/project-aurora" } },
      { type: "text", text: "Here it is." },
      { type: "done", reason: "complete" },
    ]);

    // Second model call carries the assistant turn + one user message with
    // a result for *every* tool_use, the invalid one flagged as an error.
    const second = script.calls[1] as { messages: Array<{ role: string; content: unknown }> };
    const toolResults = second.messages.at(-1)!.content as Array<Record<string, unknown>>;
    expect(toolResults).toEqual([
      expect.objectContaining({ type: "tool_result", tool_use_id: "t1" }),
      expect.objectContaining({ type: "tool_result", tool_use_id: "t2", is_error: true }),
    ]);
  });

  it("sends a cacheable system prompt, refusal fallbacks, and the visitor context in the user turn", async () => {
    script.turns = [{ deltas: ["Hi."], final: { stop_reason: "end_turn", content: [] } }];
    const { POST } = await loadRoute();
    await readEvents(await POST(post(question) as never));

    const params = script.calls[0] as Record<string, unknown>;
    expect(params.model).toBe("claude-opus-5");
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toContain("server-side-fallback-2026-07-01");
    expect(params.output_config).toEqual({ effort: "medium" });
    const system = params.system as Array<{ cache_control?: unknown }>;
    expect(system[0].cache_control).toEqual({ type: "ephemeral" });

    const messages = params.messages as Array<{ content: Array<{ text: string }> }>;
    const [contextBlock, questionBlock] = messages[0].content;
    expect(contextBlock.text).toContain("<visitor_context>");
    expect(questionBlock.text).toBe("Show me Project Aurora");
  });

  it("never acts on a turn cut off by max_tokens", async () => {
    script.turns = [
      {
        deltas: ["Let me open"],
        final: {
          stop_reason: "max_tokens",
          content: [{ type: "tool_use", id: "t1", name: "navigate", input: { path: "/about" } }],
        },
      },
    ];
    const { POST } = await loadRoute();
    const events = await readEvents(await POST(post(question) as never));
    expect(events.some((e) => e.type === "action")).toBe(false);
    expect(events.at(-1)).toEqual({ type: "done", reason: "truncated" });
  });

  it("handles a refusal with a steer-back message", async () => {
    script.turns = [{ deltas: [], final: { stop_reason: "refusal", content: [] } }];
    const { POST } = await loadRoute();
    const events = await readEvents(await POST(post(question) as never));
    expect(events.at(-1)).toEqual({ type: "done", reason: "refused" });
    expect(events[0].text).toMatch(/not something I can help with/);
  });

  it("turns API failures into a fallback error event, not a crash", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default as unknown as {
      RateLimitError: new (status: number, message: string) => Error;
    };
    script.throwError = new Anthropic.RateLimitError(429, "slow down");
    const { POST } = await loadRoute();
    const events = await readEvents(await POST(post(question) as never));
    expect(events).toEqual([expect.objectContaining({ type: "error", fallback: true })]);
  });

  it("rejects cross-origin requests and invalid bodies before calling the model", async () => {
    const { POST } = await loadRoute();
    expect((await POST(post(question, { origin: "https://evil.example" }) as never)).status).toBe(403);
    expect((await POST(post(question, { origin: "null" }) as never)).status).toBe(403);
    expect((await POST(post({ messages: [] }) as never)).status).toBe(400);
    expect(script.calls).toHaveLength(0);
  });

  it("rate-limits a single visitor", async () => {
    process.env.RC01_VISITOR_LIMIT = "2";
    script.turns = Array.from({ length: 3 }, () => ({
      deltas: ["ok"],
      final: { stop_reason: "end_turn", content: [] },
    }));
    const { POST } = await loadRoute();
    const headers = { "x-forwarded-for": "203.0.113.9" };
    await readEvents(await POST(post(question, headers) as never));
    await readEvents(await POST(post(question, headers) as never));
    const third = await POST(post(question, headers) as never);
    expect(third.status).toBe(429);
    expect(third.headers.get("retry-after")).toBeTruthy();
    delete process.env.RC01_VISITOR_LIMIT;
  });
});
