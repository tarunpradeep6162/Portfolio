import { mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/**
 * The V7 walkthrough - distinct from record-v6-experience.mjs, which only
 * ever exercised V6 surfaces (Atlas, RC-01 tours, V6 Proof Mode) and was
 * mistakenly relied on as "V7 evidence" until caught by direct artifact
 * inspection. Every beat here demonstrates a feature that did not exist
 * before this session's V7 work: Operational Twin activation/close, System
 * Trace cross-surface sync, all four project-world topologies, Deployment
 * Replay's Play control, Incident Replay, Automation Fabric, Proof Ledger +
 * project comparison, a real V7 RC-01 command (one-canvas mutual exclusion
 * via "twin"), and reduced-motion/mobile states.
 */
const baseUrl = process.env.V7_BASE_URL ?? process.env.V6_BASE_URL ?? "http://localhost:3500";
const outputDir = process.env.V7_VIDEO_DIR ?? "/tmp/v7-video";
const finalPath = path.join(outputDir, "v7-operational-twin-walkthrough.webm");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  // Explicit, not left to the browser's ambient default: this headless
  // Chromium environment was found (by direct frame-by-frame inspection of
  // a recorded video) to sometimes evaluate
  // matchMedia("(prefers-reduced-motion: reduce)") as true even without
  // any override, showing the Operational Twin's reduced-motion fallback
  // instead of the real 3D scene this walkthrough is meant to demonstrate.
  reducedMotion: "no-preference",
  recordVideo: { dir: outputDir, size: { width: 1440, height: 960 } },
});
const page = await context.newPage();

await page.addInitScript(() => {
  class FakeUtterance {
    constructor(text) {
      this.text = text;
      this.rate = 1;
      this.onend = null;
      this.onerror = null;
    }
  }
  window.SpeechSynthesisUtterance = FakeUtterance;
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      speak: (u) => setTimeout(() => u.onend && u.onend(), 1500),
      cancel: () => {},
      pause: () => {},
      resume: () => {},
    },
  });
});

async function assertVisible(locator, label) {
  const visible = await locator.isVisible().catch(() => false);
  if (!visible) {
    throw new Error(`Recorded V7 walkthrough expected "${label}" to be visible but it was not - failing rather than shipping an incomplete video`);
  }
}

