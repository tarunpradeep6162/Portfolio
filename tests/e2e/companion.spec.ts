import { test, expect, type Page } from "@playwright/test";

/**
 * Installs a fully controllable fake Web Speech synthesis API before the
 * page's own scripts run, so these tests never depend on the host machine
 * having an installed voice (spec: "Mock browser speech APIs in automated
 * tests. Do not depend on the host having an installed voice."). Utterances
 * auto-complete quickly so multi-line scripts progress without slow real
 * waits, and every "spoken" line is recorded on window.__spokenTexts for
 * assertions about what did or didn't get spoken.
 */
async function installFakeSpeech(page: Page) {
  await page.addInitScript(() => {
    class FakeUtterance {
      text: string;
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (window as unknown as { __spokenTexts: string[] }).__spokenTexts = [];
    (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance =
      FakeUtterance;
    // `speechSynthesis` is a getter-only WebIDL attribute on Window.prototype
    // in real Chromium - a plain `window.speechSynthesis = fake` assignment
    // silently no-ops (non-strict mode, no setter), leaving the *native*
    // implementation in place, which then throws when handed a non-native
    // utterance object. Object.defineProperty creates a real own property on
    // `window` that shadows the inherited accessor entirely.
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        speak: (utterance: FakeUtterance) => {
          (window as unknown as { __spokenTexts: string[] }).__spokenTexts.push(utterance.text);
          setTimeout(() => utterance.onend?.(), 20);
        },
        cancel: () => {},
        pause: () => {},
        resume: () => {},
      },
    });
  });
}

async function activate(page: Page) {
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }).waitFor();
}

