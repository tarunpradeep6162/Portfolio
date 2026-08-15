# Portfolio V8 — Implementation Plan

Direction: **A — "Unified Control Room"** (see
`docs/PORTFOLIO_V8_DISCOVERY.md` for the full comparison and reasoning).
This plan is phased and reversible by design, per your explicit working
rules: every phase lands as its own branch/PR into `portfolio-v8`, gated
by fast CI, with Full Validation reserved for release-candidate
checkpoints and evidence capture run exactly once at final closure. No
phase below is implemented as part of this discovery task — this is the
plan for the work that follows it.

## Ground rules for every phase

- Branch from `portfolio-v8`, PR back into `portfolio-v8` — never into
  `main`/`living-infrastructure-v6` or any other protected historical
  branch.
- Each phase is reversible on its own: additive first (new code beside
  the old), parity-proven, then subtractive (old code removed) as a
  separate, later commit/PR — never a single big-bang replacement of
  Atlas/Twin/RC-01.
- V7 production stays live and untouched throughout. All verification
  happens on Vercel preview deployments for each PR.
- Fast, targeted validation (`lint`/`typecheck`/`test`/`@release-fast`
  e2e subset) on every commit. Full Validation only at the checkpoints
  marked **RC** below. Evidence capture only once, at final closure.
- No runtime dependency is installed or upgraded without a concrete,
  demonstrated need tied to a specific phase below — consistent with this
  discovery task installing none.
- No Kubernetes or other new infrastructure platform — nothing in this
  plan requires one; Vercel + GitHub Actions remains sufficient.

## Phase 0 — V8 baseline and scaffolding

- Create `portfolio-v8` branch from the V7 validated commit
  (`cba06cffeaa80d489e52f269df28a0e0c49281af`).
- Copy `v7-fast-ci.yml`/`v7-full-validation.yml`/`v7-evidence-capture.yml`
  into `v8-*` equivalents (or repoint the existing ones, whichever proves
  cleaner once branch protection rules are checked) — reuse the proven
  three-tier structure, don't redesign it.
- Run the shared-vendor-bundle measurement described in
  `docs/PORTFOLIO_V8_PERFORMANCE_BUDGET.md` once against current
  production, single run (not the "twice, cold context" V6/V7 pattern —
  that was establishing a new methodology's reproducibility; this reuses
  an already-proven one, so one run is sufficient here per the reduced-
  testing working rule). Record the number as the real target for Phase 2.
- **Gate**: fast CI only. No RC checkpoint — this phase produces no
  visible change.

## Phase 1 — Unified scene host, additive

- Design and build `lib/v8/sceneDirector.ts` and a single
  `components/v8/ControlRoomHost.tsx` Canvas host, generalizing the
  quality-tier/WebGL-capability/lifecycle logic currently duplicated
  across `AtlasCanvasHost.tsx`, `OperationalTwinHost.tsx`, and
  `CompanionCanvas.tsx` into one implementation.
- Build it **beside** the existing three systems — nothing is removed
  yet, nothing on any live route changes. Verified only via new unit
  tests and a dedicated, unlisted preview route.
