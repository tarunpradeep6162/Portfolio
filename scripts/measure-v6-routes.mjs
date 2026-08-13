import { chromium } from "playwright";

/**
 * Per-route initial-payload measurement, reusing compare-bundle-sizes.mjs's
 * and check-bundle-cost.mjs's proven methodology: sum real response-body
 * bytes for every /_next/static/chunks/ (JS) and /_next/static/media/
 * (font) request, polling until the request count stops changing rather
 * than trusting a fixed delay.
 *
 * Only the home page has a documented, verified V5.1 byte baseline in
 * docs/LIVING_INFRASTRUCTURE_V6_PERFORMANCE_BUDGET.md (697,303 bytes ->
 * an 802,000-byte V6 ceiling) - it is the only route gated against a
 * specific number here. Every other route is reported honestly as "no
 * documented V5.1 baseline for this route" rather than inventing one to
 * check ±15% against; fabricating a comparison baseline would be worse
 * than not having one.
 */
const baseUrl = process.env.V6_BASE_URL ?? "http://localhost:3500";
const FONT_BUDGET_BYTES = 239000;
const HOME_JS_BUDGET_BYTES = 802000;

const routes = {
  home: { path: "/", jsBudget: HOME_JS_BUDGET_BYTES },
  work: { path: "/work" },
  "case-aurora": { path: "/work/project-aurora" },
  "case-jenkins": { path: "/work/distributed-jenkins-controller" },
  "case-secure-aws": { path: "/work/secure-aws-production-architecture" },
  "case-nodejs-auth": { path: "/work/nodejs-auth-mysql-rds" },
  about: { path: "/about" },
  resume: { path: "/resume" },
  contact: { path: "/contact" },
};

async function measureRoute(browser, name, config) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  let jsBytes = 0;
  let jsRequests = 0;
  let fontBytes = 0;
  let canvasBeforeIntent = 0;

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/")) {
      try {
        jsBytes += (await res.body()).length;
      } catch {
        // A request still in flight when the settle loop below closes the
        // context throws here ("Target page, context or browser has been
        // closed") - an unhandled rejection from this async event handler
        // would otherwise crash the whole script (a real bug, found by
        // direct reproduction: the settle loop only watches jsRequests
        // count, not font request count, so a slow font response could
        // still be pending when JS requests look stable).
      } finally {
        jsRequests++;
      }
    } else if (url.includes("/_next/static/media/") && url.endsWith(".woff2")) {
      try {
        fontBytes += (await res.body()).length;
      } catch {
        // ignore - font already counted or unavailable
      }
    }
  });

  const start = Date.now();
  await page.goto(`${baseUrl}${config.path}`, { waitUntil: "networkidle", timeout: 60000 });

  let lastCount = -1;
  let stableSince = Date.now();
  const giveUpAt = Date.now() + 6000;
  while (Date.now() - stableSince < 1200 && Date.now() < giveUpAt) {
    if (jsRequests !== lastCount) {
      lastCount = jsRequests;
      stableSince = Date.now();
    }
    await page.waitForTimeout(100);
  }
  const loadMs = Date.now() - start;

  canvasBeforeIntent = await page.locator("canvas").count();

  await context.close();
  return { name, jsBytes, jsRequests, fontBytes, canvasBeforeIntent, loadMs };
}

const browser = await chromium.launch();
const results = [];
let failures = 0;

for (const [name, config] of Object.entries(routes)) {
  const result = await measureRoute(browser, name, config);
  results.push({ ...result, config });

  const parts = [
    `${name} (${config.path}): ${result.jsBytes} JS bytes (${(result.jsBytes / 1024).toFixed(1)} KB) across ${result.jsRequests} requests`,
    `${result.fontBytes} font bytes (${(result.fontBytes / 1024).toFixed(1)} KB)`,
    `canvas-before-intent=${result.canvasBeforeIntent}`,
    `settled in ${result.loadMs}ms`,
  ];
  console.log(parts.join(", "));

  if (config.jsBudget) {
    if (result.jsBytes > config.jsBudget) {
      failures++;
      console.log(`  FAIL: ${name} JS bytes ${result.jsBytes} exceeds its ${config.jsBudget}-byte budget`);
    } else {
      console.log(`  PASS: ${name} JS bytes within its ${config.jsBudget}-byte budget`);
    }
  } else {
    console.log(`  (no documented V5.1 baseline for ${name} - reporting current bytes only, not gating pass/fail)`);
  }

  if (result.fontBytes > FONT_BUDGET_BYTES) {
    failures++;
    console.log(`  FAIL: ${name} font bytes ${result.fontBytes} exceeds the ${FONT_BUDGET_BYTES}-byte site-wide font budget`);
  }

  if (result.canvasBeforeIntent !== 0) {
    failures++;
    console.log(`  FAIL: ${name} has ${result.canvasBeforeIntent} <canvas> element(s) before any spatial intent - budget requires zero`);
  }
}

await browser.close();

console.log(
  `\n${failures === 0 ? "All gated per-route budget checks passed." : `${failures} per-route budget check(s) FAILED.`}`,
);
if (failures > 0) process.exit(1);
