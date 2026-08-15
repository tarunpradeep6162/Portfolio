# Portfolio V8 — Performance Budget

## Starting point: the V7 production baseline (already measured, reused here)

V8 develops from the V7 validated commit (`cba06cffeaa80d489e52f269df28a0e0c49281af`,
tag `operational-twin-v7-final`), currently live at
`https://portfolio-tarun-dun.vercel.app/`. Its measured numbers, from
`docs/OPERATIONAL_TWIN_V7_PERFORMANCE_BUDGET.md` and the V7 completion
report, are V8's starting baseline — not re-measured in this
discovery-only task, per the working rule to run only lightweight
documentation validation now and reserve real measurement for
implementation checkpoints.

| Metric | V7 measured value | Source |
|---|---:|---|
| Home route (`/`) decoded JS | 701,531 B (V6-era baseline) / within an 802,000 B budget as of V7 | V7 performance budget doc; V7 completion report's Full Validation table |
| Font transfer (all routes) | 90,260 B | V7 performance budget doc |
| Canvas before intent | 0, on every route | V6 baseline, re-verified by V7's `atlas.spec.ts` + `operationalTwin.spec.ts` |
| Maximum active canvas | 1, enforced by convention across 3 systems (Atlas/Twin/RC-01) | V7 architecture doc + completion report |
| Health check (production, no bypass) | 200 in 653ms | V7 completion report |
| Full Playwright suite | 96/96 passing, ~2.0 min (CI) / 56.2 min (against live production, network-bound) | V7 completion report |

## Why V8's budget should be measured as one number, not three

The V7 budget document explicitly measured each route's JS cost and each
new system's incremental cost (`V7-specific scene code ≤350 KB`, `total
first 3D activation JS ≤1.25 MB`) as if V7 were the only new system to
account for. By the time V7 shipped, that was already three coordinated
systems (Atlas, Operational Twin, RC-01), each paying for its own vendor
glue even though only one is ever active. **V8's first real measurement
task (Phase 0 of the implementation plan, not part of this discovery
task) is to measure the current production site's total shared-vendor
cost as a single number** — this is the number Direction A's
consolidation is supposed to reduce, and there is no such single number
in any existing document to compare against.

## V8 budget targets

Carried forward unchanged from V7 (still correct, still the right
invariants):

| Metric | Requirement |
|---|---|
| WebGL/Three.js JS before user intent | 0 bytes |
| Canvas mounted before intent | 0 |
| Maximum active canvas, at any time | 1 — **structural** under Direction A (one scene host), not convention-enforced across three components |
| CLS | ≤0.1 |
| INP | ≤200 ms, hosted |
| Interaction long task | no single task >50 ms |
| Reduced motion | complete content, no required canvas |
| Self-hosted fonts | no more than +5% over the 90,260 B baseline |

New or revised for V8, specific to consolidation (Direction A):

| Metric | V7 (three systems) | V8 target | Reasoning |
|---|---:|---:|---|
| Shared 3D vendor bundle (Three.js/R3F/drei, loaded once, shared by whichever system is active) | Not measured as a single figure; effectively duplicated setup/glue code across 3 mount points | Measure once at Phase 0; target: **no larger than V7's largest single system's vendor cost**, i.e. consolidation must not cost more than the most expensive of the three did alone | Direction A's whole performance argument is "one shared cost instead of three coordinated ones" — this is the number that proves or disproves it |
| Route visible transition | Target ≤400 ms, excl. unrequested 3D (unchanged from V7) | Same | No regression expected; consolidation touches what mounts, not route transition mechanics |
| Home route total JS (decoded) | ~802,000 B budget (V7) | Initial target: **no increase**; stretch target: net reduction once Atlas/Twin/RC-01 code is unified and dead component code removed | Removing two of three parallel scene-lifecycle implementations should shrink code, not grow it — a regression here is a signal the consolidation went wrong, not an acceptable cost of the new direction |
| Desktop animation | 55–60 FPS (unchanged) | Same | |
| Mobile animation | 30 FPS balanced (unchanged) | Same | |
| Largest new lazy chunk | ≤750 KB decodedBodySize (V7 target) | Same ceiling; expect this to be easier to hold since there's one scene chunk instead of three | |

## Methodology (reused, not reinvented)

Same approach as `scripts/measure-v6-baseline.mjs` (generalized for V7,
reused for V8): read the browser's own Resource Timing entries once each
route reaches `load` and settles, reporting `transferSize`,
`encodedBodySize`, and `decodedBodySize` separately, cold context per
route. V8 adds exactly one new measurement — the shared-vendor-bundle
figure above — rather than inventing a new methodology.

## Testing cadence (per your explicit working rules)

- **Fast, targeted validation during implementation**: `npm run lint`,
  `npm run typecheck`, `npm run test` (Vitest), and the curated
  `@release-fast` Playwright subset on every meaningful change — mirrors
  V7's `v7-fast-ci.yml`, reused as-is for V8's own fast-CI workflow.
- **Full Validation** (complete Playwright suite, Docker Buildx, Trivy
  fs/image scan): only at release-candidate checkpoints — i.e., at the
  end of a phase in `docs/PORTFOLIO_V8_IMPLEMENTATION_PLAN.md`, not on
  every commit.
  - **Evidence capture**: only once, at final V8 closure — a new
  `scripts/capture-v8.mjs`/`record-v8-*.mjs` pair, built the same way
  `capture-v7.mjs` was (visually verified frame-by-frame before being
  trusted), covering whatever Direction A's unified control room actually
  ships — not run repeatedly during development.
- **Vercel preview deployments** are the verification surface throughout
  V8 development; production (`portfolio-tarun-dun.vercel.app`) stays on
  the V7 commit until an explicit, authorized promotion.

## Explicit non-goals for this budget

- No Lighthouse/Core Web Vitals field-data run is promised here — none
  has ever been run in this project's history (`AWARD_READINESS_AUDIT_V3.md`
  documents this gap explicitly), and closing it isn't a V8 prerequisite.
  If a future phase adds it, that's a genuinely new capability, not a
  restated existing one.
- No numeric baseline in this document has been re-measured as part of
  this discovery task — all V7 figures above are cited from existing,
  already-verified documents. Re-measurement is Phase 0 of implementation,
  not discovery.
