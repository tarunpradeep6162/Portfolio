import { chromium } from "playwright";

/**
 * V6 soak test, extending soak-test.mjs's proven two-pass design:
 *
 * Pass 1 - repeated activation cycles on the SAME page instance (no
 * navigation, since page.goto() creates a fresh `window` every time and
 * cannot reveal cross-cycle listener growth). Alternates between RC-01 and
 * Atlas's 3D view each cycle specifically to exercise the one-canvas
 * mutual-exclusion rule under repetition, not just once.
 *
 * Pass 2 - one activation cycle per allowlisted case-study route,
 * confirming canvas/panel cleanup holds across routes.
 */
const baseUrl = process.env.V6_BASE_URL ?? "http://localhost:3500";
const sameRouteCycles = Number(process.env.V6_SOAK_CYCLES ?? 15);
const crossRoutes = [
  "/work/project-aurora",
  "/work/distributed-jenkins-controller",
  "/work/secure-aws-production-architecture",
  "/work/nodejs-auth-mysql-rds",
];

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

async function checkCleanState(label) {
  const state = await page.evaluate(() => ({
    canvasCount: document.querySelectorAll("canvas").length,
    companionRegionCount: document.querySelectorAll('[role="region"][aria-label*="RC-01" i]').length,
    speaking: window.speechSynthesis.speaking,
  }));
  if (state.canvasCount > 1) {
    failures++;
    log(`${label} FAIL: ${state.canvasCount} <canvas> elements present, expected at most 1 at any time`);
  }
  return state;
}

async function checkFullyDeactivatedState(label) {
  const state = await checkCleanState(label);
  if (state.canvasCount !== 0) {
    failures++;
    log(`${label} FAIL: ${state.canvasCount} <canvas> elements retained after full deactivation`);
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

async function activateRC01(label) {
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page
    .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
    .waitFor({ state: "visible", timeout: 20000 })
    .catch(() => {
      failures++;
      log(`${label} FAIL: RC-01 panel never became visible (stuck loading state)`);
    });
}

async function deactivateRC01() {
  const btn = page.getByRole("button", { name: /deactivate rc-01/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(200);
  }
}

async function activateAtlas3D(label) {
  const btn = page.getByRole("button", { name: /enter 3d view/i });
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.click();
  const settled = await page
    .locator("canvas")
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => {
      failures++;
      log(`${label} FAIL: Atlas 3D canvas never became visible (stuck loading state)`);
      return false;
    });
  return settled;
}

async function deactivateAtlas3D() {
  const btn = page.getByRole("button", { name: /close 3d view/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(200);
  }
}

// --- Pass 1: same-page repeated cycles, alternating RC-01 <-> Atlas 3D ---
await installInstrumentation();
await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
// Give hydration a beat before capturing the listener baseline, matching
// soak-test.mjs's finding that "networkidle" alone doesn't guarantee every
// mount-time effect has finished registering.
await page.waitForTimeout(1500);

const baseline = await page.evaluate(() => ({ ...window.__listenerCounts }));
log(`Pass 1 baseline (captured once, before any activation): ${JSON.stringify(baseline)}`);

for (let i = 0; i < sameRouteCycles; i++) {
  const useAtlas = i % 2 === 0;
  const label = `[same-page cycle ${i}, ${useAtlas ? "Atlas 3D" : "RC-01"}]`;

  if (useAtlas) {
    const opened = await activateAtlas3D(label);
    await checkCleanState(label);
    if (opened) await deactivateAtlas3D();
  } else {
    await activateRC01(label);
    await checkCleanState(label);
    await page.getByRole("button", { name: /^speak$/i }).click().catch(() => {});
    await page.waitForTimeout(200);
    await deactivateRC01();
  }

  const state = await checkFullyDeactivatedState(label);

  const liveCounts = await page.evaluate(() => ({ ...window.__listenerCounts }));
  for (const [type, count] of Object.entries(liveCounts)) {
    const base = baseline[type] ?? 0;
    if (count > base) {
      failures++;
      log(`${label} FAIL: "${type}" listener count is ${count} vs baseline ${base} on the SAME page instance - real growth, not a cross-route artifact`);
    }
  }

  log(`${label} ok (canvas=${state.canvasCount}, speaking=${state.speaking})`);
}

// Mutual exclusion, specifically: activating one while the other is open
// must close the first, never leaving two canvases mounted at once.
{
  const label = "[mutual exclusion]";
  await activateRC01(label);
  const rc01CanvasBefore = await page.locator("canvas").count();
  const opened = await activateAtlas3D(label);
  const canvasCount = await page.locator("canvas").count();
  if (canvasCount > 1) {
    failures++;
    log(`${label} FAIL: ${canvasCount} canvases mounted after activating Atlas 3D while RC-01 was open (RC-01 had ${rc01CanvasBefore})`);
  } else {
    log(`${label} ok: activating Atlas 3D left ${canvasCount} canvas(es) mounted`);
  }
  if (opened) await deactivateAtlas3D();
  await deactivateRC01();
  await checkFullyDeactivatedState(label);
}

const cancelCalls = await page.evaluate(() => window.__speakCancelCalls);
log(`Pass 1: speechSynthesis.cancel() called ${cancelCalls} times across ${sameRouteCycles} cycles`);

// --- Pass 2: one activation cycle per allowlisted case-study route ---
for (const route of crossRoutes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
  const label = `[cross-route ${route}]`;

  const opened = await activateAtlas3D(label);
  await checkCleanState(label);
  if (opened) await deactivateAtlas3D();

  await activateRC01(label);
  await deactivateRC01();
  const state = await checkFullyDeactivatedState(label);
  log(`${label} ok (canvas=${state.canvasCount}, speaking=${state.speaking})`);
}

if (consoleErrors.length > 0) {
  failures += consoleErrors.length;
  log(`\n${consoleErrors.length} browser console error(s)/pageerror(s) captured during the soak run:`);
  for (const e of consoleErrors.slice(0, 20)) log(`  ${e}`);
}

await browser.close();

console.log(
  `\n${failures === 0 ? `V6 soak test passed: ${sameRouteCycles} same-page activation cycles + mutual-exclusion check + ${crossRoutes.length} cross-route cycles, no leaks or crashes detected.` : `V6 soak test FAILED: ${failures} issue(s) found.`}`,
);
if (failures > 0) process.exit(1);
