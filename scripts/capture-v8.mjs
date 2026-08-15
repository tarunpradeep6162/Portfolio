import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/**
 * V8-specific evidence capture. Distinct from capture-v7.mjs (which only
 * ever exercised the three independent V7 scene hosts, before the
 * Phase 1-4 consolidation). Every capture here targets something that
 * either did not exist before V8 (the Unified Control Room narrative,
 * cross-system canvas-ownership enforcement, Operational Twin's context-
 * loss recovery) or something V8 specifically fixed (RC-01's canvas
 * error no longer closing its whole panel, the mobile clipping bugs).
 */
const baseUrl = process.env.V8_BASE_URL ?? "http://localhost:3200";
const output = process.env.V8_SCREENSHOT_DIR ?? "/tmp/v8-screenshots";

let failures = 0;

async function assertVisibleNonZero(locator, label) {
  const box = await locator.boundingBox();
  if (!box || box.width <= 0 || box.height <= 0) {
    failures++;
    throw new Error(`Assertion failed: ${label} is not visible/non-zero-sized (${JSON.stringify(box)})`);
  }
  return box;
}

async function forceInstantScroll(page) {
  await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
}

async function waitForCondition(fn, { timeout = 10000, interval = 100 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Condition did not become true within ${timeout}ms`);
}

async function installFakeSpeech(page) {
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
        speak: (u) => setTimeout(() => u.onend && u.onend(), 20),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
      },
    });
  });
}

async function capture(name, fn) {
  try {
    await fn();
    console.log(`captured: ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAILED ${name}: ${err.message}`);
  }
}

await mkdir(`${output}/v8`, { recursive: true });

let browser = await chromium.launch();

// 1. The Unified Control Room: one continuous narrative (Spine -> stat
// grid -> Incident Replay -> Automation Fabric -> Proof Ledger), not four
// separately-boxed sections each repeating Eyebrow/h2/intro - the actual
// Phase 5 deliverable, not a claim about it.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();
  await capture("01-control-room-narrative", async () => {
    await page.goto(`${baseUrl}#spine`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const section = page.locator("#spine");
    await assertVisibleNonZero(section, "Control Room section");
    // Confirm there is exactly one <h2> in this section, not four -
    // the concrete, checkable form of "merged into one narrative."
    const h2Count = await section.locator("h2").count();
    if (h2Count !== 1) {
      throw new Error(`Expected exactly 1 <h2> in the merged Control Room section, found ${h2Count}`);
    }
    // Confirm Incident Replay and Automation Fabric are present in the
    // same section (no longer separate id="incidents"/"automation"
    // sections - both were removed in Phase 5, confirmed by grep, and
    // this proves it stayed removed).
    await assertVisibleNonZero(page.getByText("Incident Replay", { exact: true }), "Incident Replay kicker inside Control Room");
    await assertVisibleNonZero(page.getByText("Automation Fabric", { exact: true }), "Automation Fabric kicker inside Control Room");
    await page.screenshot({ path: `${output}/v8/01-control-room-narrative.png` });
  });
  await context.close();
}

// 2. Cross-system canvas ownership: all three scenes (Atlas, Operational
// Twin, RC-01) now share one implementation (components/v8/ControlRoomScene.tsx)
// and one runtime ownership check (lib/v8/canvasOwnership.ts) - this
// activates all three in sequence in one session and confirms each
// cleanly claims and releases the single canvas slot. V7's equivalent
// script only ever proved this for two systems at once (Atlas closing
// RC-01); this is the first capture proving it across all three.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installFakeSpeech(page);

  await capture("02-cross-system-canvas-ownership", async () => {
    await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);

    // Atlas claims the canvas.
    await page.getByRole("button", { name: /enter 3d view/i }).click();
    await waitForCondition(async () => (await page.locator("canvas").count()) === 1);
    await page.getByRole("button", { name: /close 3d view/i }).click();
    await waitForCondition(async () => (await page.locator("canvas").count()) === 0);

    // Operational Twin claims it next, on the home page.
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    await page.getByRole("button", { name: /activate operational twin/i }).click();
    await waitForCondition(async () => (await page.locator("canvas").count()) === 1);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${output}/v8/02a-twin-holds-canvas.png` });
    await page.getByRole("button", { name: /close operational twin/i }).click();
    await waitForCondition(async () => (await page.locator("canvas").count()) === 0);

    // RC-01 claims it last.
    await page.getByRole("button", { name: /activate rc-01/i }).click();
    await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
    await waitForCondition(async () => (await page.locator("canvas").count()) === 1);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${output}/v8/02b-rc01-holds-canvas.png` });

    // Never more than one at any point this whole sequence.
    if ((await page.locator("canvas").count()) > 1) {
      throw new Error("More than one canvas mounted during the cross-system sequence");
    }
  });
  await context.close();
}

