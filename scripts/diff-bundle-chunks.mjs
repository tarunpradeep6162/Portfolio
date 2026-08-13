import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/**
 * Real per-chunk diff between V4/V5/V5.1's initial home-page JS load.
 *
 * Two earlier approaches in this file both proved unreliable and are kept
 * here as a record of why this one is different:
 *   1. Scraping <script> tags from curl'd static HTML pulls chunks a real
 *      browser never actually requests this early - its totals disagreed
 *      with a real browser session's totals.
 *   2. A page.on("response") listener + "wait until the request count
 *      stops changing for N ms" heuristic raced against Next.js's own
 *      chunk-loading schedule: repeated runs against the SAME unchanged
 *      server produced totals differing by 2-7x from each other (e.g.
 *      V5.1 alone measured 697KB, then 289KB, then 106KB across three
 *      consecutive runs with no code changes in between). The failure
 *      mode is real and worth naming: a fixed wall-clock cutoff cannot
 *      distinguish "still loading" from "already finished," so it
 *      sometimes snapshots mid-load.
 *
 * This version instead queries the browser's own Resource Timing API
 * after page.waitForLoadState("load") - an authoritative, browser-native
 * record of every resource actually requested by the time the load event
 * fires, not an external guess about when loading has settled.
 */
const targets = [
  { label: "v4", url: "http://localhost:3200/" },
  { label: "v5", url: "http://localhost:3300/" },
  { label: "v5_1", url: "http://localhost:3400/" },
];

const outDir = "/tmp/bundle-chunk-diff";
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const results = {};

for (const target of targets) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  await page.goto(target.url, { waitUntil: "load" });
  // The load event fires once every resource the initial render requested
  // has finished - including client-side chunks kicked off by hydration,
  // since those are themselves <script> tags the browser is still loading
  // at that point for a page like this one. A short extra wait covers any
  // deferred/async chunk requested in a hydration effect that fires a beat
  // after 'load'.
  await page.waitForTimeout(1500);

  const chunkUrls = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .filter((u) => u.includes("/_next/static/chunks/")),
  );

  const targetDir = path.join(outDir, target.label);
  await mkdir(targetDir, { recursive: true });
  const manifest = [];
  const seen = new Set();
  for (const url of chunkUrls) {
    const fname = path.basename(url);
    if (seen.has(fname)) continue;
    seen.add(fname);
    const res = await page.request.get(url);
    const body = await res.body();
    await writeFile(path.join(targetDir, fname), body);
    manifest.push({ fname, bytes: body.length });
  }
  manifest.sort((a, b) => a.bytes - b.bytes);
  results[target.label] = manifest;
  console.log(`${target.label}: ${manifest.length} chunks (via Resource Timing API), ${manifest.reduce((s, m) => s + m.bytes, 0)} bytes total`);
  await context.close();
}

await browser.close();

function diffPair(labelA, labelB) {
  const aFiles = new Set(results[labelA].map((m) => m.fname));
  const bFiles = new Set(results[labelB].map((m) => m.fname));

  console.log(`\n=== ${labelA} -> ${labelB} chunk-by-chunk diff ===`);
  console.log(`Shared filename (byte-identical, same content) in both:`);
  for (const f of results[labelB]) {
    if (aFiles.has(f.fname)) console.log(`  ${f.fname}  ${f.bytes} bytes`);
  }

  console.log(`\nOnly in ${labelB} (new, not present in ${labelA}'s initial load):`);
  for (const f of results[labelB]) {
    if (!aFiles.has(f.fname)) console.log(`  ${f.fname}  ${f.bytes} bytes`);
  }

  console.log(`\nOnly in ${labelA} (present in ${labelA} but ${labelB} no longer loads):`);
  for (const f of results[labelA]) {
    if (!bFiles.has(f.fname)) console.log(`  ${f.fname}  ${f.bytes} bytes`);
  }

  const newBytes = results[labelB].filter((f) => !aFiles.has(f.fname)).reduce((s, f) => s + f.bytes, 0);
  const removedBytes = results[labelA].filter((f) => !bFiles.has(f.fname)).reduce((s, f) => s + f.bytes, 0);
  console.log(`\nNet new bytes in ${labelB} not present in ${labelA}: ${newBytes}`);
  console.log(`Bytes ${labelA} had that ${labelB} no longer loads: ${removedBytes}`);
  console.log(`Net delta: ${newBytes - removedBytes} bytes`);
}

diffPair("v4", "v5");
diffPair("v5", "v5_1");
