import { chromium } from "playwright";

const outDir = "/home/tarun/screenshots/award-polish-v3/flightpath";
const browser = await chromium.launch();

async function shotWithRetry(page, path, attempts = 5) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.screenshot({ path });
      return;
    } catch (err) {
      console.log(`retry ${i} for ${path}: ${err.message.split("\n")[0]}`);
      await page.waitForTimeout(2000);
    }
  }
  throw new Error(`failed to capture ${path} after ${attempts} attempts`);
}

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://localhost:3200/", { waitUntil: "domcontentloaded", timeout: 60000 });
await mobile.waitForTimeout(1500);
await shotWithRetry(mobile, `${outDir}/mobile-top.png`);
await mobile.evaluate(() => window.scrollTo({ top: 2000, behavior: "instant" }));
await mobile.waitForTimeout(1500);
await shotWithRetry(mobile, `${outDir}/mobile-mid.png`);
await mobile.close();

const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const reducedPage = await reducedContext.newPage();
await reducedPage.goto("http://localhost:3200/", { waitUntil: "domcontentloaded", timeout: 60000 });
await reducedPage.waitForTimeout(1500);
await shotWithRetry(reducedPage, `${outDir}/reduced-motion.png`);
await reducedContext.close();

await browser.close();
console.log("done");
