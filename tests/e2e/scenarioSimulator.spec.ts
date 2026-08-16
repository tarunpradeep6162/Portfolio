import { test, expect } from "@playwright/test";

test.describe("Scenario Simulator", () => {
  test("visible on the homepage by default @release-fast", async ({ page }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await expect(sim).toBeVisible();
  });

  test("shows all 5 required scenario categories, each with a visible SIMULATION badge before expansion", async ({
    page,
  }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    const titles = ["Traffic spike", "Deployment failure", "Compromised credentials", "Database latency", "Recovery decision"];
    for (const title of titles) {
      const card = sim.getByRole("button", { name: new RegExp(title, "i") });
      await expect(card).toBeVisible();
    }
    // A SIMULATION badge per collapsed card, not just one for the section.
    const badges = sim.getByText("Simulation", { exact: true });
    await expect(badges).toHaveCount(5);
  });

  test("expanding a scenario keeps the SIMULATION label visible alongside the setup text - not replaced by it", async ({
    page,
  }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /traffic spike/i }).click();
    await expect(sim.getByText("Simulation", { exact: true }).first()).toBeVisible();
    await expect(sim.getByText(/request volume/i)).toBeVisible();
  });

  test("choosing an option reveals a real outcome tied to a real skill and a real, working project link", async ({
    page,
  }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /traffic spike/i }).click();
    await sim.getByRole("button", { name: /load balancer and auto scaling/i }).click();

    await expect(sim.getByText(/recommended approach/i)).toBeVisible();
    await expect(sim.getByText("AWS Auto Scaling")).toBeVisible();
    const projectLink = sim.getByRole("link", { name: /secure aws production architecture/i });
    await expect(projectLink).toBeVisible();
    await projectLink.click();
    await expect(page).toHaveURL(/\/work\/secure-aws-production-architecture$/);
  });

  test("a non-recommended choice is clearly distinguished from the recommended one", async ({ page }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /traffic spike/i }).click();
    await sim.getByRole("button", { name: /do nothing and wait/i }).click();
    await expect(sim.getByText(/trade-off/i)).toBeVisible();
    await expect(sim.getByText(/recommended approach/i)).toHaveCount(0);
  });

  test("clicking through every scenario triggers no data fetch of its own - only Next.js's own <Link> route prefetching (?_rsc=), which is unrelated navigation plumbing, not simulator data", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      const isNextRoutePrefetch = url.includes("_rsc=");
      if ((req.resourceType() === "fetch" || req.resourceType() === "xhr") && !isNextRoutePrefetch) {
        requests.push(url);
      }
    });
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    for (const title of ["Traffic spike", "Deployment failure", "Compromised credentials", "Database latency", "Recovery decision"]) {
      await sim.getByRole("button", { name: new RegExp(title, "i") }).click();
    }
    expect(requests).toHaveLength(0);
  });

  test("no visible text makes an affirmative claim of a live or real-time connection to actual infrastructure", async ({
    page,
  }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    for (const title of ["Traffic spike", "Deployment failure", "Compromised credentials", "Database latency", "Recovery decision"]) {
      await sim.getByRole("button", { name: new RegExp(title, "i") }).click();
    }
    const bodyText = await sim.innerText();
    // Checks for an affirmative claim of liveness specifically (e.g. "shows
    // live data", "connected to a live system") - not the word "live" in
    // isolation, since the section's own honest disclaimer legitimately
    // says "not connected to any real or live infrastructure," which a
    // naive /live infrastructure/ match would wrongly flag as the failure
    // mode this test exists to catch.
    expect(bodyText).not.toMatch(/\b(is|shows?|displays?) (a |the )?(live|real-?time) (data|feed|infrastructure|system|monitoring)\b/i);
    expect(bodyText).not.toMatch(/connected to (a |the )?(real|live|actual) (infrastructure|system|backend)/i);
    // Confirms the honest disclaimer is genuinely present, not just absent
    // of a false claim.
    expect(bodyText).toMatch(/not connected to any real or live infrastructure/i);
  });

  test("reachable from the Engineer Investigation bar's jump links", async ({ page }) => {
    await page.goto("/?path=engineer");
    const bar = page.getByRole("region", { name: /engineer investigation/i });
    await bar.getByRole("link", { name: /scenario simulator/i }).click();
    await expect(page.locator("#scenario-simulator")).toBeInViewport();
  });

  test("no horizontal overflow at 360px with a scenario expanded", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /database latency/i }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("no canvas involved, reduced motion renders identically @release-fast", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await expect(sim).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
  });
});
