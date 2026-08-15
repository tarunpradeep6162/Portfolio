import { chromium } from "playwright";

/**
 * Canvas-before-intent gate: the one-canvas invariant requires 0 canvas
 * elements and 0 3D bytes before genuine user intent (a click/scroll into
 * an activation zone, not just page load). This script loads the homepage
 * cold, waits well past hydration/settle, and fails the build if a
 * <canvas> is present anyway - it used to only print diagnostics and
 * always exit 0, which meant this stage could never actually catch a
 * regression of the invariant it's named for.
 */
const baseUrl = process.env.V6_BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on("console", (msg) => console.log(`[console.${msg.type()}]`, msg.text()));
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

await page.goto(`${baseUrl}/`, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(8000);

const reducedMotion = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
console.log("prefers-reduced-motion matches:", reducedMotion);

const canvasInfo = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return { found: false };
  const rect = canvas.getBoundingClientRect();
  const style = getComputedStyle(canvas);
  return {
    found: true,
    width: canvas.width,
    height: canvas.height,
    rect: { w: rect.width, h: rect.height, top: rect.top, left: rect.left },
    display: style.display,
    visibility: style.visibility,
    opacity: style.opacity,
    parentDisplay: canvas.parentElement ? getComputedStyle(canvas.parentElement).display : null,
  };
});
console.log("canvas info:", JSON.stringify(canvasInfo, null, 2));

const webglSupport = await page.evaluate(() => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
});
console.log("WebGL supported in this browser context:", webglSupport);

await browser.close();

if (canvasInfo.found) {
  console.error(
    "FAIL: a <canvas> element is present on cold load with no user intent yet - violates the 0 canvas / 0 3D bytes before intent invariant.",
  );
  process.exitCode = 1;
} else {
  console.log("PASS: no canvas present before user intent.");
}
