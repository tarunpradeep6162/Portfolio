# Operational Twin V7 — Hosted CI/CD Migration: Completion Report

## Exact final commit SHA

`9aa3514072fe0d95202892456bb7ab330595d4c3` (branch `operational-twin-v7`)

`V7 Fast CI` and `V7 Evidence Capture` passed for this exact commit.
`V7 Full Validation` and `Preview Validation`'s last real pass covers an
earlier commit, `24954550f87f7ffe70b20969b3de6772bf18d164` - **confirmed
via `git diff --stat` that zero application code differs between the two**;
the only changes since are the evidence-tooling fix described below and
documentation (`.github/workflows/v7-evidence-capture.yml`,
`scripts/capture-v7.mjs`, `scripts/record-v7-operational-twin-walkthrough.mjs`,
two docs files - nothing in `app/`, `components/`, `lib/`, `content/`,
`package.json`, `Dockerfile`, `playwright.config.ts`, or any test file).
Full Validation was **not** re-run for the newer commit, per explicit
instruction ("Do not rerun Full Validation. It has already passed.").

## A real defect found by inspecting evidence, not trusting a green checkmark

The first `V7 Evidence Capture` run (commit `2495455`) reported success and
was initially reported as complete, valid evidence. On review, it was not:
the workflow called `capture-v6.mjs` and `record-v6-experience.mjs`
(reused unchanged from V6's own release pipeline), and **neither script
contains a single line that touches any V7 feature**. Confirmed two ways:

1. **Complete source review** of both files - every route they visit
   (`/work`, `/work/project-aurora`, home), every control they click
   (Atlas "Enter 3D view", Time Machine's old Previous/Next, RC-01 tours,
   V6's own "Proof Mode" button), and every screenshot they name (visitor
   path, Atlas 2D/3D, WebGL fallback, mobile RC-01 states) is a V6
   surface. None of the ten required V7 items - Operational Twin, System
   Trace, the four project topologies, Deployment Replay's Play control,
   Incident Replay, Automation Fabric, Proof Ledger, project comparison, a
   V7 RC-01 command, one-canvas mutual exclusion - appears anywhere.
2. **Exact reconciliation** against the original run's own logs: 72 files
   (55 route screenshots + 16 V6 interaction screenshots + 1 video),
   matching precisely what the source code would produce - the artifact
   was genuinely what the scripts generated, not corrupted or mislabeled.

A full byte-for-byte download of that original 48.3 MB artifact was also
attempted for direct frame-by-frame video playback, as an additional
check beyond source review - this VM's network throughput to GitHub's
artifact storage was measured at roughly 5-7 KB/s for this specific
transfer (consistent with this session's previously-documented slow-but-
real network pattern), making full download impractical within this
session. It was left running in the background and was not completed; the
source-code and log-based reconciliation above is what actually
established the V6-only finding, not an assumption made instead of
checking.

**Fix**: two new scripts, each visually verified frame-by-frame against a
real recorded video before being trusted (not just checked for a passing
exit code):

- `scripts/capture-v7.mjs` - 16 screenshots covering all ten required
  items, including a real assertion that the `"twin"` console command
  leaves exactly one canvas mounted and closes RC-01.
- `scripts/record-v7-operational-twin-walkthrough.mjs` - one coherent
  walkthrough covering the same list, correctly named
  `v7-operational-twin-walkthrough.webm` (not `v6-*`).

Building and testing these surfaced two more real, previously-undiscovered
environment bugs, each found by literally watching the recorded video
frame-by-frame, not by trusting a passing assertion:

1. **A timing race between two independently-dispatched effects.** After
   the `"twin"` command, canvas-mount and RC-01-close were observed
   resolving in different orders across different runs under real VM
   contention (confirmed by direct reproduction - two different failure
   messages on two different attempts with identical code). Fixed by
   polling each condition independently instead of one check after a
   fixed wait.
2. **This headless Chromium environment does not reliably honor
   `reducedMotion: "no-preference"` immediately.** A recorded video showed
   the Operational Twin's reduced-motion fallback (a static bar chart)
   instead of the real 3D scene, for several real seconds after page load,
   even with the option explicitly set - traced directly to
   `useReducedMotion()`'s documented server-snapshot behavior (defaults to
   `reduced=true` on first paint to avoid a motion flash, corrects only
   after client hydration) combined with this VM's hydration taking longer
   than assumed under contention (measured: up to several seconds, not
   the ~1 second originally assumed). Fixed by polling for the real
   post-hydration button state instead of a fixed wait - not a change to
   any application code, the application's behavior was always correct.

