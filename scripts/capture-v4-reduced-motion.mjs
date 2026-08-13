import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const output = "/home/tarun/screenshots/award-experience-v4/reduced-motion";
const baseUrl = "http://localhost:3200";
const sizes = [
  { name: "375x812", width: 375, height: 812 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x900", width: 1024, height: 900 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
];
const routes = {
  home: "/",
  work: "/work",
  "case-aurora": "/work/project-aurora",
  "case-jenkins": "/work/distributed-jenkins-controller",
  "case-aws": "/work/secure-aws-production-architecture",
  "case-nodejs": "/work/nodejs-auth-mysql-rds",
  about: "/about",
  resume: "/resume",
  contact: "/contact",
  "not-found": "/v4-route-check",
};

await mkdir(output, { recursive: true });

const browser = await chromium.launch();

for (const size of sizes) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  for (const [name, route] of Object.entries(routes)) {
    await page.goto(`${baseUrl}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(900);
    await page.screenshot({
      path: `${output}/${name}-${size.name}.png`,
      fullPage: true,
    });
    console.log(`captured ${name} at ${size.name}`);
  }

  await context.close();
}

await browser.close();
console.log("done");
