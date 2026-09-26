import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { parseAction } from "@/lib/rc01/actions";
import { contextPreamble, FREE_SYSTEM_PROMPT, SYSTEM_PROMPT } from "@/lib/rc01/prompt";
import { encodeEvent, validateRequest, type Rc01StreamEvent } from "@/lib/rc01/protocol";
import { createRateLimiter } from "@/lib/rc01/rateLimit";
import { RC01_TOOLS } from "@/lib/rc01/tools";
import { answerLocally } from "@/lib/rc01/localBrain";
import { freeProviderConfig, streamFreeChat } from "@/lib/rc01/freeProvider";
import type { ChatTurn, VisitorContext } from "@/lib/rc01/protocol";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RC-01's conversational endpoint.
 *
 * Model and effort are environment-configurable so cost/quality can be tuned
 * from Vercel without a deploy. Effort defaults to "medium": RC-01 answers
 * general questions (including code), so it needs more than "low", while
 * chat latency still rules out "high".
 */
const MODEL = process.env.RC01_MODEL ?? "claude-opus-5";
const EFFORT = (process.env.RC01_EFFORT ?? "medium") as "low" | "medium" | "high";
// Hard per-response ceiling: room for a code sample or a how-to, not essays.
const MAX_TOKENS = 4096;
// A turn can be text -> tool call -> text; three model calls is ample.
const MAX_MODEL_CALLS = 3;

const perVisitor = createRateLimiter({
  limit: Number(process.env.RC01_VISITOR_LIMIT ?? 20),
  windowMs: 10 * 60 * 1000,
});
const perInstance = createRateLimiter({
  limit: Number(process.env.RC01_INSTANCE_HOURLY_LIMIT ?? 400),
  windowMs: 60 * 60 * 1000,
});

const INJECTION_SIGNALS =
  /ignore (all|any|previous|prior)|system prompt|you are now|developer mode|jailbreak|reveal your (instructions|prompt)/i;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ maxRetries: 1, timeout: 45_000 });
  return client;
}

/**
 * Which brain answers, picked from the environment on every request:
 * - "claude": ANTHROPIC_API_KEY set - full assistant with page actions.
 * - "free":   GEMINI_API_KEY or GROQ_API_KEY set - free-tier general
 *             assistant (text only, no page actions).
 * - "local":  no key - the built-in engine answers portfolio questions at
 *             zero cost. Always available, and the fallback for the others.
 */
export type BrainMode = "claude" | "free" | "local" | "off";

function brainMode(): BrainMode {
  if (process.env.RC01_DISABLED === "true") return "off";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (freeProviderConfig()) return "free";
  return "local";
}

/** No Origin header = same-origin navigation/fetch; "null" or garbage = reject. */
function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function jsonError(status: number, message: string, headers: HeadersInit = {}) {
  return Response.json({ error: message, fallback: true }, { status, headers });
}