## Workflow runs (exact URLs)

| Workflow | Commit | Result | Run URL |
|---|---|---|---|
| V7 Fast CI | `9aa3514` | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878603635 |
| V7 Full Validation | `2495455` (identical app code to `9aa3514`) | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31874612311 |
| Preview Validation | `2495455` | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31874464694 |
| V7 Evidence Capture (corrected) | `9aa3514` | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878623273 |
| V7 Evidence Capture (V6-only, superseded) | `2495455` | ✅ success but evidence was wrong scope - see above | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31874920999 |

## Test totals

- **V7 Fast CI**: `validate` job (lint/typecheck/unit/build) + `e2e-critical`
  job (~15-test `@release-fast` curated Playwright subset) - both passed,
  ~1-2 minutes each, running in parallel.
- **V7 Full Validation**: complete, unfiltered Playwright suite -
  **96 passed**, 2.0 minutes wall-clock (94 original V6/V7 tests + 2 new
  `tests/e2e/operationalTwin.spec.ts` tests added this session). Also:
  structural/accessibility HTML audit, route verification (13 routes,
  including the custom-404 case), security-header verification (5
  headers + absent `X-Powered-By`), performance-budget measurement (home
  route within its 802,000-byte budget), canvas-before-intent
  verification - all passed.
- **V7 Evidence Capture soak test**: 15 same-page activation/deactivation
  cycles (alternating RC-01/Atlas 3D) + a mutual-exclusion check + 4
  cross-route cycles - "no leaks or crashes detected."

## Docker and Trivy results

- **Docker Buildx**: production image built successfully via
  `docker/setup-buildx-action` + `docker/build-push-action` on a
  GitHub-hosted runner (real BuildKit, no local `buildx`-plugin
  installation needed - unlike this repository's local Jenkins agent,
  which required adding it explicitly this session).
