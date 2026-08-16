# Portfolio V9 — Architecture

Direction B (Guided Mission Control, 2D-first) selected in
`docs/PORTFOLIO_V9_DESIGN_DIRECTIONS.md`. This document maps every V9
pillar to what already exists, what extends, and what's genuinely new —
verified against the actual codebase at the V8 final tag, not assumed.

## Reused unchanged (no source changes)

- **`components/v8/ControlRoomScene.tsx` + `lib/v8/canvasOwnership.ts`**
  — the shared Canvas lifecycle. V9 adds zero new permanently-mounted 3D
  content (Direction B), so this host's contract (intent-loaded, one
  scene at a time, `markClosing()` on close) does not need to change. Any
  optional 3D enhancement V9 does add (e.g. an Evidence Graph "explore in
  3D" toggle) must be a fourth `SceneKind`, following the exact
  Atlas/Operational Twin/RC-01 pattern — its own dynamic-import wrapper,
  its own content component, no second Canvas host.
- **Atlas, Operational Twin, RC-01** — all three stay exactly as V8 left
  them. Not touched, not re-themed, not migrated again.
- **`content/*.ts` + `Field<T>` model** — the evidence-honesty substrate
  every new pillar must read from, never bypass.
- **`lib/v7/spineInstruments.ts` / `content/spine.ts`** (Reliability
  Spine, 8 stages) — already the taxonomy every project and incident maps
  against. Evidence Graph reuses this schema rather than inventing a
  parallel one.

## Reused and extended — the biggest finding of this discovery pass

**`VisitorPath` (`lib/v6/types.ts`) already exists**: `"recruiter" |
"engineer" | "explorer" | null`, wired into `ExperienceProvider`'s
reducer, persisted to `localStorage`, dispatched via
`VISITOR_PATH_SET`. Today it's surfaced by exactly one component,
`components/work/VisitorPathSelector.tsx`, and only narrows
framing/pacing on the `/work` index — it has no homepage presence, no
time budget, and nothing reads it outside that one page.

This means V9's Recruiter Flight Plan / Engineer Investigation / Explorer
pillars are **not a new system** — they are the payoff of a system V6
already built and V7/V8 never finished wiring up. V9's job is:

1. Surface `visitorPath` selection earlier (homepage entry, not buried in
   `/work`) — ties directly into the Command Interface (below).
2. Make more surfaces actually *read* `visitorPath` and change what they
   show/how they pace, not just `/work`'s framing text swap. The
   Recruiter path in particular needs an actual fast-path sequence (the
   4 flagship projects, in order, with a visible/implicit time budget),
   not just different copy on the same full page.
3. Everything stays optional and non-gating, exactly as
   `VisitorPathSelector.tsx`'s own doc comment states today — V9 must not
   turn this into a forced onboarding flow.

## New in V9

- **Global Command Interface** (new: e.g. `components/command/CommandPalette.tsx`).
  A `Cmd/Ctrl+K`-invoked, keyboard-first, screen-reader-tested overlay.
  Responsibilities: route search, project search, and setting
  `visitorPath` (replacing/augmenting `VisitorPathSelector` as the primary
  entry point, which can remain on `/work` as a secondary control).
  Client-side only, indexes existing route/content data — no new content
  model, no backend.
- **Recruiter Flight Plan** (new: likely a homepage state/section rather
  than a separate route, to avoid content duplication — see "Routing"
  below). Reads `visitorPath === "recruiter"`, sequences the 4 verified
  flagship projects, verified skills, and the existing contact actions
  into a compressed, time-boxed presentation.
- **Scenario Simulator** (new: `components/simulator/`). Entirely
  client-side, scripted/replayed sequences — traffic spike, deployment
  failure, credential compromise, DB latency, recovery decision — each
  one explicitly labeled "Simulation" in the UI (not just in a tooltip)
  and each one linked to a real, existing incident or spine stage from
  `content/v7/incidents.ts` / `content/spine.ts`. No network calls to any
  external or internal "live" system — this is the pillar most likely to
  accidentally violate "never fake live infrastructure" if built
  carelessly, so it is sequenced *after* the evidence-labeling
  conventions are established by the Evidence Graph (see Implementation
  Plan phase order).
- **Evidence Graph** (new: `components/evidence/`). A graph/tree
  visualization — SVG or styled HTML/CSS, not a new 3D scene, per
  Direction B — of project → commit/repo → CI → screenshot → deployment,
  built directly from the Content Matrix's verified/needs-input status.
  Nodes without real data render as `needs-input`, styled distinctly
  (already an established visual pattern in this codebase, e.g. the
  résumé "Request résumé" treatment), never omitted silently and never
  synthesized.

## Removed / consolidated

Nothing needs removing. V8 already did the consolidation work (three
Canvas lifecycles → one host, four homepage sections → one narrative).
V9 is additive on top of a system that's already been de-duplicated once;
introducing new duplication (e.g. a second visitor-path-like concept, a
second Canvas host, a second incident data source) is the failure mode to
actively guard against in review, not a redesign to plan for.

## Routing structure

Recommendation: **modes on existing routes, not parallel route trees.**

- `visitorPath` continues to live in shared client state
  (`ExperienceProvider`), not the URL path, for the same reason V6 chose
  that originally — Recruiter/Engineer/Explorer are lenses on the same
  content, not different content. A `/recruiter` route that duplicates
  homepage content would violate "one coherent portfolio... not a
  collection of unrelated dashboards" from the other direction (content
  fork instead of system fork).
