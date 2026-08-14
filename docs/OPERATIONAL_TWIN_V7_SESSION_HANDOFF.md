# Operational Twin V7 — Session Handoff

## Current state

- **Worktree**: `/home/tarun/v7-work/tarun-portfolio`
- **Branch**: `operational-twin-v7`
- **Parent**: `living-infrastructure-v6-final` (commit
  `669a0a891e4970a9bfc20a38564eca67ca9a00e9`) — confirmed ancestor via
  `git merge-base --is-ancestor`
- **HEAD**: see `git log -1 --format=%H` for the exact value; not hardcoded
  here (self-referential — same reasoning V6's completion report applied to
  its own final-HEAD wording).
- **Working tree**: clean at last commit (`e7aefdf` at the time of writing —
  verify with `git log -1` rather than trusting this number as time passes).
- **V6**: verified closed and untouched throughout.
- **Pushed to origin**: yes, tracking branch set up. Verify with
  `git rev-parse HEAD origin/operational-twin-v7` before assuming sync.

## Completed phases

- **Phase 0 (V6 baseline)**: done. Reproducible production baseline
  measured twice — `docs/OPERATIONAL_TWIN_V7_PERFORMANCE_BUDGET.md`.
- **Phase 1 (discovery + design direction)**: done. Reusable-system
  inventory and content-gap audit —
  `docs/OPERATIONAL_TWIN_V7_DISCOVERY.md`. Three original directions
  written, compared against the reject-list, "Instrument Deck" selected
  with reasoning — `docs/OPERATIONAL_TWIN_V7_DESIGN_DIRECTION.md`. Three
  new color tokens added to `app/globals.css`, each contrast-checked with
  the real WCAG formula (not eyeballed).