- Extend the reducer (`lib/v6/experienceReducer.ts` or a new
  `lib/v8/controlRoomReducer.ts`, decided during this phase based on
  which keeps `activeScene`'s mutual-exclusion semantics simplest) to
  support the unified host as one more scene kind before anything is
  migrated into it.
- **Gate**: fast CI. No RC checkpoint yet — no user-facing surface exists.

## Phase 2 — Migrate Atlas into the unified host

- Reimplement Atlas's topology-explorer visuals inside
  `ControlRoomHost`, reusing `lib/v6/atlasLayout.ts` and
  `lib/v7/topologyClassifier`/`topologyLayout.ts` unchanged (real,
  content-derived layout logic — no reason to touch it).
  - Prove parity: existing `tests/e2e/atlas.spec.ts` assertions must pass
  against the new implementation before the old `components/atlas/*` is
  touched.
- Swap the route(s) that currently render Atlas over to the unified host,
  behind the same mutual-exclusion invariant, now structural rather than
  convention-based for these two systems.
- Only once parity is proven and merged: remove the now-dead
  `components/atlas/AtlasCanvasHost.tsx`/`AtlasSpatialScene.tsx` in a
  separate, clearly-labeled subtractive commit.
- **Gate**: RC checkpoint — Full Validation once, against this phase's
  preview deployment.

## Phase 3 — Migrate the Operational Twin into the unified host

- Same additive-then-subtractive pattern as Phase 2, this time folding
  `OperationalTwinScene.tsx`'s instrument-deck rendering
  (`InstancedMesh` instruments, `StatusPips`, baseplate, lighting) into
  `ControlRoomHost`.
- Prove parity against `tests/e2e/operationalTwin.spec.ts` before removing
  `components/v7/OperationalTwinHost.tsx`/`OperationalTwinScene.tsx`.
- At the end of this phase, the unified host renders both Atlas-derived
  topology views and Instrument-Deck-derived views as different states of
  the same scene, not two systems.
- **Gate**: RC checkpoint — Full Validation.

## Phase 4 — Fold RC-01 in as console-only (drop its independent canvas)

- Per the discovery doc's Direction A description: RC-01 keeps its voice,
  command console, and tour content, but its 3D portrait
  (`RC01Model.tsx`) either renders inside the shared `ControlRoomHost`
  canvas or is retired in favor of a 2D/SVG portrait — decide based on
  what Phase 1-3 prove about shared-canvas performance headroom (this is
  the one open design decision explicitly deferred to implementation,
  matching your open question #2 in the discovery doc about RC-01's
  scope).
- `CompanionExperience.tsx`/`CompanionConsole.tsx` (state, commands,
  content) are unaffected either way — only the rendering surface changes.
- Prove parity against the full `companion.spec.ts` suite (32 tests)
  before removing `CompanionCanvas.tsx`'s independent Canvas mount.
- **Gate**: RC checkpoint — Full Validation.

## Phase 5 — Homepage narrative recomposition

- With one scene host and the Reliability Spine as its real structural
  backbone (not a section), recompose `app/page.tsx` away from the
  current eleven-block `Container`/`Eyebrow`/heading rhythm identified as
  unresolved since V3/V7. This is the phase that actually closes the V7
  session handoff's outstanding "Phase 7" item.
- Address the specific, named V3 findings still true today as part of
  this recomposition, not as separate follow-up work: the repeated
  section rhythm, the single container/card language used for
  everything, the missing second scale-contrast moment after the hero,
  and the 1920px full-bleed gap.
- Case-study page (`/work/[slug]`) template variation and the 404 page's
  disconnect from the site's visual identity are addressed here too,
  since both depend on the same unified visual language this phase
  establishes.
- **Gate**: RC checkpoint — Full Validation, plus a manual visual pass
  against the preview deployment (screenshots at the same breakpoint set
  V3 used: 320/375/390/768/1024/1440/1920) before sign-off.

## Phase 6 — Mobile composition pass

- Not "make the desktop version not overflow on mobile" (already true),
  but a genuine mobile-first composition pass for the unified control
  room and the recomposed homepage — addressing the audit's finding that
  the site's central visual investment currently degrades to near-
  invisible on mobile-class hardware rather than being deliberately
  redesigned for it.
- Accessibility work folds in here: visible captions/legends for the
  unified scene's diagram-equivalent states (closing the V3-through-V7
  gap on `role="img"`-only diagrams), re-verification of reduced-motion
  behavior against the unified host specifically.
- **Gate**: RC checkpoint — Full Validation, including
  `tests/e2e/responsive.spec.ts` and `accessibility.spec.ts` against the
  unified host's mobile/reduced-motion states.

## Phase 7 — Final closure

- One evidence-capture pass: new `scripts/capture-v8.mjs` +
  `scripts/record-v8-*.mjs`, built the same way `capture-v7.mjs` was —
  each screenshot/video visually verified frame-by-frame before being
  trusted, not just checked for a passing exit code.
- Final completion report (`docs/PORTFOLIO_V8_COMPLETION_REPORT.md`,
  following the V7 report's structure: exact commit SHAs, workflow run
  URLs, test totals, remaining limitations stated plainly).
- No production promotion happens automatically — per your explicit
  rule, promotion requires your separate, explicit authorization, exactly
  as V7's promotion was done manually by you via the Vercel dashboard.

## What is explicitly out of scope for this plan

- Direction C ("Live System" — real GitHub/uptime data feeding the Proof
  Ledger) is not scheduled as a phase. Per the discovery doc's
  recommendation, it's a plausible *later* addition once Phase 1-4
  produce one scene/state model to attach it to, not part of V8's
  execution unless you explicitly ask for it to be added as a Phase 8.
- No new runtime dependencies, no Kubernetes or alternate infrastructure
  platform, no change to the CI platform (GitHub Actions) or hosting
  platform (Vercel).
