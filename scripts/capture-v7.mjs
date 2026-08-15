import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/**
 * V7-specific evidence capture. Distinct from capture-v6.mjs (which only
 * ever exercised V6 surfaces - Atlas, RC-01 tours, V6 Proof Mode - and was
 * mistakenly relied on as "V7 evidence" until this was caught by direct
 * source review and artifact inspection). Every capture here targets a
 * feature that did not exist before this session's V7 work.
 */
const baseUrl = process.env.V7_BASE_URL ?? process.env.V6_BASE_URL ?? "http://localhost:3500";
const output = process.env.V7_SCREENSHOT_DIR ?? "/tmp/v7-screenshots";

const caseStudyRoutes = [
  ["case-aurora", "/work/project-aurora"],
  ["case-jenkins", "/work/distributed-jenkins-controller"],
  ["case-secure-aws", "/work/secure-aws-production-architecture"],
  ["case-nodejs-auth", "/work/nodejs-auth-mysql-rds"],
];

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

// A single check-after-a-fixed-wait raced React's re-render under real VM
// contention (confirmed by direct reproduction: the same assertion failed
// two different ways on two different runs - canvas not yet mounted, then
// RC-01 not yet closed - a timing race, not a logic bug). Polling until the
// condition holds (or a real timeout elapses) is the same fix already
// proven elsewhere in this repo's own scripts/tests for the same class of
// problem (e.g. companion.spec.ts's Reliability Spine Tour highlight
// check).
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

await mkdir(`${output}/v7`, { recursive: true });
await mkdir(`${output}/v7/topologies`, { recursive: true });

let browser = await chromium.launch();

// 1. Operational Twin: idle -> activating -> active (exactly one canvas) ->
// closed (back to zero canvas). The hero feature this whole session built.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  await capture("01-operational-twin-idle", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const btn = page.getByRole("button", { name: /activate operational twin/i });
    // A genuine hydration-timing gap, not a fixed-wait guess: useReducedMotion
    // renders reduced=true on first paint by design (server snapshot, avoids
    // a motion flash) and only corrects after client hydration - measured
    // directly on this VM as taking up to ~3s past networkidle, which is
    // longer than this capture's original 0s implicit wait. waitFor polls
    // for the real post-hydration state instead of assuming it's immediate.
    await btn.waitFor({ state: "visible", timeout: 10000 });
    if ((await page.locator("canvas").count()) !== 0) {
      throw new Error("A <canvas> exists before any activation - violates zero-canvas-before-intent");
    }
    await page.screenshot({ path: `${output}/v7/01-operational-twin-idle.png` });
  });

  await capture("02-operational-twin-active", async () => {
    await page.getByRole("button", { name: /activate operational twin/i }).click();
    await page.locator("canvas").first().waitFor({ state: "visible", timeout: 10000 });
    await assertVisibleNonZero(
      page.getByRole("img", { name: /The Operational Twin.*instrument deck/i }),
      "Operational Twin instrument deck",
    );
    if ((await page.locator("canvas").count()) !== 1) {
      throw new Error(`Expected exactly 1 canvas while active, found ${await page.locator("canvas").count()}`);
    }
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${output}/v7/02-operational-twin-active.png` });
  });

  await capture("03-operational-twin-closed", async () => {
    await page.getByRole("button", { name: /close operational twin/i }).click();
    await page.waitForTimeout(300);
    if ((await page.locator("canvas").count()) !== 0) {
      throw new Error("Canvas still mounted after Close - clean-close lifecycle broken");
    }
    await page.screenshot({ path: `${output}/v7/03-operational-twin-closed.png` });
  });

  await context.close();
}

// 2. System Trace: selecting a stage is a real dispatch into shared state -
// the data-v7-trace-stage attribute is the same signal companion.spec.ts
// asserts on, not a decorative screenshot.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await capture("04-system-trace-selected", async () => {
    await page.goto(`${baseUrl}#spine`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const trace = page.locator("[data-v7-trace-scope]");
    await trace.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Build", exact: true }).click();
    await page.waitForTimeout(200);
    const stage = await trace.getAttribute("data-v7-trace-stage");
    if (stage !== "build") {
      throw new Error(`System Trace did not dispatch real state - expected stage "build", got "${stage}"`);
    }
    await page.screenshot({ path: `${output}/v7/04-system-trace-selected.png` });
  });
  await context.close();
}

// 3. Four distinct project-world topologies - the whole point is that they
// visibly differ (linear/agent-branch/service-fork/perimeter), not just
// that four screenshots exist.
{
  for (const [name, route] of caseStudyRoutes) {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await capture(`05-topology-${name}`, async () => {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
      await forceInstantScroll(page);
      const diagram = page.getByRole("list", { name: /architecture nodes, selectable/i });
      await assertVisibleNonZero(diagram, `${name} topology diagram`);
      await diagram.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/v7/topologies/${name}.png` });
    });
    await context.close();
  }
}

// 4. Deployment Replay: the Play control this session added on top of
// TimeMachine's existing Previous/Next/select-stage - mid-playback, not
// just the static stage list capture-v6.mjs already had.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await capture("06-deployment-replay-playing", async () => {
    await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const tm = page.getByRole("group", { name: /architecture time machine/i });
    await tm.scrollIntoViewIfNeeded();
    const playBtn = tm.getByRole("button", { name: /^Play .*deployment replay$/i });
    await assertVisibleNonZero(playBtn, "Deployment Replay Play control");
    await playBtn.click();
    await assertVisibleNonZero(
      tm.getByRole("button", { name: /^Pause .*deployment replay$/i }),
      "Deployment Replay Pause control (confirms playback state actually changed)",
    );
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${output}/v7/06-deployment-replay-playing.png` });
  });
  await context.close();
}

