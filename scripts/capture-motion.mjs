import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3200/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(1500);

// Scroll to the flagship project grid mid-animation, then again once settled.
await page.locator("#work").scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
await page.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/motion/work-mid-reveal.png" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/motion/work-settled.png" });

// Reliability Spine walkthrough section
await page.locator("#spine").scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
await page.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/motion/spine-mid-reveal.png" });
await page.waitForTimeout(1200);
await page.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/motion/spine-settled.png" });

await browser.close();
console.log("done");
