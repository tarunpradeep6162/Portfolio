import { mkdir, readdir, rename } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/**
 * Records the full V6 walkthrough sequence in one coherent take, following
 * record-interaction-video.mjs's proven pattern: every click drives the
 * real production app, generous dwell time per beat, assertVisible throws
 * rather than shipping an incomplete video.
 */
const baseUrl = process.env.V6_BASE_URL ?? "http://localhost:3500";
const outputDir = process.env.V6_VIDEO_DIR ?? "/tmp/v6-video";
const finalPath = path.join(outputDir, "v6-experience-walkthrough.webm");

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

// 1. Initial SSR page.
await page.goto(`${baseUrl}/work`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.waitForTimeout(1200);

// 2. Visitor-path selection.
await page.getByRole("button", { name: "Engineer", exact: true }).click();
await page.waitForTimeout(1400);

// 3. Atlas 2D - navigate to a real case study.
await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.getByRole("group", { name: /architecture nodes, selectable/i }).scrollIntoViewIfNeeded();
await page.waitForTimeout(1800);

// 4. Intent activation + 5. Atlas loading.
const enterBtn = page.getByRole("button", { name: /enter 3d view/i });
await assertVisible(enterBtn, "Enter 3D view control");
await enterBtn.click();
await page.waitForTimeout(400);

// 6. Working Atlas 3D.
await page.locator("canvas").first().waitFor({ state: "visible", timeout: 10000 });
await assertVisible(
  page.getByRole("img", { name: /Interactive 3D rendering of Project Aurora.*architecture/i }),
  "working Atlas 3D scene",
);
await page.waitForTimeout(1800);

// 7. Aurora selection - click the mounted 3D scene.
{
  const box = await page.locator("canvas").first().boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
}
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /close 3d view/i }).click();
await page.waitForTimeout(600);

// 8. Architecture Time Machine.
const timeMachine = page.getByRole("group", { name: /architecture time machine/i });
await timeMachine.scrollIntoViewIfNeeded();
await assertVisible(timeMachine, "Architecture Time Machine");
await page.waitForTimeout(800);
await timeMachine.getByRole("button", { name: /next stage in/i }).click();
await page.waitForTimeout(1600);
await timeMachine.getByRole("button", { name: /next stage in/i }).click();
await page.waitForTimeout(1600);

// 9. RC-01 activation.
await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.waitForTimeout(300);
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
await page.waitForTimeout(1200);

// 10. Individual-stage pointing and captions.
await page.getByRole("button", { name: /^tours$/i }).click();
await assertVisible(page.getByRole("button", { name: /reliability spine tour/i }), "tour picker");
await page.waitForTimeout(1000);
await page.getByRole("button", { name: /reliability spine tour/i }).click();
await page.waitForTimeout(2200);
await page.getByRole("button", { name: "Next" }).click();
await page.waitForTimeout(2200);
await page.getByRole("button", { name: /^exit$/i }).click();
await page.waitForTimeout(500);

// 11. Proof Mode.
await page.getByRole("button", { name: /deactivate rc-01/i }).click();
await page.waitForTimeout(400);
const proofToggle = page.getByRole("button", { name: /^proof mode$/i });
await proofToggle.scrollIntoViewIfNeeded();
await proofToggle.click();
await assertVisible(page.getByText(/verified evidence/i), "Proof Mode evidence section");
await page.waitForTimeout(1800);

// 12. Minimise and restore.
await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
await page.waitForTimeout(600);
await page.getByRole("button", { name: /minimise rc-01/i }).click();
await assertVisible(page.getByRole("button", { name: /restore rc-01/i }), "Restore control after minimising");
await page.waitForTimeout(1400);
await page.getByRole("button", { name: /restore rc-01/i }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /deactivate rc-01/i }).click();
await page.waitForTimeout(500);

// 13. Mobile collapsed and expanded states.
await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(500);
await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
await assertVisible(page.getByRole("button", { name: /restore rc-01/i }), "collapsed-state Restore control");
await page.waitForTimeout(1600);
await page.getByRole("button", { name: /restore rc-01/i }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /^tours$/i }).click();
await assertVisible(
  page.getByRole("button", { name: /^collapse rc-01 to medium size$/i }),
  "mobile expanded-state Collapse control",
);
await page.waitForTimeout(1600);

// 14. Deactivation and clean final state.
if (await page.getByRole("button", { name: /^exit$/i }).isVisible().catch(() => false)) {
  await page.getByRole("button", { name: /^exit$/i }).click();
}
await page.getByRole("button", { name: /deactivate rc-01/i }).click();
await page.waitForTimeout(800);

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
