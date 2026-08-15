import { test, expect } from "@playwright/test";

/**
 * Operational Twin activation/close, mirroring atlas.spec.ts's proven
 * pattern for the same lifecycle shape (OperationalTwinHost.tsx explicitly
 * follows AtlasCanvasHost's fixed close/reopen behavior, not a
 * reimplementation of it).
 */
test.describe("Operational Twin: intent-loaded hero scene", () => {
  test("no canvas exists on the home page before any activation", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator("canvas").count()).toBe(0);
  });

  test("activation mounts exactly one canvas, Close cleanly unmounts it @release-fast", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /activate operational twin/i }).click();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(
      page.getByRole("img", { name: /The Operational Twin.*instrument deck/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /close operational twin/i }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});
