import { test, expect } from "@playwright/test";

test.describe("Engineer Investigation", () => {
  test("hidden by default @release-fast", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: /engineer investigation/i })).toHaveCount(0);
  });

  test("appears via ?path=engineer and links to real, existing sections - no new content system", async ({
    page,
  }) => {
    await page.goto("/?path=engineer");
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await expect(bar).toBeVisible();

    await expect(bar.getByRole("link", { name: /architecture & decisions/i })).toHaveAttribute("href", "/work");
    await expect(bar.getByRole("link", { name: /incident reconstruction/i })).toHaveAttribute(
      "href",
      "#incident-replay",
    );
    await expect(bar.getByRole("link", { name: /deployment history/i })).toHaveAttribute(
      "href",
      "#automation-fabric",
    );
    await expect(bar.getByRole("link", { name: /security & performance proof/i })).toHaveAttribute(
      "href",
      "#proof-ledger",
    );
    await expect(bar.getByRole("link", { name: /compare systems/i })).toHaveAttribute(
      "href",
      "#project-comparison",
    );
  });

  test("every in-page jump link resolves to a real, visible section - not a dead anchor", async ({ page }) => {
    await page.goto("/?path=engineer");
    const bar = page.getByRole("region", { name: /engineer investigation/i });

    await bar.getByRole("link", { name: /incident reconstruction/i }).click();
    await expect(page.locator("#incident-replay")).toBeInViewport();
    await expect(page).toHaveURL(/#incident-replay$/);

    await bar.getByRole("link", { name: /deployment history/i }).click();
    await expect(page.locator("#automation-fabric")).toBeInViewport();

    await bar.getByRole("link", { name: /security & performance proof/i }).click();
    await expect(page.locator("#proof-ledger")).toBeInViewport();

    await bar.getByRole("link", { name: /compare systems/i }).click();
    await expect(page.locator("#project-comparison")).toBeInViewport();
  });

  test("Architecture & decisions link navigates to the real work index", async ({ page }) => {
    await page.goto("/?path=engineer");
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await bar.getByRole("link", { name: /architecture & decisions/i }).click();
    await expect(page).toHaveURL(/\/work$/);
  });

  test("Exit investigation clears the path and the bar disappears", async ({ page }) => {
    await page.goto("/?path=engineer");
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await expect(bar).toBeVisible();
    await bar.getByRole("button", { name: /exit investigation/i }).click();
    await expect(page.getByRole("region", { name: /engineer investigation/i })).toHaveCount(0);
  });

  test("mutually exclusive with the recruiter flight plan - selecting one path shows only that path's bar", async ({
    page,
  }) => {
    await page.goto("/?path=engineer");
    await expect(page.getByRole("region", { name: /engineer investigation/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /recruiter flight plan/i })).toHaveCount(0);
  });

  test("no horizontal overflow at 360px with the investigation bar open", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/?path=engineer");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("reduced motion still renders the bar, no canvas involved @release-fast", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?path=engineer");
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await expect(bar).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
  });
});
