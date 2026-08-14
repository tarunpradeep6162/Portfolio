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

- **Phase 16 (visual art-direction pass)**: the Operational Twin's actual
  materials/lighting/composition/camera work — current state is
  functionally complete and correct but visually minimal, not the
  "Instrument Deck" the design-direction doc describes. Must preserve the
  already-proven lifecycle (one-canvas invariant, 0 canvas before intent)
  while improving this — per this session's explicit instruction.
- **Phase 7 (full homepage narrative recomposition)**: sections were added
  incrementally around the existing V6 homepage structure, not yet
  recomposed as one deliberate narrative arc.
- **The Jenkins pipeline** (mandatory, cannot close through structural
  review alone): confirmed this session that the controller
  (`http://192.168.1.38:8080`) and an agent (`jenkins-agent-01`) are
  genuinely running on this same VM — `192.168.1.38` is this machine's own
  LAN IP. Not yet inspected. Must inspect before changing anything
  (plugins, agent status, Docker access), never reinstall if healthy, and
  the real pipeline execution is what closes this — structural review of
  a Jenkinsfile alone does not satisfy the requirement.
- About/résumé/skills/contact page refinement (Phase 14) not started.

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

None.

## Next three tasks

1. Visual art-direction pass on the Operational Twin scene
   (`components/v7/OperationalTwinScene.tsx`): real materials/lighting/
   camera work per `docs/OPERATIONAL_TWIN_V7_DESIGN_DIRECTION.md`'s
   "Instrument Deck" direction, without touching the proven lifecycle
   (`OperationalTwinHost.tsx`) or the one-canvas invariant.
2. Jenkins: inspect the real local controller
   (`http://192.168.1.38:8080`) — plugins, agent `jenkins-agent-01`
   status, Docker access — before writing a Jenkinsfile or changing
   anything. Do not reinstall if healthy.
3. Once inspected: write/update the Jenkinsfile on this branch only (never
   touching V6), with `FINAL_RELEASE`/`DEPLOY_TO_VERCEL`/
   `RUN_EVIDENCE_CAPTURE` parameters exactly as specified, then dispatch a
   real `FINAL_RELEASE=true DEPLOY_TO_VERCEL=false` run and monitor it -
   structural review alone does not close this requirement.

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

- V7-specific chunk/asset budget vs. the targets in the performance-budget
  doc — not yet measured (only V6's baseline has been measured). Worth
  doing once the visual art-direction pass adds real geometry/material
  weight to the Twin scene, not before.
- Jenkins controller health/plugins/agent status — entirely unverified,
  next session's first Jenkins task.
- The full official `tests/e2e/*.spec.ts` suite has not been run
  end-to-end this session (by design, per the testing-frequency policy) -
  only targeted specs directly relevant to each batch's changes. The
  single comprehensive run belongs to the final closure pass.
