import { test, expect, type Page } from "@playwright/test";

/**
 * Ask mode, end to end in a real browser. /api/rc01 is intercepted so the
 * UI path (streaming render, citation chips, page actions, fallbacks) is
 * tested deterministically without spending API credits; the endpoint
 * itself is covered by tests/unit/rc01-route.test.ts.
 */
function ndjson(events: unknown[]) {
  return events.map((e) => JSON.stringify(e)).join("\n") + "\n";
}

async function mockRc01(page: Page, { enabled, events }: { enabled: boolean; events?: unknown[] }) {
  await page.route("**/api/rc01", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { enabled } });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { "content-type": "application/x-ndjson" },
      body: ndjson(events ?? []),
    });
  });
}

async function openAsk(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /activate rc-01/i }).click();
  await page.getByRole("button", { name: /^ask$/i }).click();
}

test.describe("RC-01 Ask mode", () => {
  test("streams a grounded answer with a working citation chip", async ({ page }) => {
    await mockRc01(page, {
      enabled: true,
      events: [
        { type: "text", text: "Tarun is a Cloud Engineer in Chennai. " },
        { type: "text", text: "See [his profile](/about) for more." },
        { type: "done", reason: "complete" },
      ],
    });
    await openAsk(page);

    const input = page.getByLabel(/ask rc-01 a question/i);
    await expect(input).toBeEnabled();
    await input.fill("Who is Tarun?");
    await page.getByRole("button", { name: /send question/i }).click();

    const log = page.getByRole("log", { name: /conversation with rc-01/i });
    await expect(log).toContainText("Tarun is a Cloud Engineer in Chennai.");
    const chip = log.getByRole("link", { name: "his profile" });
    await expect(chip).toHaveAttribute("href", "/about");
  });

  test("executes a validated navigate action and notes it in the log", async ({ page }) => {
    await mockRc01(page, {
      enabled: true,
      events: [
        { type: "text", text: "Opening the case study. " },
        { type: "action", action: { type: "navigate", path: "/work/project-aurora" } },
        { type: "done", reason: "complete" },
      ],
    });
    await openAsk(page);
    await page.getByLabel(/ask rc-01 a question/i).fill("Show me Project Aurora");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/work\/project-aurora$/);
  });

  test("ignores out-of-policy actions and external links from the stream", async ({ page }) => {
    await mockRc01(page, {
      enabled: true,
      events: [
        { type: "text", text: "Here: [somewhere](https://evil.example)." },
        { type: "action", action: { type: "navigate", path: "https://evil.example" } },
        { type: "done", reason: "complete" },
      ],
    });
    await openAsk(page);
    await page.getByLabel(/ask rc-01 a question/i).fill("test");
    await page.keyboard.press("Enter");

    const log = page.getByRole("log", { name: /conversation with rc-01/i });
    await expect(log).toContainText("Here: somewhere.");
    await expect(log.getByRole("link")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
  });

  test("suggested questions adapt and can be asked with one click", async ({ page }) => {
    await mockRc01(page, {
      enabled: true,
      events: [{ type: "text", text: "Sure." }, { type: "done", reason: "complete" }],
    });
    await openAsk(page);
    const suggestion = page.getByRole("button", { name: /who is tarun, in one line/i });
    await suggestion.click();
    await expect(page.getByRole("log", { name: /conversation with rc-01/i })).toContainText("Sure.");
  });

  test("offline mode explains itself and hands over to the console", async ({ page }) => {
    await mockRc01(page, { enabled: false });
    await openAsk(page);
    await expect(page.getByText(/conversational mode is offline/i)).toBeVisible();
    await page.getByRole("button", { name: /open console/i }).click();
    await expect(page.getByLabel("RC-01 console command")).toBeVisible();
  });

  test("a failed request shows an error without breaking the panel", async ({ page }) => {
    await page.route("**/api/rc01", async (route) => {
      if (route.request().method() === "GET") return route.fulfill({ json: { enabled: true } });
      return route.fulfill({ status: 429, json: { error: "Give me a minute.", fallback: true } });
    });
    await openAsk(page);
    await page.getByLabel(/ask rc-01 a question/i).fill("hello");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("log", { name: /conversation with rc-01/i })).toContainText("Give me a minute.");
    await expect(page.getByLabel(/ask rc-01 a question/i)).toBeEnabled();
  });
});
