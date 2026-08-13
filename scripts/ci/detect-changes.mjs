/**
 * Decides whether a push/PR touches application/config files (which
 * require a production build in Fast CI) vs. docs/reports-only changes
 * (which don't). No dependency on GitHub Action metadata - works from
 * `git diff` against a base ref, so it's runnable locally too.
 *
 * Usage: node scripts/ci/detect-changes.mjs [baseRef]
 * Prints `build=true` or `build=false` to stdout (and, under GitHub
 * Actions, appends the same to $GITHUB_OUTPUT).
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const baseRef = process.argv[2] ?? process.env.CI_BASE_REF ?? "HEAD~1";

function diffFiles(base) {
  try {
    return execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    // Base ref not comparable (e.g. shallow clone, first commit on branch) -
    // safest default is to assume a build is needed.
    return null;
  }
}

const files = diffFiles(baseRef);
const docsOnlyPatterns = [/^docs\//, /^reports\//, /^README\.md$/, /\.md$/];

const needsBuild =
  files === null ||
  files.some((f) => !docsOnlyPatterns.some((pattern) => pattern.test(f)));

console.log(`Changed files (${files === null ? "unknown - defaulting to build" : files.length}):`);
if (files) files.forEach((f) => console.log(`  ${f}`));
console.log(`build=${needsBuild}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `build=${needsBuild}\n`);
}
