# Living Infrastructure V6 — Completion Report

## Executive summary

This is a continuation of an already-substantial V6 session. An earlier
phase built the full CI/CD automation foundation, the Living Infrastructure
Atlas (2D + intent-loaded 3D), the Architecture Time Machine, Proof Mode,
Recruiter/Engineer/Explorer visitor paths, and an RC-01 upgrade tying it
together — recorded in that phase's own completion report, which explicitly
listed capture/video/soak tooling and a full per-route performance sweep as
deferred work rather than claiming completion it hadn't earned.

This continuation built exactly that deferred work — `scripts/capture-v6.mjs`,
`scripts/record-v6-experience.mjs`, `scripts/soak-test-v6.mjs`,
`scripts/measure-v6-routes.mjs` — and then, critically, **actually used them**:
individually inspecting every screenshot and frame-by-frame reviewing the
recorded video (not just running the scripts and trusting a green exit code)
surfaced three more real, independent bugs that no automated assertion had
caught, including one serious enough that closing Atlas's 3D view the normal
way permanently disabled it for the rest of that page session. All three are
found, fixed, and verified below with direct, repeated reproduction — not
assumed fixed because the code looked right.

## Parent tag / commit

- V5.1 parent tag: `jury-refinement-v5.1-final`
- V5.1 parent commit: `8574469`
- Preparation commit: `0a9f533`
- 16 commits on `living-infrastructure-v6` since the V5.1 parent tag
  (`git rev-list --count jury-refinement-v5.1-final..HEAD`)

## Commit history (chronological)

