import { mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/**
 * Records a real Playwright-driven walkthrough against the production
 * build - every click here drives the actual app, not a staged screen
 * capture. Deliberately covers all 9 required sequences with generous
 * dwell time at each beat so a human reviewer can see each one clearly:
 * initial fallback, activation/boot, integrated RC-01, tour selection,
 * individual-stage pointing (captions included), minimise, mobile
 * collapsed, mobile expanded.
 *
 * Captions are on by default (preferences.captionsOn), so no extra toggle
 * is needed to make them visible.
 */
const baseUrl = process.env.V5_1_BASE_URL ?? "http://localhost:3400";
const outputDir = process.env.V5_1_VIDEO_DIR ?? "/home/tarun/screenshots/jury-refinement-v5-1/video";
const finalPath = path.join(outputDir, "rc01-interaction-walkthrough.webm");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
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
    throw new Error(`Recorded walkthrough expected "${label}" to be visible but it was not - failing rather than shipping an incomplete video`);
  }
}

// 1. Initial fallback - the page before any activation.
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.waitForTimeout(1200);

// 2. Activation and boot.
await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.waitForTimeout(300);
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });

// 3. Integrated RC-01 - idle, docked into the real layout.
await page.waitForTimeout(1500);

// 4. Tour selection - the picker itself, before choosing.
await page.getByRole("button", { name: /^tours$/i }).click();
await assertVisible(page.getByRole("button", { name: /reliability spine tour/i }), "tour picker");
await page.waitForTimeout(1800);

// 5. Individual-stage pointing (+ captions) - the Reliability Spine Tour
// scrolls to and highlights one real stage at a time.
await page.getByRole("button", { name: /reliability spine tour/i }).click();
await page.waitForTimeout(2600);
await page.getByRole("button", { name: "Next" }).click();
await page.waitForTimeout(2600);

await page.getByRole("button", { name: /^exit$/i }).click();
await page.waitForTimeout(500);

// 6. Minimise.
await page.getByRole("button", { name: /minimise rc-01/i }).click();
await assertVisible(page.getByRole("button", { name: /restore rc-01/i }), "Restore control after minimising");
await page.waitForTimeout(1600);
await page.getByRole("button", { name: /restore rc-01/i }).click();
await page.waitForTimeout(500);

await page.getByRole("button", { name: /deactivate rc-01/i }).click();
await page.waitForTimeout(500);

// 7. Mobile collapsed - resizing alone would not trigger the real
// mobile-default behaviour, since the collapsed-by-default initial state
// is only computed once at mount time. Deactivate first, resize, then
// reactivate so the component genuinely mounts fresh at the narrow
// viewport, the same way a real mobile visitor would experience it.
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(500);
await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
await assertVisible(page.getByRole("button", { name: /restore rc-01/i }), "collapsed-state Restore control");
await page.waitForTimeout(1800);

// 8. Mobile expanded - restoring enters medium, opening Tours auto-expands.
await page.getByRole("button", { name: /restore rc-01/i }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /^tours$/i }).click();
await assertVisible(page.getByRole("button", { name: /^collapse rc-01 to medium size$/i }), "mobile expanded-state Collapse control");
await page.waitForTimeout(1800);

await page.getByRole("button", { name: /deactivate rc-01/i }).click();
await page.waitForTimeout(500);

await context.close();
await browser.close();

// recordVideo writes a hash-named .webm on context close - rename it to a
// stable, predictable filename for the report to reference.
const files = await readdir(outputDir);
const recorded = files.find((f) => f.endsWith(".webm") && f !== path.basename(finalPath));
if (!recorded) {
  throw new Error("No .webm file was produced by recordVideo - the walkthrough did not actually record");
}
await rename(path.join(outputDir, recorded), finalPath);
console.log(`Video saved to ${finalPath}`);
