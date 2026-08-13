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

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();

const routes = {
  home: "/",
  work: "/work",
  "case-aurora": "/work/project-aurora",
  "case-jenkins": "/work/distributed-jenkins-controller",
  about: "/about",
  resume: "/resume",
  "not-found": "/this-does-not-exist",
};

for (const [name, route] of Object.entries(routes)) {
  await page.goto(`http://localhost:3200${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(900);
  await shotWithRetry(page, `${outDir}/${name}.png`);
  console.log(`captured ${name}`);
}

await context.close();

// Wide desktop for the work grid + home full-bleed check
const wideContext = await browser.newContext({ viewport: { width: 1920, height: 900 }, reducedMotion: "reduce" });
const widePage = await wideContext.newPage();
await widePage.goto("http://localhost:3200/work", { waitUntil: "domcontentloaded", timeout: 60000 });
await widePage.waitForTimeout(900);
await shotWithRetry(widePage, `${outDir}/work-1920.png`);
console.log("captured work-1920");
await widePage.goto("http://localhost:3200/work/project-aurora", { waitUntil: "domcontentloaded", timeout: 60000 });
await widePage.waitForTimeout(900);
await shotWithRetry(widePage, `${outDir}/case-aurora-1920.png`);
console.log("captured case-aurora-1920");
await wideContext.close();

await browser.close();
console.log("done");
