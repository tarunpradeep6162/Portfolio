import { chromium } from "playwright";

/**
 * Two passes, each isolating a different failure mode:
 *
 * Pass 1 - repeated activate/deactivate on the SAME page instance, no
 * navigation. This is the only way to actually observe listener
 * accumulation: page.goto() is a real browser navigation that creates a
 * fresh `window` every time, so nothing can leak *across* navigations by
 * construction - an earlier version of this script compared each route's
 * one-time listener footprint against a single "/" baseline and reported
 * "leaks" that were really just different routes having different natural
 * listener counts, never actually growing cycle-over-cycle. Same-page
 * repetition is what catches a real "each activate adds a listener that
 * deactivate never removes" bug.
 *
 * Pass 2 - one activate/deactivate on each allowlisted route, confirming
 * canvas/panel/speech cleanup holds across routes (not a leak check, since
 * each route's baseline naturally differs).
 */
const baseUrl = process.env.V5_1_BASE_URL ?? "http://localhost:3400";
const sameRouteCycles = Number(process.env.V5_1_SOAK_CYCLES ?? 15);
const crossRoutes = ["/", "/work", "/about", "/contact"];

let failures = 0;
const log = (msg) => console.log(msg);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const consoleErrors = [];
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
});

async function installInstrumentation() {
  await page.addInitScript(() => {
    window.__listenerCounts = {};
    const orig = window.addEventListener.bind(window);
    window.addEventListener = function (type, ...rest) {
      window.__listenerCounts[type] = (window.__listenerCounts[type] || 0) + 1;
      return orig(type, ...rest);
    };
    const origRemove = window.removeEventListener.bind(window);
    window.removeEventListener = function (type, ...rest) {
      if (window.__listenerCounts[type]) window.__listenerCounts[type] -= 1;
      return origRemove(type, ...rest);
    };

    class FakeUtterance {
      constructor(text) {
        this.text = text;
        this.onend = null;
        this.onerror = null;
      }
    }
    window.SpeechSynthesisUtterance = FakeUtterance;
    let speaking = false;
    window.__speakCancelCalls = 0;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak: (u) => {
          speaking = true;
          setTimeout(() => {
            if (speaking) {
              speaking = false;
              if (u.onend) u.onend();
            }
          }, 3000);
        },
        cancel: () => {
          window.__speakCancelCalls += 1;
          speaking = false;
        },
        pause: () => {},
        resume: () => {},
        get speaking() {
          return speaking;
        },
      },
    });
  });
}

async function checkPostDeactivateState(label) {
  const state = await page.evaluate(() => ({
    canvasCount: document.querySelectorAll("canvas").length,
    companionRegionCount: document.querySelectorAll('[role="region"][aria-label*="RC-01" i]').length,
    speaking: window.speechSynthesis.speaking,
  }));
  if (state.canvasCount !== 0) {
    failures++;
    log(`${label} FAIL: ${state.canvasCount} <canvas> elements retained after deactivation`);
  }
  if (state.companionRegionCount !== 0) {
    failures++;
    log(`${label} FAIL: companion panel DOM root retained after deactivation`);
  }
  if (state.speaking) {
    failures++;
    log(`${label} FAIL: speechSynthesis still speaking after deactivation`);
  }
  return state;
}

// --- Pass 1: same-page repeated activate/deactivate ---
await installInstrumentation();
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
// "networkidle" does not guarantee every mount-time useEffect (e.g. the
// always-mounted InfrastructureObservatory/ReliabilitySpine's own listeners,
// unrelated to RC-01) has finished registering yet - capturing the baseline
// immediately can make ordinary page-load listeners look like they were
// added *by* the first activation. Give hydration a beat to fully settle.
await page.waitForTimeout(1500);

const baseline = await page.evaluate(() => ({ ...window.__listenerCounts }));
log(`Pass 1 baseline (captured once, before any activation): ${JSON.stringify(baseline)}`);

for (let i = 0; i < sameRouteCycles; i++) {
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  const panel = page.getByRole("region", { name: /RC-01 Reliability Companion panel/i });
  await panel.waitFor({ state: "visible", timeout: 20000 });

  const canvasCount = await page.locator("canvas").count();
  if (canvasCount > 1) {
    failures++;
    log(`[same-page cycle ${i}] FAIL: ${canvasCount} <canvas> elements present, expected at most 1`);
  }

  await page.getByRole("button", { name: /^speak$/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /deactivate rc-01/i }).click();
  await page.waitForTimeout(300);

  const state = await checkPostDeactivateState(`[same-page cycle ${i}]`);

  const liveCounts = await page.evaluate(() => ({ ...window.__listenerCounts }));
  for (const [type, count] of Object.entries(liveCounts)) {
    const base = baseline[type] ?? 0;
    if (count > base) {
      failures++;
      log(`[same-page cycle ${i}] FAIL: "${type}" listener count is ${count} vs baseline ${base} on the SAME page instance - real growth, not a cross-route artifact`);
    }
  }

  log(`[same-page cycle ${i}] ok (canvas=${state.canvasCount}, speaking=${state.speaking})`);
}

const cancelCalls = await page.evaluate(() => window.__speakCancelCalls);
if (cancelCalls === 0) {
  failures++;
  log(`Pass 1 FAIL: speechSynthesis.cancel() was never called across ${sameRouteCycles} cycles`);
} else {
  log(`Pass 1: speechSynthesis.cancel() called ${cancelCalls} times across ${sameRouteCycles} cycles`);
}

// --- Pass 2: one activate/deactivate per allowlisted route ---
for (const route of crossRoutes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });

  const activateBtn = page.getByRole("button", { name: /activate rc-01/i });
  if (!(await activateBtn.isVisible().catch(() => false))) {
    log(`[cross-route ${route}] no Activate button visible - unexpected for an allowlisted route`);
    failures++;
    continue;
  }
  await activateBtn.click();
  await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /deactivate rc-01/i }).click();
  await page.waitForTimeout(300);
  const state = await checkPostDeactivateState(`[cross-route ${route}]`);
  log(`[cross-route ${route}] ok (canvas=${state.canvasCount}, speaking=${state.speaking})`);
}

if (consoleErrors.length > 0) {
  failures += consoleErrors.length;
  log(`\n${consoleErrors.length} browser console error(s)/pageerror(s) captured during the soak run:`);
  for (const e of consoleErrors.slice(0, 20)) log(`  ${e}`);
}

await browser.close();

console.log(
  `\n${failures === 0 ? `Soak test passed: ${sameRouteCycles} same-page activate/deactivate cycles + ${crossRoutes.length} cross-route cycles, no leaks detected.` : `Soak test FAILED: ${failures} issue(s) found.`}`,
);
if (failures > 0) process.exit(1);
