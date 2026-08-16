# Portfolio V9 — Performance Budget

Budgets below are set against the **real, measured V8 production
baseline** (`scripts/measure-v8-baseline.mjs`, re-run at the V8 final tag
during Phase 7 closure, commit `9459778`) — not projected or estimated.

## V8 production baseline (the number V9 is measured against)

| Route | JS decoded (idle) | Requests | Font transfer | Canvas |
|---|---:|---:|---:|---:|
| `/` | 751,647 B | 16 | 90,260 B | 0 |
| `/work` | 769,591 B | 17 | 90,260 B | 0 |
| `/work/project-aurora` | 769,591 B | 17 | 90,260 B | 0 |
| `/about` | 751,647 B | 16 | 90,260 B | 0 |
| `/resume` | 751,647 B | 16 | 90,260 B | 0 |
| `/contact` | 751,647 B | 16 | 90,260 B | 0 |

Per-system activation cost (fresh context, isolates each system's real
cost — see `docs/PORTFOLIO_V8_PHASE0_BASELINE.md` for the full
shared-vendor-chunk analysis):

| System | Total activation | Shared vendor (Three.js) | System-specific |
|---|---:|---:|---:|
| Atlas | ~905 KB | 896,201 B | ~4–8 KB |
| Operational Twin | ~906 KB | 896,201 B | ~7–9 KB |
| RC-01 | ~968 KB | 896,201 B | ~69 KB |

Zero canvas mounted on any route before intent, on all 6 tracked routes —
the invariant V9 must not break.

## V9 budgets

- **Zero 3D/WebGL bytes before user intent.** Unchanged from V8, carried
  forward by construction (Direction B adds no permanently-mounted 3D
  content; any optional 3D stays behind the existing intent-loaded
  pattern via `lib/v8/canvasOwnership.ts`).
- **Maximum one canvas, ever.** Unchanged, enforced by the existing
  runtime check, not by convention.
- **Idle JS budget: no more than +15% over the V8 baseline per route**
  (e.g. `/` idle JS must stay under ≈864 KB decoded). 15% is chosen
  deliberately tight: V9's new pillars (Command Interface, Recruiter
  Flight Plan, Evidence Graph) are UI/content/routing work, not new
  heavy dependencies — a budget this tight forces that work to stay lean
  and immediately flags if a new pillar accidentally pulls in a large
  library. If a specific pillar genuinely needs more, that's a decision
  to surface explicitly at its phase's Full Validation checkpoint, not
  something to budget for speculatively now.
- **CLS ≤ 0.1** on all primary routes — unchanged target, already met by
  V8, must not regress.
- **No horizontal overflow** at 360px, 390px, 414px, 768px — the exact
  widths V8's `tests/e2e/responsive.spec.ts` already checks. New V9
  surfaces (Command Palette overlay, Evidence Graph, Scenario Simulator)
  get the same check before merge, using the same "real DOM measurement,
  not just scroll-width" method Phase 6 established (a scroll-width-only
  check missed a real bug once already in this codebase).
- **Responsive input during interactions** — no interaction (including
  Command Palette open/search, Scenario Simulator step transitions)
  should block the main thread long enough to miss a frame under normal
  conditions. No formal INP number is being set as a hard gate (this
  project has never run Lighthouse/Core Web Vitals — see "Not a goal"
  below); this is a qualitative check performed manually per phase.
- **Route transitions ≤ 400ms** where measurable (client-side
  navigation, e.g. Command Palette → route jump). Server/network-bound
  first loads are exempt — this budget targets perceived responsiveness
  of in-app navigation, not cold page loads.
- **No autoplay background video on constrained devices.** V9 introduces
  no background video at all in its current pillar scope; this budget is
  a guardrail against scope creep during implementation, not a response
  to a planned feature.
- **Reduced-motion mounts no animated 3D canvas.** Unchanged from V8,
  already enforced per-system; any new optional 3D surface must pass the
  same reduced-motion fallback test pattern before merge (matching
  `tests/e2e/atlas.spec.ts` / `companion.spec.ts` / `operationalTwin.spec.ts`'s
  existing reduced-motion tests).

## Not a goal (stated explicitly, matching V8's own budget doc precedent)

- No Lighthouse/Core Web Vitals automation — this project has never run
  one; V9 does not introduce that as a new gate.
- No bundle-analyzer visualization tooling — real byte measurement via
  `scripts/measure-v8-baseline.mjs`'s proven method (network-request
  interception against a real local production build) remains the
  source of truth, consistent with V6/V7/V8.

## Measurement method

Same script family as V6/V7/V8
(`scripts/measure-v8-baseline.mjs` → a V9 equivalent at Phase 0 of
implementation), against a local `next build && next start` production
build, read-only, no application behavior changed by the measurement
itself. Re-run once at each phase's Full Validation checkpoint, not on
every commit — matching the testing policy in
`docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md`.
