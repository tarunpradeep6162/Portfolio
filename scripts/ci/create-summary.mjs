/**
 * Writes a concise, Claude/human-readable `reports/ci-summary.md` from a
 * small JSON status object, and mirrors it to $GITHUB_STEP_SUMMARY when run
 * in GitHub Actions. Deliberately short: full logs stay in CI artifacts,
 * this file exists so a failure can be diagnosed from one screenful instead
 * of a complete pasted log.
 *
 * Usage: node scripts/ci/create-summary.mjs <status-json-file>
 * Expected JSON shape:
 * {
 *   "commit": "abcdef1",
 *   "workflow": "Fast CI",
 *   "status": "passed" | "failed",
 *   "passedStages": ["lint", "typecheck", "unit", "build"],
 *   "failedStage": "e2e" | null,
 *   "failedTest": "Atlas mobile overflow" | null,
 *   "targetedCommand": "npx playwright test tests/e2e/atlas.spec.ts -g \"mobile\"" | null,
 *   "traceArtifact": "playwright-report/..." | null,
 *   "firstError": "first actionable error line" | null
 * }
 */
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs";

const statusFile = process.argv[2];
if (!statusFile) {
  console.error("Usage: node scripts/ci/create-summary.mjs <status-json-file>");
  process.exit(1);
}

const status = JSON.parse(readFileSync(statusFile, "utf8"));

const lines = [
  `# CI Summary`,
  ``,
  `Commit: ${status.commit ?? "unknown"}`,
  `Workflow: ${status.workflow ?? "unknown"}`,
  `Status: ${status.status ?? "unknown"}`,
];

if (status.passedStages?.length) {
  lines.push(`Passed stages: ${status.passedStages.join(", ")}`);
}

if (status.status === "failed") {
  lines.push(`Failed stage: ${status.failedStage ?? "unknown"}`);
  if (status.failedTest) lines.push(`Failed test: ${status.failedTest}`);
  if (status.targetedCommand) lines.push(`Targeted reproduction: \`${status.targetedCommand}\``);
  if (status.traceArtifact) lines.push(`Trace artifact: ${status.traceArtifact}`);
  if (status.firstError) {
    lines.push(``, `First actionable error:`, "```", status.firstError.slice(0, 2000), "```");
  }
}

const body = lines.join("\n") + "\n";

mkdirSync("reports", { recursive: true });
writeFileSync("reports/ci-summary.md", body);
console.log(body);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
}