| Commit | Summary |
|---|---|
| `3c39cbb` | Establish the shared V6 experience architecture (prior session's Phase 1) |
| `da51db7` | Add automated testing build and deployment foundations |
| `6f21f0a` | Build the Living Infrastructure Atlas and Architecture Time Machine |
| `0a93546` | Fix CI: standardize on Node 22, not 20 (jsdom@30 requires it) |
| `7b08cb5` | Optimize Atlas 3D node material; fix a real hang in the perf script |
| `dc9405f` | Add Proof Mode |
| `32d3c65` | Add Recruiter/Engineer/Explorer visitor paths |
| `b014b03` | Upgrade RC-01: point to Atlas/Proof Mode, switch visitor path |
| `0f107db` | Extend mobile-overflow coverage to Atlas 3D view and Proof Mode |
| `899632a` | Fix a real R3F crash: remove invalid `<title>` from the Atlas 3D scene |
| `a0aff9c` | Add the (prior-phase) V6 session completion report |
| `851f61c` | **Add V6 evidence tooling**: capture, video, soak, per-route performance |
| `9610693` | **Add real WebGL context-loss recovery to Atlas**; fix capture-script bugs |
| `6ec4584` | **Fix a real bug: closing Atlas's 3D view permanently disabled it** |
| `01e0a1e` | **Fix an unhandled-rejection crash in the per-route performance script** |

All 16 commits pushed; local `HEAD` matches `origin/living-infrastructure-v6`
exactly at the time of writing.

## What this continuation built

- **`scripts/capture-v6.mjs`**: the established route × 5-breakpoint matrix
  (50 screenshots) plus 16 V6-specific states — visitor-path selection,
  Atlas 2D, Atlas 3D loading/working/node-selection, Architecture Time
  Machine, Proof Mode, RC-01 activation/pointing-captions/minimise-restore,
  reduced motion, WebGL-unsupported fallback, error recovery, mobile
  collapsed/medium/expanded, clean deactivated state — with real DOM-state
  assertions before every screenshot, never a fixed delay.
- **`scripts/record-v6-experience.mjs`**: one coherent 14-beat walkthrough
  video (`v6-experience-walkthrough.webm`, ~75s) covering the same ground,
  driving the real production app.
- **`scripts/soak-test-v6.mjs`**: extends the existing V5.1 soak
  methodology (same-page repetition is the only way to actually observe
  listener accumulation) with 15 same-page cycles alternating RC-01/Atlas
  3D activation, a dedicated mutual-exclusion check, and 4 cross-route
  cycles.
- **`scripts/measure-v6-routes.mjs`**: per-route JS/font byte measurement
  against documented budgets, reusing the response-body-summing
  methodology already proven in `compare-bundle-sizes.mjs`.
- **`release.yml`/`nightly.yml`**: evidence generation stopped being
  conditional ("if the script exists, else warn and skip") now that these
  scripts exist — they're mandatory, failing gates like every other release
  check, and the soak test / per-route budget check are newly wired in.

## Three real bugs found by actually looking at the evidence

Running a script and seeing exit code 0 is not the same as verifying the
thing it produced is correct. All three of these were missed by every
automated assertion already in place, and only surfaced because this session
followed through on "open every screenshot individually" and "frame-by-frame
video inspection" as actual review steps, not formalities.

**1. Atlas's 3D view was permanently disabled by a normal close (the serious one).**
Individually inspecting the recorded video caught "3D view failed to load"
appearing right after an ordinary close — not the working scene the beat was
supposed to show. A 10-iteration direct reproduction (open → click a node →
close) confirmed it: **10/10 failures**. Root cause: Three.js's own
`WebGLRenderer.dispose()` (called by R3F when the scene unmounts)
intentionally force-loses the WebGL context as part of its own cleanup —
firing the exact same `webglcontextlost` event a genuine GPU/driver failure
would. The context-loss recovery listener added earlier this session (a
real, legitimate fix for a real gap — Atlas had no recovery path at all
before it) couldn't tell the two apart. Because `AtlasCanvasHost` checks
`erroredOut` before `active` in its render logic, once that flag flipped
true there was no path back to the "Enter 3D view" button at all — one
normal close broke the feature for the rest of that page session.

Fixed with an `activeRef` kept current via effect for the general case, and
set synchronously inside the Close button's own click handler for the one
path direct reproduction proved races the effect — both `onError` paths (the
outer `SceneErrorBoundary`, which catches a genuine thrown exception during
unmount, and `AtlasSpatialScene`'s own `onError` prop, which catches the raw
DOM event) check it before treating a context loss as real. **Verified: 10/10
clean reproductions after the fix** (confirmed against a freshly-built,
freshly-started server — an earlier round of "still failing" results during
debugging turned out to be testing against a stale `next start` process left
over from a previous build, not the fix failing). The full `atlas.spec.ts`
suite (13/13) still passes.

**2. `measure-v6-routes.mjs` crashed on its first real run.** The JS-chunk
response handler used `try/finally` with no `catch`, unlike the font handler
right below it — a request still in flight when the settle-detection loop
closed the browser context threw an uncaught "Target page, context or
browser has been closed" from inside an async `page.on("response")` handler,
crashing the whole script via an unhandled rejection. Fixed by adding the
same `catch`-and-ignore the font handler already had. Verified: a full,
clean run across all 9 routes afterward.

**3. Two capture-script bugs and one video-script bug**, all confirmed by
direct reproduction rather than assumed from reading the code:
- `getByRole("group", { name: /architecture nodes, selectable/i })` never
  matched — the underlying `<ol>` has an implicit ARIA role of `"list"`, not
  `"group"` (confirmed by inspecting `AtlasDiagram.tsx`'s actual rendered
  roles).
- The WebGL-unsupported capture clicked "Enter 3D view" before checking for
  the fallback message, but `useWebGLSupport` detects support proactively at
  mount, not lazily on click — with `getContext` overridden, that button
  never renders at all, so the click just timed out.
- The video script's step 9 used a bare `getByRole("button", { name: "Next" })`,
  which became ambiguous once Architecture Time Machine's own "Next stage
  in..." button (still on the page from step 8, since RC-01 was activated on
  the same case-study page rather than navigating to home first, where the
  Reliability Spine Tour this step exercises actually lives) coexisted with
  RC-01's tour "Next" control.

