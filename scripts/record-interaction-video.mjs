import { mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/**
 * Records a real Playwright interaction with RC-01, not a staged screen
 * capture - every click here drives the actual production build. Captions
 * are on by default (preferences.captionsOn), so no extra toggle is needed
 * to make them visible in the recording.
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
      speak: (u) => setTimeout(() => u.onend && u.onend(), 1200),
      cancel: () => {},
      pause: () => {},
      resume: () => {},
    },
  });
});

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.waitForTimeout(800);

await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
await page.waitForTimeout(1200);

// The "Tours" button toggles its own subpanel, and selecting a tour does
// not close it - so a blind "click Tours" before every tour selection can
// toggle it *closed* if a previous selection already left it open (this is
// exactly what crashed the first run of this script, at the Engineering
// Tour step below). Check real UI state instead of assuming a fixed
// open/closed sequence.
async function startTour(tourButtonName) {
  if (await page.getByRole("button", { name: /^exit$/i }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: /^exit$/i }).click();
    await page.waitForTimeout(300);
  }
  const tourButton = page.getByRole("button", { name: tourButtonName });
  if (!(await tourButton.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /^tours$/i }).click();
    await page.waitForTimeout(300);
  }
  await tourButton.click();
}

await startTour(/recruiter tour/i);
await page.waitForTimeout(2200);

const captionVisible = await page
  .locator("text=/see captions below|reliability|recruiter/i")
  .first()
  .isVisible()
  .catch(() => false);
if (!captionVisible) {
  throw new Error("Recorded walkthrough never showed visible caption text - failing rather than shipping a silent video");
}

await page.getByRole("button", { name: "Next" }).click();
await page.waitForTimeout(2000);
await page.getByRole("button", { name: "Next" }).click();
await page.waitForTimeout(2000);

await startTour(/engineering tour/i);
await page.waitForTimeout(2200);

await page.getByRole("button", { name: /^exit$/i }).click();
await page.waitForTimeout(500);

await page.getByRole("button", { name: /mute rc-01/i }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /unmute rc-01/i }).click();
await page.waitForTimeout(600);

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
