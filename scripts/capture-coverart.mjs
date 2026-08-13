import { chromium } from "playwright";

const routes = [
  "/",
  "/work",
  "/work/project-aurora",
  "/work/distributed-jenkins-controller",
  "/work/secure-aws-production-architecture",
  "/work/nodejs-auth-mysql-rds",
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

for (const route of routes) {
  await page.goto(`http://localhost:3200${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const name = route === "/" ? "home" : route.slice(1).replace(/\//g, "-");
  await page.screenshot({ path: `/home/tarun/screenshots/visual-rebuild-v2/cover-art/${name}.png`, fullPage: true });
  console.log(`captured ${name}`);
}

await browser.close();
