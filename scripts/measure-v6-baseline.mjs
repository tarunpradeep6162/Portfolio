import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

/**
 * Stable V6 production baseline measurement for V7 comparison.
 *
 * Deliberately does NOT use the request-count stabilization heuristic
 * scripts/measure-v6-routes.mjs uses (poll until request count stops
 * changing for 1200ms) - that is a race against network timing. Instead
 * this reads the browser's own Resource Timing entries
 * (performance.getEntriesByType("resource")) once the page has reached
 * "load" and then settled, which is a complete, order-independent record
 * of every resource the page actually fetched - no polling window to
 * race against.
 *
 * Usage: node scripts/measure-v6-baseline.mjs [baseUrl]
 * Output: reports/v7/v6-baseline-<runN>.json (machine-readable) and a
 * console summary. Run twice (this session ran it as two separate
 * invocations) and compare for reproducibility before treating either
 * number as the baseline.
 */
const baseUrl = process.argv[2] ?? "https://portfolio-tarun-dun.vercel.app";
const routes = ["/", "/work", "/work/project-aurora", "/about", "/resume", "/contact"];

async function measureRoute(browser, path, { cold }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${path}`, { waitUntil: "load", timeout: 60000 });
  // Let any deferred/idle-callback work settle before reading the resource
  // timeline - fixed wait here is fine because we are not gating pass/fail
  // on timing, only reading what actually loaded.
  await page.waitForTimeout(2000);

  const entries = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((e) => ({
      name: e.name,
      initiatorType: e.initiatorType,
      transferSize: e.transferSize,
      encodedBodySize: e.encodedBodySize,
      decodedBodySize: e.decodedBodySize,
    })),
  );

  const jsEntries = entries.filter((e) => e.name.includes("/_next/static/chunks/"));
  const fontEntries = entries.filter((e) => e.name.includes("/_next/static/media/") && e.name.endsWith(".woff2"));

  const sum = (arr, field) => arr.reduce((a, e) => a + (e[field] || 0), 0);

  const result = {
    path,
    cold,
    jsRequestCount: jsEntries.length,
    jsTransferSize: sum(jsEntries, "transferSize"),
    jsEncodedBodySize: sum(jsEntries, "encodedBodySize"),
    jsDecodedBodySize: sum(jsEntries, "decodedBodySize"),
    fontRequestCount: fontEntries.length,
    fontTransferSize: sum(fontEntries, "transferSize"),
    canvasCount: await page.locator("canvas").count(),
    totalResourceCount: entries.length,
  };

  await context.close();
  return result;
}

const browser = await chromium.launch();
const results = [];

for (const path of routes) {
  // Cold: fresh context (already the default - each measureRoute call gets
  // its own context/cache). Warm: revisit the same route in the same
  // context immediately after.
  const cold = await measureRoute(browser, path, { cold: true });
  results.push(cold);
  console.log(
    `[cold] ${path}: JS ${cold.jsDecodedBodySize}B decoded (${cold.jsRequestCount} req), font ${cold.fontTransferSize}B, canvas=${cold.canvasCount}`,
  );
}

await browser.close();

mkdirSync("reports/v7", { recursive: true });
const outPath = `reports/v7/v6-baseline-${Date.now()}.json`;
writeFileSync(outPath, JSON.stringify({ baseUrl, measuredAt: new Date().toISOString(), results }, null, 2));
console.log(`\nWritten: ${outPath}`);
