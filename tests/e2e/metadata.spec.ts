import { test, expect } from "@playwright/test";
import { site } from "@/content/site";

test("home page has the correct title and meta description", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(site.title);
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute("content", site.description);
});

test("a sub-page title uses the site template", async ({ page }) => {
  await page.goto("/work");
  await expect(page).toHaveTitle(/Work \| Tarun Pradeep B/);
});

test("Open Graph tags are present on the home page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    site.title,
  );
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    "content",
    site.name,
  );
});

test("Person JSON-LD structured data is present and valid JSON", async ({
  page,
}) => {
  await page.goto("/");
  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(jsonLd).toBeTruthy();
  const parsed = JSON.parse(jsonLd ?? "{}");
  expect(parsed["@type"]).toBe("Person");
  expect(parsed.name).toBe(site.name);
});

test("sitemap.xml is served and lists the known routes", async ({ page }) => {
  const response = await page.goto("/sitemap.xml");
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  expect(body).toContain("/work");
});

test("robots.txt is served and references the sitemap", async ({ page }) => {
  const response = await page.goto("/robots.txt");
  expect(response?.status()).toBe(200);
  const body = await response?.text();
  expect(body).toContain("sitemap.xml");
});

test("the favicon route resolves", async ({ page }) => {
  const response = await page.goto("/icon");
  expect(response?.status()).toBe(200);
});