// 3. Operational Twin's context-loss recovery (new in V8 - the old
// operationalTwin.spec.ts had no such test at all until Phase 6).
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await capture("03-operational-twin-context-loss-recovery", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    await page.getByRole("button", { name: /activate operational twin/i }).click();
    await waitForCondition(async () => (await page.locator("canvas").count()) === 1);
    // Settle before dispatching - matches the fix Phase 6 made to the
    // equivalent Playwright test after finding this exact race.
    await page.waitForTimeout(800);
    await page.locator("canvas").evaluate((node) => node.dispatchEvent(new Event("webglcontextlost")));
    await waitForCondition(async () => (await page.locator("canvas").count()) === 0);
    await assertVisibleNonZero(
      page.getByText(/Operational Twin shown as a static deck/i),
      "Operational Twin static-deck fallback after context loss",
    );
    await page.screenshot({ path: `${output}/v8/03-operational-twin-context-loss-recovery.png` });
  });
  await context.close();
}

// 4. RC-01's context-loss recovery, specifically proving the Phase 4 bug
// fix: the panel itself stays open (role="region" still present), only
// the 3D portrait falls back to CompanionPortrait - the actual defect
// (the whole panel used to close) made visible, not just described.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installFakeSpeech(page);
  await capture("04-rc01-context-loss-panel-stays-open", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    await page.getByRole("button", { name: /activate rc-01/i }).click();
    const panel = page.getByRole("region", { name: /RC-01 Reliability Companion panel/i });
    await panel.waitFor({ timeout: 20000 });
    await waitForCondition(async () => (await page.locator("canvas").count()) === 1);
    await page.waitForTimeout(800);
    await page.locator("canvas").evaluate((node) => node.dispatchEvent(new Event("webglcontextlost")));
    await waitForCondition(async () => (await page.locator("canvas").count()) === 0);
    // The actual regression Phase 4 caught and fixed: without the fix,
    // this next line would throw (the panel had already unmounted).
    await assertVisibleNonZero(panel, "RC-01 panel, still open after its canvas failed");
    await assertVisibleNonZero(
      page.getByRole("img", { name: /RC-01, the Reliability Companion, static portrait/i }),
      "RC-01 static portrait fallback",
    );
    await page.screenshot({ path: `${output}/v8/04-rc01-context-loss-panel-stays-open.png` });
  });
  await context.close();
}

// 5. Mobile: the Control Room section and the Project Comparison
// selects, both real clipping bugs Phase 5/6 found and fixed, now
// wrapping correctly at 390px.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await capture("05-mobile-control-room-no-clipping", async () => {
    await page.goto(`${baseUrl}#spine`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) throw new Error("Horizontal overflow at 390px on the Control Room section");
    // The specific element that was clipped: confirm its rendered width
    // never exceeds the viewport (not just "no scrollbar", which the old
    // check alone would have missed - see docs/PORTFOLIO_V8_PHASE5_HOMEPAGE.md).
    const grid = page.locator("#spine .grid").first();
    const gridBox = await grid.boundingBox();
    if (gridBox && gridBox.width > 390) {
      throw new Error(`Control Room grid renders at ${gridBox.width}px, wider than the 390px viewport`);
    }
    await page.screenshot({ path: `${output}/v8/05-mobile-control-room-no-clipping.png` });
  });

  await capture("06-mobile-project-comparison-selects", async () => {
    const select = page.locator("#spine select").first();
    await select.scrollIntoViewIfNeeded();
    const box = await select.boundingBox();
    if (!box || box.width > 390) {
      throw new Error(`Project Comparison select renders at ${box?.width}px, wider than the 390px viewport`);
    }
    await page.screenshot({ path: `${output}/v8/06-mobile-project-comparison-selects.png` });
  });
  await context.close();
}

await browser.close();

console.log(`\n${failures === 0 ? "All V8 captures passed their assertions." : `${failures} capture(s) FAILED their assertions.`}`);
if (failures > 0) process.exit(1);