// 5. Incident Replay, 6. Automation Fabric, 7. Proof Ledger + project
// comparison - three real, distinct V7 components, none of which
// capture-v6.mjs ever visited.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  await capture("07-incident-replay", async () => {
    await page.goto(`${baseUrl}#incidents`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const section = page.locator("#incidents");
    await assertVisibleNonZero(section, "Incident Replay section");
    await section.scrollIntoViewIfNeeded();
    const nextBtn = page.getByRole("button", { name: /Next step in this incident's record/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: `${output}/v7/07-incident-replay.png` });
  });

  await capture("08-automation-fabric", async () => {
    await page.locator("#automation").scrollIntoViewIfNeeded();
    await assertVisibleNonZero(page.locator("#automation"), "Automation Fabric section");
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${output}/v7/08-automation-fabric.png` });
  });

  await capture("09-proof-ledger-and-comparison", async () => {
    await page.locator("#proof-ledger").scrollIntoViewIfNeeded();
    const ledger = page.getByRole("list", { name: /Proof Ledger, \d+ records? shown/i });
    await assertVisibleNonZero(ledger, "Proof Ledger list");
    await assertVisibleNonZero(page.locator("table"), "Project comparison table");
    await page.screenshot({ path: `${output}/v7/09-proof-ledger-and-comparison.png` });
  });

  await context.close();
}

// 8. V7 RC-01 commands + one-canvas mutual exclusion: "twin" is a real
// dispatch (closes RC-01, mounts exactly one canvas), not simulated
// console text - the same behavior companion.spec.ts's V7 test asserts.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installFakeSpeech(page);

  await capture("10-rc01-command-console-open", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    await page.getByRole("button", { name: /activate rc-01/i }).click();
    await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: /^console$/i }).click();
    const input = page.getByLabel("RC-01 console command");
    await assertVisibleNonZero(input, "RC-01 console command input");
    await input.fill("proof");
    await input.press("Enter");
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${output}/v7/10-rc01-command-console.png` });
  });

  await capture("11-v7-twin-command-one-canvas-exclusion", async () => {
    // "twin" activates the real Operational Twin scene and, via the same
    // one-canvas mutual exclusion Atlas already shares, closes RC-01
    // itself - an observable shared-state change, not narrated text.
    const input = page.getByLabel("RC-01 console command");
    await input.fill("twin");
    await input.press("Enter");
    // Poll both conditions independently rather than a single check after a
    // fixed wait: canvas-mount and RC-01-close are two separate dispatched
    // effects, and under real VM contention they were observed resolving
    // in different orders across different runs (confirmed by direct
    // reproduction) - each needs its own retry, not a shared guess.
    await waitForCondition(async () => (await page.locator("canvas").count()) === 1);
    await waitForCondition(
      async () =>
        (await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).count()) === 0,
    );
    // The canvas element mounting and its first WebGL frame actually
    // painting are two different moments - a screenshot taken right at
    // mount can show a genuinely empty canvas (confirmed by direct visual
    // inspection: the count-based assertions above all passed while the
    // instrument deck itself was still blank). Same settle time capture 02
    // already uses for the equivalent first-activation shot.
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${output}/v7/11-v7-twin-command-one-canvas-exclusion.png` });
  });

  await context.close();
}

// 9. Reduced-motion state for a V7 surface (the Operational Twin, not just
// Atlas - capture-v6.mjs's reduced-motion capture predates the Twin).
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await capture("12-operational-twin-reduced-motion", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    if ((await page.locator("canvas").count()) !== 0) {
      throw new Error("Reduced motion must never mount a <canvas> - checked on the Operational Twin specifically");
    }
    const fallback = page.getByText(/reduced motion|instrument deck/i).first();
    await assertVisibleNonZero(fallback, "Operational Twin reduced-motion fallback");
    await page.screenshot({ path: `${output}/v7/12-operational-twin-reduced-motion.png` });
  });
  await context.close();
}

// 10. Mobile state covering V7 sections specifically (System Trace,
// Incident Replay) - capture-v6.mjs's mobile captures never scrolled this
// far down the real V7 homepage.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await capture("13-mobile-v7-sections", async () => {
    await page.goto(`${baseUrl}#incidents`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const section = page.locator("#incidents");
    await assertVisibleNonZero(section, "Incident Replay section at mobile width");
    await section.scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) throw new Error("Horizontal overflow at 375px on a V7 section");
    await page.screenshot({ path: `${output}/v7/13-mobile-v7-sections.png` });
  });
  await context.close();
}

await browser.close();

console.log(`\n${failures === 0 ? "All V7 captures passed their assertions." : `${failures} capture(s) FAILED their assertions.`}`);
if (failures > 0) process.exit(1);
