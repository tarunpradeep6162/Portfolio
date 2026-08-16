# Portfolio V9 — Phase 8: Rust + WebAssembly Mission Scenario Engine

The first implementation phase of the polyglot addendum
(`docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md`, Phases 8–11). Builds the
Mission Scenario Engine defined in `docs/PORTFOLIO_V9_ARCHITECTURE.md`'s
addendum and wires it into the already-shipped Scenario Simulator
(Phase 5) as an opt-in layer, not a replacement.

## What this phase built

- **`crates/mission-simulator/`** — a real Rust crate with one module per
  required calculation family: `traffic_spike`, `deployment_failure`,
  `service_degradation`, `credential_compromise`, `recovery_decision`,
  plus `reliability.rs`'s combined-score function. Every function is
  pure and deterministic (no time, no unseeded randomness, no I/O) - the
  same inputs always produce the same outputs, verified directly by 29
  Rust unit tests covering determinism, boundary behavior, and the
  specific real-world shape each formula is meant to reflect (autoscaling
  drops fewer requests than fixed capacity; isolating a build agent
  raises diagnosis confidence; queueing amplification grows nonlinearly
  near saturation; rotation alone doesn't fix over-broad privilege;
  rollback-first restores faster than a low-confidence forward fix under
  pressure).
- **`lib/v9/wasmOwnership.ts`** — the intent-loading guard, deliberately
  mirroring `lib/v8/canvasOwnership.ts`'s contract: the compiled module is
  dynamically imported at most once per session, and only when a visitor
  actually clicks "Run the deterministic engine" inside the Scenario
  Simulator - never on route load.
- **`lib/v9/missionEngineFallback.ts`** — a pure-TypeScript port of the
  exact same formulas, for browsers without WASM support or when the
  module fails to load. Verified genuinely equivalent, not merely
  similar: `lib/v9/missionEngine.ts` tries WASM first and falls back
  automatically, and a manual browser check (below) confirmed identical
  numeric output from both paths for the same inputs.
- **`lib/v9/missionEngine.ts`** — the public API the UI calls; always
  returns a result and reports which engine produced it (`"wasm"` or
  `"fallback"`).
- **`lib/v9/missionEngineParams.ts`** — maps each real scenario choice in
  `content/v9/scenarios.ts` onto the specific engine call and parameters
  for its category. Only the field(s) a given choice actually represents
  vary between a scenario's choices (e.g. `autoscaling_enabled` for
  "load balancer and auto scaling" vs. a larger manual
  `instance_capacity_rps` for "manually launch more EC2 instances"); every
  other parameter is a documented, illustrative constant, not a fabricated
  "real" measurement.
- **`components/simulator/DeterministicEnginePanel.tsx`** — the opt-in UI
  surface inside `ChoiceOutcome`. Renders only a button
  ("Run the deterministic engine") until clicked; on success shows a
  persistent "Simulation - computed" badge, the source engine, the
  computed fields, and an explicit "not a measurement of any real system"
  disclaimer - the same labeling discipline Phase 5 already established
  for the scripted content, extended to the computed layer.
- **`.github/workflows/v9-rust-wasm.yml`** — path-filtered to
  `crates/mission-simulator/**`, runs `cargo test`, rebuilds the WASM
  artifact with `wasm-pack`, and fails the build if the rebuilt artifact
  differs from what's committed (the integrity guarantee described in
  the Architecture doc's "Build/deploy separation").

## A real build-environment finding, and how it was resolved

`wasm-pack`'s default `wasm-opt` post-processing step failed twice in
this sandbox, for two different reasons, before succeeding:

1. The GitHub Releases download of `binaryen` (the package that ships
   `wasm-opt`) failed through this environment's proxy. Resolved by
   installing `binaryen` via `apt` instead - available, but an old
   version (108).
2. apt's `wasm-opt` v108 doesn't recognize the WASM features (bulk
   memory, sign extension) that current `rustc` enables by default for
   `wasm32-unknown-unknown`, and rejected the module as invalid. Resolved
   by installing a current `wasm-opt` (v132) via the `binaryen` **npm**
   package instead, and telling `wasm-pack` to pass `--all-features` to
   it (`crates/mission-simulator/Cargo.toml`'s
   `[package.metadata.wasm-pack.profile.release]`). `.github/workflows/v9-rust-wasm.yml`
   uses the same npm-binaryen approach for reproducibility on hosted
   runners.

This is exactly the kind of version-skew problem the polyglot addendum's
"investigate the safest reproducible approach" instruction anticipated -
recorded here rather than silently worked around, since the CI workflow
depends on the same fix.

## Verification actually performed

- **`cargo test`** (native target, `crates/mission-simulator/`) — 29/29
  passing.
