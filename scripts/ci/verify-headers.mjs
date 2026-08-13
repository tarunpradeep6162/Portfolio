/**
 * Security-header verification against a running server - the same headers
 * next.config.ts's `headers()` declares, checked the way V5.1's Phase F
 * checked them (curl -I equivalent), reused here for both CI and manual use.
 *
 * Usage: node scripts/ci/verify-headers.mjs [baseUrl] [path]
 * Exit code 0 iff every required header matches and X-Powered-By is absent.
 */
const baseUrl = process.argv[2] ?? process.env.CI_BASE_URL ?? "http://localhost:3500";
const path = process.argv[3] ?? "/";

const required = [
  ["x-content-type-options", "nosniff"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", "camera=(), microphone=(), geolocation=()"],
  ["x-frame-options", "DENY"],
  ["strict-transport-security", "max-age=63072000; includeSubDomains"],
];

const res = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
let failures = 0;

for (const [header, expectedValue] of required) {
  const actual = res.headers.get(header);
  const ok = actual === expectedValue;
  if (!ok) failures++;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${header}: expected "${expectedValue}", got ${actual === null ? "MISSING" : `"${actual}"`}`);
}

const poweredBy = res.headers.get("x-powered-by");
const poweredByOk = poweredBy === null;
if (!poweredByOk) failures++;
console.log(`[${poweredByOk ? "PASS" : "FAIL"}] x-powered-by: expected absent, got "${poweredBy}"`);

if (failures > 0) {
  console.error(`\n${failures} header check(s) failed against ${baseUrl}${path}`);
  process.exit(1);
}
console.log(`\nAll header checks passed against ${baseUrl}${path}`);
