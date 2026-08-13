import { chromium } from "playwright";

const outDir = "/home/tarun/screenshots/award-polish-v3/phase4-check";
const browser = await chromium.launch();

async function shotWithRetry(page, path, attempts = 4) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.screenshot({ path, fullPage: true });
      return;
    } catch (err) {
      console.log(`retry ${i} for ${path}: ${err.message.split("\n")[0]}`);
      await page.waitForTimeout(1500);
    }
  }
  throw new Error(`failed to capture ${path}`);
}

const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: "reduce" });
const page = await context.newPage();

const routes = {
  "mobile-work": "/work",
  "mobile-case-aurora": "/work/project-aurora",
  "mobile-resume": "/resume",
  "mobile-about": "/about",
  "mobile-not-found": "/this-does-not-exist",
};

for (const [name, route] of Object.entries(routes)) {
  await page.goto(`http://localhost:3200${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(900);
  await shotWithRetry(page, `${outDir}/${name}.png`);
  console.log(`captured ${name}`);
}

await context.close();
await browser.close();
console.log("done");
