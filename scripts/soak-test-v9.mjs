import { chromium } from "playwright";

/**
 * V9 soak test. Unlike soak-test-v8.mjs (which exists because Atlas,
 * Operational Twin, and RC-01 each mount and unmount a real WebGL
 * canvas, a genuine leak surface), V9 introduces zero new Canvas-mounting
 * surfaces at all - Direction B deliberately kept every new pillar
 * (Command Palette, Recruiter Flight Plan, Engineer Investigation,
 * Evidence Graph, Scenario Simulator) as plain HTML/CSS. So this soak
 * test's job is different: repeated open/close/expand/collapse cycles of
 * the new interactive surfaces, checking for listener leaks (the same
 * instrumentation method soak-test-v8.mjs uses) and asserting canvas
 * count stays at 0 throughout every cycle - not "at most 1," but exactly
 * 0, since that is the actual invariant these specific surfaces must
 * hold.
 */
const baseUrl = process.env.V9_BASE_URL ?? "http://localhost:3200";
const cycles = Number(process.env.V9_SOAK_CYCLES ?? 15);

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
  });
}

async function checkZeroCanvas(label) {
  const canvasCount = await page.locator("canvas").count();
  if (canvasCount !== 0) {
    failures++;
    log(`${label} FAIL: ${canvasCount} <canvas> elements present - V9's new pillars must never mount one`);
  }
  return canvasCount;
}

async function cycleCommandPalette(label) {
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: /command palette/i });
  await dialog
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {
      failures++;
      log(`${label} FAIL: Command Palette never opened`);
    });
  await dialog.getByRole("combobox").fill("Aurora").catch(() => {});
  await page.keyboard.press("Escape");
  await dialog
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {
      failures++;
      log(`${label} FAIL: Command Palette never closed`);
    });
}

async function cycleScenarioSimulator(label) {
  const sim = page.getByRole("region", { name: /scenario simulator/i });
  const card = sim.getByRole("button", { name: /traffic spike/i });
  await card.click();
  const choice = sim.getByRole("button", { name: /manually launch more ec2/i });
  await choice
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {
      failures++;
      log(`${label} FAIL: Scenario Simulator never expanded`);
    });
  await choice.click();
  await sim
    .getByText(/trade-off/i)
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {
      failures++;
      log(`${label} FAIL: Scenario Simulator outcome never appeared`);
    });
  await card.click(); // collapse
}

async function cyclePathSwitch(label) {
  await page.goto(`${baseUrl}/?path=recruiter`, { waitUntil: "networkidle" });
  const plan = page.getByRole("region", { name: /recruiter flight plan/i });
  await plan
    .waitFor({ state: "visible", timeout: 5000 })
    .catch(() => {
      failures++;
      log(`${label} FAIL: Recruiter Flight Plan never appeared for ?path=recruiter`);
    });
  await plan.getByRole("button", { name: /exit flight plan/i }).click();
  await page.getByRole("region", { name: /recruiter flight plan/i }).waitFor({ state: "hidden", timeout: 5000 }).catch(() => {
    failures++;
    log(`${label} FAIL: Recruiter Flight Plan never disappeared after Exit`);
  });
}

// --- Same-page repeated cycles, alternating the 3 interactive surfaces ---
await installInstrumentation();
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const baseline = await page.evaluate(() => ({ ...window.__listenerCounts }));
log(`Baseline (captured once, before any cycle): ${JSON.stringify(baseline)}`);

for (let i = 0; i < cycles; i++) {
  const surface = ["command-palette", "scenario-simulator", "path-switch"][i % 3];
  const label = `[cycle ${i}, ${surface}]`;

  if (surface === "command-palette") {
    await cycleCommandPalette(label);
  } else if (surface === "scenario-simulator") {
    await cycleScenarioSimulator(label);
  } else {
    await cyclePathSwitch(label);
  }

  const canvasCount = await checkZeroCanvas(label);

  const liveCounts = await page.evaluate(() => ({ ...window.__listenerCounts }));
  for (const [type, count] of Object.entries(liveCounts)) {
    const base = baseline[type] ?? 0;
    if (count > base) {
      failures++;
      log(`${label} FAIL: "${type}" listener count is ${count} vs baseline ${base} - real growth, not a cross-navigation artifact`);
    }
  }

  log(`${label} ok (canvas=${canvasCount})`);
}

if (consoleErrors.length > 0) {
  failures += consoleErrors.length;
  log(`\n${consoleErrors.length} browser console error(s)/pageerror(s) captured during the soak run:`);
  for (const e of consoleErrors.slice(0, 20)) log(`  ${e}`);
}

await browser.close();

console.log(
  `\n${failures === 0 ? `V9 soak test passed: ${cycles} same-page cycles across 3 interactive surfaces, zero canvas mounted throughout, no listener growth, no console errors.` : `V9 soak test FAILED: ${failures} issue(s) found.`}`,
);
if (failures > 0) process.exit(1);
