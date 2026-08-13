# Living Infrastructure V6 — performance budget

Targets only. **Nothing in this document has been measured against a V6
production build, because no V6 implementation exists yet.** Every number
below is a ceiling to design against, not a result. The Plan document's
Phase 11 (Performance engineering) and Phase 16 (Production validation)
are where these get measured for real, with exact commands and exact
output, the same standard of evidence the V5.1 report holds itself to.

## Why these numbers, not round ones

Two real, already-measured facts from the V5.1 investigation set the floor
these budgets have to work against — picking targets that ignore them would
be dishonest before a line of V6 code exists:

- The **existing** home page's initial JS load (V5.1, no V6 code) is
  **697,303 bytes**, reproducibly measured via the browser's Resource
  Timing API. V4's equivalent is 663,419 bytes. This is the pre-V6 floor —
  not zero.
- RC-01's full activation cost (hover + click combined) is **960,257
  bytes**, reproducibly measured — the R3F/Three.js payload for one 3D
  companion. If V6 adds two more concurrent 3D/spatial systems (Atlas,
  Time Machine) at a similar order of magnitude each, uncontrolled, the
  site could plausibly reach multiple megabytes of possible JS before any
  budget discipline is applied. These budgets exist specifically to
  prevent that.

## Initial JavaScript budget

- **Target**: the route-level initial JS payload (everything loaded before
  any user interaction, on any route) must not regress more than **+15%**
  over the current V5.1 baseline for that same route.
  - Home page baseline: 697,303 bytes → V6 home page ceiling: **≤ 802,000
    bytes** before any interaction.
  - Any new route V6 introduces (e.g. a dedicated Atlas or Time Machine
    route, if the Plan chooses one) starts its own budget at the shared
    framework/GSAP cost already proven identical across V4/V5/V5.1
    (roughly 480–500KB of framework+GSAP chunks that are byte-identical
    across versions today) plus whatever page-specific code that route
    genuinely needs — not a blank-slate re-measurement that ignores what's
    already shared.
- **Method**: `scripts/diff-bundle-chunks.mjs`'s Resource-Timing-API
  approach (not the older, proven-racy stabilization-heuristic approach in
  `scripts/compare-bundle-sizes.mjs`) — reproduced identically twice before
  being trusted, per the lesson from the V5.1 report.

## Initial image/font budget

- **Target**: no new raster images are added — V6 continues V4/V5.1's
  code-generated-SVG-only pattern for any visual with no supplied source
  asset (screenshots, architecture art). This is not a stretch target; it
  is a continuation of an existing, verified constraint (`CONTENT_GAPS.md`:
  zero real project screenshots exist to load in the first place).
- **Target**: font payload does not exceed the current self-hosted
  Fontsource total (**217,407 bytes**, per the V4 report) plus **10%**
  headroom for any new weight/style V6's typography genuinely requires —
  **≤ 239,000 bytes**, self-hosted (no Google Fonts network dependency,
  continuing V4's decision).

## Largest lazy 3D chunk target

- **Target**: no single lazily-loaded 3D/spatial chunk (RC-01's existing
  chunk, or any new Atlas/Time-Machine chunk) exceeds **1.1MB** ungzipped —
  roughly 15% headroom over RC-01's own measured activation cost (960,257
  bytes) as the reference point, not an arbitrary round number.
- **Target**: if V6 introduces additional 3D chunks beyond RC-01's, each
  one is independently lazy-loaded (its own `next/dynamic(..., {ssr:
  false})` boundary) so that visiting the Atlas alone never pulls in the
  Time Machine's payload, and vice versa — no shared "V6 3D bundle" that
  forces all spatial features to load together.

## No 3D download without intent

- **Non-negotiable, inherited unchanged from V5.1's Phase D**: zero bytes
  of any 3D/spatial payload (RC-01, Atlas, Time Machine) load before a
  real user gesture (hover, focus, touch, or click) on the control that
  reveals it. `requestIdleCallback`-style unconditional prefetch is
  explicitly out of scope for any new V6 spatial feature, matching the
  reason RC-01's own idle-prefetch was removed in the first correction
  pass.
- **Verification method**: the same before/hover/click chunk-set diff
  pattern from `scripts/check-bundle-cost.mjs`, applied to every new
  spatial entry point, not just RC-01's.

