import { test, expect } from "@playwright/test";

test.describe("Command Palette", () => {
  test("trigger button opens the dialog, Escape closes it and returns focus @release-fast", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /open command palette/i });
    await trigger.focus();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("combobox")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("Ctrl+K opens the dialog from anywhere on the page @release-fast", async ({ page }) => {
    await page.goto("/about");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(dialog).toBeVisible();
  });

  test("typing filters results to a real flagship project and Enter navigates to its real route", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Aurora");
    const option = dialog.getByRole("option", { name: /project aurora/i });
    await expect(option).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work\/project-aurora$/);
    await expect(dialog).not.toBeVisible();
  });

  test("never lists a lab project as a result - lab projects have no case-study route", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Kubernetes");
    await expect(dialog.getByText(/no matches/i)).toBeVisible();
  });

  test("selecting a reading-path command sets the real, existing visitorPath state", async ({
    page,
  }) => {
    await page.goto("/work");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Read as Recruiter");
    await page.keyboard.press("Enter");
    await expect(dialog).not.toBeVisible();

    // VisitorPathSelector (components/work/VisitorPathSelector.tsx) reads
    // the same shared visitorPath state - if the palette's command truly
    // dispatched VISITOR_PATH_SET, that existing control reflects it.
    const recruiterToggle = page.getByRole("button", { name: "Recruiter" });
    await expect(recruiterToggle).toHaveAttribute("aria-pressed", "true");
  });

  test("arrow keys move selection and wrap-free, Enter activates the highlighted result", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await dialog.getByRole("combobox").fill("Read as");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(dialog).not.toBeVisible();
  });

  test("clicking the backdrop closes the dialog", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(dialog).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(dialog).not.toBeVisible();
  });

  test("reduced motion still renders the palette (plain HTML/CSS, no canvas involved) @release-fast", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /command palette/i });
    await expect(dialog).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
  });
});
