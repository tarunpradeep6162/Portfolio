import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/home/tarun/screenshots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

const routes = ["/", "/work", "/work/project-aurora", "/about", "/resume", "/contact"];

for (const route of routes) {
  await page.goto(`http://localhost:3200${route}`, { waitUntil: "load", timeout: 120000 });
  // Wait for the WebGL canvas specifically on the home page - it mounts asynchronously
  // (dynamic import + reduced-motion check + WebGL context creation), and this VM's CPU
  // makes that chain noticeably slower than normal. A fixed short timeout isn't reliable.
  if (route === "/") {
    await page.waitForSelector("canvas", { timeout: 20000 }).catch(() => {
      console.log("  (canvas did not mount within 20s - capturing anyway)");
    });
  }
  await page.waitForTimeout(500);
  const filename = route === "/" ? "home" : route.replace(/\//g, "_").slice(1);
  await page.screenshot({ path: `/home/tarun/screenshots/${filename}.png`, fullPage: true, timeout: 120000 });
  console.log(`Captured ${route}`);
}

await browser.close();

if (consoleErrors.length > 0) {
  console.log("\n=== CONSOLE ERRORS ===");
  consoleErrors.forEach((e) => console.log(e));
} else {
  console.log("\nNo console errors across any route.");
}