All fixed and re-verified: the final `capture-v6.mjs` run passed all 50
route captures and all 16 V6-specific captures with a clean exit code, and
the re-recorded video shows the correct state at every beat when inspected
frame-by-frame.

## Soak test result (real, this session)

`scripts/soak-test-v6.mjs`, 15 same-page activation cycles (alternating
RC-01/Atlas 3D) + a dedicated mutual-exclusion check + 4 cross-route cycles,
against the local production server:

- All 15 same-page cycles: `canvas=0, speaking=false` after each
  deactivation — no leaks.
- Mutual exclusion: activating Atlas 3D while RC-01 was already open left
  exactly 1 canvas mounted, never 2.
- `speechSynthesis.cancel()` was called 29 times across the run — confirms
  cleanup actually fires, not just that nothing crashed.
- All 4 cross-route cycles (Aurora, Jenkins, Secure AWS, Node.js Auth): clean.
- **Result: passed**, real exit code 0.

## Per-route performance results (real, this session)

`scripts/measure-v6-routes.mjs` against the local production server, after
fixing the crash described above:

| Route | JS bytes | Font bytes | Canvas before intent | Budget |
|---|---|---|---|---|
| `/` (home) | 120,627 (117.8 KB) | 34,608 | 0 | ≤802,000 — **pass** |
| `/work` | 150,016 (146.5 KB) | 24,836 | 0 | no documented V5.1 baseline |
| `/work/project-aurora` | 93,505 (91.3 KB) | 14,908 | 0 | no documented V5.1 baseline |
| `/work/distributed-jenkins-controller` | 78,827 (77.0 KB) | 34,608 | 0 | no documented V5.1 baseline |
| `/work/secure-aws-production-architecture` | 83,194 (81.2 KB) | 34,608 | 0 | no documented V5.1 baseline |
| `/work/nodejs-auth-mysql-rds` | 84,766 (82.8 KB) | 34,608 | 0 | no documented V5.1 baseline |
| `/about` | 250,355 (244.5 KB) | 34,608 | 0 | no documented V5.1 baseline |
| `/resume` | 305,613 (298.5 KB) | 14,908 | 0 | no documented V5.1 baseline |
| `/contact` | 102,783 (100.4 KB) | 14,908 | 0 | no documented V5.1 baseline |

Home is the only route with a documented, verified V5.1 baseline to gate
against (697,303 bytes → 802,000-byte V6 ceiling) and passes comfortably.
Every other route is reported honestly rather than checked against an
invented comparison number this session doesn't actually have. Every route's
font total is well under the 239,000-byte site-wide budget, and canvas count
before intent is 0 everywhere — the "zero spatial bytes before intent" rule
holds site-wide, not only on the one route it was previously spot-checked
against.

## Atlas interaction performance gate (re-confirmed against the fixed scene)

Reproduced twice on `/work/project-aurora` after this session's context-loss
fix (a materially different, working scene than the one measured in the
prior phase):

| Metric | Run 1 | Run 2 | Budget | Result |
|---|---|---|---|---|
| Canvas count before spatial intent | 0 | 0 | 0 | pass |
| Interaction-only CLS | 0 | 0 | ≤0.1 | pass |
| Interaction-only longest long task | 0ms | 0ms | ≤50ms | pass |

## Docker, Trivy: local status (honest)

Two more local attempts were made this session, both after the earlier
phase's documented VM-contention failures, and both under materially better
conditions (load average 1.55–1.86 vs. the earlier 5.85–6.89 range):

- **Docker**: `docker build -t tarun-portfolio:v6-final .` was started and
  monitored for ~9 minutes. It never progressed past pulling and extracting
  the `node:22-alpine` base image layers — no container was ever created for
  the first `RUN npm ci` step. This is a different stall point than the
  earlier phase's two attempts (which got through `npm ci` and stalled
  committing that layer), but the same class of issue: this VM's Docker
  daemon under sustained load. Killed and cleaned up rather than left
  indefinitely blocking other work, consistent with the same judgment call
  made earlier this session.
