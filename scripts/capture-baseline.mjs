import { chromium } from "playwright";

const browser = await chromium.launch();
const viewports = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];
const routes = ["/", "/work", "/work/project-aurora", "/about"];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const route of routes) {
    await page.goto(`http://localhost:3200${route}`, { waitUntil: "load", timeout: 60000 });
    if (route === "/") {
      await page.waitForSelector("canvas", { timeout: 15000 }).catch(() => {});
    }
    await page.waitForTimeout(500);
    const name = route === "/" ? "home" : route.replace(/\//g, "_").slice(1);
    await page.screenshot({
      path: `/home/tarun/screenshots/visual-rebuild-v2/baseline/${name}-${vp.name}.png`,
      fullPage: true,
      timeout: 60000,
    });
    console.log(`Captured ${route} @ ${vp.name}px`);
  }
  await page.close();
}
await browser.close();
console.log("Baseline capture complete.");
