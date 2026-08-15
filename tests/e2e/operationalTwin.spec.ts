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

  // V8 Phase 6: closes a real pre-existing coverage gap (this file never
  // had reduced-motion or context-loss tests, unlike atlas.spec.ts and
  // companion.spec.ts) - added specifically to prove the V8 consolidation
  // (all three scenes now share components/v8/ControlRoomScene.tsx)
  // didn't leave the Operational Twin's reduced-motion/failure-recovery
  // behavior unverified.
  test("reduced motion never mounts the Operational Twin 3D canvas", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(
      page.getByText(/Operational Twin shown as a static deck/i),
    ).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
    await context.close();
  });

  test("a lost WebGL context recovers to the static deck instead of crashing", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    await page.goto("/");
    await page.getByRole("button", { name: /activate operational twin/i }).click();
    await expect(page.locator("canvas")).toHaveCount(1);
    // The canvas DOM element existing does not guarantee R3F's onCreated
    // callback (which attaches the webglcontextlost listener) has run yet -
    // under this VM's documented contention-driven timing variance (see
    // docs/OPERATIONAL_TWIN_V7_COMPLETION_REPORT.md), dispatching
    // immediately can race that listener's attachment and silently no-op.
    // Matches companion.spec.ts's identical settle wait before its own
    // equivalent dispatch, for the same reason.
    await page.waitForTimeout(800);
    await page.locator("canvas").evaluate((node) => {
      node.dispatchEvent(new Event("webglcontextlost"));
    });
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(
      page.getByText(/Operational Twin shown as a static deck/i),
    ).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
