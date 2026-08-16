import { test, expect } from "@playwright/test";

test.describe("Recruiter Flight Plan", () => {
  test("hidden by default - the existing homepage is completely unchanged for a visitor with no path selected @release-fast", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: /recruiter flight plan/i })).toHaveCount(0);
  });

  test("appears when the recruiter path is set via the command palette, shows exactly the 4 real flagship projects", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Read as Recruiter");
    await page.keyboard.press("Enter");

    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    await expect(plan).toBeVisible();
    // The exact 4 flagship projects, never a lab project (kubernetes-fundamentals
    // is a real project name that must never appear here).
    await expect(plan.getByRole("link", { name: /project aurora/i })).toBeVisible();
    await expect(plan.getByRole("link", { name: /distributed jenkins controller/i })).toBeVisible();
    await expect(plan.getByRole("link", { name: /secure aws production architecture/i })).toBeVisible();
    await expect(plan.getByRole("link", { name: /node\.js authentication/i })).toBeVisible();
    await expect(plan.getByText(/kubernetes fundamentals/i)).toHaveCount(0);
  });

  test("every project link is a real, working link to its actual case-study route", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Read as Recruiter");
    await page.keyboard.press("Enter");

    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    await plan.getByRole("link", { name: /project aurora/i }).click();
    await expect(page).toHaveURL(/\/work\/project-aurora$/);
  });

  test("shows real skill domain names, never a fabricated score/percentage/rating", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Read as Recruiter");
    await page.keyboard.press("Enter");

    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    await expect(plan.getByText("Cloud platforms")).toBeVisible();
    await expect(plan.getByText("DevOps and delivery")).toBeVisible();
    // No percentage/score markup anywhere in the plan - matches this
    // codebase's existing no-scoring convention (content/skills.ts).
    await expect(plan.getByText(/%|\/5|\/10|expert|advanced|beginner/i)).toHaveCount(0);
  });

  test("Exit flight plan control clears the path and the plan disappears", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Read as Recruiter");
    await page.keyboard.press("Enter");

    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    await expect(plan).toBeVisible();
    await plan.getByRole("button", { name: /exit flight plan/i }).click();
    await expect(page.getByRole("region", { name: /recruiter flight plan/i })).toHaveCount(0);
  });

  test("?path=recruiter query param hydrates the plan on first load, without visiting the command palette", async ({
    page,
  }) => {
    await page.goto("/?path=recruiter");
    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    await expect(plan).toBeVisible();
  });

  test("an invalid ?path= value is ignored, not applied", async ({ page }) => {
    await page.goto("/?path=not-a-real-path");
    await expect(page.getByRole("region", { name: /recruiter flight plan/i })).toHaveCount(0);
  });

  test("no horizontal overflow at 360px with the flight plan open", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/?path=recruiter");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("reduced motion still renders the plan correctly, no canvas involved @release-fast", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?path=recruiter");
    const plan = page.getByRole("region", { name: /recruiter flight plan/i });
    await expect(plan).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
  });
});
