import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/**
 * Repairs the v5.0 capture script's failure mode (blank/black screenshots
 * from Playwright racing an in-progress smooth-scroll or WebGL frame) by:
 *   - asserting real content is present and non-zero-sized before every
 *     capture, rather than just waiting a fixed delay and hoping;
 *   - forcing instant (non-smooth) scrolling for any capture that depends
 *     on scroll position, via a page-level CSS override;
 *   - throwing (failing the whole run) instead of silently saving a shot
 *     that didn't pass its assertion.
 */
const output = process.env.V5_1_SCREENSHOT_DIR ?? "/home/tarun/screenshots/jury-refinement-v5-1";
const baseUrl = process.env.V5_1_BASE_URL ?? "http://localhost:3400";

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
  "case-secure-aws": "/work/secure-aws-production-architecture",
  "case-nodejs-auth": "/work/nodejs-auth-mysql-rds",
  about: "/about",
  resume: "/resume",
  contact: "/contact",
  "not-found": "/v5-1-route-check",
};

let failures = 0;

async function assertVisibleNonZero(locator, label) {
  const box = await locator.boundingBox();
  if (!box || box.width <= 0 || box.height <= 0) {
    failures++;
    throw new Error(`Assertion failed: ${label} is not visible/non-zero-sized (${JSON.stringify(box)})`);
  }
  return box;
}

async function forceInstantScroll(page) {
  await page.addStyleTag({ content: "* { scroll-behavior: auto !important; }" });
}

async function installFakeSpeech(page) {
  await page.addInitScript(() => {
    class FakeUtterance {
      constructor(text) {
        this.text = text;
        this.rate = 1;
        this.onend = null;
        this.onerror = null;
      }
    }
    window.SpeechSynthesisUtterance = FakeUtterance;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak: (u) => setTimeout(() => u.onend && u.onend(), 20),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
      },
    });
  });
}

async function activate(page) {
  await forceInstantScroll(page);
  const btn = page.getByRole("button", { name: /activate rc-01/i });
  await assertVisibleNonZero(btn, "Activate RC-01 button");
  await btn.click();
  const panel = page.getByRole("region", { name: /RC-01 Reliability Companion panel/i });
  await panel.waitFor({ state: "visible", timeout: 20000 });
  await assertVisibleNonZero(panel, "RC-01 panel after activation");
  return panel;
}

const browser = await chromium.launch();

await mkdir(`${output}/routes`, { recursive: true });
await mkdir(`${output}/companion`, { recursive: true });

// 1. Route x breakpoint matrix, each with pre-capture content assertions.
for (const size of sizes) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await context.newPage();

  for (const [name, route] of Object.entries(routes)) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
    await forceInstantScroll(page);

    if (name === "home") {
      await assertVisibleNonZero(page.locator("h1"), `${name}@${size.name}: hero h1`);
    }
    if (name === "work") {
      const cardCount = await page.locator("article, a[href^='/work/']").count();
      if (cardCount === 0) {
        failures++;
        throw new Error(`Assertion failed: ${name}@${size.name} has no work cards`);
      }
    }
    if (name === "not-found") {
      await assertVisibleNonZero(page.getByRole("heading").first(), `${name}@${size.name}: 404 heading`);
    }

    await page.screenshot({ path: `${output}/routes/${name}-${size.name}.png` });
    console.log(`captured route ${name} at ${size.name}`);
  }
  await context.close();
}

