import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/**
 * Captures the complete Immersive Ops v5 review set: every real route at
 * every required breakpoint, plus the RC-01 Reliability Companion's key
 * states on the homepage (loading, activated, tour, briefing, reduced
 * motion, low power, WebGL failure, mobile compact mode). Mirrors the shape
 * of scripts/capture-v4.mjs but adds the companion states V4 never had.
 */
const output =
  process.env.V5_SCREENSHOT_DIR ??
  "/home/tarun/screenshots/immersive-ops-v5";
const baseUrl = process.env.V5_BASE_URL ?? "http://localhost:3300";

const sizes = [
  { name: "375x812", width: 375, height: 812 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x900", width: 1024, height: 900 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const routes = {
  home: "/",
  work: "/work",
  "case-aurora": "/work/project-aurora",
  "case-jenkins": "/work/distributed-jenkins-controller",
  "case-secure-aws": "/work/secure-aws-production-architecture",
  "case-nodejs-auth": "/work/nodejs-auth-mysql-rds",
  about: "/about",
  resume: "/resume",
  contact: "/contact",
  "not-found": "/v5-route-check",
};

await mkdir(`${output}/routes/viewport`, { recursive: true });
await mkdir(`${output}/routes/full`, { recursive: true });
await mkdir(`${output}/companion`, { recursive: true });

const browser = await chromium.launch();

// 1. Every real route at every required breakpoint.
for (const size of sizes) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
  });
  const page = await context.newPage();

  for (const [name, route] of Object.entries(routes)) {
    await page.goto(`${baseUrl}${route}`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.waitForTimeout(1_000);
    await page.screenshot({
      path: `${output}/routes/viewport/${name}-${size.name}.png`,
    });
    await page.screenshot({
      path: `${output}/routes/full/${name}-${size.name}.png`,
      fullPage: true,
    });
    console.log(`captured route ${name} at ${size.name}`);
  }

  await context.close();
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

// 2. RC-01 companion states on the homepage, desktop viewport.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await installFakeSpeech(page);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({
    path: `${output}/companion/01-initial-svg-fallback.png`,
  });
  console.log("captured companion: initial SVG fallback");

  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${output}/companion/02-robot-loading.png` });
  console.log("captured companion: robot loading");

  await page
    .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
    .waitFor();
  await page.waitForTimeout(2_000);
  await page.screenshot({ path: `${output}/companion/03-activated-idle.png` });
  console.log("captured companion: activated / idle");

  await page.getByRole("button", { name: /^tours$/i }).click();
  await page.getByRole("button", { name: /recruiter tour/i }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${output}/companion/04-recruiter-tour.png` });
  console.log("captured companion: recruiter tour");

  const nextButton = page.getByRole("button", { name: "Next" });
  await nextButton.click();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `${output}/companion/05-project-briefing.png`,
  });
  console.log("captured companion: project briefing");

  await context.close();
}

// 3. Reduced motion: static portrait, no canvas.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page
    .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
    .waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${output}/companion/06-reduced-motion.png` });
  console.log("captured companion: reduced motion");
  await context.close();
}

// 4. Low-power mode toggle.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page
    .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
    .waitFor();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /turn on low-power mode/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/companion/07-low-power.png` });
  console.log("captured companion: low power mode");
  await context.close();
}

// 5. WebGL unavailable: SVG/CSS fallback portrait, no crash.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page
    .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
    .waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${output}/companion/08-webgl-failure.png` });
  console.log("captured companion: WebGL failure fallback");
  await context.close();
}

// 6. Mobile compact mode.
{
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page
    .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
    .waitFor();
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: `${output}/companion/09-mobile-compact.png` });
  console.log("captured companion: mobile compact mode");
  await context.close();
}

await browser.close();
console.log(`\nAll captures written under ${output}`);
