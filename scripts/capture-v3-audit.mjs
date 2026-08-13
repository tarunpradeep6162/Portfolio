import { chromium } from "playwright";

const routes = [
  "/",
  "/work",
  "/work/project-aurora",
  "/work/distributed-jenkins-controller",
  "/work/secure-aws-production-architecture",
  "/work/nodejs-auth-mysql-rds",
  "/about",
  "/resume",
  "/contact",
  "/this-route-does-not-exist",
];
const widths = [320, 375, 390, 768, 1024, 1440, 1920];

const browser = await chromium.launch();
const outDir = "/home/tarun/screenshots/award-polish-v3/pre-audit";

for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const route of routes) {
    await page.goto(`http://localhost:3200${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(700);
    const name = (route === "/" ? "home" : route.slice(1).replace(/\//g, "-")) + `-${width}`;
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
    console.log(`captured ${name}`);
  }
  await context.close();
}

await browser.close();
console.log("done");
