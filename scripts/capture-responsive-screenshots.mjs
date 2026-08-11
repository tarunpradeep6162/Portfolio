import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/home/tarun/screenshots/responsive", { recursive: true });

const browser = await chromium.launch();

const viewports = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
];

const overflowIssues = [];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto("http://localhost:3200/", { waitUntil: "load", timeout: 120000 });
  await page.waitForSelector("canvas", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (overflow) overflowIssues.push(`${vp.name}px: horizontal overflow detected`);

  await page.screenshot({ path: `/home/tarun/screenshots/responsive/home-${vp.name}.png`, fullPage: true, timeout: 60000 });
  console.log(`Captured home @ ${vp.name}px${overflow ? " -- OVERFLOW DETECTED" : ""}`);
  await page.close();
}

await browser.close();

if (overflowIssues.length > 0) {
  console.log("\n=== OVERFLOW ISSUES ===");
  overflowIssues.forEach((i) => console.log(i));
} else {
  console.log("\nNo horizontal overflow at any tested breakpoint.");
}
