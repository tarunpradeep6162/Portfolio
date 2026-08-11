import { chromium } from "playwright";

const routes = ["/", "/work", "/work/project-aurora", "/work/distributed-jenkins-controller", "/work/secure-aws-production-architecture", "/work/nodejs-auth-mysql-rds", "/about", "/resume", "/contact"];
const widths = [375, 768, 1440];

const browser = await chromium.launch();
const outDir = "/home/tarun/screenshots/visual-rebuild-v2/final-sweep";

// reducedMotion:'reduce' makes ScrollReveal/HeroCopyReveal jump straight to
// the end state (no ScrollTrigger dependency), which sidesteps a
// Playwright-specific quirk: fullPage screenshots resize the viewport via
// CDP without firing real scroll/resize events, so ScrollTrigger-driven
// content stays at its initial opacity:0 in that capture mode even though
// it reveals correctly under real user scrolling (verified separately via
// mouse-wheel capture). This is a screenshot-tooling artifact, not a site
// bug - reduced motion sidesteps it since the layout itself is unaffected.
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const route of routes) {
    await page.goto(`http://localhost:3200${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(900);
    const name = (route === "/" ? "home" : route.slice(1).replace(/\//g, "-")) + `-${width}`;
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
    console.log(`captured ${name}`);
  }
  await page.close();
}

await browser.close();
console.log("done");
