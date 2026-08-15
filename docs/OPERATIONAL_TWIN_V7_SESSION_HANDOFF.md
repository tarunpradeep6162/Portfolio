# Operational Twin V7 — Session Handoff

## Current state

- **Worktree**: `/home/tarun/v7-work/tarun-portfolio`
- **Branch**: `operational-twin-v7`
- **Parent**: `living-infrastructure-v6-final` (commit
  `669a0a891e4970a9bfc20a38564eca67ca9a00e9`) — confirmed ancestor.
- **HEAD**: see `git log -1 --format=%H` for the exact value; not hardcoded
  here (self-referential).
- **Working tree**: clean at last commit (`8ad4783` at the time of writing —
  verify with `git log -1` rather than trusting this number as time passes).
- **V6**: verified closed and untouched throughout every batch this session.
- **Pushed to origin**: yes, every batch. Verify with
  `git rev-parse HEAD origin/operational-twin-v7` before assuming sync.

## Completed phases (12 commits since the master-spec doc landed)

- **Phase 0 (V6 baseline)**: reproducible production baseline measured
  twice — `docs/OPERATIONAL_TWIN_V7_PERFORMANCE_BUDGET.md`.
- **Phase 1 (discovery + design direction)**: reusable-system inventory,
  content-gap audit, three original directions compared against the
  reject-list, "Instrument Deck" selected with reasoning. Three new color
  tokens in `app/globals.css`, each WCAG-contrast-checked with the real
  formula.
- **Phase 2 (architecture)**: `lib/v6/experienceReducer.ts`/`types.ts`
  extended (`qualityTier`/`webglCapability`/`traceScope`, new
  `"operational-twin"` `SceneKind`) — verified backward-compatible, not
  just type-compatible. Caught and fixed a real `QualityTier` duplication
  in the same pass.
- **Phase 3+4 (Scene Director + SSR hero), first pass**: the full
  Operational Twin activation lifecycle
  (`components/v7/OperationalTwinHost/Scene/Fallback.tsx`) — real,
  working, mirrors Atlas's proven shape. Visual content is a working but
  minimal instanced-box deck; full art-direction polish is explicitly
  Phase 16, not done yet (see below).
- **Phase 6 (System Trace)**: `components/v7/SystemTrace.tsx` — real
  cross-surface sync (URL, ReliabilitySpine, ProjectCard dimming), all
  verified in-browser. Found/fixed a real production-build-only failure
  (`useSearchParams()` Suspense boundary) that `tsc`/`eslint` never caught.
- **Phase 8 (four project-world topologies)**: `lib/v7/topologyClassifier
  /topologyLayout.ts` — all four real projects get genuinely different
  shapes (linear/agent-branch/service-fork/perimeter), derived from real
  structural cues in their flow text. Found/fixed two real bugs: a stale
  server process serving pre-fix code, and a genuine x-axis line-crossover
  in the fork layout (now regression-tested).
- **Phase 9 (Deployment Replay)**: extended `TimeMachine.tsx` with
  Play/Pause/Restart rather than building a parallel component (it already
  had Previous/Next/select-stage). Found/fixed a real impure-state-updater
  bug in the Play handler along the way.
- **Phase 10 (Incident Replay)**: `components/v7/IncidentReplay.tsx` +
  `content/v7/incidents.ts` — three real, documented incidents from this
  site's own V6/V7 development (Atlas close/reopen regression, the
  Suspense-boundary build failure, the topology line-crossover), not
  invented outages.
- **Phase 11 (Automation Fabric)**: `components/v7/AutomationFabric.tsx` —
  the real pipeline from `docs/AUTOMATED_CI_CD.md`, honestly split into
  verified (real V6 evidence, linked) vs. pending (genuinely not yet run
  for V7) stages.
- **Phase 12 (Proof Ledger + comparison)**: `lib/v7/evidenceMapper.ts` +
  `ProofLedger.tsx` (filterable by status and by traced stage) and
  `lib/v7/projectComparison.ts` + `ProjectComparison.tsx` (a plain table,
  not a radar chart, honestly reporting "Not documented for this project"
  where nothing real matches).
