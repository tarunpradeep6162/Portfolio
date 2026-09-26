import type { ChatTurn } from "./protocol";

/**
 * Optional free-tier AI for RC-01, via the OpenAI-compatible chat API that
 * both Google Gemini and Groq expose. Set ONE of these in Vercel:
 *
 *   GEMINI_API_KEY  - free key from https://aistudio.google.com/apikey
 *   GROQ_API_KEY    - free key from https://console.groq.com/keys
 *
 * RC01_FREE_MODEL overrides the default model id if a provider renames it.
 * Free tiers are rate-limited and may use prompts to improve the provider's
 * models, which is why this path never sends anything but the visitor's
 * question, the conversation, and public portfolio content.
 */
export interface FreeProviderConfig {
  name: "gemini" | "groq";
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function freeProviderConfig(env: NodeJS.ProcessEnv = process.env): FreeProviderConfig | null {
  if (env.GEMINI_API_KEY) {
    return {
      name: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: env.GEMINI_API_KEY,
      model: env.RC01_FREE_MODEL ?? "gemini-2.5-flash",
    };
  }
  if (env.GROQ_API_KEY) {
    return {
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: env.GROQ_API_KEY,
      model: env.RC01_FREE_MODEL ?? "llama-3.3-70b-versatile",
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

/** Streams text deltas from an OpenAI-compatible /chat/completions endpoint. */
export async function* streamFreeChat(
  config: FreeProviderConfig,
  {
    system,
    turns,
    maxTokens,
    signal,
    fetchImpl = fetch,
  }: {
    system: string;
    turns: ChatTurn[];
    maxTokens: number;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
  },
): AsyncGenerator<string> {
  const res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      stream: true,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...turns],
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new FreeProviderError(`${config.name} ${res.status}: ${detail.slice(0, 200)}`, res.status);
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
