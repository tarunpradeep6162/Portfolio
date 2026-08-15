# Portfolio V9 — Implementation Plan

## Direction comparison and selection (summary — full reasoning in `docs/PORTFOLIO_V9_DESIGN_DIRECTIONS.md`)

Three genuinely different execution strategies were compared:

- **A — Full Spatial Mission Control**: one persistent 3D shell every
  pillar routes through. Rejected: conflicts with zero-3D-before-intent,
  raises regression risk on the exact scene lifecycle V8 spent 7 phases
  stabilizing, and is the least mobile/recruiter-safe of the three.
- **B — Guided Mission Control (2D-first, spatial as accent)**:
  **selected**. Mission Control identity carried by structure,
  typography, motion, and navigation; existing 3D systems (Atlas,
  Operational Twin, RC-01) reused unchanged. Reasoning: the actual gap
  found in `docs/PORTFOLIO_V9_DISCOVERY.md` is connective/narrative, not
  a lack of 3D content — this direction spends new effort exactly there,
  at the lowest regression risk and lowest token/testing cost.
- **C — Modular Mission Deck**: a per-pillar widget grid. Rejected
  outright — architecturally reproduces the "collection of unrelated
  dashboards" the task explicitly says V9 must not feel like.

## Reuse / consolidate / remove (summary — full detail in `docs/PORTFOLIO_V9_ARCHITECTURE.md`)

- **Reused unchanged**: `components/v8/ControlRoomScene.tsx`,
  `lib/v8/canvasOwnership.ts`, Atlas/Operational Twin/RC-01, the
  `Field<T>` content model, the Reliability Spine taxonomy.
- **Reused and extended**: `VisitorPath` (`lib/v6/types.ts`) — already
  exists (recruiter/engineer/explorer), already wired into
  `ExperienceProvider`, currently surfaced by exactly one component on
  `/work`. V9's Recruiter Flight Plan and Command Interface are this
  system's payoff, not a new system.
- **New**: Command Interface, Recruiter Flight Plan sequencing, Scenario
  Simulator, Evidence Graph — all additive, all client-side, none
  requiring a new backend or new runtime dependency identified so far.
- **Removed**: nothing. V8 already consolidated the systems that needed
  consolidating; V9's job is to not reintroduce duplication.

## Content gaps requiring user input (full list in `docs/PORTFOLIO_V9_CONTENT_MATRIX.md`)

Résumé PDF; screenshots for the 4 flagship case studies; repo links for
the 8 lab projects; issuer link/credential ID for 8 certifications;
Stackly achievement details; a decision on publishing the Cinematic Web
Experience live URL. None of these block implementation — every new V9
surface renders `needs-input` content as absent, exactly as V8 does
today, until supplied.

## Phases

Reversible, additive-then-subtractive where anything is replaced (same
method V8 used for its scene migrations) — nothing in this plan removes
working V8 behavior before its replacement is proven at a Full Validation
checkpoint.

### Phase 0 — V9 baseline

Adapt `scripts/measure-v8-baseline.mjs` into
`scripts/measure-v9-baseline.mjs` (read-only, same method), confirm it
reproduces the numbers already recorded in
`docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md` at the V9 starting commit
(should be identical to the V8 final tag, since no application code has
changed yet). No component/content changes.
**Gate**: Fast CI only.

### Phase 1 — Global Command Interface (additive)

Build the `Cmd/Ctrl+K` command palette as a new, isolated overlay
component. Reads existing route and project data; dispatches the
existing `VISITOR_PATH_SET` action for recruiter/engineer/explorer
selection. Does not modify any existing page. Keyboard and screen-reader
support built in from the start, not retrofitted.
**Gate**: Fast CI + targeted a11y/keyboard checks. Full Validation at
this phase's RC checkpoint (first one in the V9 sequence, since every
later phase depends on this being solid).

### Phase 2 — Recruiter Flight Plan

Extend the homepage to read `visitorPath === "recruiter"` and present the
4 flagship projects, verified skills, and contact actions as a
compressed, sequenced path. Add the `/?path=recruiter`
query-param-hydration exception noted in the Architecture doc, guarded by
a targeted test. Existing full homepage remains the default,
`visitorPath === null` experience — no content is hidden from a visitor
who doesn't choose a path, per `VisitorPathSelector.tsx`'s existing "never
a wall" contract.
**Gate**: Fast CI. Full Validation at RC checkpoint, plus a manual timed
walkthrough confirming the path is genuinely completable in ~60 seconds.

### Phase 3 — Engineer Investigation connective pass

No new content system — this phase links the *existing* Incident Replay,
Automation Fabric, Proof Ledger, and Project Comparison surfaces into a
coherent "investigation" sequence reachable from the Command Interface
and the `visitorPath === "engineer"` framing. Mostly navigation/UI work.
**Gate**: Fast CI. Full Validation at RC checkpoint.

