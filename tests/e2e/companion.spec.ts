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

  test("command console: atlas and proof commands now genuinely control shared state (V7)", async ({
    page,
  }) => {
    // V6's "atlas"/"proof" commands only narrated; V7 upgraded them to
    // dispatch real shared state (spec Section 10.9: "must control real
    // shared application state, not simulated console output"). This
    // replaces the old assertion that they *didn't* control the page -
    // that guarantee was intentionally changed, not regressed.
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^console$/i }).click();
    const input = page.getByLabel("RC-01 console command");

    await input.fill("proof");
    await input.press("Enter");
    // "proof" traces every stage - a real dispatch into the same
    // selectedStageId/traceScope every other V7 surface reads, visible
    // via System Trace's stable DOM signal.
    await expect(page.locator("[data-v7-trace-scope]")).toHaveAttribute(
      "data-v7-trace-stage",
      "commit",
    );
    await expect(page.locator("[data-v7-trace-scope]")).toHaveAttribute(
      "data-v7-trace-scope",
      "all",
    );

    // "twin" activates the real Operational Twin scene and, via the same
    // one-canvas mutual exclusion Atlas/RC-01 already share, closes RC-01
    // itself - not simulated text, an observable state change. RC-01 is
    // already open from above (the "proof" command doesn't close it) -
    // re-clicking "Activate RC-01" here would target a button that isn't
    // rendered while already active, so this reuses the still-open panel
    // instead of re-activating it.
    await input.fill("twin");
    await input.press("Enter");
    await expect(
      page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }),
    ).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test("command console: reset command clears trace state and closes RC-01 itself", async ({
    page,
  }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^console$/i }).click();
    const input = page.getByLabel("RC-01 console command");

    await input.fill("spine");
    await input.press("Enter");
    await expect(page.locator("[data-v7-trace-scope]")).toHaveAttribute(
      "data-v7-trace-stage",
      "commit",
    );

    await page.getByLabel("RC-01 console command").fill("reset");
    await page.getByLabel("RC-01 console command").press("Enter");
    await expect(page.locator("[data-v7-trace-scope]")).toHaveAttribute(
      "data-v7-trace-stage",
      "none",
    );
    await expect(
      page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }),
    ).toHaveCount(0);
  });

  test("command console: recruiter/engineer/explorer commands set the visitor path via shared state", async ({
    page,
  }) => {
    // More real steps than most console tests (activate, open console,
    // type + wait for response, deactivate, then check a second
    // component's state) - the default 30s occasionally isn't enough on
    // this VM under load even when every step itself succeeds.
    test.setTimeout(60000);
    await installFakeSpeech(page);
    await page.goto("/work");
    await activate(page);
    await page.getByRole("button", { name: /^console$/i }).click();
    const input = page.getByLabel("RC-01 console command");

    await input.fill("engineer");
    await input.press("Enter");
    await expect(page.getByText(/visitor path set to engineer/i)).toBeVisible();

    // The console dispatches to the same shared ExperienceProvider state
    // VisitorPathSelector reads - deactivating RC-01 and checking the
    // selector directly confirms the two surfaces actually share state,
    // not just that the console printed a plausible-sounding string.
    await page.getByRole("button", { name: /deactivate rc-01/i }).click();
    await expect(page.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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

  test("v5.1: the panel never extends above the sticky header, even with a tour and captions open", async ({
    page,
  }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^tours$/i }).click();
    await page.getByRole("button", { name: /engineering tour/i }).click();
    await page.waitForTimeout(500);

    const headerBottom = await page
      .getByRole("banner")
      .evaluate((el) => el.getBoundingClientRect().bottom);
    const panelTop = await page
      .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
      .evaluate((el) => el.getBoundingClientRect().top);

    expect(panelTop).toBeGreaterThanOrEqual(headerBottom);
  });

  test("v5.1: the Reliability Spine Tour highlights one real stage at a time, not all eight at once", async ({
    page,
  }) => {
    await installFakeSpeech(page);
    await page.goto("/");
    await activate(page);
    await page.getByRole("button", { name: /^tours$/i }).click();
    await page.getByRole("button", { name: /reliability spine tour/i }).click();

    // classList.contains is an exact token match - SpineNode's inactive
    // branch also contains the *substring* "text-[var(--accent)]" as part
    // of "group-hover:text-[var(--accent)]", so a substring check would
    // give a false positive on every stage row regardless of this feature.
    // ReliabilitySpine auto-clears its highlight 1800ms after it is set, so
    // a separate wait-then-query pair can race past the window entirely
    // (observed: waitForFunction resolves, then a follow-up page.evaluate
    // round-trip lands after the 1800ms timeout has already fired, reading
    // back zero highlighted stages). waitForFunction's own return value is
    // captured atomically inside the same browser-side evaluation, so there
    // is no second round-trip to race against the timer.
    // Playwright arguments must be JSON-serializable, so the index-finding
    // logic is duplicated inline in each browser-side callback rather than
    // passed in as a function reference (which cannot cross the CDP
    // boundary) - the alternative to inlining is a second round-trip, which
    // is exactly the race this rewrite exists to avoid.
    const firstHandle = await page.waitForFunction(
      () => {
        const indices = Array.from(document.querySelectorAll("ol > li")).reduce<number[]>(
          (acc, li, i) => {
            // Each stage is a <button> containing nested spans - the accent
            // label span is the second-level one, not the first span
            // encountered (that's the "01" index number, which never carries
            // the accent class), so every descendant span must be checked.
            const isActive = Array.from(li.querySelectorAll("span")).some((span) =>
              span.classList.contains("text-[var(--accent)]"),
            );
            if (isActive) acc.push(i);
            return acc;
          },
          [],
        );
        return indices.length === 1 ? indices : null;
      },
      null,
      { timeout: 5000 },
    );
    const firstHighlighted = (await firstHandle.jsonValue()) as number[];
    expect(firstHighlighted).toHaveLength(1);

    await page.getByRole("button", { name: "Next" }).click();
    const secondHandle = await page.waitForFunction(
      (previousIndex) => {
        const indices = Array.from(document.querySelectorAll("ol > li")).reduce<number[]>(
          (acc, li, i) => {
            const isActive = Array.from(li.querySelectorAll("span")).some((span) =>
              span.classList.contains("text-[var(--accent)]"),
            );
            if (isActive) acc.push(i);
            return acc;
          },
          [],
        );
        return indices.length === 1 && indices[0] !== previousIndex ? indices : null;
      },
      firstHighlighted[0],
      { timeout: 5000 },
    );
    const secondHighlighted = (await secondHandle.jsonValue()) as number[];
    expect(secondHighlighted).toHaveLength(1);
    expect(secondHighlighted[0]).not.toBe(firstHighlighted[0]);
  });

  test.describe("v5.1: the desktop dock never covers key hero content", () => {
    test.use({ viewport: { width: 1440, height: 1000 } });

    function expectNoOverlap(content: { x: number; width: number }, dock: { x: number }) {
      // The dock sits to the right of the reflowed content on desktop - a
      // real non-overlap check is "content's right edge is left of the
      // dock's left edge", not just "different elements exist."
      expect(content.x + content.width).toBeLessThanOrEqual(dock.x);
    }

    test("does not cover the name (h1)", async ({ page }) => {
      await page.goto("/");
      await activate(page);
      await page.waitForTimeout(300);
      const nameBox = await page.locator("h1").boundingBox();
      const dockBox = await page
        .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
        .boundingBox();
      expect(nameBox).not.toBeNull();
      expect(dockBox).not.toBeNull();
      expectNoOverlap(nameBox!, dockBox!);
    });

    test("does not cover the hero statement", async ({ page }) => {
      await page.goto("/");
      await activate(page);
      await page.waitForTimeout(300);
      const statementBox = await page
        .getByText(/I engineer reliable paths/i)
        .boundingBox();
      const dockBox = await page
        .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
        .boundingBox();
      expect(statementBox).not.toBeNull();
      expect(dockBox).not.toBeNull();
      expectNoOverlap(statementBox!, dockBox!);
    });

    test("does not cover the primary CTA", async ({ page }) => {
      await page.goto("/");
      await activate(page);
      await page.waitForTimeout(300);
      const ctaBox = await page
        .getByRole("link", { name: /explore the systems/i })
        .boundingBox();
      const dockBox = await page
        .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
        .boundingBox();
      expect(ctaBox).not.toBeNull();
      expect(dockBox).not.toBeNull();
      expectNoOverlap(ctaBox!, dockBox!);
    });

    test("does not cover the Observatory core", async ({ page }) => {
      await page.goto("/");
      await activate(page);
      await page.waitForTimeout(300);
      const observatoryBox = await page.locator("figure").first().boundingBox();
      const dockBox = await page
        .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
        .boundingBox();
      expect(observatoryBox).not.toBeNull();
      expect(dockBox).not.toBeNull();
      expectNoOverlap(observatoryBox!, dockBox!);
    });

    test("dock spans from below the sticky header to the viewport bottom, no horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/");
      await activate(page);
      await page.waitForTimeout(300);
      const headerBottom = await page
        .getByRole("banner")
        .evaluate((el) => el.getBoundingClientRect().bottom);
      const dockBox = await page
        .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
        .boundingBox();
      expect(dockBox).not.toBeNull();
      expect(dockBox!.y).toBeGreaterThanOrEqual(headerBottom - 1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });
  });

  test.describe("v5.1: mobile collapsed/medium/expanded states", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("activation begins in the collapsed peek state, hero CTA still visible", async ({
      page,
    }) => {
      await page.goto("/");
      await activate(page);
      await page.waitForTimeout(400);
      // Collapsed peek: the header-only state (reuses "minimised") - no
      // canvas/portrait, no controls row, just the header and its note.
      await expect(page.getByRole("button", { name: /^speak$/i })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /restore rc-01/i })).toBeVisible();
      // The hero CTA must still be visible - collapsed must not hide it.
      await expect(page.getByRole("link", { name: /explore the systems/i })).toBeVisible();
    });

    test("restoring from collapsed enters medium (canvas/controls visible, no tour/console)", async ({
      page,
    }) => {
      await page.goto("/");
      await activate(page);
      await page.getByRole("button", { name: /restore rc-01/i }).click();
      await page.waitForTimeout(400);
      await expect(page.getByRole("button", { name: /^speak$/i })).toBeVisible();
      await expect(page.getByText("Choose a tour")).toHaveCount(0);
      // Medium is not expanded - the mobile-only expand toggle should say
      // "Expand", not "Collapse".
      await expect(page.getByRole("button", { name: /^expand rc-01$/i })).toBeVisible();
    });

    test("opening Tours moves to expanded automatically, no horizontal overflow, Close/Minimise/Stop retained", async ({
      page,
    }) => {
      await page.goto("/");
      await activate(page);
      await page.getByRole("button", { name: /restore rc-01/i }).click();
      await page.getByRole("button", { name: /^tours$/i }).click();
      await page.waitForTimeout(400);
      await expect(
        page.getByRole("button", { name: /collapse rc-01 to medium size/i }),
      ).toBeVisible();
      await expect(page.getByText("Choose a tour")).toBeVisible();
      // The three required controls remain reachable in the expanded state.
      await expect(page.getByRole("button", { name: "Deactivate RC-01" })).toBeVisible();
      await expect(page.getByRole("button", { name: /minimise rc-01/i })).toBeVisible();
      await expect(page.getByRole("button", { name: "Stop RC-01" })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });

    test("minimising from expanded returns to collapsed peek and resets the expand toggle", async ({
      page,
    }) => {
      await page.goto("/");
      await activate(page);
      await page.getByRole("button", { name: /restore rc-01/i }).click();
      await page.getByRole("button", { name: /^tours$/i }).click();
      await page.getByRole("button", { name: /minimise rc-01/i }).click();
      await page.waitForTimeout(400);
      await expect(page.getByRole("button", { name: /restore rc-01/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^speak$/i })).toHaveCount(0);
      // Restoring again should land back in medium, not still-expanded.
      await page.getByRole("button", { name: /restore rc-01/i }).click();
      await page.waitForTimeout(300);
      await expect(page.getByRole("button", { name: /^expand rc-01$/i })).toBeVisible();
    });

    test("focus returns to the Activate button after deactivating from the expanded state", async ({
      page,
    }) => {
      await page.goto("/");
      await activate(page);
      await page.getByRole("button", { name: /restore rc-01/i }).click();
      await page.getByRole("button", { name: /^tours$/i }).click();
      await page.getByRole("button", { name: "Deactivate RC-01" }).click();
      await page.waitForTimeout(300);
      // The Activate button's accessible name comes from its visible text
      // content, not an aria-label (unlike the panel's other controls) - see
      // the equivalent keyboard-Escape check above.
      const focusedLabel = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.getAttribute("aria-label") || el?.textContent || "";
      });
      expect(focusedLabel).toMatch(/activate rc-01/i);
    });
  });
});