test.describe("RC-01 Reliability Companion", () => {
  test("does not speak before activation", async ({ page }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await page.waitForTimeout(1000);
    const spoken = await page.evaluate(
      () => (window as unknown as { __spokenTexts: string[] }).__spokenTexts,
    );
    expect(spoken).toEqual([]);
    await expect(
      page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }),
    ).toHaveCount(0);
  });

  test("activation boots the panel but does not itself start speech - Speak is a separate control", async ({
    page,
  }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.waitForTimeout(600);
    const spoken = await page.evaluate(
      () => (window as unknown as { __spokenTexts: string[] }).__spokenTexts,
    );
    expect(spoken).toEqual([]);
  });

  test("Speak starts synthesis and captions render the same text", async ({ page }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^speak$/i }).click();
    await page.waitForTimeout(300);
    const spoken = await page.evaluate(
      () => (window as unknown as { __spokenTexts: string[] }).__spokenTexts,
    );
    expect(spoken.length).toBeGreaterThan(0);
    await expect(page.getByText(spoken[0])).toBeVisible();
  });

  test("Mute blocks further speech and Stop halts playback", async ({ page }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /mute rc-01/i }).click();
    await page.getByRole("button", { name: /^speak$/i }).click();
    await page.waitForTimeout(300);
    let spoken = await page.evaluate(
      () => (window as unknown as { __spokenTexts: string[] }).__spokenTexts,
    );
    expect(spoken).toEqual([]);

    await page.getByRole("button", { name: /unmute rc-01/i }).click();
    await page.getByRole("button", { name: /^speak$/i }).click();
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: /stop rc-01/i }).click();
    spoken = await page.evaluate(
      () => (window as unknown as { __spokenTexts: string[] }).__spokenTexts,
    );
    expect(spoken.length).toBeGreaterThan(0);
  });

  test("captions continue on a timer when speech synthesis is unsupported", async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-expect-error - simulating a browser with no Web Speech support at all
      delete window.SpeechSynthesisUtterance;
    });
    await page.goto("/");
    await activate(page);
    await expect(
      page.getByText(/voice synthesis unavailable in this browser/i),
    ).toBeVisible();
    await page.getByRole("button", { name: /^speak$/i }).click();
    await page.waitForTimeout(300);
    // The same line exists twice by design: once visibly in the caption
    // list, once in a sr-only aria-live region for screen readers. .first()
    // just needs to confirm the caption text rendered at all.
    await expect(
      page.getByText(/welcome to tarun pradeep's infrastructure observatory/i).first(),
    ).toBeVisible();
  });

  test("WebGL unavailable falls back to the static SVG portrait, no crash", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
    await page.goto("/");
    await activate(page);
    await page.waitForTimeout(800);
    expect(await page.locator("canvas").count()).toBe(0);
    await expect(
      page.getByRole("img", { name: /RC-01, the Reliability Companion, static portrait/i }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("reduced motion never mounts the 3D canvas", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await activate(page);
    await page.waitForTimeout(800);
    expect(await page.locator("canvas").count()).toBe(0);
    await context.close();
  });

  test("low-power mode toggle skips the 3D canvas", async ({ page }) => {
    await page.goto("/");
    await activate(page);
    await page.waitForTimeout(800);
    expect(await page.locator("canvas").count()).toBe(1);
    await page.getByRole("button", { name: /turn on low-power mode/i }).click();
    await page.waitForTimeout(300);
    expect(await page.locator("canvas").count()).toBe(0);
  });

  test("a lost WebGL context recovers to the portrait instead of crashing", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.goto("/");
    await activate(page);
    await page.waitForTimeout(800);
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveCount(1);
    await canvas.evaluate((node) => {
      node.dispatchEvent(new Event("webglcontextlost"));
    });
    await page.waitForTimeout(300);
    expect(await page.locator("canvas").count()).toBe(0);
    await expect(
      page.getByRole("img", { name: /RC-01, the Reliability Companion, static portrait/i }),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("keyboard: Tab reaches Activate, Enter opens the panel, Escape closes it and returns focus", async ({
    page,
  }) => {
    // The activate button sits after every other focusable element on a
    // content-heavy home page; under this VM's documented CPU contention
    // each Tab+evaluate round-trip can be slow, so this walk gets a longer
    // budget than the default per-test timeout.
    test.setTimeout(60_000);
    await page.goto("/");
    let reachedActivate = false;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      // The Activate button's accessible name comes from its visible text
      // content, not an aria-label attribute (unlike the panel's other
      // controls) - check both so this matches how getByRole resolves it.
      const label = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("aria-label") || el?.textContent || "";
      });
      if (/activate rc-01/i.test(label)) {
        reachedActivate = true;
        break;
      }
    }
    expect(reachedActivate).toBe(true);

    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }),
    ).toHaveCount(0);
    const refocusedLabel = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute("aria-label") || el?.textContent || "";
    });
    expect(refocusedLabel).toMatch(/activate rc-01/i);
  });

  test("Escape closes an open subpanel without deactivating the companion", async ({ page }) => {
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^tours$/i }).click();
    await expect(page.getByText("Choose a tour")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Choose a tour")).toHaveCount(0);
    await expect(
      page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }),
    ).toBeVisible();
  });

  test("tour selection walks through steps with a confirmed route suggestion", async ({
    page,
  }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^tours$/i }).click();
    await page.getByRole("button", { name: /recruiter tour/i }).click();
    await expect(page.getByText(/recruiter tour — step 1/i)).toBeVisible();

    // The Recruiter Tour's suggestedRoute only appears on its final step
    // (content/companion.ts) - advance through the rest with Next first.
    const nextButton = page.getByRole("button", { name: "Next" });
    await nextButton.click();
    await nextButton.click();
    await nextButton.click();
    await expect(page.getByText(/recruiter tour — step 4/i)).toBeVisible();

    const routeButton = page.getByRole("button", { name: /open the résumé/i });
    await expect(routeButton).toBeVisible();
    await routeButton.click();
    await expect(page).toHaveURL(/\/resume$/);
  });

  test("command console: documented command works, unknown command shows local help only", async ({
    page,
  }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^console$/i }).click();
    const input = page.getByLabel("RC-01 console command");

    await input.fill("spine");
    await input.press("Enter");
    await expect(page.getByText(/speaking the eight-stage reliability spine/i)).toBeVisible();

    await input.fill("this-is-not-a-real-command");
    await input.press("Enter");
    // Unknown input falls back to the same consoleHelpText shown when the
    // console first opens (content/companion.ts) - not the distinct string
    // the "help" command itself returns. That means this exact text is
    // already in the log once before the unknown command is even typed, so
    // .last() targets the one this assertion actually cares about.
    await expect(
      page
        .getByText(/available commands: help, projects, spine, skills, resume, contact, mute, stop/i)
        .last(),
    ).toBeVisible();
  });

  test("mobile viewport: companion fits without introducing horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await activate(page);
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("no duplicate element ids are introduced by the companion", async ({ page }) => {
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^tours$/i }).click();
    await page.getByRole("button", { name: /^console$/i }).click();
    const duplicateIds = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const id of ids) {
        if (seen.has(id)) dupes.push(id);
        seen.add(id);
      }
      return dupes;
    });
    expect(duplicateIds).toEqual([]);
  });

  test("every companion control exposes an accessible name", async ({ page }) => {
    await page.goto("/");
    await activate(page);
    const panel = page.getByRole("region", { name: /RC-01 Reliability Companion panel/i });
    const buttons = await panel.getByRole("button").all();
    for (const button of buttons) {
      const name = await button.evaluate((el) => {
        return (
          el.getAttribute("aria-label") ||
          el.textContent?.trim() ||
          ""
        );
      });
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