## Canvas-count limit

- **Target**: **at most 1 mounted `<canvas>` element at any given time**,
  site-wide, matching the existing soak-test-verified invariant for RC-01
  alone. If V6 introduces Atlas and/or Time Machine as separate R3F
  Canvases, they must not be simultaneously mounted with RC-01's Canvas —
  either share a single Canvas (multiple R3F scenes/portals within it) or
  enforce mutual exclusion (opening one closes/unmounts another) before
  this is considered met.
- **Verification method**: extend `scripts/soak-test.mjs`'s existing
  `document.querySelectorAll("canvas").length` assertion to cover
  Atlas/Time-Machine activation sequences, not just RC-01's.

## Mobile quality tier

- **Target**: reuse RC-01's existing three-tier system (`high` / `balanced`
  / `fallback`, driven by `navigator.hardwareConcurrency` /
  `navigator.deviceMemory` plus a manual low-power override that always
  wins) for any new 3D surface, rather than inventing a second
  tier-detection system. No shadows, no post-processing, in any tier —
  continuing V5's existing "removed as a variable entirely" decision.
- **Target**: on the `fallback` tier specifically, Atlas/Time-Machine (if
  3D) degrade to the same class of static, code-generated fallback
  RC-01 already uses (`CompanionPortrait`-equivalent) — not a lower-poly
  3D scene, which would still carry a WebGL cost fallback mode is meant to
  avoid entirely.

## Reduced-motion behavior

- **Target**: `prefers-reduced-motion` (via the existing
  `useReducedMotion()` hook — reused, not reimplemented) disables:
  camera fly-throughs/cinematic movement (Explorer path), any
  scroll-linked spatial transition, and RC-01's existing breathing/head-
  tracking motion — continuing V5's existing behavior. Under reduced
  motion, the Explorer path itself should present its content as static,
  navigable steps, not attempt a slowed-down version of the same
  animation.
- **Target**: reduced-motion mode never mounts a 3D canvas that motion
  mode would — matching RC-01's existing test-verified behavior
  ("reduced motion never mounts the 3D canvas"), extended to any new
  spatial surface.

## Low-power behavior

- **Target**: the existing manual, `localStorage`-persisted low-power
  toggle (an honest user-controlled switch, not a fabricated device
  benchmark, per V5's own design decision) governs every 3D/spatial
  surface site-wide, not just RC-01 — one toggle, one meaning, everywhere.

## Route transition budget

- **Target**: navigating between any two real routes (including into and
  out of any new Atlas/Time-Machine route, if the Plan introduces one)
  completes its visible transition in **≤ 400ms** perceived time before
  the destination route's primary content is interactive, excluding any
  lazy 3D payload that hasn't been requested yet.
- **Method**: Playwright-timed navigation, not a subjective read — extend
  `tests/e2e/routes.spec.ts`'s existing navigation coverage with timing
  assertions.

## Layout-shift target

- **Target**: **CLS ≤ 0.1** on every real route, matching the commonly-cited
  "good" Core Web Vitals threshold — chosen deliberately rather than
  invented, and explicitly not claimed as achieved until measured. RC-01's
  desktop dock (real `padding-right` layout reflow) is a known intentional,
  one-time layout shift on activation; the target here is about
  *unintentional* shift during normal page load and any new V6 spatial UI
  mounting.

## Long-task target

- **Target**: no single main-thread task during initial page load or a
  spatial-feature activation exceeds **50ms** (the standard "long task"
  threshold), measured via the `PerformanceObserver` `longtask` entry
  type. 3D scene construction (procedural geometry generation, matching
  RC-01's existing "pure procedural geometry, no imported meshes" pattern)
  is the most likely source of a long task in Atlas/Time-Machine and
  should be chunked/deferred across frames if a single construction pass
  would exceed this.

## What "measured" will mean (Phase 16)

Every target above gets a real number, a real command, and real output in
the eventual V6 completion report — following the exact standard set by
`docs/JURY_REFINEMENT_V5_1_COMPLETION_REPORT.md`: reproduced at least
twice before being trusted (per the lesson learned when an
earlier bundle-comparison methodology gave three different answers across
three runs against an unchanged server), and any target not met reported
as not met, not silently dropped from the document.
