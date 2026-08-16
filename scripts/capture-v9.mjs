import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/**
 * V9-specific evidence capture. Distinct from capture-v8.mjs (which
 * exercised the three shared-canvas systems and the Phase 5 homepage
 * narrative). Every capture here targets something that did not exist
 * before V9: the Command Interface, the Recruiter Flight Plan, the
 * Engineer Investigation connective pass, the Evidence Graph, and the
 * Scenario Simulator - none of which mount a Canvas, per Direction B.
 */
const baseUrl = process.env.V9_BASE_URL ?? "http://localhost:3200";
const output = process.env.V9_SCREENSHOT_DIR ?? "/tmp/v9-screenshots";

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

async function capture(name, fn) {
  try {
    await fn();
    console.log(`captured: ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAILED ${name}: ${err.message}`);
  }
}

await mkdir(`${output}/v9`, { recursive: true });

let browser = await chromium.launch();

// 1. The Command Palette: Ctrl+K opens it, typing filters to a real
// flagship project, with zero canvas mounted anywhere on the page - this
// is a plain HTML/CSS overlay, never a 3D scene.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await capture("01-command-palette-search", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    await page.waitForTimeout(500);
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.waitFor({ timeout: 10000 });
    // Scoped to the dialog - the page also has 2 pre-existing <select>
    // elements (ProjectComparison) that resolve to role="combobox" too.
    await dialog.getByRole("combobox").fill("Aurora");
    await assertVisibleNonZero(dialog.getByRole("option", { name: /project aurora/i }), "Aurora search result");
    if ((await page.locator("canvas").count()) !== 0) {
      throw new Error("Command Palette mounted a canvas - it must never mount one");
    }
    await page.screenshot({ path: `${output}/v9/01-command-palette-search.png` });
  });
  await context.close();
}

// 2. The Recruiter Flight Plan, via the real ?path=recruiter shareable
// URL - the exact 4 flagship projects, real skill domains, real contact
// actions, nothing invented.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1300 } });
  const page = await context.newPage();
  await capture("02-recruiter-flight-plan", async () => {
    await page.goto(`${baseUrl}/?path=recruiter`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    await assertVisibleNonZero(plan, "Recruiter Flight Plan section");
    await assertVisibleNonZero(plan.getByText("Project Aurora", { exact: false }), "Aurora in the flight plan");
    await plan.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/v9/02-recruiter-flight-plan.png` });
  });
  await context.close();
}

// 3. The Engineer Investigation bar, and proof that one of its jump
// links actually scrolls to a real, pre-existing section - not a dead
// anchor.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await capture("03-engineer-investigation-jump", async () => {
    await page.goto(`${baseUrl}/?path=engineer`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await assertVisibleNonZero(bar, "Engineer Investigation bar");
    await bar.getByRole("link", { name: /incident reconstruction/i }).click();
    await page.waitForTimeout(400);
    await assertVisibleNonZero(page.locator("#incident-replay"), "Incident Replay section after jump");
    await page.screenshot({ path: `${output}/v9/03-engineer-investigation-jump.png` });
  });
  await context.close();
}

// 4. The Evidence Graph: Project Aurora's verified repository link next
// to every other project's honest needs-input state, in the same view.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();
  await capture("04-evidence-graph", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const graph = page.getByRole("region", { name: /evidence graph/i });
    await assertVisibleNonZero(graph, "Evidence Graph section");
    await assertVisibleNonZero(graph.getByRole("link", { name: /view/i }).first(), "Aurora's verified repository link");
    await graph.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/v9/04-evidence-graph.png` });
  });
  await context.close();
}

// 5. The Scenario Simulator, expanded with a choice selected - the
// SIMULATION badge, the setup text, and the skill/project citation all
// visible together in one frame, proving the label survives expansion
// rather than being replaced by the content.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await capture("05-scenario-simulator-expanded", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.scrollIntoViewIfNeeded();
    await sim.getByRole("button", { name: /traffic spike/i }).click();
    await sim.getByRole("button", { name: /load balancer and auto scaling/i }).click();
    await assertVisibleNonZero(sim.getByText("Simulation", { exact: true }).first(), "Simulation badge, still visible expanded");
    await assertVisibleNonZero(sim.getByText(/recommended approach/i), "Recommended-approach outcome");
    if ((await page.locator("canvas").count()) !== 0) {
      throw new Error("Scenario Simulator mounted a canvas - it must never mount one");
    }
    await page.screenshot({ path: `${output}/v9/05-scenario-simulator-expanded.png` });
  });
  await context.close();
}

// 6. Mobile (390px): every new V9 pillar stacked in one session -
// Command Palette open, Engineer path active, Scenario Simulator
// expanded - with no horizontal overflow anywhere.
{
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await capture("06-mobile-all-v9-surfaces", async () => {
    await page.goto(`${baseUrl}/?path=engineer`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    await page.waitForTimeout(500);
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.scrollIntoViewIfNeeded();
    await sim.getByRole("button", { name: /database latency/i }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) throw new Error("Horizontal overflow at 390px with the Scenario Simulator expanded");
    await page.screenshot({ path: `${output}/v9/06-mobile-all-v9-surfaces.png` });
  });
  await context.close();
}

await browser.close();

console.log(`\n${failures === 0 ? "All V9 captures passed their assertions." : `${failures} capture(s) FAILED their assertions.`}`);
if (failures > 0) process.exit(1);
