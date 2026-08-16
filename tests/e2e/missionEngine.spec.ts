import { test, expect } from "@playwright/test";

const trackedRoutes = ["/", "/work", "/work/project-aurora", "/about", "/resume", "/contact"];

test.describe("Mission Scenario Engine (Rust/WASM, opt-in)", () => {
  test("zero .wasm requests on initial load across every tracked route @release-fast", async ({ page }) => {
    for (const route of trackedRoutes) {
      const wasmRequests: string[] = [];
      page.on("request", (req) => {
        if (req.url().includes(".wasm")) wasmRequests.push(req.url());
      });
      await page.goto(route, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      expect(wasmRequests, `${route} must not fetch any .wasm file before intent`).toHaveLength(0);
      page.removeAllListeners("request");
    }
  });

  test("expanding scenarios and picking a choice still fetches no .wasm - only the explicit engine button does @release-fast", async ({
    page,
  }) => {
    const wasmRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes(".wasm")) wasmRequests.push(req.url());
    });
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /traffic spike/i }).click();
    await sim.getByRole("button", { name: /load balancer and auto scaling/i }).click();
    expect(wasmRequests).toHaveLength(0);

    const engineButton = sim.getByRole("button", { name: /run the deterministic engine/i });
    await expect(engineButton).toBeVisible();
    await engineButton.click();

    await expect(sim.getByText(/simulation - computed/i)).toBeVisible({ timeout: 10000 });
    expect(wasmRequests.length).toBeGreaterThan(0);
  });

  test("computed result is labeled as a simulation and attributes its source engine", async ({ page }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /recovery decision/i }).click();
    await sim.getByRole("button", { name: /roll back to the last known-good/i }).click();
    await sim.getByRole("button", { name: /run the deterministic engine/i }).click();

    await expect(sim.getByText(/simulation - computed/i)).toBeVisible({ timeout: 10000 });
    await expect(sim.getByText(/rust\/wasm engine|typescript fallback/i)).toBeVisible();
    await expect(sim.getByText(/not a measurement of any real system/i)).toBeVisible();
  });

  test("different choices in the same scenario produce different computed results", async ({ page }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /traffic spike/i }).click();

    await sim.getByRole("button", { name: /manually launch more ec2/i }).click();
    await sim.getByRole("button", { name: /run the deterministic engine/i }).click();
    await expect(sim.getByText(/simulation - computed/i)).toBeVisible({ timeout: 10000 });
    const manualText = await sim.getByText(/dropped requests/i).locator("..").textContent();

    await sim.getByRole("button", { name: /load balancer and auto scaling/i }).click();
    await sim.getByRole("button", { name: /run the deterministic engine/i }).click();
    await expect(sim.getByText(/simulation - computed/i)).toBeVisible({ timeout: 10000 });
    const autoscaledText = await sim.getByText(/dropped requests/i).locator("..").textContent();

    expect(manualText).not.toEqual(autoscaledText);
  });

  test("keyboard-reachable: Tab to the engine button, Enter runs it", async ({ page }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /database latency/i }).click();
    await sim.getByRole("button", { name: /check the managed database/i }).click();

    const engineButton = sim.getByRole("button", { name: /run the deterministic engine/i });
    await engineButton.focus();
    await expect(engineButton).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(sim.getByText(/simulation - computed/i)).toBeVisible({ timeout: 10000 });
  });

  test("no canvas is ever mounted by the engine panel", async ({ page }) => {
    await page.goto("/");
    const sim = page.getByRole("region", { name: /scenario simulator/i });
    await sim.getByRole("button", { name: /compromised credentials/i }).click();
    await sim.getByRole("button", { name: /rotate the key and re-scope/i }).click();
    await sim.getByRole("button", { name: /run the deterministic engine/i }).click();
    await expect(sim.getByText(/simulation - computed/i)).toBeVisible({ timeout: 10000 });
    expect(await page.locator("canvas").count()).toBe(0);
  });
});