- **Phase 13 (RC-01 V7 commands)**: three new commands (`twin`, `reset`,
  `pipeline`) and two upgraded (`spine`, `proof`, `atlas`) now dispatch
  real shared state — verified directly: `twin` closes RC-01 while canvas
  count stays exactly 1, `reset` clears both trace and RC-01 itself.
  Honest scope limit recorded: Deployment Replay/Incident Replay controls
  remain component-local state, not yet RC-01-controllable (would require
  lifting their state into the shared reducer — deliberately deferred,
  not overlooked).
- **Phase 15 (mobile/a11y hardening), first pass**: found and fixed a
  real, user-scrollable horizontal-overflow bug present since before this
  session (`<html>` lacked the `overflow-x: clip` `<body>` already had) —
  verified with `window.scrollTo` actually moving before the fix and not
  moving after, at every tested breakpoint.

## Not yet started

- **Phase 7 (full homepage narrative recomposition)**: sections were added
  incrementally around the existing V6 homepage structure, not yet
  recomposed as one deliberate narrative arc.
- About/résumé/skills/contact page refinement (Phase 14) not started.

## Completed since the above list was last frozen

- **Phase 16 (visual art-direction pass)**: done — `OperationalTwinScene.tsx`
  got a real second `InstancedMesh` (`StatusPips`), a solid baseplate, a
  second cool-toned fill light, and a corrected camera radius/height (found
  a real composition bug: at the old radius of 4.2 with a 38° FOV, only
  ~4 of 8 instruments were ever in frame — confirmed by screenshot, fixed
  by widening to 8.6).
