/**
 * Route-presence check against a running server (any base URL: local
 * `next start`, a Docker container, or a Vercel preview). Node stdlib
 * fetch only - no new runtime dependency for CI.
 *
 * Usage: node scripts/ci/verify-routes.mjs [baseUrl]
 * Exit code 0 iff every expected route/status pair matches.
 */
const baseUrl = process.argv[2] ?? process.env.CI_BASE_URL ?? "http://localhost:3500";

// See verify-health.mjs for why this exists - no-op unless set.
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const headers = bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {};

const expected = [
  ["/", 200],
  ["/work", 200],
  ["/work/project-aurora", 200],
  ["/work/distributed-jenkins-controller", 200],
  ["/work/secure-aws-production-architecture", 200],
  ["/work/nodejs-auth-mysql-rds", 200],
  ["/about", 200],
  ["/resume", 200],
  ["/contact", 200],
  ["/sitemap.xml", 200],
  ["/robots.txt", 200],
  ["/this-route-does-not-exist-ci-check", 404],
  ["/work/unknown-project", 404],
];

let failures = 0;
const results = [];

for (const [path, expectedStatus] of expected) {
  try {
    const res = await fetch(`${baseUrl}${path}`, { redirect: "manual", headers });
    const ok = res.status === expectedStatus;
    if (!ok) failures++;
    results.push({ path, expectedStatus, actualStatus: res.status, ok });
  } catch (err) {
    failures++;
    results.push({ path, expectedStatus, actualStatus: null, ok: false, error: String(err) });
  }
}

for (const r of results) {
  const mark = r.ok ? "PASS" : "FAIL";
  console.log(
    `[${mark}] ${r.path} -> expected ${r.expectedStatus}, got ${r.actualStatus ?? "ERROR: " + r.error}`,
  );
}

if (failures > 0) {
  console.error(`\n${failures}/${expected.length} route checks failed against ${baseUrl}`);
  process.exit(1);
}
console.log(`\nAll ${expected.length} route checks passed against ${baseUrl}`);
