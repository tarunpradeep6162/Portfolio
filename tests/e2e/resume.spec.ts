import { test, expect } from "@playwright/test";

const PDF = "/resume/Tarun-Pradeep-B-Resume.pdf";

test.describe("Résumé PDF", () => {
  test("the PDF is served as a real PDF", async ({ request }) => {
    const res = await request.get(PDF);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("pdf");
    expect((await res.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  for (const [where, path, name] of [
    ["résumé page", "/resume", /download résumé \(pdf\)/i],
    ["hero", "/", /résumé pdf/i],
  ] as const) {
    test(`downloads from the ${where}`, async ({ page }) => {
      await page.goto(path);
      const link = page.getByRole("link", { name }).first();
      await expect(link).toHaveAttribute("href", PDF);
      const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
      expect(download.suggestedFilename()).toBe("Tarun-Pradeep-B-Resume.pdf");
    });
  }

  test("the footer links the PDF on every page", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("footer").getByRole("link", { name: /résumé pdf/i })).toHaveAttribute("href", PDF);
  });
});
