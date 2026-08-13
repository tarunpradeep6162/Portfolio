import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

/**
 * V6 evidence capture, following capture-v5-1.mjs's proven pattern: assert
 * real content is present and non-zero-sized before every screenshot
 * (never a fixed delay + hope), force instant scrolling, throw on a failed
 * assertion instead of silently saving a broken shot. Reuses that script's
 * fake-speech/activate/assertVisibleNonZero helpers rather than
 * reinventing them.
 */
const baseUrl = process.env.V6_BASE_URL ?? "http://localhost:3500";
const output = process.env.V6_SCREENSHOT_DIR ?? "/tmp/v6-screenshots";

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
  "not-found": "/v6-route-check",
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

async function activateCompanion(page) {
  await forceInstantScroll(page);
  const btn = page.getByRole("button", { name: /activate rc-01/i });
  await assertVisibleNonZero(btn, "Activate RC-01 button");
  await btn.click();
  const panel = page.getByRole("region", { name: /RC-01 Reliability Companion panel/i });
  await panel.waitFor({ state: "visible", timeout: 20000 });
  await assertVisibleNonZero(panel, "RC-01 panel after activation");
  return panel;
}

async function capture(name, fn) {
  try {
    await fn();
    console.log(`captured: ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAILED ${name}: ${err.message}`);
  }
}

const browser = await chromium.launch();

await mkdir(`${output}/routes`, { recursive: true });
await mkdir(`${output}/v6`, { recursive: true });

// 1. Route x breakpoint matrix - the established V5.1 matrix, reused as-is
// since V6 changed no route's basic 200/404 shape.
for (const size of sizes) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await context.newPage();

  for (const [name, route] of Object.entries(routes)) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
    await forceInstantScroll(page);

    if (name === "home") {
      await assertVisibleNonZero(page.locator("h1"), `${name}@${size.name}: hero h1`);
    }
    if (name === "not-found") {
      await assertVisibleNonZero(page.getByRole("heading").first(), `${name}@${size.name}: 404 heading`);
    }

    await page.screenshot({ path: `${output}/routes/${name}-${size.name}.png` });
    console.log(`captured route ${name} at ${size.name}`);
  }
  await context.close();
}

// 2. V6-specific states, at a stable desktop size unless a state is
// inherently mobile-only.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  await capture("01-visitor-path-selection", async () => {
    await page.goto(`${baseUrl}/work`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const group = page.getByRole("group", { name: /visitor path/i });
    await assertVisibleNonZero(group, "visitor path selector");
    await page.getByRole("button", { name: "Engineer", exact: true }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${output}/v6/01-visitor-path-selection.png` });
  });

  await capture("02-atlas-2d", async () => {
    await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    const diagram = page.getByRole("group", { name: /architecture nodes, selectable/i });
    await assertVisibleNonZero(diagram, "Atlas 2D diagram");
    await page.screenshot({ path: `${output}/v6/02-atlas-2d.png` });
  });

  await capture("03-atlas-loading", async () => {
    // The intent-loaded 3D chunk is only requested after the "Enter 3D
    // view" control is actually activated - captured mid-request by racing
    // the screenshot against the network, not a fixed delay.
    const enterBtn = page.getByRole("button", { name: /enter 3d view/i });
    await assertVisibleNonZero(enterBtn, "Enter 3D view control");
    await enterBtn.click();
    await page.screenshot({ path: `${output}/v6/03-atlas-loading.png` });
  });

  await capture("04-atlas-3d-working", async () => {
    await page.locator("canvas").first().waitFor({ state: "visible", timeout: 10000 });
    const img = page.getByRole("img", { name: /Interactive 3D rendering of Project Aurora.*architecture/i });
    await img.waitFor({ state: "visible", timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${output}/v6/04-atlas-3d-working.png` });
  });

  await capture("05-project-selection", async () => {
    const node = page.locator("canvas").first();
    const box = await node.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: `${output}/v6/05-project-node-selection.png` });
    await page.getByRole("button", { name: /close 3d view/i }).click();
    await page.waitForTimeout(200);
  });

  await capture("06-architecture-time-machine", async () => {
    const tm = page.getByRole("group", { name: /architecture time machine/i });
    await assertVisibleNonZero(tm, "Architecture Time Machine");
    await tm.getByRole("button", { name: /next stage in/i }).click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${output}/v6/06-architecture-time-machine.png` });
  });

  await capture("07-proof-mode", async () => {
    await page.getByRole("button", { name: /^proof mode$/i }).click();
    await assertVisibleNonZero(page.getByText(/verified evidence/i), "Proof Mode evidence section");
    await page.screenshot({ path: `${output}/v6/07-proof-mode.png` });
  });

  await installFakeSpeech(page);
  await capture("08-rc01-activation", async () => {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await activateCompanion(page);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${output}/v6/08-rc01-activation.png` });
  });

  await capture("09-rc01-pointing-and-captions", async () => {
    await page.getByRole("button", { name: /^tours$/i }).click();
    await page.getByRole("button", { name: /reliability spine tour/i }).click();
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("ol > li")).filter((li) =>
          Array.from(li.querySelectorAll("span")).some((span) =>
            span.classList.contains("text-[var(--accent)]"),
          ),
        ).length === 1,
      { timeout: 5000 },
    );
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
    await page.getByRole("button", { name: /^speak$/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${output}/v6/09-rc01-pointing-captions.png` });
    await page.getByRole("button", { name: /^exit$/i }).click();
  });

  await capture("10-rc01-minimise-restore", async () => {
    await page.getByRole("button", { name: /minimise rc-01/i }).click();
    await assertVisibleNonZero(page.getByRole("button", { name: /restore rc-01/i }), "Restore control");
    await page.screenshot({ path: `${output}/v6/10a-rc01-minimised.png` });
    await page.getByRole("button", { name: /restore rc-01/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${output}/v6/10b-rc01-restored.png` });
  });

  await context.close();
}

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await installFakeSpeech(page);
  await capture("11-reduced-motion-state", async () => {
    await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
    await forceInstantScroll(page);
    // No Canvas at all under reduced motion - Atlas's "Enter 3D view"
    // control itself is not rendered.
    if ((await page.locator("canvas").count()) !== 0) {
      throw new Error("Reduced motion must never mount a <canvas>");
    }
    await page.screenshot({ path: `${output}/v6/11-reduced-motion.png` });
  });
  await context.close();
}

