import { test, expect } from "@playwright/test";

test.describe("Visitor path: optional, localStorage-only, never a wall", () => {
  test("the work index is fully usable with no path ever selected", async ({ page }) => {
    await page.goto("/work");
    // Real project content is visible and interactive without touching the
    // selector at all - it narrows framing, it never gates content.
    await expect(page.getByRole("heading", { name: /proof, arranged as systems/i })).toBeVisible();
    await expect(page.getByRole("group", { name: /visitor path/i })).toBeVisible();
    for (const path of ["Recruiter", "Engineer", "Explorer"]) {
      await expect(page.getByRole("button", { name: path, exact: true })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
  });

  test("selecting a path persists across reload, resetting clears it", async ({ page }) => {
    await page.goto("/work");
    await page.getByRole("button", { name: "Engineer", exact: true }).click();
    await expect(page.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.reload();
    await expect(page.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: /^reset$/i }).click();
    await expect(page.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await page.reload();
    await expect(page.getByRole("button", { name: "Engineer", exact: true })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
