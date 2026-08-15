import { test, expect } from "@playwright/test";

/**
 * Spec §15/§20: 320-375 small mobile, 390-430 modern mobile, 768 tablet,
 * 1024 compact desktop, 1440 desktop, 1920 wide desktop. One parametrized
 * spec sweeping all six rather than duplicating full browser projects per
 * width (per the build plan - cheaper to run, same coverage).
 */
const breakpoints = [
  { name: "small mobile", width: 360, height: 800 },
  { name: "modern mobile", width: 414, height: 896 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "compact desktop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide desktop", width: 1920, height: 1080 },
];

for (const bp of breakpoints) {
  // @release-fast only at 360px (the smallest, most overflow-prone
  // breakpoint) - the full sweep across all six stays in FULL_VALIDATION.
  const tag = bp.width === 360 ? " @release-fast" : "";
  test(`no horizontal overflow on home at ${bp.name} (${bp.width}px)${tag}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/");
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow detected at ${bp.width}px`).toBe(
      false,
    );
  });

  test(`no horizontal overflow on a case-study page at ${bp.name} (${bp.width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/work/project-aurora");
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow detected at ${bp.width}px`).toBe(
      false,
    );
  });
}

test("navigation stays on a single line at desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  const box = await nav.boundingBox();
  // A wrapped (two-line) nav would be roughly double this height (~78px+);
  // 60px comfortably separates that from V4's genuine single-line height
  // (~39px, taller than V3's nav due to more generous link padding) without
  // sitting only 1px from the real value like the old 40px threshold did.
  expect(box?.height).toBeLessThan(60);
});

test("header height stays within the 80px cap at desktop width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.locator("header");
  const box = await header.boundingBox();
  expect(box?.height).toBeLessThanOrEqual(80);
});

/**
 * V6 additions (Atlas 3D view, Proof Mode) checked in their *expanded*
 * state, not just their default-collapsed one already covered by the
 * case-study sweep above - at the narrowest breakpoint only, since a
 * mobile-first layout that doesn't overflow at 360px is the binding
 * constraint every wider breakpoint already inherits.
 */
test("no horizontal overflow with Atlas's 3D view open at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/work/project-aurora");
  await page.getByRole("button", { name: /enter 3d view/i }).click();
  await expect(page.locator("canvas")).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow detected with Atlas 3D view open at 360px").toBe(false);
});

test("no horizontal overflow with Proof Mode expanded at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/work/project-aurora");
  await page.getByRole("button", { name: /^proof mode$/i }).click();
  await expect(page.getByText(/verified evidence/i)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow detected with Proof Mode expanded at 360px").toBe(false);
});
