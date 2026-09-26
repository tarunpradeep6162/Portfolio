import type { ChatTurn } from "./protocol";

/**
 * Optional free-tier AI for RC-01, via the OpenAI-compatible chat API that
 * both Google Gemini and Groq expose. Set ONE of these in Vercel:
 *
 *   GEMINI_API_KEY  - free key from https://aistudio.google.com/apikey
 *   GROQ_API_KEY    - free key from https://console.groq.com/keys
 *
 * RC01_FREE_MODEL overrides the model chain (comma-separated, tried in
 * order when a model is overloaded, rate-limited or retired).
 * Free tiers are rate-limited and may use prompts to improve the provider's
 * models, which is why this path never sends anything but the visitor's
 * question, the conversation, and public portfolio content.
 */
export interface FreeProviderConfig {
  name: "gemini" | "groq";
  baseUrl: string;
  apiKey: string;
  /** Tried in order; the first that starts answering wins. */
  models: string[];
}

const parseModels = (value: string | undefined, fallback: string[]) =>
  value ? value.split(",").map((m) => m.trim()).filter(Boolean) : fallback;

export function freeProviderConfig(env: NodeJS.ProcessEnv = process.env): FreeProviderConfig | null {
  if (env.GEMINI_API_KEY) {
    return {
      name: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: env.GEMINI_API_KEY,
      models: parseModels(env.RC01_FREE_MODEL, ["gemini-3.8-flash", "gemini-flash-latest", "gemini-flash-lite-latest"]),
    };
  }
  if (env.GROQ_API_KEY) {
    return {
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: env.GROQ_API_KEY,
      models: parseModels(env.RC01_FREE_MODEL, ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]),
    };
  }
  return null;
}

export class FreeProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type StreamOptions = {
  system: string;
  turns: ChatTurn[];
  maxTokens: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

/** Overloaded, rate-limited, erroring, or retired: worth trying the next model. */
const RETRYABLE = new Set([404, 408, 429, 500, 502, 503, 504]);

/**
 * Streams from the first model in the chain that starts answering. Failover
 * only happens before any text has been yielded - never mid-answer.
 */
export async function* streamFreeChat(
  config: FreeProviderConfig,
  options: StreamOptions,
  onFailover?: (model: string, error: FreeProviderError) => void,
): AsyncGenerator<string> {
  let lastError: FreeProviderError | undefined;
  for (const model of config.models) {
    let yielded = false;
    try {
      for await (const text of streamModel(config, model, options)) {
        yielded = true;
        yield text;
      }
      return;
    } catch (error) {
      if (yielded || !(error instanceof FreeProviderError) || !RETRYABLE.has(error.status)) throw error;
      lastError = error;
      onFailover?.(model, error);
    }
  }
  throw lastError ?? new FreeProviderError(`${config.name}: no models configured`, 500);
}

/** Streams text deltas from an OpenAI-compatible /chat/completions endpoint. */
async function* streamModel(
  config: FreeProviderConfig,
  model: string,
  { system, turns, maxTokens, signal, fetchImpl = fetch }: StreamOptions,
): AsyncGenerator<string> {
  const res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...turns],
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new FreeProviderError(`${config.name}/${model} ${res.status}: ${detail.slice(0, 200)}`, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += done ? "" : decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = done ? "" : (lines.pop() ?? "");
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const text = json.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        // Keep-alive or partial frame - ignore.
      }
    }
    if (done) return;
  }
}