// Canvas-mount and RC-01-close are two separate dispatched effects that
// were observed resolving in different orders under real VM contention
// (confirmed by direct reproduction on the equivalent capture-v7.mjs
// check) - polling each independently instead of one check after a fixed
// wait.
async function waitForCondition(fn, { timeout = 10000, interval = 100 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Condition did not become true within ${timeout}ms`);
}

async function assertCanvasCount(expected, label) {
  const count = await page.locator("canvas").count();
  if (count !== expected) {
    throw new Error(`${label}: expected ${expected} canvas(es), found ${count}`);
  }
}

// 1. Home page, zero canvas before intent.
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.waitForTimeout(1000);
await assertCanvasCount(0, "Cold home-page load");

// 2. Operational Twin: activate, exactly one canvas, close, back to zero.
const twinBtn = page.getByRole("button", { name: /activate operational twin/i });
// A genuine hydration-timing gap, not a fixed-wait guess: useReducedMotion
// renders reduced=true on first paint by design and only corrects after
// client hydration - measured directly on this VM as taking up to ~3s past
// networkidle. waitFor polls for the real post-hydration state.
await twinBtn.waitFor({ state: "visible", timeout: 10000 });
await twinBtn.click();
await page.locator("canvas").first().waitFor({ state: "visible", timeout: 10000 });
await assertVisible(
  page.getByRole("img", { name: /The Operational Twin.*instrument deck/i }),
  "working Operational Twin scene",
);
await assertCanvasCount(1, "Operational Twin active");
await page.waitForTimeout(2200);
await page.getByRole("button", { name: /close operational twin/i }).click();
await page.waitForTimeout(400);
await assertCanvasCount(0, "Operational Twin after Close");

// 3. System Trace - selecting a stage is a real dispatch, not decorative.
await page.locator("#spine").scrollIntoViewIfNeeded();
const trace = page.locator("[data-v7-trace-scope]");
await assertVisible(trace, "System Trace control");
await page.waitForTimeout(600);
await page.getByRole("button", { name: "Test", exact: true }).click();
await page.waitForTimeout(1400);

// 4. Four distinct project-world topologies - visit all four case studies.
const caseStudies = [
  "/work/project-aurora",
  "/work/distributed-jenkins-controller",
  "/work/secure-aws-production-architecture",
  "/work/nodejs-auth-mysql-rds",
];
for (const route of caseStudies) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
  const diagram = page.getByRole("list", { name: /architecture nodes, selectable/i });
  await assertVisible(diagram, `topology diagram at ${route}`);
  await diagram.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
}

// 5. Deployment Replay - the Play control, on the last case study page.
const timeMachine = page.getByRole("group", { name: /architecture time machine/i });
await timeMachine.scrollIntoViewIfNeeded();
await assertVisible(timeMachine, "Architecture Time Machine");
const playBtn = timeMachine.getByRole("button", { name: /^Play .*deployment replay$/i });
await assertVisible(playBtn, "Deployment Replay Play control");
await playBtn.click();
await assertVisible(
  timeMachine.getByRole("button", { name: /^Pause .*deployment replay$/i }),
  "Deployment Replay Pause control",
);
await page.waitForTimeout(2400);
await timeMachine.getByRole("button", { name: /^Pause .*deployment replay$/i }).click();

// 6. Incident Replay.
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.locator("#incidents").scrollIntoViewIfNeeded();
await assertVisible(page.locator("#incidents"), "Incident Replay section");
await page.waitForTimeout(800);
const incidentNext = page.getByRole("button", { name: /Next step in this incident's record/i });
if (await incidentNext.isVisible().catch(() => false)) {
  await incidentNext.click();
  await page.waitForTimeout(1200);
}

// 7. Automation Fabric.
await page.locator("#automation").scrollIntoViewIfNeeded();
await assertVisible(page.locator("#automation"), "Automation Fabric section");
await page.waitForTimeout(1400);

// 8. Proof Ledger + project comparison.
await page.locator("#proof-ledger").scrollIntoViewIfNeeded();
await assertVisible(
  page.getByRole("list", { name: /Proof Ledger, \d+ records? shown/i }),
  "Proof Ledger list",
);
await assertVisible(page.locator("table"), "Project comparison table");
await page.waitForTimeout(1800);

// 9. A real V7 RC-01 command - "twin" via the command console, demonstrating
// one-canvas mutual exclusion (closes RC-01, mounts exactly one canvas).
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
await page.waitForTimeout(600);
await page.getByRole("button", { name: /^console$/i }).click();
const consoleInput = page.getByLabel("RC-01 console command");
await assertVisible(consoleInput, "RC-01 console command input");
await consoleInput.fill("twin");
await page.waitForTimeout(400);
await consoleInput.press("Enter");
await waitForCondition(async () => (await page.locator("canvas").count()) === 1);
await waitForCondition(
  async () =>
    (await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).count()) === 0,
);
// Canvas mounting and its first WebGL frame actually painting are two
// different moments - a settle wait so the recorded video shows the real
// instrument deck, not a blank canvas (confirmed by direct visual
// inspection on the equivalent capture-v7.mjs screenshot).
await page.waitForTimeout(800);
await page.waitForTimeout(1600);
await page.getByRole("button", { name: /close operational twin/i }).click();
await page.waitForTimeout(400);

// 10. Reduced-motion state.
await context.close();
const reducedContext = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  reducedMotion: "reduce",
  recordVideo: { dir: outputDir, size: { width: 1440, height: 960 } },
});
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
await reducedPage.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
if ((await reducedPage.locator("canvas").count()) !== 0) {
  throw new Error("Reduced motion must never mount a <canvas>");
}
await reducedPage.waitForTimeout(1200);

// 11. Mobile viewport, a V7 section specifically.
await reducedContext.close();
const mobileContext = await browser.newContext({
  viewport: { width: 375, height: 812 },
  reducedMotion: "no-preference",
  recordVideo: { dir: outputDir, size: { width: 375, height: 812 } },
});
const mobilePage = await mobileContext.newPage();
await mobilePage.goto(`${baseUrl}#incidents`, { waitUntil: "networkidle" });
await mobilePage.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await mobilePage.locator("#incidents").scrollIntoViewIfNeeded();
await assertVisible(mobilePage.locator("#incidents"), "Incident Replay at mobile width");
await mobilePage.waitForTimeout(1400);

await mobileContext.close();
await browser.close();

// recordVideo writes a hash-named .webm per context on close. Three
// contexts were recorded above (main + reduced-motion + mobile) - only the
// FIRST (the main walkthrough, by far the longest and most complete) is
// renamed to the stable, predictable filename the report references; the
// other two stay under their hash names as supplementary clips rather than
// silently overwriting the primary one.
const files = await readdir(outputDir);
const recorded = files.filter((f) => f.endsWith(".webm") && f !== path.basename(finalPath));
if (recorded.length === 0) {
  throw new Error("No .webm file was produced by recordVideo - the walkthrough did not actually record");
}
// Largest file = the main walkthrough (most beats, longest duration).
const { statSync } = await import("node:fs");
recorded.sort((a, b) => statSync(path.join(outputDir, b)).size - statSync(path.join(outputDir, a)).size);
await rename(path.join(outputDir, recorded[0]), finalPath);
console.log(`Primary V7 walkthrough saved to ${finalPath}`);
console.log(`${recorded.length - 1} supplementary clip(s) (reduced-motion, mobile) retained under their original names.`);
