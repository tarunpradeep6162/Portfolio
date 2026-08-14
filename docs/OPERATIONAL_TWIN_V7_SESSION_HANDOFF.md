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
- **Working tree**: clean at last commit (`7377658` at the time of writing —
  verify with `git log -1` rather than trusting this number as time passes).
- **V6**: verified closed and untouched throughout.

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

## Not yet started

Phases 5–20 essentially in full: the Operational Twin's real visual
polish, System Trace UI (the reducer/data plumbing exists via
`selectedStageId`/`traceScope`; no dedicated UI component yet), the four
flagship project worlds' distinct topologies, Deployment Replay, Incident
Replay, Automation Fabric, Proof Ledger, project comparison, RC-01's V7
command upgrades, About/résumé/skills/contact refinement, mobile/a11y
hardening pass, and — a substantial addition from the most recent
instruction — the entire Jenkins pipeline (Jenkinsfile, local controller
inspection, parameterized final-release pipeline, real execution against
`http://192.168.1.38:8080`).

## Checks actually run (exact results, this session)

- `tsc --noEmit` — clean at every commit.
- `eslint` on every new/changed directory — clean (one unused-directive
  warning caught and removed, not left in).
- `vitest run` (full suite) — 66 → 71 → 74 passing as each batch of new
  tests landed; never a regression in the existing count.
- `next typegen` — required once per fresh worktree/route change (not a
  full build) to get real `tsc` signal on route files.
- Real browser verification against a `next dev` server on port 3700 (not
  assumed from code): 0 canvas before intent, exactly 1 canvas after
  activating the Operational Twin, instrument click doesn't crash, 0 close
  → 1 reopen canvas count, 0 console/page errors throughout. Reduced
  motion: 0 canvas, fallback SVG present, no activate button rendered.
  Mobile 320px/375px with the Twin active: 0px horizontal overflow.

No full Playwright/Docker/Trivy/screenshot/video/soak run yet — correctly
deferred to the single final closure pass per the testing-frequency policy
in this instruction; nothing above required them.

## Current blocker

None.

## Next three tasks

1. Build the System Trace UI component (`components/v7/SystemTrace.tsx`)
   that makes `selectedStageId`/`activeProject`/`traceScope` visibly
   synchronize across the Twin, Atlas, Time Machine, and (once built)
   Proof Ledger — the spec's signature interaction, currently only wired
   at the state level, not yet visible/operable as its own control.
2. Give each of the four flagship project worlds distinct topology
   (`app/work/[slug]/page.tsx` currently reuses Atlas's generic node/edge
   layout for all four) — start with Project Aurora since it's the only
   project with a real repository link to ground the "evidence" surfaces
   against.
3. Begin the Jenkins pipeline: inspect the existing controller at
   `http://192.168.1.38:8080` (plugins, agent `jenkins-agent-01` status,
   Docker access) before writing anything, per the explicit "inspect
   before changing" requirement — this has not been started yet.

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
