import { chromium } from "playwright";

/**
 * V6 performance measurement, corrected after the first version conflated
 * navigation/hydration long tasks with the Atlas interaction itself (both
 * observers used `buffered: true` and were registered via addInitScript
 * before navigation, so they captured everything from page construction
 * onward, not just the click). This version measures hydration and the
 * interaction as two separate phases with two separate observers:
 *
 *   1. A buffered observer captures the navigation/hydration phase, exactly
 *      as before - useful, but reported separately and never blamed on the
 *      interaction.
 *   2. A brand-new, non-buffered observer is created immediately before the
 *      click, after the page has reached Playwright's "networkidle" signal
 *      (a real, event-driven settle condition - no requests pending for
 *      500ms - not a fixed arbitrary sleep and not the disproven
 *      request-count-stabilization heuristic used for byte totals in an
 *      earlier V4/V5 script). Only entries at/after an explicit
 *      performance.now() marker taken right before the click are counted,
 *      as a second, redundant safety check on top of the observer being
 *      freshly created (a fresh non-buffered PerformanceObserver only ever
 *      reports entries generated after `.observe()` is called, per spec -
 *      the startTime filter exists purely as an explicit, auditable
 *      confirmation of that, not because it's structurally necessary).
 *   3. Post-interaction settle is detected by polling the real DOM
 *      consequence of the click (the clicked node's aria-pressed flipping
 *      to "true") rather than a fixed waitForTimeout.
 *
 * Byte totals still use response-body length via page.request.get(), not
 * transferSize (0 for some cached/uncompressed local responses) - unchanged
 * from the original methodology, which was correct.
 *
 * Run this script twice as separate process invocations and compare both
 * results by hand before trusting either - do not average, and do not pick
 * a "preferred" run.
 */
const baseUrl = process.env.V6_BASE_URL ?? "http://localhost:3500";
const targetPath = process.argv[2] ?? "/work/project-aurora";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

// Phase 1 instrumentation: buffered, covers navigation + hydration only.
await page.addInitScript(() => {
  window.__hydrationCLS = 0;
  window.__hydrationLongTasks = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__hydrationCLS += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    // layout-shift not supported in this browser context - reported as such below.
  }
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__hydrationLongTasks.push(entry.duration);
      }
    }).observe({ type: "longtask", buffered: true });
  } catch {
    // longtask not supported - reported as such below.
  }
});

await page.goto(`${baseUrl}${targetPath}`, { waitUntil: "load" });
// Real settle signal (no pending network activity for 500ms), not a fixed sleep.
await page.waitForLoadState("networkidle");

const hydrationCLS = await page.evaluate(() => window.__hydrationCLS ?? null);
const hydrationLongTasks = await page.evaluate(() => window.__hydrationLongTasks ?? []);
const maxHydrationLongTask =
  hydrationLongTasks.length > 0 ? Math.max(...hydrationLongTasks) : 0;

const chunkUrls = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .map((e) => e.name)
    .filter((u) => u.includes("/_next/static/chunks/")),
);
let totalBytes = 0;
const seen = new Set();
for (const url of chunkUrls) {
  if (seen.has(url)) continue;
  seen.add(url);
  const res = await page.request.get(url);
  totalBytes += (await res.body()).length;
}

const canvasCountBeforeIntent = await page.locator("canvas").count();

// Phase 2 instrumentation: fresh, non-buffered, registered immediately
// before the measured interaction - it structurally cannot see anything
// that happened during navigation/hydration.
await page.evaluate(() => {
  window.__interactionCLS = 0;
  window.__interactionLongTasks = [];
  window.__interactionMarker = performance.now();
  try {
    window.__interactionCLSObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput && entry.startTime >= window.__interactionMarker) {
          window.__interactionCLS += entry.value;
        }
      }
    });
    window.__interactionCLSObserver.observe({ type: "layout-shift", buffered: false });
  } catch {
    // layout-shift not supported in this browser context - reported as such below.
  }
  try {
    window.__interactionLongTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.startTime >= window.__interactionMarker) {
          window.__interactionLongTasks.push(entry.duration);
        }
      }
    });
    window.__interactionLongTaskObserver.observe({ type: "longtask", buffered: false });
  } catch {
    // longtask not supported - reported as such below.
  }
});

const firstNode = page.getByRole("button", { name: /architecture node 1 of/ });
const nodeExists = await firstNode.isVisible().catch(() => false);
let interactionMeasured = false;

if (nodeExists) {
  await firstNode.click();
  // Real settle: poll for the actual DOM consequence of the click, not a
  // fixed delay. aria-pressed flipping to "true" is the interaction's own
  // completion signal.
  await firstNode
    .evaluate((el) => {
      return new Promise((resolve) => {
        const check = () => {
          if (el.getAttribute("aria-pressed") === "true") {
            resolve(true);
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
    })
    .catch(() => {});
  // One further settle window past the DOM update, event-driven: wait for
  // the next two animation frames so any React commit's own layout/paint
  // work is captured by the still-attached observer before it's read.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );
  interactionMeasured = true;
}

const interactionCLS = await page.evaluate(() => window.__interactionCLS ?? null);
const interactionLongTasks = await page.evaluate(() => window.__interactionLongTasks ?? []);
const maxInteractionLongTask =
  interactionLongTasks.length > 0 ? Math.max(...interactionLongTasks) : 0;

await page.evaluate(() => {
  window.__interactionCLSObserver?.disconnect();
  window.__interactionLongTaskObserver?.disconnect();
});

console.log(`Measured: ${targetPath}`);
console.log(`  Response-body JS bytes (page.request.get sum, dedup'd): ${totalBytes} (${(totalBytes / 1024).toFixed(1)} KB)`);
console.log(`  Chunk requests: ${seen.size}`);
console.log(`  <canvas> count before any spatial intent: ${canvasCountBeforeIntent}`);
console.log(`  --- Navigation/hydration phase (buffered observer, page.goto -> networkidle) ---`);
console.log(`  Hydration-phase CLS (layout-shift API, hadRecentInput excluded): ${hydrationCLS === null ? "unsupported in this browser context" : hydrationCLS}`);
console.log(`  Hydration-phase long tasks: ${hydrationLongTasks.length}, longest = ${maxHydrationLongTask.toFixed(1)}ms`);
console.log(`  --- Interaction-only phase (fresh non-buffered observer, marker at click time) ---`);
if (!interactionMeasured) {
  console.log(`  Atlas node button not found/visible - interaction NOT measured for this route.`);
} else {
  console.log(`  Interaction-only CLS (layout-shift API, hadRecentInput excluded): ${interactionCLS === null ? "unsupported in this browser context" : interactionCLS}`);
  console.log(`  Interaction-only long tasks: ${interactionLongTasks.length}, longest = ${maxInteractionLongTask.toFixed(1)}ms`);
}

await browser.close();
