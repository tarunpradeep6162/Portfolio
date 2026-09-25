import { describe, it, expect } from "vitest";
import { parseAction } from "@/lib/rc01/actions";
import { resolveInternalHref } from "@/lib/rc01/routes";
import { createEventParser, encodeEvent, validateRequest, LIMITS } from "@/lib/rc01/protocol";
import { createRateLimiter } from "@/lib/rc01/rateLimit";

describe("resolveInternalHref", () => {
  it("accepts real pages and home sections", () => {
    expect(resolveInternalHref("/work/project-aurora")).toBe("/work/project-aurora");
    expect(resolveInternalHref("/work/project-aurora/")).toBe("/work/project-aurora");
    expect(resolveInternalHref("/#spine")).toBe("/#spine");
    expect(resolveInternalHref("/blog")).toBe("/blog");
  });

  it("rejects anything that could leave the site or doesn't exist", () => {
    for (const href of [
      "https://evil.example",
      "//evil.example/work",
      "javascript:alert(1)",
      "/work/not-a-real-project",
      "/admin",
      "work/project-aurora",
    ]) {
      expect(resolveInternalHref(href), href).toBeNull();
    }
  });

  it("drops unknown hash fragments rather than failing the whole link", () => {
    expect(resolveInternalHref("/#nope")).toBe("/");
    expect(resolveInternalHref("/about#team")).toBe("/about");
  });
});

describe("parseAction", () => {
  it("accepts valid actions", () => {
    expect(parseAction("navigate", { path: "/contact" })).toEqual({ type: "navigate", path: "/contact" });
    expect(parseAction("highlight_spine_stage", { stage: "recover" })).toEqual({
      type: "highlight_spine_stage",
      stage: "recover",
    });
    expect(parseAction("gesture", { gesture: "wave" })).toEqual({ type: "gesture", gesture: "wave" });
    expect(parseAction("copy_email", {})).toEqual({ type: "copy_email" });
  });

  it("rejects out-of-policy input from the model", () => {
    expect(parseAction("navigate", { path: "https://evil.example" })).toBeNull();
    expect(parseAction("navigate", {})).toBeNull();
    expect(parseAction("gesture", { gesture: "moonwalk" })).toBeNull();
    expect(parseAction("set_audience", { audience: "admin" })).toBeNull();
    expect(parseAction("scroll_to_section", { section: "footer" })).toBeNull();
    expect(parseAction("delete_everything", {})).toBeNull();
    expect(parseAction("navigate", null)).toBeNull();
  });
});

describe("validateRequest", () => {
  const context = { path: "/", section: "spine", audience: "recruiter", dwellSeconds: 12 };

  it("accepts an alternating history ending on a user turn", () => {
    const result = validateRequest({
      messages: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello!" },
        { role: "user", content: "What does Tarun do?" },
      ],
      context,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.messages).toHaveLength(3);
      expect(result.value.context.audience).toBe("recruiter");
    }
  });

  it("rejects histories that don't alternate or end on the assistant", () => {
    expect(validateRequest({ messages: [{ role: "assistant", content: "x" }], context }).ok).toBe(false);
    expect(
      validateRequest({
        messages: [
          { role: "user", content: "a" },
          { role: "user", content: "b" },
        ],
        context,
      }).ok,
    ).toBe(false);
    expect(validateRequest({ messages: [{ role: "system", content: "x" }], context }).ok).toBe(false);
  });

  it("caps message length and history depth", () => {
    const long = "x".repeat(LIMITS.maxMessageChars + 1);
    expect(validateRequest({ messages: [{ role: "user", content: long }], context }).ok).toBe(false);

    const many = Array.from({ length: 31 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `turn ${i}`,
    }));
    const result = validateRequest({ messages: many, context });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.messages.length).toBeLessThanOrEqual(LIMITS.maxTurns);
  });

  it("sanitises untrusted context fields", () => {
    const result = validateRequest({
      messages: [{ role: "user", content: "hi" }],
      context: { path: "/work<script>", section: "spine;drop", audience: "hacker", dwellSeconds: 1e9 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.context.path).toBe("/workscript");
      expect(result.value.context.section).toBe("spinedrop");
      expect(result.value.context.audience).toBeNull();
      expect(result.value.context.dwellSeconds).toBe(3600);
    }
  });
});

describe("stream event parser", () => {
  it("reassembles events split across arbitrary chunk boundaries", () => {
    const wire =
      encodeEvent({ type: "text", text: "Hello " }) +
      encodeEvent({ type: "action", action: { type: "navigate", path: "/about" } }) +
      encodeEvent({ type: "done", reason: "complete" });
    const parser = createEventParser();
    const events = [];
    for (let i = 0; i < wire.length; i += 7) events.push(...parser.push(wire.slice(i, i + 7)));
    events.push(...parser.flush());
    expect(events).toEqual([
      { type: "text", text: "Hello " },
      { type: "action", action: { type: "navigate", path: "/about" } },
      { type: "done", reason: "complete" },
    ]);
  });

  it("drops malformed lines and out-of-policy actions instead of trusting them", () => {
    const parser = createEventParser();
    const events = parser.push(
      '{"type":"text","text":"ok"}\nnot json\n{"type":"action","action":{"type":"navigate","path":"https://evil.example"}}\n{"type":"mystery"}\n',
    );
    expect(events).toEqual([{ type: "text", text: "ok" }]);
  });
});

describe("rate limiter", () => {
  it("allows up to the limit per window, then reports when to retry", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 100).allowed).toBe(true);
    const blocked = limiter.check("a", 200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
    expect(limiter.check("b", 200).allowed).toBe(true);
    expect(limiter.check("a", 1001).allowed).toBe(true);
  });

  it("bounds memory by evicting the least recently used key", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000, maxKeys: 2 });
    limiter.check("a", 0);
    limiter.check("b", 1);
    limiter.check("c", 2); // evicts "a"
    expect(limiter.check("a", 3).allowed).toBe(true);
  });
});
