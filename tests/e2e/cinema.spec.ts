import { test, expect } from "@playwright/test";

test.describe("Cinema layer", () => {
  test("the persistent 3D stage goes live behind the home page without errors", async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/?cinema=1");
    await page.waitForFunction(() => document.documentElement.dataset.cinema === "live", null, { timeout: 60_000 });
    await expect(page.getByTestId("cinema-stage").locator("canvas")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("automation and reduced motion get the static site: no stage, the Observatory still is shown", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForTimeout(1500);
    await expect(page.getByTestId("cinema-stage")).toHaveCount(0);
    await expect(page.locator(".observatory-still")).toBeVisible();
  });

  test("the 3D stage is opt-in: off by default, the header switch turns it on and is remembered", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    await expect(page.getByTestId("cinema-stage")).toHaveCount(0);
    await expect(page.locator(".observatory-still")).toBeVisible();
    await page.getByRole("button", { name: /turn cinema mode on/i }).click();
    await expect(page.getByRole("button", { name: /turn cinema mode off/i })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => localStorage.getItem("tp-cinema"))).toBe("on");
  });

  test("sound is off by default and the toggle is remembered", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /turn site sound on/i });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(page.getByRole("button", { name: /turn site sound off/i })).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByRole("button", { name: /turn site sound off/i })).toBeVisible();
  });

  test("chapter slates frame the home page's acts", async ({ page }) => {
    await page.goto("/");
    for (const name of [/chapter 01: selected systems/i, /chapter 02: the recovery path/i, /final chapter: the route to you/i]) {
      await expect(page.getByRole("region", { name })).toHaveCount(1);
    }
  });

  test("scrolling the spine runs the simulated release to recovery", async ({ page }) => {
    await page.goto("/");
    const list = page.locator("ol[data-stage-anchor='spine']");
    await list.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const el = document.querySelector("ol[data-stage-anchor='spine']") as HTMLElement;
      window.scrollTo(0, el.getBoundingClientRect().bottom + window.scrollY);
    });
    await expect(page.locator("[data-run='done']").first()).toBeAttached();
    await expect(page.getByText(/recovered · all stages green/i)).toBeVisible({ timeout: 10_000 });
  });

  test("a case study plays as chapters with a keyboard-operable before/after wipe", async ({ page }) => {
    await page.goto("/work/project-aurora");
    await expect(page.getByRole("navigation", { name: "Chapters" }).getByRole("link")).toHaveCount(5);
    const slider = page.getByRole("slider", { name: /compare before and after/i });
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("100");
    await expect(page.locator("dl [data-count]").first()).toBeAttached();
  });

  test("the Atlas incident film plays and reports each phase", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/work/project-aurora");
    await page.getByRole("button", { name: /enter 3d view/i }).click();
    await page.getByRole("button", { name: /play incident film/i }).click();
    await expect(page.getByRole("status").filter({ hasText: /walking the system|rolling/i })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /is down|rerouting|recovered/i })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /stop incident film/i }).click();
  });

  test("route changes play the wipe and land at the top of the new page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: /about/i }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.locator(".route-wipe")).toBeAttached();
  });
});
