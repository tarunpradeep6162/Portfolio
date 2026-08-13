import { chromium } from "playwright";

/**
 * Diffs the actual SET of requested chunk URLs at each stage, in a single
 * page session, rather than comparing counts across separate page loads.
 * Counts alone were unreliable: Next.js's own <Link> prefetching for the
 * other nav items (/work, /about, /contact) happens regardless of whether
 * RC-01 is hovered, so two separate "hover" vs "no interaction" page loads
 * settled at the same total chunk count either way - the set diff below is
 * the only way to see which chunk(s), if any, are specifically new because
 * of the hover/click.
 */
const baseUrl = process.env.V5_1_BASE_URL ?? "http://localhost:3400";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

const seen = new Map(); // url -> byte length

page.on("response", async (res) => {
  const url = res.url();
  if (url.includes("/_next/static/chunks/") && !seen.has(url)) {
    try {
      const body = await res.body();
      seen.set(url, body.length);
    } catch {
      seen.set(url, 0);
    }
  }
});

function snapshot() {
  return new Set(seen.keys());
}
function totalBytes(urls) {
  let sum = 0;
  for (const u of urls) sum += seen.get(u) ?? 0;
  return sum;
}
function diff(before, after) {
  return [...after].filter((u) => !before.has(u));
}

await page.goto(baseUrl, { waitUntil: "networkidle" });
let lastSize = -1;
let stableSince = Date.now();
while (Date.now() - stableSince < 1200) {
  if (seen.size !== lastSize) {
    lastSize = seen.size;
    stableSince = Date.now();
  }
  await page.waitForTimeout(100);
}
const afterLoad = snapshot();
console.log(`After initial load + settle: ${afterLoad.size} chunk requests, ${totalBytes(afterLoad)} bytes total`);

await page.getByRole("button", { name: /activate rc-01/i }).hover();
await page.waitForTimeout(1200);
const afterHover = snapshot();
const hoverNew = diff(afterLoad, afterHover);
console.log(`After hover: ${hoverNew.length} NEW chunk(s), ${totalBytes(hoverNew)} bytes - ${hoverNew.map((u) => u.split("/").pop()).join(", ") || "(none)"}`);

await page.getByRole("button", { name: /activate rc-01/i }).click();
await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor({ timeout: 20000 });
await page.waitForTimeout(1200);
const afterClick = snapshot();
const clickNew = diff(afterHover, afterClick);
console.log(`After click+activate: ${clickNew.length} additional NEW chunk(s), ${totalBytes(clickNew)} bytes`);

await browser.close();
