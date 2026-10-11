import { expect, test, type Page } from "@playwright/test";
import { projects } from "@/content/projects";
import { blogPosts } from "@/content/blog";

/**
 * Security regression suite: response headers, the Content-Security-Policy
 * against every real page and the heaviest features (3D stage, RC-01's 3D
 * companion), and the API guards. CSP violations are captured in both
 * Report-Only and enforced mode - the browser raises the same event.
 */
const routes = [
  "/",
  "/about",
  "/work",
  ...projects.map((p) => `/work/${p.slug}`),
  "/blog",
  `/blog/${blogPosts[0].slug}`,
  "/resume",
  "/contact",
  "/this-page-does-not-exist",
];

async function watchCsp(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      (window as unknown as { __csp: string[] }).__csp.push(`${e.effectiveDirective} ${e.blockedURI}`);
    });
  });
}
const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

test.describe("security headers", () => {
  test("every page carries the hardening headers and a CSP", async ({ request }) => {
    for (const path of ["/", "/resume", "/work"]) {
      const res = await request.get(path);
      const headers = res.headers();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["strict-transport-security"]).toContain("max-age=63072000");
      expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["x-powered-by"]).toBeUndefined();
      const csp = headers["content-security-policy"] ?? headers["content-security-policy-report-only"];
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).not.toContain("unsafe-eval");
    }
  });

  test("API responses are uncacheable and unindexed", async ({ request }) => {
    const res = await request.get("/api/rc01");
    expect(res.headers()["cache-control"]).toContain("no-store");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("robots.txt opts AI-training crawlers out, security.txt is published", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/User-Agent: GPTBot[\s\S]*Disallow: \//i);
    expect(robots).toMatch(/User-Agent: \*\s*\nAllow: \//i);
    const securityTxt = await request.get("/.well-known/security.txt");
    expect(securityTxt.status()).toBe(200);
    expect(await securityTxt.text()).toContain("Contact: mailto:");
  });
});

test.describe("Content-Security-Policy blocks nothing the site needs", () => {
  test("no violations on any route", async ({ page }) => {
    test.setTimeout(180_000);
    await watchCsp(page);
    for (const path of routes) {
      await page.goto(path, { waitUntil: "networkidle" });
      expect(await violations(page), path).toEqual([]);
    }
  });

  test("no violations with the 3D stage and RC-01's 3D companion running", async ({ page }) => {
    test.setTimeout(120_000);
    await watchCsp(page);
    await page.goto("/?cinema=1", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /activate rc-01/i }).click();
    await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor();
    await page.waitForTimeout(3000);
    expect(await violations(page)).toEqual([]);
  });
});

test.describe("API guards", () => {
  test("RC-01 rejects cross-site and script requests, and oversized bodies", async ({ request, baseURL }) => {
    const body = { messages: [{ role: "user", content: "hi" }] };
    expect((await request.post("/api/rc01", { data: body, headers: { origin: "https://evil.example" } })).status()).toBe(403);
    expect((await request.post("/api/rc01", { data: body })).status()).toBe(403);
    const big = await request.post("/api/rc01", {
      data: { messages: [{ role: "user", content: "x".repeat(70_000) }] },
      headers: { origin: baseURL!, "sec-fetch-site": "same-origin" },
    });
    expect(big.status()).toBe(413);
  });

  test("owner and webhook endpoints are inert without their secrets", async ({ request }) => {
    expect((await request.post("/api/security/test-alert")).status()).toBe(404);
    expect((await request.post("/api/security/vercel-webhook", { data: {} })).status()).toBe(404);
  });

  test("CSP reports are accepted and bounded", async ({ request }) => {
    const report = { "csp-report": { "document-uri": "https://x/?q=secret", "blocked-uri": "inline", "effective-directive": "script-src" } };
    const ok = await request.post("/api/security/csp-report", {
      data: report,
      headers: { "content-type": "application/csp-report" },
    });
    expect(ok.status()).toBe(204);
    const big = await request.post("/api/security/csp-report", {
      data: { pad: "x".repeat(20_000) },
      headers: { "content-type": "application/csp-report" },
    });
    expect(big.status()).toBe(413);
  });
});
