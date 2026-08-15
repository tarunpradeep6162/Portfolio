/**
 * Polls a base URL until it responds (any status < 500) or a timeout
 * elapses - the real-condition wait CI/Docker/Compose steps use instead of
 * a fixed `sleep N` before running route/header checks.
 *
 * Usage: node scripts/ci/verify-health.mjs [baseUrl] [timeoutMs]
 * Exit code 0 iff the server became reachable within the timeout.
 */
const baseUrl = process.argv[2] ?? process.env.CI_BASE_URL ?? "http://localhost:3500";
const timeoutMs = Number(process.argv[3] ?? 60_000);
const pollIntervalMs = 500;

// Vercel Deployment Protection (SSO wall) intercepts every route on a
// protected preview with a 302 unless this header is present - present
// only when the env var is set (e.g. against a Vercel preview URL in CI),
// a no-op everywhere else (local/Docker candidates). Never logged.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {};

const start = Date.now();
let lastError = null;

while (Date.now() - start < timeoutMs) {
  try {
    const res = await fetch(`${baseUrl}/`, { redirect: "manual", headers });
    if (res.status < 500) {
      console.log(`Healthy: ${baseUrl}/ responded ${res.status} after ${Date.now() - start}ms`);
      process.exit(0);
    }
    lastError = `HTTP ${res.status}`;
  } catch (err) {
    lastError = String(err);
  }
  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
}

console.error(`Health check failed: ${baseUrl}/ did not become healthy within ${timeoutMs}ms (last: ${lastError})`);
process.exit(1);