- **The Jenkins pipeline** — real execution, now retired from the critical
  path in favor of hosted CI/CD (see the new section below), but the full
  history is real and kept as evidence, not deleted:
  - Inspected the existing controller (`http://192.168.1.38:8080`, not
    recorded elsewhere - see the security note below) and agent
    `jenkins-agent-01` first, per explicit instruction — confirmed
    healthy, left completely unmodified throughout the entire session.
  - Built a new, separate, reproducible Docker-capable agent from
    `jenkins/agent/Dockerfile` (`portfolio-build-agent`, label
    `portfolio-docker`), based on `jenkins/ssh-agent:debian-jdk21`, Node
    22, Docker CLI, Trivy, Playwright chromium pinned to `1.62.1`. Docker
    socket GID-matched (host GID 116) so the non-root `jenkins` user
    reaches `/var/run/docker.sock` without running as root; mounted only
    into this container, never `jenkins-agent-01`.
  - Proved the agent with a read-only diagnostic job
    (`portfolio-docker-diagnostics#1`, SUCCESS) before touching the real
    pipeline — real tool versions confirmed, not assumed.
  - Ten real pipeline runs (`operational-twin-v7-pipeline` #1-#10), each
    hitting and fixing a genuine, different defect - not the same bug
    retried:
    1. Docker build/run tag mismatch (`jenkins-${BUILD_NUMBER}` built vs.
       `${BUILD_NUMBER:-jenkins}` run).
    2. Trivy vulnerability-DB download exceeded its 5-minute default
       timeout on this VM's real (slow, not stalled) network throughput.
    3. Candidate container unreachable - the agent's own `sh` steps run
       inside a separate network namespace from the Docker host; fixed by
       addressing the candidate by its own bridge IP instead of
       `localhost`.
    4. A Declarative Pipeline limitation - a variable declared in the
       top-level `environment{}` block silently ignored later
       `env.X = ...` reassignment; fixed by using a plain Groovy variable
       instead.
    5. `playwright install --with-deps` tried to `su` to root (no root
       access, deliberately) and was unnecessary anyway (deps already
       baked into the agent image).
    6. Two real, deterministic test regressions the first full-suite run
       ever found: `getByRole("button",{name:"Next"})` became ambiguous
       once `IncidentReplay`'s own Next button was added (fixed with
       `exact:true`); a hardcoded 60-Tab-press bound in a keyboard test
       no longer covered the larger V7 homepage (measured: 62 needed,
       raised the bound to 120).
    7. A full host VM reboot mid-build (external, not a pipeline defect) -
       both agent containers auto-restarted cleanly via their own
       `--restart unless-stopped` policy.
    8-9. Isolated, non-deterministic single-test flakes (confirmed via
       repeated local isolation - each passed 2-3/3 tries, unlike the
       real regressions above which failed 100% of the time when
       isolated) - `retries: 2` added to `playwright.config.ts` for
       CI-style runs so a lone blip self-heals within one run instead of
       failing the whole ~25-45 minute pipeline.
    10. Clean run once the accumulated fixes landed together.
  - **Reduced to three profiles** (`RELEASE_FAST`/`FULL_VALIDATION`/
    `EVIDENCE_ONLY`) after the above - the original monolithic
    `FINAL_RELEASE` run was correct but far too slow for a per-commit
    gate. `RELEASE_FAST` uses a curated ~15-test `@release-fast`-tagged
    Playwright subset (verified locally: 15/15 effective passes in 2.5
    minutes). Switched from the deprecated legacy Docker builder to
    buildx (confirmed this CLI hard-requires the plugin for
    `DOCKER_BUILDKIT=1`) - added `docker-buildx-plugin` to the agent
    Dockerfile and rebuilt the image
    (`portfolio-build-agent:buildx-v2`), confirmed working (`docker
    buildx version` → v0.36.1) but **not yet swapped into the running
    container** - deprioritized once GitHub Actions became the active
    hosted platform (see below); the running agent still serves the
    legacy builder until swapped.
  - **Known limitation, stated plainly**: single local VM, real measured
    resource contention throughout (slow package-mirror throughput,
    occasional VM-load test flakiness, one full host reboot mid-build) -
    not a reliable always-on CI target. This is the direct reason GitHub
    Actions now runs the normal V7 workflow instead.
  - **Not shut down** - still running as of this session, not shown as
    "currently operating" beyond what live status reporting in this
    session confirms. No IP, token, SSH key, or credential is recorded in
    this or any other committed file (the `http://192.168.1.38:8080`
    address noted above is the machine's own LAN IP, unreachable from
    outside that network - recorded here only because it appears in this
    doc's own prior text, not as new disclosure).

## Hosted CI/CD (GitHub Actions + Codespaces) - the new active platform

See `docs/OPERATIONAL_TWIN_V7_HOSTED_CICD.md` for full detail. Summary:

- `.devcontainer/devcontainer.json` - reproducible Codespaces dev
  environment (Node 22, Chromium pre-installed). Reviewed for
  correctness, not yet proven by actually creating a Codespace.
- `.github/workflows/v7-fast-ci.yml` - required on every
  `operational-twin-v7` push/PR; two parallel jobs (lint/typecheck/unit/
  build, and the curated `@release-fast` Playwright subset). **Confirmed
  passing** on multiple real runs this session (~1-2 minutes per job on
  GitHub-hosted runners, no VM contention).
- `.github/workflows/v7-full-validation.yml` - manual/nightly, complete
  Playwright suite + Docker Buildx + Trivy fs/image scan + candidate
  container checks, two parallel jobs. Hit a real, documented GitHub
  limitation on first use - `workflow_dispatch` cannot be invoked via
  API/CLI for a workflow that has never fired on that branch (confirmed
  via a direct 404 from the dispatch endpoint) - worked around with a
  temporary `push` trigger for one registration run, then removed once
  `workflow_dispatch` itself was confirmed working. **Confirmed passing**
  against the exact current HEAD via a proper `workflow_dispatch` call
  (commit `605366ab7f9ef600f3205f383e3add2543c0790f`) - all three jobs
  (`setup`, `docker-scan-candidate`, `validate`) succeeded, ~4 minutes
  total wall-clock.
- `.github/workflows/v7-evidence-capture.yml` - manual, candidate-SHA-
  scoped, screenshot/video/soak/inventory only. Not yet run - deliberately
  deferred until the final candidate is chosen, per its own design.
- **Real finding**: every V7 Vercel preview deployment has returned HTTP
  302 to `vercel.com/sso-api` on every route across ~19 consecutive
  `Preview Validation` runs (confirmed with a direct `curl -I`, not
  inferred) - Vercel's own Deployment Protection setting, not an app
  defect. Fix chosen: a Protection Bypass for Automation secret
  (`VERCEL_AUTOMATION_BYPASS_SECRET`), in progress - confirm in the live
  session whether it has been added and wired into the workflows yet.

## Checks actually run (exact results, this session)

- `tsc --noEmit` — clean at every one of 12 commits.
- `eslint` on every new/changed path — clean throughout.
- `vitest run` (full suite) — 66 → 71 → 74 → 84 → 85 → 97 passing as
  batches landed; never a regression in the existing count.
- `next build` (full production build) — run 3 times, always clean after
  fixes; this is the only check that caught the Suspense-boundary
  failure.
- Real browser verification for every batch (not assumed from code) —
  see each phase above for what was specifically checked.
- `tests/e2e/atlas.spec.ts` and `tests/e2e/responsive.spec.ts` (existing
  V6 specs) re-run against this session's changes since they touch shared
  rendering/global CSS — all real failures traced to VM contention via
  isolated reproduction, none were regressions.

**VM contention got significantly worse in the RC-01/mobile-hardening
batches** — health checks up to 221s, one Playwright test failing 4 times
at 4 different random lines in isolation. All confirmed environmental via
control tests (an untouched test failing identically), never assumed. If
this recurs: check `lsof -i :<port>` before assuming a kill worked, prefer
`waitUntil: "domcontentloaded"` over `"load"` for Playwright navigation on
this VM (curl gets 200 in seconds while the `load` event, which waits for
every sub-resource, can hang far longer under contention), and don't
chase a single flaky official test past 2-3 isolated retries if a custom
direct-interaction script has already proven the real behavior works —
reserve full-suite confirmation for the final closure pass on
less-contended infrastructure, per the testing-frequency policy.

## Current blocker

Waiting on the user to generate a Vercel "Protection Bypass for
Automation" secret (Vercel dashboard → Project Settings → Deployment
Protection) and share it, so it can be added as the
`VERCEL_AUTOMATION_BYPASS_SECRET` GitHub Actions secret and wired into
`preview-validate.yml`/the new V7 workflows. Confirm in the live session
whether this has since been resolved before assuming it's still blocking.