- Exception worth testing in Phase 2 of implementation: a shareable,
  bookmarkable URL variant (e.g. `/?path=recruiter`) that hydrates
  `visitorPath` from a query param on load — gives recruiters a directly
  shareable link without creating a second copy of the content.
- Evidence Graph and Scenario Simulator are new **sections**, reached via
  the Command Interface and normal in-page navigation, not new top-level
  routes that duplicate `/work`'s project index.

## What this means for implementation risk

Because the highest-value new pillars (Command Interface, Recruiter
Flight Plan) are built on an existing, already-tested reducer field
(`visitorPath`) rather than a new one, V9's Phase 1–2 risk is
substantially lower than a from-scratch build would be — the state
management and persistence layer is proven; the work is UI, sequencing,
and a11y, all of which take targeted Playwright coverage rather than a
new architecture to validate.

## Addendum — polyglot architecture

Everything above describes the shipped Phases 0–7 (Direction B, unchanged
by this addendum). This section maps the newly-mandatory Rust, Go, and
GLSL responsibilities onto that same, already-stable system, using the
same rule the rest of this document follows: reuse what exists, extend
only where there's a real gap, never build a second copy of something
that already works.

### Language responsibility boundary

- **TypeScript** — unchanged as the primary application language. Next.js
  App Router, React components, accessibility, state management, content
  types, and browser integration all stay exactly where they are today.
- **Rust + WebAssembly** — `crates/mission-simulator/`, a new, isolated
  deterministic engine (below). Owns calculation, owns nothing about
  rendering or routing.
- **Go** — `tools/portfolio-audit/`, a new, isolated CI binary (below).
  Owns validation and reporting, never runs in the browser, never touches
  the Next.js build graph.
- **GLSL** — small shader programs attached to material slots inside the
  three *existing* Three.js systems (below). Owns visual refinement only;
  removing a shader must never remove information or functionality.

### Mission Scenario Engine (Rust/WASM) — how it attaches to the shipped Scenario Simulator

The already-shipped `ScenarioSimulator.tsx` (Phase 5) and its 5 scripted
scenarios in `content/v9/scenarios.ts` are not replaced or rewritten by
this engine — they remain the honest, narrative, always-available default.
The engine is an **additional, opt-in layer** inside that same UI: a
disclosure (e.g. "Run the deterministic engine") that, only once actually
opened, dynamically `import()`s the compiled WASM module and lets the
visitor adjust real parameters (load level, node count, latency budget,
credential-compromise blast radius, etc.) and see a computed — not
scripted — state transition and reliability score.

- **Crate layout**: `crates/mission-simulator/`, one module per required
  calculation family — traffic spikes, deployment failures, service
  degradation, credential compromise, recovery decisions — plus a
  reliability-scoring function that reports against the existing
  Reliability Spine taxonomy (`content/spine.ts`) rather than inventing a
  parallel scoring system. Every function is a pure, deterministic
  computation: same inputs always produce the same outputs. Any
  randomness the simulation needs (e.g. a stochastic traffic-spike model)
  must use an explicit, visible seed so results stay reproducible and
  testable — never wall-clock or unseeded entropy.
- **Compilation**: `wasm-pack build --target web`, producing the
  browser-loadable glue + `.wasm` binary.
- **Intent-loading**: new `lib/v9/wasmOwnership.ts`, deliberately mirroring
  `lib/v8/canvasOwnership.ts`'s contract — tracks whether the module has
  been requested, ensures it is fetched at most once per session, and
  guarantees it is never imported on initial route load, matching
  "zero WASM bytes before intent" in the Performance Budget addendum.
