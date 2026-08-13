import { test, expect } from "@playwright/test";

/**
 * Proof Mode's core acceptance criteria (V6 Plan Phase 7): never a
 * clickable link for a project whose `links` field is empty, and a real
 * link for the one project (Aurora) that actually has one. Collapsed by
 * default, so these tests open it first.
 */
test.describe("Proof Mode: honest evidence separation", () => {
  test("collapsed by default, expands on click", async ({ page }) => {
    await page.goto("/work/project-aurora");
    const toggle = page.getByRole("button", { name: /^proof mode$/i });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText(/verified evidence/i)).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(/verified evidence/i)).toBeVisible();
  });

  test("renders a real link for Project Aurora, the one project with a verified repository", async ({
    page,
  }) => {
    await page.goto("/work/project-aurora");
    await page.getByRole("button", { name: /^proof mode$/i }).click();
    // Scoped to Proof Mode's own "Verified evidence" section - the same
    // Repository link also appears in the "What shipped" chapter above,
    // so an unscoped query would match twice.
    const evidenceSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /verified evidence/i }) });
    await expect(
      evidenceSection.getByRole("link", { name: /repository/i }),
    ).toHaveAttribute("href", /github\.com\/tarunpradeep6162\/ProjectAurora/);
  });

  test("never renders a clickable link for a project with an empty links array", async ({
    page,
  }) => {
    for (const slug of [
      "distributed-jenkins-controller",
      "secure-aws-production-architecture",
      "nodejs-auth-mysql-rds",
    ]) {
      await page.goto(`/work/${slug}`);
      await page.getByRole("button", { name: /^proof mode$/i }).click();
      await expect(page.getByText(/no public repository or live link/i)).toBeVisible();
      // The "Verified evidence" section must render zero links at all for
      // a project with an empty `links` array - not a disabled-looking
      // button, not a fabricated URL.
      const evidenceSection = page
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: /verified evidence/i }) });
      await expect(evidenceSection.getByRole("link")).toHaveCount(0);
    }
  });

  test("Secure AWS's known-limitations section surfaces its label note, not only a tooltip", async ({
    page,
  }) => {
    await page.goto("/work/secure-aws-production-architecture");
    // The label note legitimately renders twice by design - once in the
    // page header (already true before Proof Mode existed) and again in
    // Proof Mode's "Known limitations" section, so an unscoped query is
    // ambiguous. Scope to the limitations section specifically to confirm
    // Proof Mode's own copy, not just the header's.
    await page.getByRole("button", { name: /^proof mode$/i }).click();
    const limitationsSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /known limitations/i }) });
    await expect(
      limitationsSection.getByText(/architecture \/ learning implementation/i),
    ).toBeVisible();
  });
});
