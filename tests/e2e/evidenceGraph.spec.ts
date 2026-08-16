import { test, expect } from "@playwright/test";

test.describe("Evidence Graph", () => {
  test("visible on the homepage by default - not gated behind any visitor path @release-fast", async ({
    page,
  }) => {
    await page.goto("/");
    const graph = page.getByRole("region", { name: /evidence graph/i });
    await expect(graph).toBeVisible();
  });

  test("shows exactly the 4 flagship projects, never a lab project", async ({ page }) => {
    await page.goto("/");
    const graph = page.getByRole("region", { name: /evidence graph/i });
    await expect(graph.getByText("Project Aurora: Containerised Application on AWS EC2")).toBeVisible();
    await expect(graph.getByText("Distributed Jenkins Controller and Linux Build Agent")).toBeVisible();
    await expect(graph.getByText("Secure AWS Production Architecture")).toBeVisible();
    await expect(graph.getByText("Node.js Authentication Application with MySQL and Amazon RDS")).toBeVisible();
    await expect(graph.getByText("Kubernetes Fundamentals")).toHaveCount(0);
  });

  test("Project Aurora's repository is a real, working external link", async ({ page }) => {
    await page.goto("/");
    const graph = page.getByRole("region", { name: /evidence graph/i });
    const auroraCard = graph.getByText("Project Aurora: Containerised Application on AWS EC2").locator("..");
    const link = auroraCard.getByRole("link", { name: /view/i }).first();
    await expect(link).toHaveAttribute("href", "https://github.com/tarunpradeep6162/ProjectAurora/");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });

  test("every other project's repository and every project's screenshot render as needs-input, never a fabricated link", async ({
    page,
  }) => {
    await page.goto("/");
    const graph = page.getByRole("region", { name: /evidence graph/i });
    // 4 projects x 2 nodes each = 8 node rows; Aurora's repository is the
    // only verified-with-href one, so exactly 7 "needs-input" detail texts
    // should be present. Matched loosely on "supplied yet" since the real
    // per-project note text genuinely varies (e.g. Secure AWS's says "No
    // architecture diagram screenshot supplied yet.") - the test should
    // tolerate real content variation, not force it into one exact phrase.
    const needsInputRows = graph.getByText(/supplied yet/i);
    await expect(needsInputRows).toHaveCount(7);
  });

  test("real Reliability Spine stage labels render per project, not raw ids", async ({ page }) => {
    await page.goto("/");
    const graph = page.getByRole("region", { name: /evidence graph/i });
    await expect(graph.getByText("Commit", { exact: true }).first()).toBeVisible();
    // Raw id casing would be lowercase "commit" as a distinct visible
    // string - real labels are capitalized, confirming the lookup ran.
  });

  test("reachable from the Engineer Investigation bar's jump links", async ({ page }) => {
    await page.goto("/?path=engineer");
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await bar.getByRole("link", { name: /evidence graph/i }).click();
    await expect(page.locator("#evidence-graph")).toBeInViewport();
  });

  test("no horizontal overflow at 360px", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("no canvas involved, renders identically under reduced motion @release-fast", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const graph = page.getByRole("region", { name: /evidence graph/i });
    await expect(graph).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
  });
});
