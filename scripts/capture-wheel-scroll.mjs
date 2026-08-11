import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3200/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1200);

const outDir = "/home/tarun/screenshots/visual-rebuild-v2/wheel-scroll";
let step = 0;
for (let i = 0; i < 10; i++) {
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(900);
  step++;
  await page.screenshot({ path: `${outDir}/step-${String(step).padStart(2, "0")}.png` });
}

await browser.close();
console.log("done");
