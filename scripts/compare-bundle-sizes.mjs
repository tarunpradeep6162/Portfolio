import { chromium } from "playwright";

/**
 * Compares the home page's initial JS payload across V4 (no companion at
 * all), V5 (RC-01 with the requestIdleCallback auto-prefetch this
 * correction removed), and V5.1 (intent-only loading). Measures actual
 * response body bytes for every /_next/static/chunks/ request, polling
 * until the request count stops changing rather than trusting a fixed
 * delay - the same methodology already validated in check-bundle-cost.mjs.
 */
const targets = [
  { label: "V4 (no companion)", url: "http://localhost:3200/" },
  { label: "V5 (idle-prefetch, pre-correction)", url: "http://localhost:3300/" },
  { label: "V5.1 (intent-only, this correction)", url: "http://localhost:3400/" },
];

const browser = await chromium.launch();

for (const target of targets) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  let totalBytes = 0;
  let requests = 0;

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/")) {
      try {
        const body = await res.body();
        totalBytes += body.length;
        requests++;
      } catch {
        requests++;
      }
    }
  });

  await page.goto(target.url, { waitUntil: "networkidle" });

  let lastCount = -1;
  let stableSince = Date.now();
  const giveUpAt = Date.now() + 6000;
  while (Date.now() - stableSince < 1200 && Date.now() < giveUpAt) {
    if (requests !== lastCount) {
      lastCount = requests;
      stableSince = Date.now();
    }
    await page.waitForTimeout(100);
  }

  console.log(`${target.label}: ${requests} JS chunk requests, ${totalBytes} bytes (${(totalBytes / 1024).toFixed(1)} KB) on initial home-page load, no interaction`);
  await context.close();
}

await browser.close();