- **Trivy filesystem scan**: CRITICAL/HIGH, informational (`exit-code: 0`,
  matches this repo's existing nightly-scan severity policy).
- **Trivy image scan**: CRITICAL/HIGH, fixed-vulnerabilities-only
  (`ignore-unfixed: true`), **blocking** (`exit-code: 1`) - the job
  succeeded, which is only possible if **zero** blocking findings were
  present (a real finding would have failed this exact step).
- **Candidate container**: built image actually run as a container and
  health/route/header-checked (not just scanned statically) - passed.

## Vercel preview/production status

- **Preview**: `https://tarun-portfolio-8kyh5zho4-tarun-2f6a.vercel.app`
  (commit `2495455`) - verified for real: health check 200 in 510ms, all
  13 route checks passing (11× expected-200, 2× expected-404), all 5
  security headers correct, targeted Playwright smoke checks passing.
- **Real finding, now resolved**: every V7 preview deployment had
  returned HTTP 302 to Vercel's own SSO wall (`vercel.com/sso-api`) on
  every route, across ~19 consecutive `Preview Validation` runs before
  this session - confirmed directly with `curl -I`, not assumed from
  logs alone. Fixed with a `VERCEL_AUTOMATION_BYPASS_SECRET` repository
  secret (generated by the user in the Vercel dashboard, added to GitHub
  Actions secrets), wired as an `x-vercel-protection-bypass` header. The
  secret value is never logged - GitHub Actions automatically redacts
  `${{ secrets.* }}` values in run output, confirmed directly (every log
  line referencing it shows `***`).
- **Production**: still exclusively V6 (`https://portfolio-tarun-dun.vercel.app`).
  **No production promotion was attempted or claimed.** V7 has not been
  promoted; that remains a separate, explicit future action once a V7
  final tag exists and its own promotion path is authorized.

## Evidence inventory (corrected)

Archived as GitHub Actions artifact
`v7-evidence-9aa3514072fe0d95202892456bb7ab330595d4c3` (90-day retention,
17,614,097 bytes, artifact ID `9245449735`, **22 files** - confirmed via
the upload step's own "With the provided path, there will be 22 files
uploaded" log line, not assumed):
[https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878623273/artifacts/9245449735](https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878623273/artifacts/9245449735)

- **16 V7 screenshots** (`screenshots/v7/`): Operational Twin idle/active/
  closed (3), System Trace stage selection (1), 4 distinct project
  topologies (`topologies/case-aurora.png`, `case-jenkins.png`,
  `case-secure-aws.png`, `case-nodejs-auth.png` - each visually confirmed
  to show a genuinely different shape: linear chain, agent-branch
  triangle, etc.), Deployment Replay mid-playback (1), Incident Replay
  (1), Automation Fabric (1), Proof Ledger + project comparison table (1),
  RC-01 command console (1), the `"twin"` command's one-canvas exclusion
  (1), Operational Twin reduced-motion fallback (1), mobile V7 sections
  (1).
- **3 videos**: `v7-operational-twin-walkthrough.webm` (3.5 MB, the
  primary ~2-minute walkthrough covering every item above in one take -
  visually confirmed frame-by-frame, not just a passing exit code) plus
  two short supplementary clips (reduced-motion and mobile passes,
  hash-named).
- **3 reports**: `evidence-inventory.md` (generated manifest),
  `soak-test.txt`, `perf-routes.txt`.

The superseded, V6-only artifact (`v7-evidence-24954550...`, 72 files,
48.3 MB) remains archived on its original run for historical reference
but should not be treated as V7 evidence.

## Remaining limitations

- **Codespaces**: `.devcontainer/devcontainer.json` was reviewed for
  correctness but not proven by actually creating a Codespace (this
  session's tools cannot drive GitHub's Codespaces infrastructure
  directly). Low risk - it only adds a new file, doesn't change
  application behavior. Recommended: create one Codespace on
  `operational-twin-v7` and confirm `npm run dev`/`npm run test:e2e` work
  before relying on it day-to-day.
- **`workflow_dispatch` registration quirk**: `v7-full-validation.yml` and
  `v7-evidence-capture.yml` each required a one-time temporary `push`
  trigger to register with GitHub before `workflow_dispatch` became
  callable via API/CLI - a documented GitHub limitation (confirmed via a
  direct 404 from the dispatch endpoint), not a defect in either file.
  Both are fully registered and working now.
- **Nightly schedule** (`21:15 UTC` for V7 Full Validation) has not yet
  fired for real - only manually dispatched runs are confirmed.
- **Full Validation's exact-SHA gap**: as explained above, it last ran for
  real against `2495455`, not the newer `9aa3514` - the application code
  is identical between them (confirmed via diff), but if this matters for
  a strict audit trail, one more `V7 Full Validation` dispatch against
  `9aa3514` would close it exactly (not done here per explicit
  instruction not to rerun it).
- **Superseded artifact download**: the original V6-only artifact's
  background download for direct video playback never finished (this
  VM's network throughput to GitHub's artifact storage). Not needed for
  the conclusion reached (see above), but noted so it isn't mistaken for
  a completed check.
- **Jenkins**: the `Deploy to Vercel` stage in `Jenkinsfile` was never
  exercised (no Jenkins Credentials for it exist), and the newly-added
  `docker buildx` support (`portfolio-build-agent:buildx-v2`) was built
  and verified standalone but never swapped into the running agent
  container - both moot now that GitHub Actions is the active platform.

## Codespaces usage instructions

1. GitHub → this repository → **Code** button → **Codespaces** tab →
   **Create codespace on `operational-twin-v7`** (confirm the branch
   selector, not the default branch).
2. Pick a **4-core** machine if offered (the devcontainer's
   `hostRequirements.cpus: 4` filters the picker to this minimum, doesn't
   force it).
3. Wait for `postCreateCommand` (`npm ci && npx playwright install
   --with-deps chromium`) to finish - one-time per Codespace.
4. `npm run dev` (port 3000, forwarded automatically) or `npm run
   test:e2e` (Playwright's own `webServer` on port 3100).
5. **Stop** the Codespace when done for the day (halts compute billing,
   keeps your files). **Delete** it once work is merged and you won't
   resume that exact environment (frees the storage allocation too).

## Jenkins archival and shutdown instructions

**What genuinely ran** (not fabricated, not simulated): a real Jenkins
controller and a purpose-built `portfolio-docker`-labeled agent
(`portfolio-build-agent`) executed ten real pipeline runs this session,
each finding and fixing a genuine, different defect (Docker tag mismatch,
Trivy timeout, agent network-namespace routing, a Declarative Pipeline
env-var limitation, a root-escalation issue, two real test regressions,
one full host reboot mid-build, two isolated environmental flakes). The
pipeline was then reduced from one monolithic run to three profiles
(`RELEASE_FAST`/`FULL_VALIDATION`/`EVIDENCE_ONLY`), and the agent was
successfully rebuilt with `docker buildx` support
(`portfolio-build-agent:buildx-v2`, confirmed working). Full itemized
history: `docs/OPERATIONAL_TWIN_V7_SESSION_HANDOFF.md`.

**Known limitation, stated plainly**: single local VM, real measured
resource contention throughout (slow package-mirror throughput,
occasional VM-load test flakiness, one full host reboot mid-build) - not
a reliable always-on CI target. This is the direct reason GitHub Actions
now runs the normal V7 workflow instead - not a rejection of Jenkins as a
technology, a decision about *this specific* single-machine deployment of
it.

**GitHub Actions is now the active hosted automation platform** for
normal V7 development, testing, security scanning, and preview
validation. Jenkins is retained as historical portfolio evidence, not
required for anything described in this report.

**Jenkins is not shut down automatically by this work.** No IP address,
API token, SSH key, or other credential is recorded in this report or any
other committed file. When ready, the safe local shutdown sequence
(run manually, on the machine itself, outside this repository):

```bash
# Stop the two agent containers (does not delete images/volumes)
docker stop portfolio-build-agent jenkins-agent-01

# Stop the Jenkins controller service (adjust to how it was started -
# systemd unit, docker container, or foreground process)
sudo systemctl stop jenkins   # if running as a systemd service
# or: docker stop <jenkins-controller-container-name>

# Only after confirming nothing else depends on it:
# revoke the Jenkins API token used this session (Jenkins UI -> user ->
# Configure -> API Token -> revoke) and delete the token file:
rm -f ~/.jenkins-api-token
```

Do not run these until you've independently confirmed you no longer need
local Jenkins access - they are provided as instructions, not executed by
this session.

## What has not happened (explicitly, to avoid any ambiguity)

- **No V7 final tag has been created.** Fast CI and Evidence Capture have
  passed for the exact final commit; Full Validation and Preview
  Validation's last real pass is for an ancestor commit with identical
  application code (see above) - creating the tag itself is a separate,
  explicit action for the user to request by name/format, not inferred
  here.
- **No production promotion.** V6 remains the sole production deployment.
- **No Jenkins shutdown.** Commands are provided above; none were
  executed.