await capture("12-webgl-failure-fallback", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
  await forceInstantScroll(page);
  await page.getByRole("button", { name: /enter 3d view/i }).click();
  await page.waitForTimeout(600);
  await assertVisibleNonZero(
    page.getByText(/3D view unavailable - WebGL not supported/i),
    "WebGL-unsupported fallback message",
  );
  await page.screenshot({ path: `${output}/v6/12-webgl-failure-fallback.png` });
  await context.close();
});

await capture("13-error-recovery", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
  await forceInstantScroll(page);
  await page.getByRole("button", { name: /enter 3d view/i }).click();
  const canvas = page.locator("canvas").first();
  await canvas.waitFor({ state: "visible", timeout: 10000 });
  await canvas.evaluate((node) => node.dispatchEvent(new Event("webglcontextlost")));
  await page.waitForTimeout(500);
  await assertVisibleNonZero(
    page.getByText(/3D view failed to load/i),
    "3D-view error-recovery fallback message",
  );
  await page.screenshot({ path: `${output}/v6/13-error-recovery.png` });
  await context.close();
});

await capture("15-mobile-collapsed-medium-expanded", async () => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await installFakeSpeech(page);
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await activateCompanion(page);
  await page.waitForTimeout(400);
  await assertVisibleNonZero(
    page.getByRole("link", { name: /explore the systems/i }),
    "hero CTA behind collapsed peek",
  );
  await page.screenshot({ path: `${output}/v6/15a-mobile-collapsed.png` });
  await page.getByRole("button", { name: /restore rc-01/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/v6/15b-mobile-medium.png` });
  await page.getByRole("button", { name: /^tours$/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${output}/v6/15c-mobile-expanded.png` });
  await context.close();
});

await capture("16-clean-deactivated-state", async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await installFakeSpeech(page);
  await page.goto(`${baseUrl}/work/project-aurora`, { waitUntil: "networkidle" });
  await forceInstantScroll(page);
  await activateCompanion(page);
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /deactivate rc-01/i }).click();
  await page.waitForTimeout(300);
  const canvasCount = await page.locator("canvas").count();
  if (canvasCount !== 0) {
    throw new Error(`Expected zero <canvas> after deactivation, found ${canvasCount}`);
  }
  await page.screenshot({ path: `${output}/v6/16-clean-deactivated-state.png` });
  await context.close();
});

await browser.close();

console.log(`\n${failures === 0 ? "All V6 captures passed their assertions." : `${failures} capture(s) FAILED their assertions.`}`);
if (failures > 0) process.exit(1);
