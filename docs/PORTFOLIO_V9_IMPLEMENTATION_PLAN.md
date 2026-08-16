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

## Addendum — Phases 8–11: mandatory polyglot language architecture

**Status.** Phases 0–7 above are complete and shipped — merged into
`portfolio-v9` as `a1b9773b472f6b67f4f3e9b0005c2b300d02ae4d`, promoted to
production. Everything below is new, separately-authorized scope building
the mandatory Rust/Go/GLSL architecture defined in this addendum's
companion sections in `docs/PORTFOLIO_V9_DISCOVERY.md`,
`docs/PORTFOLIO_V9_ARCHITECTURE.md`, and
`docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`. This section is **planning
only** — no Rust, Go, or GLSL source lands until all four documents are
updated (this pass, now complete) and reviewed.

### Phase 8 — Rust + WebAssembly: Mission Scenario Engine

- New crate `crates/mission-simulator/`: one module per required
  calculation family (traffic spikes, deployment failures, service
  degradation, credential compromise, recovery decisions), plus a
  reliability-scoring function reporting against the existing Reliability
  Spine taxonomy (`content/spine.ts`).
- Compiled via `wasm-pack build --target web`; committed `pkg/` output
  alongside the authoritative Rust source (Architecture doc's "Build/
  deploy separation").
- New `lib/v9/wasmOwnership.ts` intent-loading guard, mirroring
  `lib/v8/canvasOwnership.ts`'s contract for a WASM module instead of a
  Canvas — dynamically `import()`-ed only when a visitor opts into the
  deterministic engine from inside the existing Scenario Simulator, never
  on route load.
- New `lib/v9/missionEngineFallback.ts`: a pure-TypeScript reference
  implementation producing equivalent results for no-WASM/reduced-data
  cases.
- Rust unit tests covering deterministic outputs (identical inputs
  produce identical outputs; any randomness is explicitly seeded and
  tested as such).
- New Playwright coverage: zero `.wasm` network requests before the
  opt-in control is used, on every tracked route — extends the existing
  zero-canvas-before-intent test pattern to the WASM modality.
- Real compressed WASM size measured against the placeholder budget in
  `docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`; the budget is tightened to
  the real number once known, not left as unused slack.
**Gate**: Fast CI (path-filtered Rust job). Full Validation at this
phase's RC checkpoint, including the rebuilt-vs-committed-artifact hash
check.

### Phase 9 — Go: portfolio-audit CI tool

- New module `tools/portfolio-audit/` (own `go.mod`, standard library
  preferred): route-inventory validation, content/evidence manifest
  inspection, security-header verification, broken/missing proof
  reference detection, screenshot/video artifact-count reconciliation.
- Table-driven tests for every validator; targeted fuzz tests on the
  content/manifest parsing paths.
- Outputs machine-readable JSON (CI gating) and human-readable Markdown
  (job summary) from one run.
- `govulncheck` wired into the security workflow for this module.
- Runs alongside every Node/TS check it overlaps with (Architecture doc's
  duplication table) for at least one full Full Validation cycle; outputs
  are diffed and shown equivalent before any specific Node duplicate is
  retired, and that retirement is an explicit decision made at this
  phase's RC checkpoint, never silent and never assumed.
**Gate**: Fast CI (path-filtered Go job) + `govulncheck`. Full Validation
at RC checkpoint, including the Node/Go output-equivalence diff.

### Phase 10 — GLSL: reviewed shader pass on existing 3D systems

- Small, targeted vertex/fragment shaders applied as material
  enhancements to Atlas, Operational Twin, and RC-01 — no new canvas, no
  new `SceneKind`, no new intent-loading surface (reuses the existing
  one).
- Each shader ships with a documented rationale (why the system's current
  standard Three.js material can't achieve the selected Direction B art
  direction there) and a verified fallback to that standard material
  under reduced motion, low-power conditions, and WebGL failure.
- Re-runs the exact reduced-motion/no-WebGL Playwright coverage each of
  these three systems already has, extended to also cover the shader
  path. This phase touches already-stable, already-hardened V8 code, so
  it gets the same scrutiny V8 Phase 6 gave those systems the first time
  — this is the highest-regression-risk phase of the addendum precisely
  because it's the only one modifying existing, shipped rendering code
  rather than adding an isolated new module.
**Gate**: Fast CI. Full Validation at RC checkpoint, including full
reduced-motion/no-WebGL parity re-verification on all three systems.

### Phase 11 — Polyglot hardening, final validation, and completion report

- Full Validation rebuilds and verifies all language outputs together:
  `cargo build --release && cargo test`, `wasm-pack build` (with the
  Phase 8 hash-integrity check), `go build ./... && go test ./... && go
  vet ./...`, `govulncheck`, and Trivy — all blocking at this final
  release gate, matching the explicit instruction that these stay
  blocking regardless of how lenient per-commit Fast CI is.
- CI timing re-measured for real against the Performance Budget
  addendum's target ceilings; budgets revised to match reality if the
  real numbers differ.
- Evidence capture extended, not replaced: `scripts/capture-v9.mjs` /
  `scripts/soak-test-v9.mjs` re-run to confirm zero regression in the
  already-shipped Phases 0–7 pillars, plus new evidence specific to this
  addendum — WASM load-on-intent proof, the Go tool's own JSON/Markdown
  output as a CI artifact, and before/after screenshots of any
  GLSL-enhanced system.
- **Completion report requirements** (restated here so they aren't lost
  between now and Phase 11): language responsibilities; real lines/files
  of authored source per language; what each language materially
  contributes, demonstrated rather than asserted; Rust and Go test
  results; real WASM size and loading behavior; real CI timings;
  security-scan results (Trivy, `govulncheck`, and the existing npm-audit
  equivalent); why each language was selected, confirmed or revised
  against what was actually learned building it; limitations and
  maintenance cost — the honest ongoing cost of four languages/toolchains
  instead of one, not glossed over.
- No production promotion happens automatically at this phase either —
  same explicit, separate, user-performed step as every prior closure in
  this project.
**Gate**: Full Validation + Evidence Capture (once) + the blocking
Trivy/`govulncheck` release gate.

### CI wiring for the new languages

- New path-filtered triggers so Rust checks run only when
  `crates/mission-simulator/**` changes and Go checks run only when
  `tools/portfolio-audit/**` changes — a normal TypeScript-only commit
  pays for neither toolchain, matching the explicit instruction.
- Cargo, Go module, and npm dependency caches are keyed and restored
  independently (`actions/cache`, separate keys per `Cargo.lock`,
  `go.sum`, `package-lock.json`), so a change in one language's
  dependencies never invalidates another's cache.
- Full Validation / the final release-gate workflow always rebuilds and
  verifies all four languages together regardless of path filters, since
  that gate exists precisely to catch what per-commit path-filtering is
  designed to skip day-to-day.

### Explicit non-goals for this addendum

- No always-on backend, database, Kubernetes cluster, VPS, or paid
  service introduced for any of this. The Rust/WASM engine is a static
  asset loaded client-side; the Go tool is a CI-only binary; GLSL shaders
  run on the GPU inside an already-existing intent-loaded Canvas. Nothing
  here adds a server.
- No artificial GitHub language-percentage targeting. Every file added
  must trace to one of the responsibilities in the Architecture doc's
  addendum; this plan sets no line-count or percentage target.
- Zero-3D-before-intent and the one-canvas invariant, both already
  established by V8 and preserved through Phases 0–7, extend unchanged
  through Phases 8–10 — GLSL shaders attach to existing intent-loaded
  systems, they do not create a new one.

### Rollback (extended)

- Phases 8–10 are each independently revertable, same contract as Phases
  0–7: a `git revert` of a phase's commits removes that language's
  surface without breaking the others, since the Rust engine, Go tool,
  and GLSL shaders don't depend on each other.
- If the Rust/WASM artifact-hash integrity check ever fails in CI
  (rebuilt hash ≠ committed hash), the correct response is to fail the
  build, not to silently trust either version — the committed artifact is
  never authoritative over what the reviewed source actually compiles to.

### Explicitly not done in this addendum's preparation pass

- No Rust, Go, or GLSL source added.
- No `crates/mission-simulator/` or `tools/portfolio-audit/` directories
  created.
- No CI workflow changes made.
- No runtime or toolchain dependencies installed.
- Phase 8 implementation begins only after this updated plan is reviewed,
  matching the explicit instruction governing this addendum.
