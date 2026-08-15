import { chromium } from "playwright";

/**
 * V8 soak test, extending soak-test-v6.mjs's proven two-pass design to a
 * third system: since Phase 2-4 moved Atlas, Operational Twin, and RC-01
 * onto one shared canvas host (components/v8/ControlRoomScene.tsx) and one
 * ownership tracker (lib/v8/canvasOwnership.ts), a leak or a stuck-fallback
 * regression in the shared host would affect all three - V6's two-system
 * alternation could not catch that.
 *
 * Atlas only mounts on case-study routes (AtlasCanvasHost is used from
 * work/[slug]) and Operational Twin only mounts on the home page (its only
 * caller is components/hero/Hero.tsx) - unlike V6 where both systems shared
 * one route, there is no single route where all three can be exercised
 * together. So this script runs two same-page sequences instead of one:
 * Atlas<->RC-01 on a case-study route (matching V6 exactly), and
 * Twin<->RC-01 on the home page (new in V8).
 *
 * Both sequences also specifically re-check the Phase 7 regression this
 * soak test was written to guard against: closing a scene via its ordinary
 * Close/Deactivate control must return to the plain Activate control, never
 * leave the "failed to load"/"shown as a static deck" error fallback
 * showing after a close that was not a genuine WebGL context loss. That bug
 * was real, shipped past every existing assertion-only test, and was only
 * caught by visually inspecting evidence screenshots - this soak test adds
 * the DOM-level check so a regression trips CI, not just a human screenshot
 * review.
 */
const baseUrl = process.env.V8_BASE_URL ?? "http://localhost:3200";
const sameRouteCycles = Number(process.env.V8_SOAK_CYCLES ?? 12);
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

// The Phase 7 regression check: after an ordinary close (not a genuine
// WebGL context loss), the scene must return to its plain Activate control,
// never get stuck showing the "failed to load"/"shown as a static deck"
// error fallback that only a real error should produce.
async function checkNoStuckFallback(label, { activateName, fallbackTextPattern }) {
  const activateVisible = await page
    .getByRole("button", { name: activateName })
    .isVisible()
    .catch(() => false);
  const fallbackVisible = await page
    .getByText(fallbackTextPattern)
    .first()
    .isVisible()
    .catch(() => false);
  if (!activateVisible) {
    failures++;
    log(`${label} FAIL: Activate control not visible after close - possibly stuck`);
  }
  if (fallbackVisible) {
    failures++;
    log(`${label} FAIL: error fallback still showing after an ordinary close (the Phase 7 regression)`);
  }
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
    await page.waitForTimeout(300);
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
    await page.waitForTimeout(300);
  }
}

async function activateTwin(label) {
  const btn = page.getByRole("button", { name: /activate operational twin/i });
  if (!(await btn.isVisible().catch(() => false))) return false;
  await btn.click();
  const settled = await page
    .locator("canvas")
    .first()
    .waitFor({ state: "visible", timeout: 10000 })
    .then(() => true)
    .catch(() => {
      failures++;
      log(`${label} FAIL: Operational Twin canvas never became visible (stuck loading state)`);
      return false;
    });
  return settled;
}

