import { test, expect } from "@playwright/test";

/**
 * Targeted coverage for the Living Infrastructure Atlas's node selection,
 * against Project Aurora's real page - the project validated first per the
 * V6 plan, since it has the richest verified content (4 spine stages, a
 * real repository link).
 */
test.describe("Living Infrastructure Atlas: node selection", () => {
  test("pointer selection: clicking a node marks it pressed and shows its detail readout", async ({
    page,
  }) => {
    await page.goto("/work/project-aurora");
    const gitNode = page.getByRole("button", { name: /^Git, architecture node 1 of 7$/ });
    await expect(gitNode).toBeVisible();
    await expect(gitNode).toHaveAttribute("aria-pressed", "false");

    await gitNode.click();
    await expect(gitNode).toHaveAttribute("aria-pressed", "true");
    // Scoped to text starting with "Node" - Architecture Time Machine (added
    // after this test was first written) also renders its own role="status"
    // readout on the same page (always present, since it has a default
    // active stage), so an unscoped getByRole("status") is ambiguous now.
    await expect(page.getByRole("status").filter({ hasText: /^Node/ })).toContainText(
      "Node 1 of 7: Git",
    );
  });

  test("keyboard selection: Tab reaches a node and Enter selects it", async ({ page }) => {
    await page.goto("/work/project-aurora");
    const ec2Node = page.getByRole("button", { name: /^EC2, architecture node 7 of 7$/ });
    await ec2Node.focus();
    await expect(ec2Node).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(ec2Node).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("status").filter({ hasText: /^Node/ })).toContainText(
      "Node 7 of 7: EC2",
    );
  });

  test("selecting the same node twice toggles it off", async ({ page }) => {
    await page.goto("/work/project-aurora");
    const node = page.getByRole("button", { name: /^Build, architecture node 2 of 7$/ });
    await node.click();
    await expect(node).toHaveAttribute("aria-pressed", "true");
    await node.click();
    await expect(node).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("status").filter({ hasText: /^Node/ })).toHaveCount(0);
  });

  test("compound node labels render whole, not split on '/' or '('", async ({ page }) => {
    await page.goto("/work/project-aurora");
    await expect(
      page.getByRole("button", { name: /^App\/MySQL, architecture node 5 of 7$/ }),
    ).toBeVisible();

    await page.goto("/work/distributed-jenkins-controller");
    await expect(
      page.getByRole("button", { name: /^Build \(on agent\), architecture node 2 of 3$/ }),
    ).toBeVisible();
  });

  test("the Atlas diagram does not appear on the 404 page", async ({ page }) => {
    await page.goto("/work/unknown-project");
    await expect(page.getByText("Living Infrastructure Atlas")).toHaveCount(0);
  });
});

test.describe("Living Infrastructure Atlas: intent-loaded 3D view and one-canvas rule", () => {
  test("no canvas exists before any spatial intent - the 2D diagram works alone", async ({
    page,
  }) => {
    await page.goto("/work/project-aurora");
    await expect(page.getByRole("button", { name: /^Git, architecture node 1 of 7$/ })).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
  });

  test("'Enter 3D view' mounts exactly one canvas, selecting the same node in it works", async ({
    page,
  }) => {
    await page.goto("/work/project-aurora");
    await page.getByRole("button", { name: /enter 3d view/i }).click();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(
      // projectLabel is the full project.title ("Project Aurora:
      // Containerised Application on AWS EC2"), not the short "Project
      // Aurora" - matching only the stable, non-title-dependent part of the
      // aria-label avoids coupling this test to that title's exact wording.
      page.getByRole("img", { name: /Interactive 3D rendering of Project Aurora.*architecture/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /close 3d view/i }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("activating the 3D view closes RC-01 first - at most one mounted canvas at any time", async ({
    page,
  }) => {
    await page.goto("/work/project-aurora");
    await page.getByRole("button", { name: /activate rc-01/i }).click();
    await page
      .getByRole("region", { name: /RC-01 Reliability Companion panel/i })
      .waitFor();
    await expect(page.locator("canvas")).toHaveCount(1);

    await page.getByRole("button", { name: /enter 3d view/i }).click();
    await expect(
      page.getByRole("region", { name: /RC-01 Reliability Companion panel/i }),
    ).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test("reduced motion never mounts the Atlas 3D canvas", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/work/project-aurora");
    await expect(page.getByText(/3D view unavailable while reduced motion is enabled/i)).toBeVisible();
    expect(await page.locator("canvas").count()).toBe(0);
    await context.close();
  });
});

test.describe("Architecture Time Machine: only real stages, never padded", () => {
  test("Jenkins' Time Machine shows exactly its 3 real stages, no placeholder stage", async ({
    page,
  }) => {
    await page.goto("/work/distributed-jenkins-controller");
    const group = page.getByRole("group", { name: /architecture time machine/i });
    await expect(group.getByRole("button", { name: /stage 1 of 3/i })).toBeVisible();
    await expect(group.getByRole("button", { name: /stage 2 of 3/i })).toBeVisible();
    await expect(group.getByRole("button", { name: /stage 3 of 3/i })).toBeVisible();
    await expect(group.getByRole("button", { name: /stage 4 of/i })).toHaveCount(0);
  });

  test("Aurora's Time Machine shows exactly its 4 real stages", async ({ page }) => {
    await page.goto("/work/project-aurora");
    const group = page.getByRole("group", { name: /architecture time machine/i });
    await expect(group.getByRole("button", { name: /stage 4 of 4/i })).toBeVisible();
    await expect(group.getByRole("button", { name: /stage 5 of/i })).toHaveCount(0);
  });

  test("Node.js Auth's Time Machine never shows a Container stage - the project is container-free", async ({
    page,
  }) => {
    await page.goto("/work/nodejs-auth-mysql-rds");
    const group = page.getByRole("group", { name: /architecture time machine/i });
    await expect(group.getByRole("button", { name: /^Container,/i })).toHaveCount(0);
    await expect(group.getByRole("button", { name: /stage 3 of 3/i })).toBeVisible();
  });

  test("Next/Previous buttons and arrow keys move the active stage", async ({ page }) => {
    await page.goto("/work/project-aurora");
    const group = page.getByRole("group", { name: /architecture time machine/i });
    const firstStage = group.getByRole("button", { name: /stage 1 of 4/i });
    await expect(firstStage).toHaveAttribute("aria-current", "step");

    // Button click: stage 1 -> stage 2.
    await group.getByRole("button", { name: /next stage in/i }).click();
    await expect(group.getByRole("button", { name: /stage 2 of 4/i })).toHaveAttribute(
      "aria-current",
      "step",
    );

    // Arrow key: the group's onKeyDown handler advances from current state
    // (stage 2) regardless of which button has DOM focus, so this moves to
    // stage 3, not back to stage 2 - the component tracks one active index,
    // not per-button state.
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("button", { name: /stage 3 of 4/i })).toHaveAttribute(
      "aria-current",
      "step",
    );

    // Button click: stage 3 -> stage 2.
    await group.getByRole("button", { name: /previous stage in/i }).click();
    await expect(group.getByRole("button", { name: /stage 2 of 4/i })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
});
