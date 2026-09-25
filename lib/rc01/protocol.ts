import { audiences, parseAction, type Audience, type Rc01Action } from "./actions";

/**
 * Wire format between /api/rc01 and the browser: newline-delimited JSON,
 * one event per line. Kept deliberately tiny and framework-free so it can be
 * unit-tested without a server and parsed incrementally from a fetch body.
 */
export type Rc01StreamEvent =
  | { type: "text"; text: string }
  | { type: "action"; action: Rc01Action }
  | { type: "done"; reason: "complete" | "refused" | "truncated" }
  | { type: "error"; message: string; fallback: boolean };

export function encodeEvent(event: Rc01StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

/** Parses one NDJSON line; drops anything malformed or out of policy. */
export function parseEventLine(line: string): Rc01StreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const event = raw as Record<string, unknown>;
  switch (event.type) {
    case "text":
      return typeof event.text === "string" ? { type: "text", text: event.text } : null;
    case "action": {
      const action = event.action as Record<string, unknown> | undefined;
      const parsed = action ? parseAction(action.type, action) : null;
      return parsed ? { type: "action", action: parsed } : null;
    }
    case "done":
      return event.reason === "refused" || event.reason === "truncated"
        ? { type: "done", reason: event.reason }
        : { type: "done", reason: "complete" };
    case "error":
      return {
        type: "error",
        message: typeof event.message === "string" ? event.message : "RC-01 is unavailable.",
        fallback: event.fallback === true,
      };
    default:
      return null;
  }
}

/**
 * Incremental NDJSON splitter: feed it decoded chunks, get back complete
 * events. Holds a partial trailing line between chunks.
 */
export function createEventParser() {
  let buffer = "";
  return {
    push(chunk: string): Rc01StreamEvent[] {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      return lines.map(parseEventLine).filter((e): e is Rc01StreamEvent => e !== null);
    },
    flush(): Rc01StreamEvent[] {
      const rest = parseEventLine(buffer);
      buffer = "";
      return rest ? [rest] : [];
    },
  };
}

// ---------------------------------------------------------------------------
// Request contract
// ---------------------------------------------------------------------------

export const LIMITS = {
  maxTurns: 12,
  maxMessageChars: 800,
  maxPathChars: 120,
} as const;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface VisitorContext {
  path: string;
  section: string | null;
  audience: Audience | null;
  dwellSeconds: number;
  returningVisitor: boolean;
}

export interface Rc01Request {
  messages: ChatTurn[];
  context: VisitorContext;
}

export type ValidationResult =
  | { ok: true; value: Rc01Request }
  | { ok: false; error: string };

/**
 * Server-side validation of an untrusted request body. History must strictly
 * alternate and end on a user turn; every string is length-capped so a
 * visitor can't inflate token spend by pasting a novel.
 */
export function validateRequest(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid body." };
  const { messages, context } = body as { messages?: unknown; context?: unknown };

  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "No messages." };
  }
  const recent = messages.slice(-LIMITS.maxTurns);
  const turns: ChatTurn[] = [];
  for (const [index, message] of recent.entries()) {
    const { role, content } = (message ?? {}) as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return { ok: false, error: "Bad role." };
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, error: "Empty message." };
    }
    if (content.length > LIMITS.maxMessageChars) {
      return { ok: false, error: `Messages are limited to ${LIMITS.maxMessageChars} characters.` };
    }
    const expected = (recent.length - 1 - index) % 2 === 0 ? "user" : "assistant";
    if (role !== expected) return { ok: false, error: "Turns must alternate." };
    turns.push({ role, content: content.trim() });
  }

  const ctx = (context ?? {}) as Record<string, unknown>;
  const path =
    typeof ctx.path === "string" ? ctx.path.slice(0, LIMITS.maxPathChars) : "/";
  const section =
    typeof ctx.section === "string" ? ctx.section.slice(0, 40).replace(/[^\w-]/g, "") : null;
  const audience = (audiences as readonly unknown[]).includes(ctx.audience)
    ? (ctx.audience as Audience)
    : null;
  const dwell = Number(ctx.dwellSeconds);

  return {
    ok: true,
    value: {
      messages: turns,
      context: {
        path: path.replace(/[^\w\-/#.]/g, ""),
        section: section || null,
        audience,
        dwellSeconds: Number.isFinite(dwell) ? Math.max(0, Math.min(3600, Math.round(dwell))) : 0,
        returningVisitor: ctx.returningVisitor === true,
      },
    },
  };
}