## Next three tasks

1. Confirm `V7 Fast CI`'s first real run result (dispatched this
   session by the push that added it) via `gh run list`/`gh run view` -
   this doc was written while that run was still in flight, do not trust
   this text for its result.
2. Once the Vercel bypass secret is in hand: wire it into the preview
   validation path, re-verify a V7 preview passes for real, then trigger
   `V7 Full Validation` once and fix any genuine failures found (rerun
   only the affected checks first, full validation again only if needed).
3. Run `V7 Evidence Capture` for the final validated candidate SHA once
   Fast CI + Full Validation + preview verification have all genuinely
   passed for the same commit - then produce the completion report and
   only then consider a V7 final tag.

## Commands to resume

```bash
cd /home/tarun/v7-work/tarun-portfolio
git status --short
git log --oneline -15
npm run dev   # or: npm run build && npm run start -- -p 3700
npx vitest run
npx tsc --noEmit
```

## Claims that remain unverified

- `V7 Full Validation` and `V7 Evidence Capture` (GitHub Actions): neither
  has actually run yet as of this writing. `V7 Full Validation` could not
  even be dispatched at first — GitHub refuses `workflow_dispatch` API
  calls for a workflow that has never fired on that branch (a documented
  GitHub limitation, confirmed via a direct 404 from the dispatch
  endpoint, not assumed) — worked around with a temporary `push` trigger
  to register it, meant to be removed again once its first real run is
  confirmed. Check the live session for whether that removal happened and
  what the actual run result was; do not trust this text for either.
- Vercel preview validation: blocked on the `VERCEL_AUTOMATION_BYPASS_SECRET`
  the user was asked to generate — confirm in the live session whether
  it's been provided and wired in, and whether a preview has actually been
  re-verified since (the 302-to-SSO-wall finding was real and confirmed;
  the fix was not yet confirmed working as of this writing).
- `V7 Fast CI`'s first run passed cleanly (both jobs, ~1-2 min each) —
  this is real and confirmed, not a claim.
- Vercel CLI deployment via the Jenkins `Deploy to Vercel` stage was never
  exercised (no Jenkins Credentials for it exist) — moot now that GitHub
  Actions is the active platform, but the code path itself remains
  unverified if anyone returns to it.
