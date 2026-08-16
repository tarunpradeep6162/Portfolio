# Portfolio V9 — Phase 11: Polyglot Hardening, Full Validation, Completion Report

The closing phase of the polyglot addendum's implementation
(`docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md`, Phases 8–11). Rebuilds and
verifies every language together on the fully-integrated
`portfolio-v9` branch (Phases 8, 9, and 10 all merged), adds the
blocking `Trivy`/`govulncheck` release gate, and reconciles this report
against exact Git SHAs and real measurements - not projected ones.

## 1. Language responsibilities

| Language | Responsibility | Owns | Never touches |
|---|---|---|---|
| **TypeScript** | Primary application language, unchanged | Next.js App Router, React components, accessibility, state, content types, browser integration | — |
| **Rust + WebAssembly** | Deterministic Mission Scenario Engine (`crates/mission-simulator/`) | Calculation for 5 scenario categories + a combined reliability score | Rendering, routing, any DOM |
| **Go** | CI/release audit tool (`tools/portfolio-audit/`) | Route inventory, content evidence manifest, security-header config, Scenario Simulator proof references | The browser - never ships to the client |
| **GLSL** | 2 small material-level shaders (`lib/v9/shaders/`) | Visual refinement of Atlas's node material and Operational Twin's ground plane | Interaction logic, information conveyed, any new canvas |

## 2. Lines/files of authored source by language

Real counts from the repository at closure (`crates/mission-simulator/src/`,
`tools/portfolio-audit/`, `lib/v9/shaders/` - excludes generated/vendored
files: `crates/mission-simulator/pkg/` is wasm-bindgen output, not
authored source):

| Language | Files | Lines |
|---|---:|---:|
| Rust (`crates/mission-simulator/src/*.rs`, 6 calculation modules + `lib.rs`) | 7 | 780 |
| Go (`tools/portfolio-audit/`, 5 source + 5 test files + `main.go`) | 11 | 889 (461 source / 428 test) |
| GLSL (as `.ts` string-export files, `lib/v9/shaders/`) | 2 | 101 |
| TypeScript, polyglot-integration layer (`lib/v9/missionEngine*.ts`, `wasmOwnership.ts`, `DeterministicEnginePanel.tsx`) | 6 | 658 |

Every file above is load-bearing per the responsibilities table - none
were added to shift a language-percentage chart, consistent with the
addendum's explicit instruction.

## 3. What each language materially contributes (demonstrated, not asserted)

