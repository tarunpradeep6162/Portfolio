import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against a production build (next build && next start), per spec §20's
 * explicit "start the production build locally" requirement - not the dev
 * server, which has HMR/dev-overlay chrome that doesn't reflect what ships.
 *
 * When PLAYWRIGHT_TEST_BASE_URL is set (CI's preview/nightly/release
 * workflows validating a real Vercel preview or a Docker candidate), tests
 * target that URL directly and Playwright never starts a local server -
 * there's nothing to build/start against an already-deployed target, and
 * doing so would just race a second, irrelevant local server on port 3100.
 */
const externalBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // Zero for local dev - a real failure should surface immediately while
  // iterating. Retries only when targeting an external base URL (CI-style
  // runs against a real Vercel preview or Docker candidate, the same signal
  // this file already uses above): across 5 real full-suite runs of this
  // Jenkins pipeline on a resource-constrained VM, exactly one test failed
  // each time - a different, unrelated test every time (skip-link session
  // drop, WebGL-context-loss timing, generic 30s timeouts), never the same
  // one twice, and every one of them passed cleanly in isolated local
  // reruns - consistent with rare, genuine environmental flakiness, not a
  // deterministic bug (a real regression reproduced 100% of the time when
  // isolated, unlike these). 2 retries absorbs that without masking a real,
  // reproducible failure, which will still fail all 3 attempts.
  retries: externalBaseUrl ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
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
