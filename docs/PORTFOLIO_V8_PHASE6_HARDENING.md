# Portfolio V8 — Phase 6: Mobile, Accessibility, Performance, Security, Failure-Recovery Hardening

A systematic sweep, not a grab-bag of one-off fixes - each finding below
was reproduced with real measurement (DOM inspection, `getComputedStyle`,
a real dispatched event) before being fixed, matching this codebase's own
evidence-honesty standard.

## Mobile: a systemic, previously-undetected clipping bug

Phase 5 found one instance of this on the homepage (a missing mobile
`grid-cols-1` default letting a grid item's implicit `min-width: auto`
force its track past the viewport). This phase asked the obvious next
question: **does the same pattern exist anywhere else?**

Grepped the whole `app/`/`components/` tree for
`grid ... (sm|md|lg|xl):grid-cols-[...]` without a plain `grid-cols-N`
default. Found **17 more occurrences** across `app/resume/page.tsx`,
`app/not-found.tsx`, `app/work/[slug]/page.tsx` (×4), `app/work/page.tsx`,
`app/about/page.tsx` (×2), `components/v7/ProofLedger.tsx`,
`components/v7/AutomationFabric.tsx`, `components/hero/Hero.tsx`,
`components/layout/Footer.tsx`, `components/work/LabProjectList.tsx`,
`components/work/WorkFilterBar.tsx`, `components/about/ExperienceTimeline.tsx`
(×2) - all pre-existing from V4-V7, none introduced by V8.

**Not assumed broken - checked.** Ran a real 390px-viewport DOM scan
(non-`position:absolute/fixed` elements wider than the viewport) across
`/`, `/work`, `/work/project-aurora`, `/about`, `/resume`, `/contact`
before touching anything. Two categories of "wide element" were found and
correctly left alone: the Hero's deliberately-bleeding visual
(`-mx-10` negative margins, `min-w-0` already applied - the same
graceful-degradation-below-~430px behavior `AWARD_READINESS_AUDIT_V3.md`
already documented and accepted, not new), and `ProjectComparison`'s
comparison table (`min-w-[36rem]`, already correctly wrapped in
`overflow-x-auto` - a deliberate, standard scrollable-table pattern, not
a bug). Everything else found was a real clipping bug and was fixed with
the same `grid-cols-1` (or `sm:`-scoped equivalent) default Phase 5
established.

**A second, distinct mobile bug**: `ProjectComparison.tsx`'s two
`<select>` elements had no width constraint, so the browser sized each to
its longest `<option>` text (a full project title, e.g. "Distributed
Jenkins Controller and Linux Build Agent") - 442px wide inside a 390px
viewport. Fixed with `w-full max-w-[16rem]` on both selects (256px
rendered, confirmed).

**Re-scanned after fixing**: zero real overflow remaining on any of the
six routes at 390px, confirmed by the same DOM scan and by
screenshot at both 1440px (desktop, unaffected - the fix only changes
layout below each breakpoint) and 390px.

## New test coverage: closing a real gap, and a real bug it found

`tests/e2e/operationalTwin.spec.ts` had only two tests (activation,
close) - unlike `atlas.spec.ts` and `companion.spec.ts`, it had **no
reduced-motion test and no context-loss/failure-recovery test**, even
though Operational Twin now shares the exact same
`components/v8/ControlRoomScene.tsx` lifecycle as both. Added both,
modeled on the existing proven patterns in those two files.

**The new context-loss test found a real, previously-unverified timing
issue** - not a flake to be waited out. First attempts failed
intermittently (1-2 times per ~4 full-suite runs) with the canvas
genuinely staying mounted for the full 5-second assertion timeout, not a
borderline near-miss. Diagnosed with the full error trace, not guessed:
`Received: 1` for the entire timeout window means the dispatched
`webglcontextlost` event had no effect at all, not that the reaction was
merely slow. Root cause: the canvas DOM element appearing does not
guarantee React Three Fiber's `onCreated` callback (which attaches the
`webglcontextlost` listener) has run yet - dispatching immediately after
`toHaveCount(1)` can race that attachment under this VM's documented
contention (`docs/OPERATIONAL_TWIN_V7_COMPLETION_REPORT.md`). Fixed by
adding the same `800ms` settle wait `companion.spec.ts`'s existing,
proven equivalent test already uses for exactly this reason - not
discovered independently, matched to existing precedent once the failure
pattern was understood. Re-verified: 3/3 clean full-suite runs (98/98
each) after the fix, versus intermittent failures before it.

## Security headers - verified, not assumed unchanged

`curl -I` against a fresh local production build confirmed all 5 headers
(`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`X-Frame-Options`, `Strict-Transport-Security`) present and
`X-Powered-By` absent - `next.config.ts` was never touched by any V8
phase, but this was checked directly rather than assumed from that fact
alone.

## Failure-recovery - the full picture across all three scenes

- **Atlas**: no dedicated context-loss test exists in `atlas.spec.ts`
  (a pre-existing gap, not introduced or closed this phase - noted here
  rather than silently left out of this report). Atlas's error path
  shares the exact same `ControlRoomScene` code Twin's now-passing test
  exercises, so the underlying mechanism is proven; the route-specific
  test itself is not. Recorded as a real, still-open item for a future
  pass, not claimed as covered.
- **Operational Twin**: now covered (see above).
- **RC-01**: covered since V7, and specifically fixed in Phase 4
  (the `deactivateOnError` bug).

## Verification

- `npm run build`, `lint`, `typecheck` - clean.
- `npm run test` - 108/108, unchanged.
- **Full Playwright suite (this phase's Full Validation checkpoint)**:
  98/98 (96 existing + 2 new Operational Twin tests), confirmed stable
  across 3 consecutive full-suite runs after the settle-wait fix.
- `node scripts/audit-static-html.mjs` - passed for all 9 routes.
- `curl -I` against a fresh local production server - all 5 security
  headers present, `X-Powered-By` absent.
- Real DOM measurement (`getBoundingClientRect`,
  `getComputedStyle(...).gridTemplateColumns`) at 390px across all six
  primary routes, before and after each fix - not just automated
  scroll-width checks, which this phase confirmed can miss real clipped
  content when `overflow-x: clip` is present upstream.
- Screenshot verification at 1440px and 390px on the homepage.

## Not done in this phase (explicitly, not silently)

- Atlas's own context-loss path has no dedicated e2e test (see above).
- The mobile grid-default sweep covered every occurrence found by a
  whole-repository grep, but relied on that grep's pattern
  (`grid ... breakpoint:grid-cols-[...]` without a base `grid-cols-N`) -
  a differently-shaped instance of the same underlying CSS Grid
  behavior could theoretically exist and not match that exact pattern.
  Not found by the DOM scan across all six routes, but noted as the
  honest limit of this pass's method.
- No Lighthouse/Core Web Vitals run - consistent with
  `docs/PORTFOLIO_V8_PERFORMANCE_BUDGET.md`'s stated non-goal; this
  project has never run one.
