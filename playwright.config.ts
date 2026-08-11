import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a production build (next build && next start), per spec §20's
 * explicit "start the production build locally" requirement - not the dev
 * server, which has HMR/dev-overlay chrome that doesn't reflect what ships.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Starts the existing production build directly rather than rebuilding
    // (`npm run verify` already runs the build as its own step beforehand;
    // this VM's build alone takes 20+ minutes, so re-running it here would
    // just double that cost for no reason). `npm run build` first if
    // `.next` doesn't exist yet.
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
