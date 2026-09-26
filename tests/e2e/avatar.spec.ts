import { test, expect } from "@playwright/test";

test.describe("Digital twin (About)", () => {
  test("shows the static render, offers the .glb, and opens the live 3D view on request", async ({ page, request }) => {
    test.setTimeout(90_000); // builds and renders a full 3D model; slow on software-GL CI runners
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/about");

    const section = page.locator('section[aria-labelledby="digital-twin"]');
    await expect(section.getByRole("img", { name: /armoured avatar/i })).toBeVisible();
    // No 3D cost until asked for.
    await expect(page.locator("canvas")).toHaveCount(0);

    const download = section.getByRole("link", { name: /download \.glb/i });
    await expect(download).toHaveAttribute("href", "/avatar/tarun-armour.glb");
    const glb = await request.get("/avatar/tarun-armour.glb");
    expect(glb.ok()).toBe(true);
    const bytes = await glb.body();
    expect(bytes.subarray(0, 4).toString("ascii")).toBe("glTF");

    const open = section.getByRole("button", { name: /explore in 3d/i });
    await open.click();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(section.getByRole("button", { name: /close 3d/i })).toHaveAttribute("aria-pressed", "true");
    await section.getByRole("button", { name: /close 3d/i }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