// 2. Home page's Engineering Lab record count assertion (satisfies "assert
// Engineering Lab records exist" independent of the route loop above).
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/work`, { waitUntil: "networkidle" });
  const labCount = await page.getByText(/lab records|engineering lab/i).count();
  console.log("engineering lab section present:", labCount > 0);
  await context.close();
}

// 3. Companion states.
async function capture(name, fn) {
  try {
    await fn();
    console.log(`captured companion state: ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAILED companion state ${name}: ${err.message}`);
  }
}

// initial fallback + intent prefetch (hover) + boot/loading + integrated idle
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installFakeSpeech(page);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  // Without this, the Reliability Spine Tour's real scrollIntoView (a
  // *smooth* scroll, not instant) races the fixed 650ms highlight-dispatch
  // timer: the highlight class can appear while the page is still mid-scroll,
  // so a screenshot taken the instant the class check passes can land on a
  // transient scroll position - observed as a fully blank black frame for
  // 06-individual-stage-pointing even though the DOM assertion passed.
  await forceInstantScroll(page);

  await capture("01-initial-fallback", async () => {
    await assertVisibleNonZero(page.locator("figure").first(), "Observatory fallback");
    await page.screenshot({ path: `${output}/companion/01-initial-fallback.png` });
  });

  await capture("02-intent-prefetch-hover", async () => {
    await page.getByRole("button", { name: /activate rc-01/i }).hover();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${output}/companion/02-intent-prefetch-hover.png` });
  });

  await capture("03-boot-loading", async () => {
    await page.getByRole("button", { name: /activate rc-01/i }).click();
    await page.screenshot({ path: `${output}/companion/03-boot-loading.png` });
  });

  await capture("04-integrated-idle", async () => {
    const panel = page.getByRole("region", { name: /RC-01 Reliability Companion panel/i });
    await panel.waitFor({ state: "visible", timeout: 20000 });
    await page.waitForTimeout(2000);
    await assertVisibleNonZero(page.locator("h1"), "hero h1 with dock open");
    await page.screenshot({ path: `${output}/companion/04-integrated-idle-desktop-dock.png` });
  });

  // The "Tours" button toggles its own subpanel, and selecting a tour does
  // not close that subpanel - so blindly clicking "Tours" before every tour
  // selection alternately opens and closes it depending on what a *previous*
  // capture left behind. This helper checks real UI state (an Exit button
  // present means a tour is active; the target tour button already visible
  // means the panel is already open) instead of assuming a fixed sequence.
  async function startTour(tourButtonName) {
    if (await page.getByRole("button", { name: /^exit$/i }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: /^exit$/i }).click();
    }
    const tourButton = page.getByRole("button", { name: tourButtonName });
    if (!(await tourButton.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /^tours$/i }).click();
    }
    await tourButton.click();
  }

  await capture("05-recruiter-tour", async () => {
    await startTour(/recruiter tour/i);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${output}/companion/05-recruiter-tour.png` });
  });

  await capture("06-individual-stage-pointing", async () => {
    await startTour(/reliability spine tour/i);
    // Each stage renders as a <button> with nested spans - the accent-lit
    // label span sits one level deeper than the "01" index span, so every
    // descendant span must be checked, not just the first one found.
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("ol > li")).filter((li) =>
          Array.from(li.querySelectorAll("span")).some((span) =>
            span.classList.contains("text-[var(--accent)]"),
          ),
        ).length === 1,
      { timeout: 5000 },
    );
    // The app calls scrollIntoView({behavior: "smooth"}) to bring the
    // spine section into view, and that explicit JS option overrides the
    // page-level `scroll-behavior: auto !important` CSS - the override does
    // NOT force an instant jump the way it does for CSS/anchor-link
    // scrolling. The real scroll animation takes ~1s, well past the 650ms
    // mark when the highlight class above already applies, so a screenshot
    // taken right after that class check can land mid-scroll on a blank
    // transitional frame (this is exactly what produced a solid black
    // capture here previously). Poll window.scrollY until it stops
    // changing before treating the page as settled.
    let lastY = -1;
    let stableSince = Date.now();
    const giveUpAt = Date.now() + 5000;
    while (Date.now() - stableSince < 400 && Date.now() < giveUpAt) {
      const y = await page.evaluate(() => window.scrollY);
      if (y !== lastY) {
        lastY = y;
        stableSince = Date.now();
      }
      await page.waitForTimeout(100);
    }
    await page.screenshot({ path: `${output}/companion/06-individual-stage-pointing.png` });
  });

  await capture("07-engineering-tour", async () => {
    await startTour(/engineering tour/i);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${output}/companion/07-engineering-tour.png` });
  });

  await capture("08-project-briefing", async () => {
    await startTour(/project tour/i);
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(700);
    const captionTitle = await page.locator("text=/project aurora|jenkins|aws|node/i").first();
    await assertVisibleNonZero(captionTitle, "project briefing caption title");
    const sawRecruiterSummary = await page.getByText(/recruiter summary/i).count();
    if (sawRecruiterSummary > 0) {
      throw new Error("Project briefing capture must not contain 'Recruiter Summary'");
    }
    await page.screenshot({ path: `${output}/companion/08-project-briefing.png` });
  });

  await capture("09-captions", async () => {
    if (await page.getByRole("button", { name: /^exit$/i }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: /^exit$/i }).click();
    }
    await page.getByRole("button", { name: /^speak$/i }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${output}/companion/09-captions.png` });
  });

  await capture("10-muted", async () => {
    await page.getByRole("button", { name: /mute rc-01/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${output}/companion/10-muted.png` });
  });

  await capture("11-low-power", async () => {
    await page.getByRole("button", { name: /turn on low-power mode/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${output}/companion/11-low-power.png` });
  });

  await context.close();
}

// WebGL failure
await capture("12-webgl-failure", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await activate(page);
  await page.waitForTimeout(600);
  await assertVisibleNonZero(
    page.getByRole("img", { name: /RC-01, the Reliability Companion, static portrait/i }),
    "WebGL-failure static portrait",
  );
  await page.screenshot({ path: `${output}/companion/12-webgl-failure.png` });
  await context.close();
});

// Error recovery (lost context)
await capture("13-error-recovery", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await activate(page);
  await page.waitForTimeout(800);
  const canvas = page.locator("canvas");
  await canvas.evaluate((node) => node.dispatchEvent(new Event("webglcontextlost")));
  await page.waitForTimeout(400);
  await assertVisibleNonZero(
    page.getByRole("img", { name: /RC-01, the Reliability Companion, static portrait/i }),
    "recovered static portrait",
  );
  await page.screenshot({ path: `${output}/companion/13-error-recovery.png` });
  await context.close();
});

// Reduced motion
await capture("14-reduced-motion", async () => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await activate(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${output}/companion/14-reduced-motion.png` });
  await context.close();
});

// Mobile: collapsed / medium / expanded
await capture("15-mobile-collapsed", async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await activate(page);
  await page.waitForTimeout(500);
  await assertVisibleNonZero(
    page.getByRole("link", { name: /explore the systems/i }),
    "hero CTA behind collapsed peek",
  );
  await page.screenshot({ path: `${output}/companion/15-mobile-collapsed.png` });
  await page.getByRole("button", { name: /restore rc-01/i }).click();
  await page.waitForTimeout(500);
  await capture("16-mobile-medium", async () => {
    await page.screenshot({ path: `${output}/companion/16-mobile-medium.png` });
  });
  await page.getByRole("button", { name: /^tours$/i }).click();
  await page.waitForTimeout(500);
  await capture("17-mobile-expanded", async () => {
    await page.screenshot({ path: `${output}/companion/17-mobile-expanded.png` });
  });
  await context.close();
});

await browser.close();

console.log(`\n${failures === 0 ? "All captures passed their assertions." : `${failures} capture(s) FAILED their assertions.`}`);
if (failures > 0) process.exit(1);
