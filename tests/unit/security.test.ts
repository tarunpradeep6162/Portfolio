import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deliverAlert, renderAlert, resetAlertState, type SecurityAlert } from "@/lib/security/alerts";
import { buildCsp } from "@/lib/security/csp";
import { AI_TRAINING_CRAWLERS } from "@/lib/security/crawlers";
import { recordSecurityEvent, resetEventState } from "@/lib/security/events";
import { clientIp, isSameOriginRequest, readJsonBody, safeEqual } from "@/lib/security/request";
import { classify, verifySignature } from "@/lib/security/vercelWebhook";
import { jsonLdScript } from "@/lib/seo/jsonLd";
import robots from "@/app/robots";

const h = (init: Record<string, string>) => new Headers(init);

describe("request guards", () => {
  it("accepts only same-origin browser requests", () => {
    expect(isSameOriginRequest(h({ host: "site.dev", origin: "https://site.dev", "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(isSameOriginRequest(h({ host: "site.dev", origin: "https://site.dev" }))).toBe(true);
    expect(isSameOriginRequest(h({ host: "site.dev", "sec-fetch-site": "same-origin" }))).toBe(true);
    // Scripts with no browser headers, cross-site pages, opaque origins:
    expect(isSameOriginRequest(h({ host: "site.dev" }))).toBe(false);
    expect(isSameOriginRequest(h({ host: "site.dev", origin: "https://evil.example" }))).toBe(false);
    expect(isSameOriginRequest(h({ host: "site.dev", origin: "https://site.dev", "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOriginRequest(h({ host: "site.dev", origin: "null" }))).toBe(false);
  });

  it("prefers the edge-set client address over client-supplied forwarding headers", () => {
    expect(clientIp(h({ "x-real-ip": "198.51.100.1", "x-forwarded-for": "6.6.6.6" }))).toBe("198.51.100.1");
    expect(clientIp(h({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(clientIp(h({}))).toBe("unknown");
  });

  it("bounds request bodies whatever Content-Length claims", async () => {
    const json = (body: string, headers: Record<string, string> = {}) =>
      new Request("http://x/", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
    expect(await readJsonBody(json('{"a":1}'), 100)).toEqual({ ok: true, value: { a: 1 } });
    expect(await readJsonBody(json("x".repeat(500)), 100)).toMatchObject({ ok: false, status: 413 });
    expect(await readJsonBody(json("{}", { "content-length": "999999" }), 100)).toMatchObject({ ok: false, status: 413 });
    expect(await readJsonBody(json("{bad"), 100)).toMatchObject({ ok: false, status: 400 });
    const text = new Request("http://x/", { method: "POST", headers: { "content-type": "text/plain" }, body: "{}" });
    expect(await readJsonBody(text, 100)).toMatchObject({ ok: false, status: 415 });
  });

  it("compares secrets without short-circuiting on length", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});

describe("security alert delivery", () => {
  const alert = (over: Partial<SecurityAlert> = {}): SecurityAlert => ({
    id: "SEC-TEST",
    severity: "high",
    category: "owner_auth_failed",
    route: "/api/security/test-alert",
    reason: "Invalid owner token presented",
    action: "Rejected",
    nextStep: "Rotate the token",
    clientRef: "a1b2c3",
    occurredAt: new Date("2026-10-11T08:00:00Z"),
    ...over,
  });
  const env = { RESEND_API_KEY: "re_test_key" } as unknown as NodeJS.ProcessEnv;
  const ok = () => new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
  const noSleep = async () => {};

  beforeEach(() => resetAlertState());

  it("is a logged no-op until an email provider is configured", async () => {
    const fetchImpl = vi.fn();
    expect(await deliverAlert(alert(), { env: {} as NodeJS.ProcessEnv, fetchImpl })).toEqual({
      status: "skipped",
      reason: "not_configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends every required field, to the security inbox, without secrets", async () => {
    const fetchImpl = vi.fn(async () => ok());
    const result = await deliverAlert(alert(), { env, fetchImpl, now: 1_000 });
    expect(result).toEqual({ status: "sent", providerId: "email_123", attempts: 1 });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toContain("owner_auth_failed");
    const payload = JSON.parse(init.body as string);
    expect(payload.to).toEqual(["tarunpradeep2003@gmail.com"]);
    for (const field of ["SEC-TEST", "2026-10-11 08:00:00 UTC", "HIGH", "owner_auth_failed", "/api/security/test-alert", "Invalid owner token", "Rejected", "Rotate the token", "a1b2c3", "vercel.com"]) {
      expect(payload.text).toContain(field);
    }
    expect(init.body as string).not.toContain("re_test_key");
  });

  it("escapes attacker-influenced text in the HTML body", () => {
    const { html } = renderAlert(alert({ reason: '<img src=x onerror="alert(1)">' }), "https://dash");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("suppresses duplicates inside the window and caps volume, except for critical", async () => {
    const fetchImpl = vi.fn(async () => ok());
    await deliverAlert(alert(), { env, fetchImpl, now: 0 });
    expect(await deliverAlert(alert(), { env, fetchImpl, now: 60_000 })).toEqual({ status: "suppressed", reason: "duplicate" });
    for (let i = 0; i < 9; i++) await deliverAlert(alert({ reason: `r${i}` }), { env, fetchImpl, now: 1000 + i });
    expect(await deliverAlert(alert({ reason: "r-extra" }), { env, fetchImpl, now: 2000 })).toEqual({
      status: "suppressed",
      reason: "rate_limited",
    });
    expect((await deliverAlert(alert({ reason: "crit", severity: "critical" }), { env, fetchImpl, now: 2001 })).status).toBe("sent");
  });

  it("retries provider errors with backoff but not client errors", async () => {
    const flaky = vi.fn().mockResolvedValueOnce(new Response("", { status: 503 })).mockResolvedValueOnce(ok());
    expect(await deliverAlert(alert(), { env, fetchImpl: flaky, sleep: noSleep })).toMatchObject({ status: "sent", attempts: 2 });

    resetAlertState();
    const rejected = vi.fn(async () => new Response("", { status: 403 }));
    expect(await deliverAlert(alert(), { env, fetchImpl: rejected, sleep: noSleep })).toEqual({
      status: "failed",
      error: "HTTP 403",
      attempts: 1,
    });
    expect(rejected).toHaveBeenCalledTimes(1);
  });
});

describe("security event correlation", () => {
  beforeEach(() => {
    resetAlertState();
    resetEventState();
  });

  it("logs a single failure, escalates repeated failures from one client to an emailed alert", async () => {
    const lines: string[] = [];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "e" }), { status: 200 }));
    const env = { RESEND_API_KEY: "k" } as unknown as NodeJS.ProcessEnv;
    const event = {
      category: "owner_auth_failed",
      severity: "medium" as const,
      route: "/api/security/test-alert",
      reason: "Invalid owner token presented",
      action: "Rejected (401)",
      ip: "198.51.100.7",
      escalate: { count: 5, windowMs: 600_000, to: "high" as const },
    };
    for (let i = 0; i < 4; i++) {
      const r = await recordSecurityEvent(event, { env, fetchImpl, now: 1000 + i, log: (l) => lines.push(l) });
      expect(r.severity).toBe("medium");
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    const fifth = await recordSecurityEvent(event, { env, fetchImpl, now: 2000, log: (l) => lines.push(l) });
    expect(fifth.severity).toBe("high");
    expect(fifth.delivery?.status).toBe("sent");
    // Raw client addresses never reach the logs.
    expect(lines.join("\n")).not.toContain("198.51.100.7");
    expect(JSON.parse(lines[0])).toMatchObject({ event: "security", category: "owner_auth_failed" });
  });
});

describe("Vercel webhook verification and classification", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ type: "deployment.created" });
  const sig = createHmac("sha1", secret).update(body).digest("hex");

  it("accepts only bodies signed with the webhook secret", () => {
    expect(verifySignature(body, sig, secret)).toBe(true);
    expect(verifySignature(body + " ", sig, secret)).toBe(false);
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, sig, "other")).toBe(false);
  });

  it("treats a production deploy by a non-owner as critical, by the owner as routine", () => {
    const deploy = (user: string) => ({ type: "deployment.created", payload: { target: "production", user: { id: user } } });
    expect(classify(deploy("intruder"), ["owner"])?.severity).toBe("critical");
    expect(classify(deploy("owner"), ["owner"])?.severity).toBe("low");
    expect(classify({ type: "deployment.created", payload: { target: null } }, ["owner"])).toBeNull();
  });

  it("flags configuration changes and firewall events", () => {
    expect(classify({ type: "project.env-variable.created", payload: { user: { id: "x" } } }, ["owner"])?.severity).toBe("high");
    expect(classify({ type: "project.env-variable.created", payload: { user: { id: "owner" } } }, ["owner"])?.severity).toBe("medium");
    expect(classify({ type: "firewall.attack" }, [])?.severity).toBe("high");
    expect(classify({ type: "deployment.ready" }, [])).toBeNull();
  });
});

describe("content policy", () => {
  it("CSP forbids eval, framing, plugins and foreign scripts", () => {
    const csp = buildCsp();
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'(;|$)/);
    expect(csp).not.toContain("vercel.live");
    expect(buildCsp({ preview: true })).toContain("https://vercel.live");
    // Report-Only must not carry a directive browsers reject in that mode.
    expect(buildCsp()).not.toContain("upgrade-insecure-requests");
    expect(buildCsp({ enforce: true })).toContain("upgrade-insecure-requests");
  });

  it("robots.txt opts AI-training crawlers out and keeps search crawling open", () => {
    const rules = robots().rules as { userAgent: string | string[]; allow?: string; disallow?: string }[];
    const ai = rules.find((r) => Array.isArray(r.userAgent));
    expect(ai?.disallow).toBe("/");
    for (const bot of ["GPTBot", "ClaudeBot", "Google-Extended", "CCBot"]) expect(ai?.userAgent).toContain(bot);
    expect(AI_TRAINING_CRAWLERS).not.toContain("Googlebot");
    expect(rules.find((r) => r.userAgent === "*")).toMatchObject({ allow: "/", disallow: "/api/" });
  });

  it("structured data cannot break out of its script element", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("security endpoints", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
    vi.unstubAllGlobals();
  });

  it("test-alert is disabled without a token and rejects wrong tokens", async () => {
    const { POST } = await import("@/app/api/security/test-alert/route");
    delete process.env.SECURITY_ADMIN_TOKEN;
    const req = (auth?: string) =>
      new Request("http://x/api/security/test-alert", { method: "POST", headers: auth ? { authorization: auth } : {} });
    expect((await POST(req() as never)).status).toBe(404);
    process.env.SECURITY_ADMIN_TOKEN = "t".repeat(40);
    expect((await POST(req("Bearer wrong") as never)).status).toBe(401);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "e1" }), { status: 200 })));
    process.env.RESEND_API_KEY = "k";
    const res = await POST(req(`Bearer ${"t".repeat(40)}`) as never);
    expect(res.status).toBe(200);
    expect((await res.json()).delivery.status).toBe("sent");
  });

  it("webhook receiver is disabled without a secret and verifies signatures", async () => {
    const { POST } = await import("@/app/api/security/vercel-webhook/route");
    const body = JSON.stringify({ type: "deployment.ready" });
    const req = (sig?: string) =>
      new Request("http://x/api/security/vercel-webhook", {
        method: "POST",
        headers: sig ? { "x-vercel-signature": sig } : {},
        body,
      });
    delete process.env.VERCEL_WEBHOOK_SECRET;
    expect((await POST(req() as never)).status).toBe(404);
    process.env.VERCEL_WEBHOOK_SECRET = "s3cret";
    expect((await POST(req("bad") as never)).status).toBe(401);
    expect((await POST(req(createHmac("sha1", "s3cret").update(body).digest("hex")) as never)).status).toBe(200);
  });

  it("analytics accepts small, well-formed, same-origin events only", async () => {
    const { POST } = await import("@/app/api/analytics/route");
    const req = (body: string, headers: Record<string, string> = {}) =>
      new Request("http://localhost/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost", origin: "http://localhost", ...headers },
        body,
      });
    expect((await POST(req('{"name":"page_view","category":"navigation"}') as never)).status).toBe(204);
    expect((await POST(req('{"name":"page_view","category":"navigation"}', { origin: "https://evil.example" }) as never)).status).toBe(403);
    expect((await POST(req('{"name":"<script>","category":"x"}') as never)).status).toBe(400);
    expect((await POST(req(JSON.stringify({ name: "a", category: "b", pad: "x".repeat(5000) })) as never)).status).toBe(413);
  });
});