/** Lets the client decide whether to offer AI chat or only the command console. */
export async function GET() {
  const mode = brainMode();
  return Response.json({ enabled: mode !== "off", mode }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const mode = brainMode();
  if (mode === "off") return jsonError(503, "RC-01's chat is switched off.");

  // Same-origin only: the endpoint is the site's own feature, not a free
  // public proxy to a paid API.
  if (!isSameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return jsonError(403, "Cross-origin requests are not allowed.");
  }

  const visitorKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const visitorCheck = perVisitor.check(visitorKey);
  if (!visitorCheck.allowed) {
    return jsonError(429, "You've asked a lot of questions in a short time - give me a minute.", {
      "Retry-After": String(visitorCheck.retryAfterSeconds),
    });
  }
  if (!perInstance.check("instance").allowed) {
    return jsonError(429, "RC-01 is very busy right now. Try again shortly.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON.");
  }
  const parsed = validateRequest(body);
  if (!parsed.ok) return jsonError(400, parsed.error);
  const { messages: turns, context } = parsed.value;

  const latest = turns[turns.length - 1].content;
  if (INJECTION_SIGNALS.test(latest)) {
    console.warn(JSON.stringify({ event: "rc01.injection_signal", sample: latest.slice(0, 160) }));
  }

  if (mode !== "claude") return streamAlternative(request, mode, turns, context);

  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((turn, index) =>
    index === turns.length - 1
      ? {
          role: "user",
          content: [
            { type: "text", text: contextPreamble(context) },
            { type: "text", text: turn.content },
          ],
        }
      : { role: turn.role, content: turn.content },
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentText = false;
      const send = (event: Rc01StreamEvent) => {
        if (event.type === "text") sentText = true;
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      try {
        for (let call = 1; call <= MAX_MODEL_CALLS; call++) {
          const modelStream = getClient().beta.messages.stream(
            {
              model: MODEL,
              max_tokens: MAX_TOKENS,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
              output_config: { effort: EFFORT },
              system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
              tools: RC01_TOOLS,
              messages,
            },
            { signal: request.signal },
          );

          for await (const event of modelStream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              send({ type: "text", text: event.delta.text });
            }
          }
          const message = await modelStream.finalMessage();
          logUsage(message);

          if (message.stop_reason === "refusal") {
            send({ type: "text", text: "That's not something I can help with, but I'm happy to help with something else." });
            send({ type: "done", reason: "refused" });
            break;
          }
          // A turn cut off by max_tokens may carry a truncated tool input
          // that still looks valid; never act on it.
          if (message.stop_reason === "max_tokens") {
            send({ type: "done", reason: "truncated" });
            break;
          }

          const toolUses = message.content.filter(
            (block): block is Anthropic.Beta.BetaToolUseBlock => block.type === "tool_use",
          );
          if (message.stop_reason !== "tool_use" || toolUses.length === 0) {
            send({ type: "done", reason: "complete" });
            break;
          }

          // Execute = validate + relay to the browser. Every tool_use gets a
          // result in one user message (parallel calls stay parallel).
          const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((use) => {
            const action = parseAction(use.name, use.input);
            if (!action) {
              return {
                type: "tool_result",
                tool_use_id: use.id,
                is_error: true,
                content: "Rejected: input outside the allowed values.",
              };
            }
            send({ type: "action", action });
            return { type: "tool_result", tool_use_id: use.id, content: "Done on the visitor's page." };
          });

          if (call === MAX_MODEL_CALLS) {
            send({ type: "done", reason: "complete" });
            break;
          }
          messages.push({ role: "assistant", content: message.content });
          messages.push({ role: "user", content: results });
        }
      } catch (error) {
        if (request.signal.aborted) {
          // Visitor pressed stop or navigated away - nothing to report.
        } else if (!sentText) {
          // Nothing reached the visitor yet: answer from the built-in engine
          // instead of showing an error.
          console.error(JSON.stringify({ event: "rc01.claude_fallback_local", message: String(error) }));
          sendLocal(send, latest);
        } else if (error instanceof Anthropic.RateLimitError) {
          send({ type: "error", message: "RC-01 is at capacity right now. Try again in a moment.", fallback: true });
        } else if (error instanceof Anthropic.AuthenticationError) {
          console.error(JSON.stringify({ event: "rc01.auth_error" }));
          send({ type: "error", message: "RC-01's conversational mode is offline.", fallback: true });
        } else if (error instanceof Anthropic.APIError) {
          console.error(JSON.stringify({ event: "rc01.api_error", status: error.status, message: error.message }));
          send({ type: "error", message: "RC-01 lost its connection. Try again.", fallback: true });
        } else {
          console.error(JSON.stringify({ event: "rc01.unexpected_error", message: String(error) }));
          send({ type: "error", message: "Something went wrong on RC-01's side.", fallback: true });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by an aborted client connection.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function logUsage(message: Anthropic.Beta.BetaMessage) {
  const usage = message.usage;
  console.info(
    JSON.stringify({
      event: "rc01.usage",
      model: message.model,
      stop_reason: message.stop_reason,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read_input_tokens: usage.cache_read_input_tokens,
      cache_creation_input_tokens: usage.cache_creation_input_tokens,
    }),
  );
}

function sendLocal(send: (event: Rc01StreamEvent) => void, question: string) {
  const local = answerLocally(question);
  // Word-sized chunks so the client's streaming path (typing, live speech)
  // behaves the same as with a model.
  for (const piece of local.text.match(/\S+\s*|\s+/g) ?? []) send({ type: "text", text: piece });
  for (const action of local.actions) send({ type: "action", action });
  send({ type: "done", reason: "complete" });
}

/** Free-tier provider or built-in engine, over the same NDJSON protocol. */
function streamAlternative(
  request: NextRequest,
  mode: "free" | "local",
  turns: ChatTurn[],
  context: VisitorContext,
): Response {
  const latest = turns[turns.length - 1].content;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Rc01StreamEvent) => controller.enqueue(encoder.encode(encodeEvent(event)));
      const config = mode === "free" ? freeProviderConfig() : null;
      try {
        if (!config) {
          sendLocal(send, latest);
          return;
        }
        const withContext: ChatTurn[] = turns.map((turn, index) =>
          index === turns.length - 1
            ? { role: "user", content: `${contextPreamble(context)}\n\n${turn.content}` }
            : turn,
        );
        let sentText = false;
        try {
          for await (const text of streamFreeChat(config, {
            system: FREE_SYSTEM_PROMPT,
            turns: withContext,
            maxTokens: MAX_TOKENS,
            signal: request.signal,
          }, (model, error) =>
            console.warn(JSON.stringify({ event: "rc01.free_model_failover", model, status: error.status })),
          )) {
            sentText = true;
            send({ type: "text", text });
          }
          if (!sentText) sendLocal(send, latest);
          else send({ type: "done", reason: "complete" });
        } catch (error) {
          if (request.signal.aborted) return;
          console.error(JSON.stringify({ event: "rc01.free_provider_error", provider: config.name, message: String(error) }));
          if (!sentText) sendLocal(send, latest);
          else send({ type: "error", message: "RC-01 lost its connection. Try again.", fallback: true });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed by an aborted client connection.
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
