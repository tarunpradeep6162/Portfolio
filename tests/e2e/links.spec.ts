import { test, expect } from "@playwright/test";
import { site } from "@/content/site";

test.describe("external identity links", () => {
  test("GitHub and LinkedIn links point to the real profiles with safe rel attributes", async ({ page }) => {
    await page.goto("/contact");
    // Scoped to the footer specifically - GitHub/LinkedIn also appear in the
    // page's main content, so an unscoped role query matches both instances.
    const footer = page.getByRole("contentinfo");
    const github = footer.getByRole("link", { name: "GitHub" });
    const linkedin = footer.getByRole("link", { name: "LinkedIn" });

    await expect(github).toHaveAttribute("href", site.github);
    await expect(github).toHaveAttribute("rel", /noopener/);
    await expect(github).toHaveAttribute("rel", /noreferrer/);

    await expect(linkedin).toHaveAttribute("href", site.linkedin);
    await expect(linkedin).toHaveAttribute("rel", /noopener/);
  });

  test("the primary email CTA uses a mailto link with the real address", async ({ page }) => {
    await page.goto("/contact");
    const emailCta = page.getByRole("link", { name: "Email Tarun" });
    await expect(emailCta).toHaveAttribute("href", `mailto:${site.email}`);
  });

  test("the résumé page offers a mailto fallback since no PDF is supplied yet", async ({ page }) => {
    await page.goto("/resume");
    await expect(page.getByText(/no pdf export yet/i)).toBeVisible();
    const requestLink = page.getByRole("link", { name: /request a pdf by email/i });
    await expect(requestLink).toHaveAttribute("href", new RegExp(`mailto:${site.email}`));
  });

  test("flagship project repository links point to real GitHub URLs", async ({ page }) => {
    await page.goto("/work/project-aurora");
    const repoLink = page.getByRole("link", { name: "Repository" });
    await expect(repoLink).toHaveAttribute("href", /github\.com\/tarunpradeep6162/);
  });
});