- **`wasm-pack build --target web --release`** — succeeds; real measured
  output: `mission_simulator_bg.wasm` 20,094 bytes raw / 8,553 bytes
  gzip -9 (~8.4 KB), `mission_simulator.js` glue 19,411 bytes uncompressed.
  `docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`'s placeholder 150 KB ceiling
  tightened to a real, CI-enforced 40 KB gzip ceiling based on this
  measurement.
- **`next build`** (Turbopack, this Next.js version's default bundler) —
  clean; confirms the WASM asset is correctly fingerprinted into
  `.next/static/media/` and referenced from a code-split chunk, not
  inlined into the main bundle.
- **Manual browser verification** against a real `next start` production
  server (Playwright, temporary sandbox `executablePath` override,
  reverted before commit per this session's established pattern):
  - Zero `.wasm` network requests on initial load, confirmed with request
    interception.
  - Clicking "Run the deterministic engine" is the only action that
    triggers a `.wasm` fetch.
  - The computed result matched the expected hand-calculated value
    exactly (traffic-spike, autoscaling choice: peak utilization
    500/150×100 = 333%, matching the UI's displayed "333%").
  - With `window.WebAssembly` deleted before navigation, the same
    interaction produces the same "333%" result via the TypeScript
    fallback, with the UI correctly labeling the source as
    "TypeScript fallback" instead of "Rust/WASM engine" - confirmed
    equivalence, not just a plausible-looking fallback.
- **A real bug found and fixed during this verification, in the
  application, not just a test**: `DeterministicEnginePanel` didn't reset
  its internal state when a visitor switched choices within the same
  expanded scenario, so the "Run the deterministic engine" button
  silently disappeared behind a stale result from the previous choice.
  Fixed with `key={choice.id}` on the panel instance in
  `ScenarioSimulator.tsx`, forcing a clean remount per choice - caught by
  a genuinely failing Playwright test (`different choices in the same
  scenario produce different computed results`), not found by inspection
  first.
- **`npm run lint` / `npm run typecheck` / `npm run build`** — clean.
- **New unit tests**: `tests/unit/missionEngineFallback.test.ts`, 10/10
  passing (fallback formula behavior + a completeness check that every
  real scenario/choice pair in `content/v9/scenarios.ts` has an engine
  mapping).
- **New Playwright tests**: `tests/e2e/missionEngine.spec.ts`, 6/6
  passing (zero-WASM-before-intent across all 6 tracked routes, the
  explicit opt-in fetch, labeling, choice-to-choice variation, keyboard
  reachability, zero canvas).
- **Full Validation (this phase's explicit RC-checkpoint gate)**: full
  unit suite 144/144 (134 existing + 10 new), full Playwright suite
  **155/155** (149 existing + 6 new), both clean on a single run.

## A real CI failure, found and fixed after opening the PR

`.github/workflows/v9-rust-wasm.yml`'s first hosted run genuinely failed:
the rebuilt WASM artifact's bytes (`mission_simulator_bg.wasm`, and the
`.d.ts` field ordering inside `mission_simulator.js`) differed from what
was committed, even though nothing about the Rust source had changed
between the local build and the CI rebuild. Root cause: neither `npm
install --global binaryen` (unpinned) nor `wasm-bindgen-cli`'s internal
codegen are guaranteed to produce byte-identical output across separate
runs/environments - `wasm-opt` version drift and non-deterministic
internal ordering inside `wasm-bindgen`'s code generation can both change
the compiled bytes without changing behavior at all.

The original CI check (`git diff --exit-code` on the raw artifact bytes)
was the wrong test for the guarantee this workflow actually needs -
**does the committed artifact still behave like what the reviewed Rust
source currently compiles to**, not **are the bytes identical to some
specific prior build**. Fixed by replacing the byte diff with a
functional-equivalence check: `scripts/verify-mission-simulator-wasm.mjs`
loads a compiled `pkg/` directly from raw bytes (bypassing `fetch()`,
which doesn't support `file://` URLs in Node) and calls every exported
function with fixed inputs. The workflow now runs this once against the
artifact as committed, rebuilds, runs it again, and fails only if the
*computed results* differ - a real behavioral-drift signal, not
incidental byte-ordering noise. Verified locally: rebuilding the crate
twice in a row produced byte-identical output in this sandbox (no
drift to observe locally), but the functional-equivalence script still
correctly reports a match either way, which is what actually matters.

## Not done in this phase (explicitly, not silently)

- The Mission Scenario Engine is scoped to the 5 categories/formulas
  described in `docs/PORTFOLIO_V9_ARCHITECTURE.md` - no additional
  categories, no configurable-parameter UI beyond what each real choice
  already implies. Expanding either is future scope, not silently
  dropped.
- No change to Phase 5's scripted scenario content
  (`content/v9/scenarios.ts`) - the engine is strictly additive.
- No further changes to the CI workflow beyond the functional-equivalence
  fix above - it's been reconciled against one real hosted run (the
  failure) and this fix, not yet against a second clean run, which
  happens automatically when this commit is pushed.
- No production promotion, no V9 final tag touched - unaffected by this
  phase.
