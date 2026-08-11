import { test, expect } from "@playwright/test";

const routes = ["/", "/work", "/work/project-aurora", "/about", "/resume", "/contact"];

test.describe("all routes load without console errors", () => {
  for (const route of routes) {
    test(`${route} renders and is free of console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      page.on("pageerror", (err) => errors.push(err.message));

      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
      expect(errors, `console errors on ${route}:\n${errors.join("\n")}`).toEqual([]);
    });
  }
});

test("navigation links reach every route from the header", async ({ page }) => {
  await page.goto("/");
  // Scoped to the Primary nav and exact-matched - "Work" otherwise substring-matches
  // project card links whose summary text happens to contain "network".
  const nav = page.getByRole("navigation", { name: "Primary" });
  await nav.getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL("/work");
  await nav.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL("/about");
  await nav.getByRole("link", { name: "Résumé", exact: true }).click();
  await expect(page).toHaveURL("/resume");
  await nav.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL("/contact");
});

test("browser back/forward works across route navigation", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await nav.getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL("/work");
  await page.goBack();
  await expect(page).toHaveURL("/");
  await page.goForward();
  await expect(page).toHaveURL("/work");
});

test("a nonexistent route renders the 404 page, not a crash", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading")).toBeVisible();
});

test("a project case-study route resolves via generateStaticParams", async ({ page }) => {
  const response = await page.goto("/work/project-aurora");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText("Project Aurora");
});
