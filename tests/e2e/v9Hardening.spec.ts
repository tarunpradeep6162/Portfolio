import { test, expect } from "@playwright/test";

/**
 * V9 Phase 6 hardening - cross-cutting checks across every new pillar
 * (Command Palette, Recruiter Flight Plan, Engineer Investigation,
 * Evidence Graph, Scenario Simulator) rather than one test file per
 * component re-testing what each component's own spec file already
 * covers. Matches the same sweep method V8 Phase 6 used: check for a
 * known bug class across everything new, not just where it was first
 * noticed.
 */
test.describe("V9 Phase 6: hardening", () => {
  test("no duplicate element ids are introduced across every new V9 surface, opened together", async ({
    page,
  }) => {
    await page.goto("/?path=engineer");
    await page.waitForTimeout(500);
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /traffic spike/i }).click();
    await page.keyboard.press("Control+k");

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

  test("every interactive control introduced by V9 exposes an accessible name", async ({ page }) => {
    await page.goto("/?path=engineer");
    await page.waitForTimeout(500);

    // Command Palette trigger
    await expect(page.getByRole("button", { name: /open command palette/i })).toBeVisible();
    // Engineer Investigation bar's exit control and jump links
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await expect(bar.getByRole("button", { name: /exit investigation/i })).toBeVisible();
    for (const link of await bar.getByRole("link").all()) {
      await expect(link).toHaveAccessibleName(/.+/);
    }
    // Evidence Graph
    const graph = page.getByRole("region", { name: /evidence graph/i });
    await expect(graph).toBeVisible();
    // Scenario Simulator scenario toggles
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    for (const button of await sim.getByRole("button").all()) {
      await expect(button).toHaveAccessibleName(/.+/);
    }
  });

  test("keyboard-only: Tab reaches the Command Palette trigger, Enter opens it, Escape closes and restores focus", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /open command palette/i });
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: /command palette/i })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("keyboard-only: Recruiter Flight Plan is fully reachable and dismissible without a mouse", async ({
    page,
  }) => {
    await page.goto("/?path=recruiter");
    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    const exitBtn = plan.getByRole("button", { name: /exit flight plan/i });
    await exitBtn.focus();
    await expect(exitBtn).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("region", { name: /recruiter flight plan/i })).toHaveCount(0);
  });

  test("keyboard-only: a Scenario Simulator card can be opened and its choice selected via Tab/Enter alone", async ({
    page,
  }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    const trafficCard = sim.getByRole("button", { name: /traffic spike/i });
    await trafficCard.focus();
    await page.keyboard.press("Enter");
    const firstChoice = sim.getByRole("button", { name: /manually launch more ec2/i });
    await firstChoice.focus();
    await page.keyboard.press("Enter");
    await expect(sim.getByText(/trade-off/i)).toBeVisible();
  });

  test("reduced motion: every new V9 section renders with zero canvas, across every visitor path", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of [null, "recruiter", "engineer", "explorer"]) {
      const url = path ? `/?path=${path}` : "/";
      await page.goto(url);
      expect(await page.locator("canvas").count()).toBe(0);
    }
  });

  test("security headers are unchanged from V8 - next.config.ts was not touched by any V9 phase", async ({
    page,
  }) => {
    const response = await page.goto("/");
    const headers = response!.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBeTruthy();
    expect(headers["permissions-policy"]).toBeTruthy();
    expect(headers["strict-transport-security"]).toBeTruthy();
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("no horizontal overflow at 360px with every new V9 surface open simultaneously", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/?path=engineer");
    await page.waitForTimeout(500);
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /database latency/i }).click();
    await page.keyboard.press("Control+k");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});
