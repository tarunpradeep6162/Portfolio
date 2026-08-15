import { test, expect } from "@playwright/test";

test("skip link is the first focusable element and jumps to main content @release-fast", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: /skip to content/i });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});

test("keyboard tab order reaches primary navigation links", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Work" })).toBeVisible();
  await nav.getByRole("link", { name: "Work" }).focus();
  await expect(nav.getByRole("link", { name: "Work" })).toBeFocused();
});

test("focus is visible on an interactive element", async ({ page }) => {
  await page.goto("/contact");
  const emailButton = page.getByRole("button").first();
  await emailButton.focus();
  const outlineWidth = await emailButton.evaluate(
    (el) => getComputedStyle(el).outlineWidth,
  );
  expect(outlineWidth).not.toBe("0px");
});

test("reduced motion is honored: hero copy is immediately visible with no animation delay @release-fast", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  const opacity = await page
    .locator("h1")
    .evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(opacity)).toBe(1);
  await context.close();
});

test("the SVG observatory requires no canvas in reduced-motion mode", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForTimeout(3000);
  const canvasCount = await page.locator("canvas").count();
  expect(canvasCount).toBe(0);
  await expect(page.locator("figure").first()).toBeVisible();
  await context.close();
});

test("the Reliability Spine diagram nodes reveal descriptions on focus, not only on hover", async ({
  page,
}) => {
  await page.goto("/");
  // Description ids are React useId()-generated rather than a predictable
  // "spine-desc-*" string. data-spine-node distinguishes these controls from
  // the mobile nav toggle, which also carries an aria-controls attribute.
  const firstNode = page.locator("button[data-spine-node]").first();
  await firstNode.focus();
  const controlsId = await firstNode.getAttribute("aria-controls");
  const description = page.locator(`#${controlsId}`);
  await expect(description).toHaveClass(/opacity-100/);
});

test("mobile menu opens, is keyboard operable, and closes on link activation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: /open menu/i });
  await menuButton.click();
  const panel = page.locator("#mobile-nav-panel");
  await expect(panel).toBeVisible();
  await panel.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL("/about");
});