- **Fallback**: `lib/v9/missionEngineFallback.ts`, a pure-TypeScript
  reference implementation producing equivalent results for browsers
  without WASM support or with a reduced-data preference — the
  deterministic engine is an enhancement to the Scenario Simulator, never
  a hard dependency of it.
- **Honesty constraint carried over unchanged from Phase 5**: whatever the
  engine computes must be visibly labeled as a simulation in the rendered
  UI, using the same "Simulation" badge convention Phase 5 already
  established — the engine makes the simulation *more real as a skill
  demonstration*, it must never make the UI look more like live
  infrastructure.

### Go audit tool — architecture and duplication-retirement plan

`tools/portfolio-audit/` is a standalone Go module (its own `go.mod`) that
never touches the Next.js build graph and never ships to the browser. It
runs only in GitHub Actions and, optionally, locally.

Responsibilities, mapped to what they are expected to eventually replace:

| Go tool responsibility | Existing overlapping check |
|---|---|
| Validate the route inventory | `lib/v9/commandIndex.ts`'s real-routes list; the routing assertions already scattered across `tests/e2e/*.spec.ts` |
| Inspect content/evidence manifests | `tests/unit/evidenceGraph.test.ts`, `tests/unit/scenarios.test.ts`, and similar content-integrity assertions |
| Verify security-header expectations | The `curl -I` + Playwright response-header check described in `docs/PORTFOLIO_V9_PHASE6_HARDENING.md` |
| Detect broken/missing proof references | The `Field<T>` `needs-input` scanning already done ad hoc per component |
| Reconcile screenshot/video artifact counts | `scripts/capture-v9.mjs`'s manual per-capture assertion count |

**Retirement is a decision, not an assumption.** The Go tool lands
alongside every one of these Node/TS checks first, not instead of them.
Both run in CI for at least one full Full Validation cycle; their outputs
are diffed and shown equivalent before any specific Node duplicate is
retired, and that retirement happens explicitly at the relevant phase's
RC checkpoint — never silently, and never before the Go tool has proven
itself on a real run against this real content.

Output: machine-readable JSON (consumed by CI to gate merges) and
human-readable Markdown (posted as a job summary), from the same run —
never two separate code paths that could drift from each other.

### GLSL shader attachment points

No new canvas and no new `SceneKind` is required or permitted for GLSL.
Shaders are optional **material-level** enhancements to Atlas, Operational
Twin, and RC-01, applied through the existing `ControlRoomScene.tsx` host
and its existing intent-loading contract — the shader compiles at the same
moment that system's Canvas already mounts, not before.

- Decorative and nonessential by construction: every shader-enhanced
  material must have the system's current standard Three.js material
  (`MeshStandardMaterial` / `MeshPhysicalMaterial`, whichever the system
  already uses) as its fallback, so removing the shader removes only
  visual polish, never information or functionality.
- Reduced motion, low-power conditions, and WebGL failure all resolve to
  that same standard-material fallback — re-running the exact
  reduced-motion/no-WebGL Playwright coverage each of these three systems
  already has (`tests/e2e/atlas.spec.ts`, `companion.spec.ts`,
  `operationalTwin.spec.ts`), extended to also cover the shader path.
- No full-screen post-processing passes "merely to claim shader usage."
  Every shader is scoped to one specific, reviewed material application
  (e.g. a rim-light effect on Atlas's globe, a scanline effect on RC-01's
  companion surface), each with a written rationale for why the system's
  current standard material can't achieve the selected Direction B art
  direction at that specific spot.

### Build/deploy separation — why Vercel stays fast

- The WASM artifact (`wasm-pack`'s `pkg/` output) is committed to the
  repository alongside its authoritative Rust source, treated exactly
  like any other compiled static asset. Vercel's `next build` never
  invokes `cargo` or `wasm-pack` — it only bundles the already-built
  `.wasm`/glue files, the same as any other file under version control.
- A dedicated, path-filtered GitHub Actions job (Rust toolchain +
  wasm-pack, cached, triggered only by `crates/mission-simulator/**`
  changes) rebuilds the crate on every relevant change and compares the
  rebuilt artifact's hash against the committed one. A mismatch fails
  CI — this hash check is what makes a committed binary artifact
  trustworthy without requiring Vercel to rebuild it from source on every
  deploy.
- The Go binary is CI-only: it is never imported by Next.js and adds zero
  runtime bytes to any route.

### Removed / consolidated (addendum)

Nothing is removed by this addendum on day one. The Node/TS checks the Go
tool overlaps with are retired only after the equivalence proof described
above — matching the same "additive, then subtractive only after the
replacement is proven" discipline the rest of this document already
follows for every other system.
