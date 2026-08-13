import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const output =
  process.env.V4_SCREENSHOT_DIR ??
  "/home/tarun/screenshots/award-experience-v4";
const baseUrl = process.env.V4_BASE_URL ?? "http://localhost:3200";
const sizes = [
  { name: "375x812", width: 375, height: 812 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
];
const routes = {
  home: "/",
  work: "/work",
  "case-aurora": "/work/project-aurora",
  about: "/about",
  resume: "/resume",
  contact: "/contact",
  "not-found": "/v4-route-check",
};

await mkdir(`${output}/viewport`, { recursive: true });
await mkdir(`${output}/full`, { recursive: true });

const launchOptions = {};
if (process.env.V4_BUNDLED_CHROMIUM === "1") {
  const bundledChromium = (await import("@sparticuz/chromium")).default;
  launchOptions.executablePath = await bundledChromium.executablePath();
  launchOptions.args = bundledChromium.args;
}

const browser = await chromium.launch(launchOptions);

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
    await page.waitForTimeout(1_200);
    await page.screenshot({
      path: `${output}/viewport/${name}-${size.name}.png`,
    });
    await page.screenshot({
      path: `${output}/full/${name}-${size.name}.png`,
      fullPage: true,
    });
    console.log(`captured ${name} at ${size.name}`);
  }

  await context.close();
}

await browser.close();
