# Operational Twin V7 — Hosted CI/CD Migration: Completion Report

## Exact final commit SHA (released)

`cba06cffeaa80d489e52f269df28a0e0c49281af` (branch `operational-twin-v7`)

This is one commit newer than `9aa3514072fe0d95202892456bb7ab330595d4c3`
(the commit referenced throughout most of this report as the evidence-
capture fix) - the intervening commit, `cba06cf` itself, is **documentation
only**: it rewrote this report and the session handoff doc with the honest
V7-evidence reconciliation. Confirmed via `git diff --stat 9aa3514 cba06cf`:
only `docs/OPERATIONAL_TWIN_V7_COMPLETION_REPORT.md` and
`docs/OPERATIONAL_TWIN_V7_SESSION_HANDOFF.md` changed - nothing in `app/`,
`components/`, `lib/`, `content/`, `package.json`, `Dockerfile`,
`playwright.config.ts`, or any test file.

`V7 Fast CI`, `Preview Validation`, and `V7 Evidence Capture` are all green
for this exact final commit (`cba06cf`). `V7 Full Validation`'s last real
pass covers an earlier ancestor, `24954550f87f7ffe70b20969b3de6772bf18d164`
- **confirmed via `git diff --stat` that zero application code differs
between that commit and `cba06cf`** (the only changes across the whole span
are the evidence-tooling fix and documentation, itemized above and below).
Full Validation was **not** re-run, per explicit instruction ("Do not
rerun Full Validation unless application source changed").

## Final tag

`operational-twin-v7-final` (annotated), created and pushed to `origin`,
points at exactly `cba06cffeaa80d489e52f269df28a0e0c49281af`:

```
$ git rev-list -n1 operational-twin-v7-final
cba06cffeaa80d489e52f269df28a0e0c49281af
$ git ls-remote --tags origin operational-twin-v7-final
d0c19b7d0ee554e8d86f8caa3014707010c9a0fb  refs/tags/operational-twin-v7-final
```

(`d0c19b7` is the tag object's own SHA; `git rev-list` above confirms the
commit it points to.)

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
| V7 Fast CI | `cba06cf` (final) | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878940954 |
| V7 Fast CI | `9aa3514` (ancestor, evidence-fix commit) | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878603635 |
| Preview Validation | `cba06cf` (final) | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878959630 |
| V7 Full Validation | `2495455` (identical app code to `cba06cf` - see above) | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31874612311 |
| V7 Evidence Capture (corrected) | `9aa3514` (identical app code to `cba06cf`) | ✅ success | https://github.com/tarunpradeep6162/Portfolio/actions/runs/31878623273 |
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
- **Preview validated for the final commit**: deployment `5919434464` for
  `cba06cffeaa80d489e52f269df28a0e0c49281af` (exact final-HEAD match, found
  via `gh api repos/.../deployments?sha=...`, not assumed) -
  `https://tarun-portfolio-8q00opsir-tarun-2f6a.vercel.app`. This is a
  **different, newer** preview than the one referenced above for `2495455`
  (`...-8kyh5zho4-...`) - not reused merely because the older one had
  already passed. Targeted Preview Validation ran against this exact
  deployment (`31878959630`, ✅ success): health 200 in 698ms, all 13
  route checks, all 6 security headers including confirmed-absent
  `X-Powered-By`, desktop/mobile smoke tests, and overflow/canvas/speech
  checks all passed.
- **Production: promoted.** This preview (deployment `5919434464`, commit
  `cba06cf`) was promoted to `https://portfolio-tarun-dun.vercel.app` -
  manually, via the Vercel dashboard's "Promote to Production," by the
  user (no Vercel API token or CLI was available in this session to do it
  programmatically; this was disclosed and the user chose to do it
  themselves rather than have the session route around the gap). No
  rebuild occurred - the promoted deployment is bit-for-bit the same build
  already validated as the preview above.

## Production deployment verification (public, no bypass header, no login)

Performed entirely against `https://portfolio-tarun-dun.vercel.app/` as an
anonymous visitor would reach it - `VERCEL_AUTOMATION_BYPASS_SECRET` was
confirmed unset in the verifying shell for every check below.

| Check | Result |
|---|---|
| Public HTTP 200 | ✅ `200` in 653ms (`verify-health.mjs`) |
| No redirect to `vercel.com/login` or `sso-api` | ✅ direct 200, no `Location` header |
| All expected routes | ✅ 13/13 (`verify-routes.mjs`), including both 404 cases |
| Custom 404 behavior | ✅ `/this-route-does-not-exist-ci-check` and `/work/unknown-project` both return 404 |
| Security headers | ✅ 6/6 (`verify-headers.mjs`): `x-content-type-options`, `referrer-policy`, `permissions-policy`, `x-frame-options`, `strict-transport-security`, absent `x-powered-by` |
| Full Playwright suite against the live domain | ✅ 96/96 ultimately passing (81 clean, 9 flaky-then-passed, 6 initially failed then confirmed as this session's own test-client network artifact - see below), 56.2 minutes |
| Operational Twin activate/close/reopen | ✅ `operationalTwin.spec.ts:15`, isolated clean pass; screenshots `01`-`03` (idle/active/closed) visually confirmed |
| System Trace | ✅ `04-system-trace-selected` screenshot + `companion.spec.ts:309`'s `"proof"` command trace-state assertions |
| Deployment Replay + Incident Replay | ✅ `06-deployment-replay-playing`, `07-incident-replay` - real assertions (Play→Pause control appears, Next-step control), not decorative |
| Automation Fabric + Proof Ledger | ✅ `08-automation-fabric`, `09-proof-ledger-and-comparison` |
| RC-01 | ✅ full `companion.spec.ts` (32 tests) plus `10-rc01-command-console` |
| Maximum one canvas | ✅ `atlas.spec.ts`, `operationalTwin.spec.ts`, `capture-v7.mjs`'s `"twin"`-command assertion, all confirm ≤1 |
| Zero canvas before intent | ✅ `atlas.spec.ts:71` + `01-operational-twin-idle` screenshot visually confirmed (static 2D diagram only, "Activate Operational Twin" button present, no canvas) |
| Mobile overflow | ✅ `responsive.spec.ts` + companion mobile-state tests + `13-mobile-v7-sections` |
| Reduced-motion fallback | ✅ `accessibility.spec.ts` + `12-operational-twin-reduced-motion` |
| Serious browser console errors | ✅ `routes.spec.ts` - all 6 required routes clean, zero console/page errors |

All 16 `capture-v7.mjs` screenshots were also re-captured live against
production (not reused from the earlier local/evidence-capture run) and
passed every one of the script's hard assertions on a clean, uncontended
rerun; two of the highest-stakes frames (`01-operational-twin-idle`,
`11-v7-twin-command-one-canvas-exclusion`) were opened and visually
inspected directly, not just trusted from the assertion pass.

**A real investigation, not a hidden false start**: the first full-suite
run against production reported 6 deterministic failures (failed all 3
attempts each, including `operationalTwin.spec.ts:15` itself) clustered
around canvas-mount timing and RC-01 state-sync. Rather than accept or
hide this, it was investigated before any rollback decision:

1. A `curl` timing check immediately after the hour-long run showed the
   root page taking 2-3s to respond (vs. ~650-700ms baseline measured
   earlier the same session, and vs. GitHub Actions' own 698ms for the
   identical deployment) - this VM's network was measurably degraded,
   consistent with the same slow-network pattern already documented
   earlier in this session (5-7 KB/s GitHub artifact downloads).
2. All 6 tests were re-run in isolation, away from the hour-long suite's
   contention: **5 of 6 passed immediately** (one - `atlas.spec.ts:79` -
   passed on its own first retry).
3. The 6th, `companion.spec.ts:309`, still failed at the standard 30s
   timeout even in isolation. Its failure snapshot (`error-context.md`,
   captured at the exact moment of timeout) already showed the **correct
   end state reached** - Operational Twin active, RC-01 panel closed -
   just not within 30s. Re-run once more with a 90s timeout: **passed in
   31.9s** - 1.9 seconds over the standard budget, not a broken assertion.

Conclusion: all 6 were this session's own test-client bandwidth becoming
the bottleneck under sustained load against a real remote domain (not a
production defect) - confirmed by isolation, by a longer-timeout pass, and
independently by the completely clean, zero-failure `capture-v7.mjs`
re-run described above. **No rollback was needed or performed** (Step 8's
condition - production verification failing - was not met).

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
- **This VM's network as a testing bottleneck against real remote targets**:
  demonstrated concretely during production verification (see above) - an
  hour-long sustained Playwright run against a live external domain
  degraded this machine's own throughput enough to produce 6 false
  failures, resolved only by isolating and re-timing each one. Worth
  knowing before trusting any future *local* full-suite run against a real
  hosted target on this same machine; GitHub-hosted runners were and
  remain the more reliable environment for that class of check.
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

## What has happened vs. what has not (explicitly, to avoid any ambiguity)

**Happened, this final phase:**
- Annotated tag `operational-twin-v7-final` created and pushed to `origin`,
  confirmed pointing at exactly `cba06cffeaa80d489e52f269df28a0e0c49281af`.
- The Vercel preview for that exact commit (deployment `5919434464`) was
  promoted to `https://portfolio-tarun-dun.vercel.app` - by the user,
  manually, via the Vercel dashboard, with no rebuild.
- Full public production verification against the live domain (no bypass
  header, no login) - every item in the required checklist confirmed, see
  above.

**Distinguishing the four things that could be confused with each other:**
- **Validated application candidate**: `cba06cffeaa80d489e52f269df28a0e0c49281af`
  (identical application code to `9aa3514` and, further back, to `2495455`
  - see the diff-stat chain above).
- **Evidence correction commit**: `9aa3514072fe0d95202892456bb7ab330595d4c3`
  (fixed the V6-only evidence-capture defect; app code identical to the
  final commit).
- **Production deployment SHA**: `cba06cffeaa80d489e52f269df28a0e0c49281af`
  (deployment `5919434464`, promoted without rebuilding from the preview
  already validated for this exact commit).
- **Final documentation HEAD**: `cba06cffeaa80d489e52f269df28a0e0c49281af`
  itself is also the commit this report describes as of its own last edit
  - this report's *update* pushing that edit is a new commit on top (see
  git log for the exact SHA once pushed).

**Still not done:**
- **No Jenkins shutdown.** Commands are provided above; none were
  executed.
- **No rollback.** Production verification passed; Step 8's rollback
  condition was never met.
