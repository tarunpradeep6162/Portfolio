import { chromium } from "playwright";

const browser = await chromium.launch();

// Desktop viewport-height shot (not full page) to see the actual hero framing.
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await desktop.goto("http://localhost:3200/", { waitUntil: "domcontentloaded", timeout: 60000 });
await desktop.waitForSelector("canvas", { timeout: 20000 }).catch(() => {});
await desktop.waitForTimeout(1000);
await desktop.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/hero/desktop-1440.png" });

// Move the pointer to check parallax renders without layout breakage.
await desktop.mouse.move(1100, 300);
await desktop.waitForTimeout(500);
await desktop.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/hero/desktop-1440-pointer.png" });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto("http://localhost:3200/", { waitUntil: "domcontentloaded", timeout: 60000 });
await mobile.waitForTimeout(1000);
await mobile.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/hero/mobile-390.png" });

const tablet = await browser.newPage({ viewport: { width: 768, height: 1024 } });
await tablet.goto("http://localhost:3200/", { waitUntil: "domcontentloaded", timeout: 60000 });
await tablet.waitForTimeout(1000);
await tablet.screenshot({ path: "/home/tarun/screenshots/visual-rebuild-v2/hero/tablet-768.png" });

await browser.close();
console.log("done");
