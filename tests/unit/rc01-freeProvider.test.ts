import { describe, it, expect } from "vitest";
import { freeProviderConfig, streamFreeChat, FreeProviderError } from "@/lib/rc01/freeProvider";
import { FREE_SYSTEM_PROMPT, SYSTEM_PROMPT } from "@/lib/rc01/prompt";

function sseResponse(frames: string[], status = 200) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      // Split mid-frame to exercise buffering.
      const all = frames.join("");
      controller.enqueue(enc.encode(all.slice(0, 17)));
      controller.enqueue(enc.encode(all.slice(17)));
      controller.close();
    },
  });
  return new Response(body, { status });
}

describe("free provider", () => {
  it("prefers Gemini, then Groq, else none", () => {
    expect(freeProviderConfig({ GEMINI_API_KEY: "g", GROQ_API_KEY: "q" } as unknown as NodeJS.ProcessEnv)?.name).toBe("gemini");
    expect(freeProviderConfig({ GROQ_API_KEY: "q" } as unknown as NodeJS.ProcessEnv)?.name).toBe("groq");
    expect(freeProviderConfig({ GROQ_API_KEY: "q", RC01_FREE_MODEL: "m" } as unknown as NodeJS.ProcessEnv)?.model).toBe("m");
    expect(freeProviderConfig({} as unknown as NodeJS.ProcessEnv)).toBeNull();
  });

  it("streams text deltas from OpenAI-compatible SSE and sends the system prompt", async () => {
    let sent: { url: string; body: Record<string, unknown>; auth: string | null } | undefined;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      sent = { url, body: JSON.parse(String(init.body)), auth: new Headers(init.headers).get("authorization") };
      return sseResponse([
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        ": keep-alive\n\n",
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        "data: [DONE]\n\n",
      ]);
    }) as unknown as typeof fetch;
    const config = freeProviderConfig({ GROQ_API_KEY: "secret" } as unknown as NodeJS.ProcessEnv)!;
    const out: string[] = [];
    for await (const t of streamFreeChat(config, { system: "SYS", turns: [{ role: "user", content: "hi" }], maxTokens: 10, fetchImpl })) out.push(t);
    expect(out.join("")).toBe("Hello world");
    expect(sent?.url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(sent?.auth).toBe("Bearer secret");
    expect(sent?.body.messages).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "hi" },
    ]);
  });

  it("raises a typed error on HTTP failure", async () => {
    const fetchImpl = (async () => new Response("quota", { status: 429 })) as unknown as typeof fetch;
    const config = freeProviderConfig({ GEMINI_API_KEY: "k" } as unknown as NodeJS.ProcessEnv)!;
    const run = async () => {
      for await (const _ of streamFreeChat(config, { system: "", turns: [], maxTokens: 1, fetchImpl })) void _;
    };
    await expect(run()).rejects.toBeInstanceOf(FreeProviderError);
  });

  it("uses the same persona and knowledge, without the page-action tool guidance", () => {
    expect(FREE_SYSTEM_PROMPT).not.toContain("# Acting on the page");
    expect(FREE_SYSTEM_PROMPT).toContain("# Boundaries");
    expect(FREE_SYSTEM_PROMPT).toContain("# Knowledge base");
    expect(FREE_SYSTEM_PROMPT.length).toBeLessThan(SYSTEM_PROMPT.length);
  });
});
