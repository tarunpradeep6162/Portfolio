import { chromium } from "playwright";

const label = process.argv[2];
if (!label) {
  console.error("Usage: node scripts/capture-before-after.mjs <before|after>");
  process.exit(1);
}

const outDir = `/home/tarun/screenshots/award-polish-v3/${label}`;
const sizes = [
  { name: "375x812", width: 375, height: 812 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
];
const routes = { home: "/", work: "/work", "case-aurora": "/work/project-aurora" };

const browser = await chromium.launch();

async function shotWithRetry(page, path, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.screenshot({ path });
      return;
    } catch (err) {
      console.log(`retry ${i} for ${path}: ${err.message.split("\n")[0]}`);
      await page.waitForTimeout(1500);
    }
  }
  throw new Error(`failed to capture ${path}`);
}

for (const size of sizes) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  for (const [routeName, route] of Object.entries(routes)) {
    await page.goto(`http://localhost:3200${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(900);
    const path = `${outDir}/${routeName}-${size.name}.png`;
    await shotWithRetry(page, path);
    console.log(`captured ${label}/${routeName}-${size.name}.png`);
  }
  await context.close();
}

await browser.close();
console.log("done");