- **Trivy**: not installed locally. A no-sudo install (the standard
  `contrib/install.sh` script to `~/.local/bin`, since `apt-get` requires a
  password this session doesn't have) was attempted; the ~14MB binary
  download stalled for several minutes with no completion, alongside the
  concurrent Docker attempt — plausibly the same I/O contention, not
  conclusively isolated. Killed for the same reason.

**What this means concretely**: the Docker image has still not been proven
to build and boot anywhere in this environment. The real build/validate step
remains `release.yml`'s GitHub-hosted-runner jobs (real BuildKit, no local
VM contention), structurally reviewed but not yet executed since no release
tag has been pushed. Trivy's real first execution will be whichever runs
first between a pushed nightly run and a release tag.

## GitHub Actions: real, hosted results this session

- **Fast CI**: triggered by every push in this continuation, including the
  push containing all four commits above. Result: **success**
  (`https://github.com/tarunpradeep6162/Portfolio/actions/runs/31716439052`).
- **Nightly Deep Validation**: manually triggered via
  `gh workflow run nightly.yml` against the current `HEAD` (a first
  dispatch was cancelled and re-triggered after discovering it had started
  against a stale, pre-push commit — the four commits above were pushed
  specifically so this run would test the real, current code, not an
  earlier snapshot). Result: **success**, all 25 steps, in 4m27s total
  (`https://github.com/tarunpradeep6162/Portfolio/actions/runs/31716460320`)
  — dramatically faster than any equivalent run on this local VM, which is
  exactly the point of moving validation onto a properly-resourced,
  uncontended runner. Verified step-by-step, not just the overall
  conclusion, since a fast total time for a "full" pipeline is worth
  double-checking rather than assuming nothing was skipped:

  | Step | Result |
  |---|---|
  | Lint | success |
  | Typecheck | success |
  | Unit tests | success |
  | Production build | success |
  | Full Playwright suite (single worker) | success |
  | Accessibility-focused pass | success |
  | Verify routes | success |
  | Verify headers | success |
  | V6 Atlas interaction performance gate (×2) | success |
  | V6 per-route performance budgets | success |
  | V6 soak test (15 cycles) | success |
  | **Trivy filesystem/secret/misconfig scan** | **success** |

  This is the first genuine Trivy execution of this entire session — every
  local attempt (both this phase and the prior one) was blocked by this
  VM's Docker/network contention. It ran for real, on GitHub's
  infrastructure, and passed the documented severity policy
  (CRITICAL/HIGH with a known fix blocks).

## Known limitations and deferred work (updated)

1. **Docker image**: still not built successfully anywhere in this
   environment (see above). First real verification remains
   `release.yml`'s GitHub-hosted job, pending a release tag push.
2. **Trivy**: not run locally in either phase of this session. First real
   execution is whichever of the nightly workflow or a release tag comes
   first.
3. **Jenkins**: `Jenkinsfile` reviewed structurally, never executed (no
   Jenkins agent labeled `portfolio-docker` configured in this environment).
4. **Vercel**: not linked in this environment; `preview-validate.yml` and
   the release workflow's promotion job will report "not configured" rather
   than fail or fabricate a deployment.
5. **Per-route V5.1 baselines**: only home has a documented, verified V5.1
   byte baseline to gate against. Every other route's current bytes are
   reported honestly (see the table above) rather than checked against an
   invented ±15% comparison this session doesn't have real data for.

## Restart command

```bash
cd /home/tarun/v6-work/tarun-portfolio
npm run build
npm run start -- -p 3500
```

## Final Git state

```
$ git status --short
(clean)

$ git rev-parse HEAD
01e0a1e...  (matches origin/living-infrastructure-v6)
```

No protected branch touched. `living-infrastructure-v6-final` has
deliberately not been created — see "Known limitations" above for what's
still genuinely outstanding before that tag would be honest.