### Phase 4 — Evidence Graph

New graph/tree visualization (SVG/HTML, not 3D) built from the Content
Matrix's verified/needs-input status. This phase establishes the visual
convention for labeling `needs-input` nodes that Phase 5's Scenario
Simulator then reuses.
**Gate**: Fast CI. Full Validation at RC checkpoint, plus a direct
content audit confirming every rendered node traces to a real
`content/*.ts` field (no fabricated edges) — matching the discipline used
throughout V6–V8.

### Phase 5 — Scenario Simulator

Built last among the new pillars, deliberately, so the "always labeled as
simulation, always linked to a real documented skill/incident" convention
is already established by Phase 4. Client-side scripted sequences only,
tied to real entries in `content/v7/incidents.ts` / `content/spine.ts`.
**Gate**: Fast CI. Full Validation at RC checkpoint, plus a specific
review pass confirming every scenario carries a visible "Simulation"
label in the rendered UI (not only in a doc or tooltip) and that no
scenario claims or implies a live backend connection.

### Phase 6 — Hardening

Mobile/keyboard/screen-reader/reduced-motion/performance/security sweep
across every new V9 surface, using the same method Phase 5/6 of V8 used
(whole-repo grep for known bug classes, fix every instance found, not
just the one that was noticed). Re-verify security headers unchanged.
**Gate**: Full Validation (complete Playwright suite).

### Phase 7 — Final validation and closure

Run validation once, capture V9-specific evidence (adapting
`scripts/capture-v8.mjs` → `scripts/capture-v9.mjs`, and
`scripts/soak-test-v8.mjs` → a V9 equivalent covering the Command
Interface and any new intent-loaded surfaces), inspect every screenshot
directly before claiming any result, run the soak test once, write the
completion report, reconcile with exact Git SHAs and hosted CI results.
No production promotion happens automatically — matching V8's precedent,
that remains an explicit, separate, user-performed step.
**Gate**: Full Validation + Evidence Capture (once).

## Fast CI / Full Validation / Evidence Capture / production gates, defined

- **Fast CI** (`.github/workflows/v9-fast-ci.yml`, to be created at
  Phase 0 by copying `v8-fast-ci.yml` and re-scoping its `on:` triggers
  to `portfolio-v9`): lint, typecheck, unit tests, production build, and
  the curated `@release-fast` Playwright slice. Runs on every push/PR
  against `portfolio-v9`. This is the only CI that runs per-commit.
- **Full Validation**: the complete, unfiltered Playwright suite, run
  locally (matching V8's pattern) at each phase's RC checkpoint — not on
  every commit, per the explicit testing policy in this task.
- **Evidence Capture**: screenshot/video/soak-test evidence, run exactly
  once, at Phase 7 closure — not per phase. Every captured screenshot is
  visually inspected before being cited as passing, per the standard this
  codebase already holds itself to (this is precisely what caught the
  real V8 Phase 7 regression that no automated assertion caught).
- **Production gate**: no tag, no promotion, until Full Validation and
  Evidence Capture both genuinely pass at Phase 7 and the user explicitly
  authorizes closure — mirroring the V8 closure process this exact
  session just completed (tag `unified-control-room-v8-final`, then a
  separate, manual Vercel "Promote to Production" step).

## When one test fails (testing policy, restated for this plan)

Reproduce the specific failing test in isolation first. Only re-run the
complete suite after understanding whether the failure is a genuine
defect or hosted-runner/network flakiness (the same distinction V8 Phase
6 had to make for its Operational Twin context-loss test, which turned
out to be a real timing bug, not a flake — diagnosed by reading the full
failure trace, not by assuming and re-running).

## Rollback instructions

- **Per-phase rollback**: every phase above is additive-then-subtractive;
  nothing existing is removed until its replacement passes that phase's
  Full Validation checkpoint. Reverting a phase is a normal `git revert`
  of that phase's commits — no other phase's work depends on an
  in-progress phase's internals (Command Interface, Recruiter Flight
  Plan, Evidence Graph, and Scenario Simulator are each independently
  removable without breaking the others, since none of them modify
  Atlas/Twin/RC-01/the existing content model).
- **Whole-branch rollback**: `portfolio-v9` can be abandoned entirely at
  any point with zero impact on production — production is promoted from
  a tag (`unified-control-room-v8-final` today), never from a branch
  directly, so there is nothing to undo on the production side.
- **Permanent, protected fallback**: `unified-control-room-v8-final`
  (commit `9459778`) remains the permanent V8 boundary, exactly as
  `operational-twin-v7-final` and `living-infrastructure-v6-final` remain
  untouched boundaries for their respective versions. No V9 phase may
  modify or move this tag.

## Explicitly not done in this preparation task

- No runtime dependencies installed.
- No application source changed.
- No V9 Fast CI workflow file created yet (specified above, created at
  Phase 0 of implementation, not during preparation).
- No V9 implementation begun.