- **Rust/WASM**: the Scenario Simulator's "Run the deterministic engine"
  panel computes real, parameter-driven outputs (traffic-spike drop
  rate, deployment diagnosis confidence, latency amplification under
  saturation, credential blast radius, recovery time-to-restore) that a
  purely scripted TS component (Phase 5's original scenarios) could not
  produce - different choices in the same scenario now demonstrably
  produce different numbers, verified directly by
  `tests/e2e/missionEngine.spec.ts`'s "different choices... produce
  different computed results" test.
- **Go**: `tools/portfolio-audit` independently re-derived the exact
  same facts already documented by hand in
  `docs/PORTFOLIO_V9_CONTENT_MATRIX.md` and enforced separately by the
  TypeScript test suite - 4 flagship projects, 1 verified repository
  link, 0 screenshots, 0 broken proof references - from a completely
  independent code path (Go regex/brace-depth scanning vs. TypeScript
  module imports). Two independent implementations agreeing on the same
  real facts is a stronger integrity guarantee than either alone.
- **GLSL**: Atlas's node material now has a genuine fresnel rim term and
  Operational Twin's ground plane now has genuine procedural grid lines
  - both effects `MeshLambertMaterial` cannot produce at all (no
  view-direction term; no procedural pattern without an external
  texture), confirmed by direct visual inspection of the rendered
  output, not just the absence of a console error.

## 4. Rust and Go test results

- **Rust**: `cargo test` (native target) - **29/29 passing**. Every
  category's determinism, boundary behavior, and the specific real-world
  shape each formula is meant to reflect (autoscaling drops fewer
  requests than fixed capacity; isolating a build agent raises diagnosis
  confidence; rollback-first restores faster than a low-confidence
  forward fix; etc.).
- **Go**: `go test ./...` - **all table-driven tests passing**, each
  check covered twice (fixture-based, isolating the parsing logic; and
  against this repository's real content files, confirming the tool
  works on real content, not just fixtures). Fuzzing
  (`FuzzParseProjects`, `FuzzCheckProofReferences`) - ~1.8 million
  executions in 20 seconds locally, zero panics.

## 5. WASM size and loading behavior

- Real measured artifact: **20,094 bytes raw / 8,553 bytes gzip -9
  (~8.4 KB)** - well under the 40 KB gzip ceiling
  `docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md` tightened to at Phase 8.
- Loading behavior, confirmed by Playwright request interception across
  all 6 tracked routes: **zero `.wasm` network requests before a
  visitor explicitly clicks "Run the deterministic engine"** inside the
  Scenario Simulator - never on initial route load, never from merely
  expanding a scenario or selecting a choice.
- Fallback: a pure-TypeScript reference implementation
  (`lib/v9/missionEngineFallback.ts`) verified to produce **identical**
  numeric output to the compiled WASM module for the same inputs
  (confirmed manually with `window.WebAssembly` deleted before
  navigation - both paths returned the same "333%" peak-utilization
  result for the same traffic-spike scenario).

## 6. CI timings

Real measurements from the first hosted GitHub Actions runs (not
projected):

| Workflow | Real duration | Target ceiling |
|---|---:|---:|
| `v9-rust-wasm.yml` (`cargo test` + `wasm-pack build` + functional-equivalence check) | ~1m52s | ≤ 3 min |
| `v9-go-audit.yml` (`go vet`/`build`/`test` + fuzz + `govulncheck` + real repo audit) | ~1m25s | ≤ 2 min |

Both comfortably under budget. `v9-release-gate.yml` (new this phase,
below) has not yet run on a hosted runner as of writing this report -
its first real result is reconciled in the PR this phase opens, not
asserted here in advance.

## 7. Security-scan results

- **`govulncheck ./...`** (Go, run both locally and wired into
  `v9-go-audit.yml`): **"No vulnerabilities found"** against this
  module's actual call graph.
- **`npm audit --omit=dev`**: **0 vulnerabilities**.
- **Trivy** (new this phase, `.github/workflows/v9-release-gate.yml`):
  wired as a blocking filesystem scan (HIGH/CRITICAL severity,
  `exit-code: 1`) across the whole repository's dependency manifests
  (npm, Cargo, Go modules). **Could not be run locally in this
  sandbox** - this session's GitHub access is scoped to
  `tarunpradeep6162/Portfolio` only, and Trivy's install script needs
  unscoped GitHub API access this sandbox's proxy correctly denies.
  This is a real, honestly-stated environmental limitation, not a
  skipped check: Trivy will run for real in CI once this phase's PR is
  pushed, and its actual result needs to be checked there before this
  addendum is considered fully closed (see "Not done in this phase"
  below).

## 8. Why each language was selected (confirmed or revised against what was actually learned)

- **Rust/WASM**: selected in the Discovery addendum because the
  Scenario Simulator's existing content (Phase 5) was real, honest
  narrative but never *calculated* anything - a genuine capability gap,
  not a stylistic one. Confirmed by building it: the engine measurably
  changes what a visitor sees (different choices → different computed
  numbers), which the original scripted content structurally could not
  do.
- **Go**: selected because the same evidence-integrity checks
  (route inventory, evidence manifest, proof references) were already
  being done by hand or in scattered TS assertions - a genuine
  consolidation opportunity into one portable, machine-readable tool.
  Confirmed: the tool's real output matched every existing fact exactly
  on the first real run, which is exactly the independent-verification
  value a second implementation is supposed to provide.
- **GLSL**: selected narrowly - only where a standard Three.js material
  structurally cannot produce the desired effect (fresnel rim lighting;
  procedural grid lines without a texture asset). Confirmed by scoping
  down from 3 candidate systems to 2 once RC-01's actual complexity
  (428 lines, 5 animated material refs, the most heavily-tested
  component in this codebase) made its risk/benefit case for a purely
  decorative addition clearly worse than Atlas/Operational Twin's - a
  real, mid-implementation judgment call, not a plan followed blindly.

## 9. Limitations and maintenance cost (stated honestly)

- **Four languages/toolchains instead of one is a real, ongoing cost.**
  Every future contributor needs Rust + `wasm-pack` + a compatible
  `wasm-opt`, and Go, in addition to Node/npm, to touch the respective
  parts of this codebase. This portfolio's prior versions (V6–V8) never
  required this; it is now a genuine dependency surface that must be
  kept working (toolchain updates, dependency patches, CI runner
  images) indefinitely, not a one-time cost.
- **The Go tool is a regex/brace-depth scanner, not a real parser** -
  documented in `docs/PORTFOLIO_V9_PHASE9_GO_AUDIT_TOOL.md`. It works
  today because the three content files it reads have a narrow, known
  shape; a significant reformat of any of them could silently break its
  extraction without a compile-time signal.
- **The WASM artifact's build is genuinely non-deterministic
  byte-for-byte** (confirmed by a real CI failure this addendum hit and
  fixed at Phase 8 - see `docs/PORTFOLIO_V9_PHASE8_MISSION_SCENARIO_ENGINE.md`).
  The functional-equivalence check that replaced the original byte-hash
  check is the correct fix, but it does mean the committed `pkg/`
  artifact's raw bytes will drift slightly across rebuilds even with
  zero source changes - expected, not a defect, but worth knowing before
  debugging an unexpected `git diff` on that directory.
- **Two of three candidate GLSL attachment points were used, one
  deliberately was not** (RC-01) - if a future contributor wants shader
  parity there, it is new scope with its own regression-risk review, not
  an oversight to "finish."
- **Duplication between the Go tool and existing Node/TS checks has not
  been retired** - both still run. Retiring either is a deliberate future
  decision requiring a proven-equivalence run first, not something this
  phase should have rushed.

## Verification actually performed this phase

- **`npm run lint` / `npm run typecheck` / `npm run build`** - clean, on
  the fully-integrated branch (Phases 8+9+10 all merged).
- **`cargo test`** (native) - 29/29. **`wasm-pack build`** rebuilt;
  functional-equivalence check against the committed artifact - match.
- **`go vet` / `go build` / `go test ./...`** - clean, all passing.
  **`govulncheck ./...`** - no vulnerabilities.
- **Full unit suite** - **144/144** (134 core V9 + 10 mission-engine
  fallback).
- **Full Validation** - the complete Playwright suite, **155/155
  passing, run twice consecutively** to confirm stability (both runs
  clean, no flake).
- **Evidence capture, re-run** (not replaced): `scripts/capture-v9.mjs`
  - all 6 original V9 captures still pass their assertions, **every
  screenshot visually inspected** before citing this result (confirmed
  the "Run the deterministic engine" button now appears inline in the
  Scenario Simulator capture, and confirmed zero horizontal overflow at
  390px with every V9 surface - original and polyglot - open together).
  `scripts/soak-test-v9.mjs` - 15 cycles, zero canvas throughout, no
  listener growth, no console errors.
- **Performance re-measured for real**:
  `docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`'s "Real measured results"
  section - `/` +4.95% over the V8 baseline, `/work` +4.83%, both
  comfortably inside the +15% ceiling; zero canvas before intent still
  holds on all 6 tracked routes.
- **New this phase**: `.github/workflows/v9-release-gate.yml` - a
  not-path-filtered workflow rebuilding and verifying all four languages
  together plus a blocking Trivy scan, on every push to `portfolio-v9`.

## Git and hosted CI reconciliation

- **V9 core** (Phases 0–7): merged as `a1b9773b472f6b67f4f3e9b0005c2b300d02ae4d`,
  promoted to production.
- **Polyglot planning addendum**: merged as `f81873dea6ca93c6195957671ea5ea9eefc01914`.
- **Phase 8** (Rust/WASM): merged as `d81f78650ee104ecd4b90322ed9b1f6fe730fd54`
  (PR #12 - one real CI failure found and fixed mid-PR, documented in
  `docs/PORTFOLIO_V9_PHASE8_MISSION_SCENARIO_ENGINE.md`).
- **Phase 9** (Go): merged as `5bc27e295b7532272f6065d5fb6c2dc1280f1d64`
  (PR #13).
- **Phase 10** (GLSL): merged as `115fa9347d68075d45fcfc1da8eab05aae66f7ff`
  (PR #14).
- **This phase**: committed on top of the above on
  `claude/portfolio-v9-phase11-hardening`, will appear as a new PR into
  `portfolio-v9` once pushed.

## Not done in this phase (explicitly, not silently)

- **`v9-release-gate.yml`'s Trivy job has not yet run for real** - it
  will run for the first time when this phase's PR is opened against
  `portfolio-v9` (that workflow triggers on push to `portfolio-v9`
  directly, so it will actually fire once this PR merges, not on the PR
  itself - a deliberate design choice, documented in the workflow's own
  comments, since this is the "does everything already on main still
  pass" gate, not a per-PR check). Its first real result must be checked
  before considering this addendum's security-scan requirement fully
  closed - noted as a genuine open item, not asserted as passing in
  advance.
- **No production promotion, no V9 final tag touched.** Matches every
  prior closure in this project - a separate, explicit, user-performed
  step.
- **No retirement of any Node/TS check the Go tool overlaps with** -
  unchanged from Phase 9's own stated scope.
