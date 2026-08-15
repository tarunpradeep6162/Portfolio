import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

/**
 * V9 Phase 0 baseline: identical methodology to
 * scripts/measure-v8-baseline.mjs (real resource-timing measurement
 * against a running production build, not projected), re-pointed at
 * reports/v9/. Confirms the V9 starting point matches the numbers already
 * recorded in docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md before any V9
 * application code is written - at this commit the app is byte-for-byte
 * identical to the V8 final tag (unified-control-room-v8-final), so this
 * run should reproduce the V8 production baseline exactly.
 *
 * Read-only against a running server - does not alter application behavior.
 *
 * Usage: node scripts/measure-v9-baseline.mjs [baseUrl]
 * Output: reports/v9/v9-baseline-<timestamp>.json
 */
const baseUrl = process.argv[2] ?? "http://127.0.0.1:3200";
const routes = ["/", "/work", "/work/project-aurora", "/about", "/resume", "/contact"];

async function measureRoute(browser, path) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${path}`, { waitUntil: "load", timeout: 60000 });
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

/**
 * Measures which chunk URLs (and how many bytes) are newly requested when a
 * specific system activates, in a fresh context each time, so each
 * system's cost is measured independently rather than cumulatively.
 */
async function measureSystemActivation(browser, { name, path, activate }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const chunkBytes = new Map();

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/") && !chunkBytes.has(url)) {
      try {
        const body = await res.body();
        chunkBytes.set(url, body.length);
      } catch {
        chunkBytes.set(url, 0);
      }
    }
  });

  await page.goto(`${baseUrl}${path}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1000);
  const beforeUrls = new Set(chunkBytes.keys());
  const beforeCanvas = await page.locator("canvas").count();

  let activationError = null;
  try {
    await activate(page);
  } catch (err) {
    activationError = String(err?.message ?? err);
  }
  await page.waitForTimeout(1500);

  const afterUrls = new Set(chunkBytes.keys());
  const afterCanvas = await page.locator("canvas").count();
  const newUrls = [...afterUrls].filter((u) => !beforeUrls.has(u));
  const newBytes = newUrls.reduce((a, u) => a + (chunkBytes.get(u) ?? 0), 0);

  await context.close();
  return {
    name,
    path,
    activationError,
    beforeCanvas,
    afterCanvas,
    newChunkCount: newUrls.length,
    newChunkBytes: newBytes,
    newChunkUrls: newUrls.map((u) => u.split("/").pop()),
  };
}

const browser = await chromium.launch();
const routeResults = [];

console.log("=== Per-route baseline (idle, no system activated) ===");
for (const path of routes) {
  const r = await measureRoute(browser, path);
  routeResults.push(r);
  console.log(
    `${path}: JS ${r.jsDecodedBodySize}B decoded (${r.jsRequestCount} req), font ${r.fontTransferSize}B, canvas=${r.canvasCount}`,
  );
}

console.log("\n=== Per-system activation cost (fresh context each) ===");
const systemResults = [];

systemResults.push(
  await measureSystemActivation(browser, {
    name: "atlas",
    path: "/work/project-aurora",
    activate: async (page) => {
      await page.getByRole("button", { name: /enter 3d view/i }).click();
      await page.locator("canvas").first().waitFor({ state: "visible", timeout: 10000 });
    },
  }),
);

systemResults.push(
  await measureSystemActivation(browser, {
    name: "operational-twin",
    path: "/",
    activate: async (page) => {
      await page.getByRole("button", { name: /activate operational twin/i }).click();
      await page.locator("canvas").first().waitFor({ state: "visible", timeout: 10000 });
    },
  }),
);

systemResults.push(
  await measureSystemActivation(browser, {
    name: "rc01",
    path: "/",
    activate: async (page) => {
      await page.getByRole("button", { name: /activate rc-01/i }).click();
      await page.locator("canvas").first().waitFor({ state: "visible", timeout: 10000 });
    },
  }),
);

for (const s of systemResults) {
  console.log(
    `${s.name} (${s.path}): +${s.newChunkBytes}B across ${s.newChunkCount} new chunks, canvas ${s.beforeCanvas}->${s.afterCanvas}${s.activationError ? ` [ERROR: ${s.activationError}]` : ""}`,
  );
}

const chunkToSystems = new Map();
for (const s of systemResults) {
  for (const chunk of s.newChunkUrls) {
    if (!chunkToSystems.has(chunk)) chunkToSystems.set(chunk, []);
    chunkToSystems.get(chunk).push(s.name);
  }
}
const sharedChunks = [...chunkToSystems.entries()].filter(([, systems]) => systems.length > 1);

console.log(`\n=== Chunk overlap across systems ===`);
console.log(
  sharedChunks.length === 0
    ? "No chunk basename appeared in more than one system's activation set (each system's dynamic import produced a distinct chunk name)."
    : sharedChunks.map(([chunk, systems]) => `${chunk}: ${systems.join(", ")}`).join("\n"),
);

await browser.close();

mkdirSync("reports/v9", { recursive: true });
const outPath = `reports/v9/v9-baseline-${Date.now()}.json`;
writeFileSync(
  outPath,
  JSON.stringify(
    { baseUrl, measuredAt: new Date().toISOString(), routeResults, systemResults, sharedChunks },
    null,
    2,
  ),
);
console.log(`\nWritten: ${outPath}`);
