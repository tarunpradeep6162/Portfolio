# Portfolio V9 — Phase 6: Hardening

Sweeps the known bug classes V8 Phase 5/6 already established methods
for, applied across every new V9 pillar together (not one component at
a time) — plus this phase's explicit gate: Full Validation, the complete
Playwright suite.

## Mobile: element-level scan, not just scroll-width

Same method V8 Phase 6 used after finding that a scroll-width-only check
can miss real clipped content: a real 390px-viewport DOM scan (every
non-`position:absolute/fixed` element, checked against the viewport
width directly), run across every new V9 state combination - no path,
recruiter path, engineer path, engineer path with the Scenario Simulator
expanded, and the Command Palette open. Zero new wide elements in any of
them. The only wide elements found anywhere are the two pre-existing,
already-documented V8 exceptions (the Hero's deliberately-bleeding
visual, and `ProjectComparison`'s `overflow-x-auto`-wrapped comparison
table) - confirming V9 introduced no new instance of the bug class V8
found 18 occurrences of.

Also grepped every new V9 component file for the specific missing-
mobile-default grid pattern that caused those 18 V8 occurrences
(`breakpoint:grid-cols-[...]` without a base `grid-cols-N`) - zero
matches. `EvidenceGraph.tsx`'s one responsive grid already had a
`grid-cols-1` base default from Phase 4.

## Keyboard and screen-reader

New file **`tests/e2e/v9Hardening.spec.ts`** - cross-cutting checks
exercising every new pillar together, not duplicating what each
component's own spec file already tests in isolation:

- No duplicate element `id`s anywhere on the page with every new V9
  surface open simultaneously (Command Palette, an expanded Scenario
  Simulator card, the Engineer Investigation bar) - matches the exact
  check `companion.spec.ts` already established for RC-01.
- Every interactive control introduced by V9 - the Command Palette
  trigger, the Engineer Investigation bar's exit control and jump
  links, every Scenario Simulator button - exposes a real accessible
  name.
- Three keyboard-only flows, no mouse: Tab to the Command Palette
  trigger → Enter opens it → Escape closes it and restores focus to the
  trigger; Tab to the Recruiter Flight Plan's exit control → Enter
  clears the path; Tab to a Scenario Simulator card → Enter expands it →
  Tab to a choice → Enter selects it and reveals the outcome.

## Reduced motion

Confirmed zero `<canvas>` elements across all 4 `visitorPath` states
(`null`, `recruiter`, `engineer`, `explorer`) with reduced motion
active - none of the 5 new V9 pillars mount any 3D content at all
(Direction B, confirmed structurally again here, not just by design
intent).

## Security headers

`curl -I` and a direct Playwright response-header check both confirm
all 5 headers (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`)
present and `X-Powered-By` absent - unchanged from V8, verified
directly rather than assumed from the fact that `next.config.ts` was
never touched by any V9 phase.

## Performance budget

Re-ran `scripts/measure-v9-baseline.mjs` against a fresh production
build with all 5 new pillars live on the homepage:

| Route | Phase 0 baseline | Now | Growth | +15% ceiling |
|---|---:|---:|---:|---:|
| `/` | 751,647 B | 779,901 B | +3.8% | 864,394 B |
| `/work`, `/work/project-aurora` | 769,591 B | 797,845 B | +3.7% | 885,030 B |

Comfortably inside the budget set in
`docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md` - five new interactive
sections added roughly 28 KB total, not the "immediately flags a large
dependency" scenario the tight 15% budget was set to catch. Zero canvas
before intent still holds on all 6 tracked routes. Atlas/Operational
Twin/RC-01 per-system activation costs are unchanged from baseline
within normal chunk-hash noise.

## Verification

- `npm run lint` / `npm run typecheck` / `npm run build` — clean.
- **`tests/e2e/v9Hardening.spec.ts`** — 8/8 passing (detailed above).
- **Full Validation (this phase's explicit gate)**: the complete
  Playwright suite, **149/149 passing**, run twice consecutively to
  confirm stability (149/149 both times) - matching the "confirm
  clean across repeated runs" convention V8 Phase 6 established when
  it found a real timing race that a single passing run would have
  masked. No such race found here; both runs were clean without any
  test modification between them.
- Full unit suite: 134/134, unchanged from Phase 5 (no new
  unit-testable pure logic this phase).

## What Phase 6 did not do

- Did not run Lighthouse/Core Web Vitals - consistent with
  `docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`'s stated non-goal.
- Did not touch `next.config.ts` or any existing V7/V8 component.
- Evidence capture (screenshots/video/soak test) is deliberately not
  part of this phase - reserved for Phase 7 closure, run exactly once,
  per the stated testing policy.