- **Phase 2 (architecture)**: done. `lib/v6/experienceReducer.ts`/`types.ts`
  extended with `qualityTier`/`webglCapability`/`traceScope` and a new
  `"operational-twin"` `SceneKind` member — verified backward-compatible
  (typecheck clean, unit suite same-count-plus-new passing), not just
  type-compatible. Caught and fixed a real duplication in the same pass
  (a second `QualityTier` type that should have reused
  `lib/companion/state.ts`'s existing one) —
  `docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md`.
- **Phase 3 (Scene Director) + Phase 4 (SSR hero/intent loader), first
  pass**: done and verified working in a real browser, not just
  typechecked. `lib/v7/sceneDirector.ts` (`decideSceneMount`, 5 unit
  tests), `lib/v7/spineInstruments.ts` (real per-stage project counts, 3
  unit tests), and the full Operational Twin activation lifecycle
  (`components/v7/OperationalTwinHost.tsx`,
  `OperationalTwinScene.tsx`, `OperationalTwinFallback.tsx`) wired into
  the existing hero. **What "first pass" means precisely**: the
  activation/lifecycle/one-canvas/fallback machinery is real and correct
  (mirrors Atlas's proven, regression-tested shape); the 3D scene's actual
  visual content is a working but minimal instanced-box deck, not yet the
  fully art-directed Instrument Deck the design-direction doc describes
  (large legible individual instruments with real material/lighting
  polish). That polish is explicitly Phase 16 (performance/visual
  engineering) in the spec's own ordering, not skipped — just not done
  yet.

- **Phase 6 (System Trace)**: done. `components/v7/SystemTrace.tsx` - real
  cross-surface sync verified in-browser, not assumed: selecting a stage
  updates the URL (`?stage=`), highlights the matching `ReliabilitySpine`
  node, and correctly dims/highlights `ProjectCard`s by whether they
  demonstrate that stage (3 demonstrating / 1 dimmed for "build",
  matching real content exactly). Caught and fixed a real production
  build failure (`useSearchParams()` needs a `Suspense` boundary) by
  actually running `next build`, not just typecheck/lint - a lint-clean
  component can still fail a real build.
- **Phase 8 (four project-world topologies)**: done.
  `lib/v7/topologyClassifier.ts` + `lib/v7/topologyLayout.ts` - all four
  real flagship projects classify into four different topology shapes
  (linear/agent-branch/service-fork/perimeter) from structural cues
  already in their real flow text, feeding the one shared layout function
  both `AtlasDiagram.tsx` (2D) and `AtlasSpatialScene.tsx` (3D) already
  called. Found and fixed two real bugs by actually looking at rendered
  output, not trusting the math: a stale leftover server process serving
  pre-fix code (killed by exact PID via `lsof -i`), and a genuine x-axis
  line-crossover in the service-fork layout (now has a regression test).

## Not yet started

Phases 5, 7, 9-20 in large part: the Operational Twin's real visual
polish (still a working-but-minimal instanced-box deck, not the fully
art-directed Instrument Deck), full homepage narrative recomposition
around the Twin (Phase 7), Deployment Replay, Incident Replay, Automation
Fabric, Proof Ledger, project comparison, RC-01's V7 command upgrades,
About/résumé/skills/contact refinement, mobile/a11y hardening pass, and —
a substantial addition from the most recent instruction — the entire
Jenkins pipeline (Jenkinsfile, local controller inspection, parameterized
final-release pipeline, real execution). Confirmed this session: the
Jenkins controller (`http://192.168.1.38:8080`) and an agent
(`jenkins-agent-01`) are genuinely running on this same VM (`192.168.1.38`
is this machine's own LAN IP) - not yet inspected further.

## Checks actually run (exact results, this session)

- `tsc --noEmit` — clean at every commit.
- `eslint` on every new/changed directory — clean (one unused-directive
  warning caught and removed, not left in).
- `vitest run` (full suite) — 66 → 71 → 74 → 84 → 85 passing as each batch
  of new tests landed; never a regression in the existing count (two
  mid-session failures both reproduced clean in isolation and traced to
  VM load contention, not real regressions — see below).
- `next typegen` — required once per fresh worktree/route change (not a
  full build) to get real `tsc` signal on route files.
- `next build` (full production build) — run twice this session, both
  clean. Worth knowing: this is the only check that caught the
  `useSearchParams()` Suspense-boundary failure; `tsc`/`eslint`/`next dev`
  all stayed silent about it.
- Real browser verification against local servers (not assumed from
  code): Operational Twin activation lifecycle, System Trace cross-surface
  sync (URL, ReliabilitySpine, ProjectCard), and all four topology
  screenshots individually inspected, not just measured.
- `tests/e2e/atlas.spec.ts` (13 tests, existing V6 spec) run twice against
  this session's changes since they touch shared Atlas rendering code —
  13/13 both times.

**Process hygiene lesson, worth repeating for whoever resumes this**: a
`kill <pid>` or `pkill` that returns a non-zero/144 exit code does **not**
mean the process died — this session lost real time to a stale `next
start` process left listening on port 3700 from an earlier check, serving
pre-fix code to every subsequent verification for several tool calls
before `lsof -i :3700` surfaced the actual PID and a `kill -9` on that
exact PID fixed it. Always verify with `lsof -i :<port>` (or equivalent)
after killing a dev/preview server, never assume the kill command's exit
code tells you the port is free.

No full Playwright/Docker/Trivy/screenshot/video/soak run yet — correctly
deferred to the single final closure pass per the testing-frequency policy
in this instruction; nothing above required them.

## Current blocker

None.

## Next three tasks

1. Deployment Replay (`components/v7/DeploymentReplay.tsx` per the spec's
   suggested structure): deterministic stage replay with
   previous/play-pause/next/restart/select controls, clearly labelled as
   simulated/replayed state, not a live deployment claim.
2. Incident Replay: audit real documented V6/V7 incidents worth using
   (the Atlas close/reopen regression and the System Trace Suspense-
   boundary build failure from this session are both real, documented,
   verified candidates) before writing the component - only use
   incidents that actually happened, per the "select only after auditing
   source documents" instruction.
3. Begin the Jenkins pipeline once the above (or enough of Phases 9-15)
   land: inspect the existing controller at `http://192.168.1.38:8080`
   (plugins, agent `jenkins-agent-01` status, Docker access) before
   writing anything, per the explicit "inspect before changing"
   requirement — confirmed running on this same VM this session, not yet
   inspected further.

## Commands to resume

```bash
cd /home/tarun/v7-work/tarun-portfolio
git status --short
git log --oneline -8
npm run dev   # or: npm run build && npm run start -- -p 3700
npx vitest run
npx tsc --noEmit
```

## Claims that remain unverified

- Whether the current V7-specific chunk/asset budget is within the
  targets in the performance-budget doc is not yet measured — only V6's
  baseline has been measured so far. Measure V7 routes with the same
  `measure-v6-baseline.mjs` methodology once there's enough V7 content to
  be worth measuring (not after every small change, per policy).
- `resumeFile` / Secure AWS disclosure checks from Phase 1 are current as
  of that check; re-verify if much time has passed.
- Jenkins controller health/plugins/agent status: entirely unverified —
  next session's first Jenkins task, not assumed from the user's
  description of it.