async function deactivateTwin() {
  const btn = page.getByRole("button", { name: /close operational twin/i });
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

async function runSameRouteSequence({ routeLabel, systems }) {
  await page.waitForTimeout(1500);
  const baseline = await page.evaluate(() => ({ ...window.__listenerCounts }));
  log(`Pass 1 [${routeLabel}] baseline (captured once, before any activation): ${JSON.stringify(baseline)}`);

  for (let i = 0; i < sameRouteCycles; i++) {
    const system = systems[i % systems.length];
    const label = `[${routeLabel} cycle ${i}, ${system}]`;

    if (system === "atlas") {
      const opened = await activateAtlas3D(label);
      await checkCleanState(label);
      if (opened) {
        await deactivateAtlas3D();
        await checkNoStuckFallback(label, {
          activateName: /enter 3d view/i,
          fallbackTextPattern: /3d view failed to load/i,
        });
      }
    } else if (system === "twin") {
      const opened = await activateTwin(label);
      await checkCleanState(label);
      if (opened) {
        await deactivateTwin();
        await checkNoStuckFallback(label, {
          activateName: /activate operational twin/i,
          fallbackTextPattern: /operational twin shown as a static deck/i,
        });
      }
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

  const cancelCalls = await page.evaluate(() => window.__speakCancelCalls);
  log(`Pass 1 [${routeLabel}]: speechSynthesis.cancel() called ${cancelCalls} times across ${sameRouteCycles} cycles`);
}

// --- Pass 1a: Atlas <-> RC-01 on a case-study route (matches V6) ---
await installInstrumentation();
await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await runSameRouteSequence({ routeLabel: "/work/project-aurora", systems: ["atlas", "rc01"] });

// Mutual exclusion: Atlas + RC-01, same route.
{
  const label = "[mutual exclusion, /work/project-aurora]";
  await activateRC01(label);
  const openedAtlas = await activateAtlas3D(label);
  const canvasCount = await page.locator("canvas").count();
  if (canvasCount > 1) {
    failures++;
    log(`${label} FAIL: ${canvasCount} canvases mounted after activating Atlas 3D while RC-01 was open`);
  } else {
    log(`${label} ok: canvas count stayed at ${canvasCount} after activating Atlas 3D while RC-01 was open`);
  }
  if (openedAtlas) await deactivateAtlas3D();
  await deactivateRC01();
  await checkFullyDeactivatedState(label);
}

// --- Pass 1b: Operational Twin <-> RC-01 on the home page (new in V8) ---
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await runSameRouteSequence({ routeLabel: "/", systems: ["twin", "rc01"] });

// Mutual exclusion: Operational Twin + RC-01, home page.
{
  const label = "[mutual exclusion, /]";
  await activateRC01(label);
  const openedTwin = await activateTwin(label);
  const canvasCount = await page.locator("canvas").count();
  if (canvasCount > 1) {
    failures++;
    log(`${label} FAIL: ${canvasCount} canvases mounted after activating Operational Twin while RC-01 was open`);
  } else {
    log(`${label} ok: canvas count stayed at ${canvasCount} after activating Operational Twin while RC-01 was open`);
  }
  if (openedTwin) await deactivateTwin();
  await deactivateRC01();
  await checkFullyDeactivatedState(label);
}

// --- Pass 2: one activation cycle per allowlisted case-study route ---
for (const route of crossRoutes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
  const label = `[cross-route ${route}]`;

  const openedAtlas = await activateAtlas3D(label);
  await checkCleanState(label);
  if (openedAtlas) {
    await deactivateAtlas3D();
    await checkNoStuckFallback(label, {
      activateName: /enter 3d view/i,
      fallbackTextPattern: /3d view failed to load/i,
    });
  }

  await activateRC01(label);
  await deactivateRC01();
  const state = await checkFullyDeactivatedState(label);
  log(`${label} ok (canvas=${state.canvasCount}, speaking=${state.speaking})`);
}

// Operational Twin only appears on the home page, so its cross-route check
// is a single home-page cycle rather than one per case-study route.
{
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
  const label = "[cross-route / (Operational Twin)]";
  const opened = await activateTwin(label);
  await checkCleanState(label);
  if (opened) {
    await deactivateTwin();
    await checkNoStuckFallback(label, {
      activateName: /activate operational twin/i,
      fallbackTextPattern: /operational twin shown as a static deck/i,
    });
  }
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
  `\n${failures === 0 ? `V8 soak test passed: ${sameRouteCycles * 2} same-page activation cycles across 2 route/system sequences + 2 mutual-exclusion checks + ${crossRoutes.length + 1} cross-route cycles, no leaks, crashes, or stuck fallbacks detected.` : `V8 soak test FAILED: ${failures} issue(s) found.`}`,
);
if (failures > 0) process.exit(1);
