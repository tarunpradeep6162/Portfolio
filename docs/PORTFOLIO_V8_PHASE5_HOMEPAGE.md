# Portfolio V8 — Phase 5: Recompose the Homepage Narrative

Per the approved product decision: one composed homepage, no route per
Reliability Spine stage, existing detailed routes (`/work/[slug]`,
`/about`, `/resume`, `/contact`) untouched, no verified project evidence
hidden. This phase closes the V7 session handoff's own outstanding item
("Phase 7: full homepage narrative recomposition - not yet started").

## What changed, and why

`app/page.tsx` previously stacked eleven independent sections, five of
which (Reliability protocol, Incident record, Automation fabric, Proof
ledger, Capability matrix) repeated the identical
`Eyebrow → h2 → intro paragraph → content` template - the exact structural
finding `docs/PORTFOLIO_V8_DISCOVERY.md` carried forward from
`AWARD_READINESS_AUDIT_V3.md`, confirmed still true by direct inspection
before this phase started.

**Inspected before changing anything**: `IncidentReplay.tsx`,
`AutomationFabric.tsx`, `ProofLedger.tsx`, and `ProjectComparison.tsx` each
already render their own internal kicker label + intro paragraph
(`font-mono text-[9px] uppercase...` plus a one-sentence description) -
confirmed by reading all four component files directly. The old
`app/page.tsx` was giving each of these a **second**, redundant
page-level `Eyebrow`/`h2`/intro on top of the one the component already
provides. This is direct, concrete evidence of the repeated-rhythm
problem, not just a stylistic judgment call.

**The fix**: merged the four V7 add-on sections
(`id="spine"`/`id="incidents"`/`id="automation"`/`id="proof-ledger"`) into
one continuous "Control Room" section, keeping the single `id="spine"`
(RC-01's tour/section-tracking anchor, see below). One real page-level
`Eyebrow`/`h2`/intro frames the whole section
("The control room" / "One protocol, traced live across everything
below."); `SystemTrace`, `ReliabilitySpine`, `IncidentReplay`,
`AutomationFabric`, `ProofLedger`, and `ProjectComparison` then flow in
sequence beneath it, each still using its own existing internal kicker as
a sub-heading - not duplicated, not removed, just no longer redundantly
wrapped.

**A real second scale-contrast moment** (the other V3 finding still true:
"nothing on the rest of the page is large again until the next page's
hero-less heading"): a large, low-opacity "08" numeral behind the
Reliability Spine list - the same real stage count already shown in the
stat grid below it, given hero-scale typographic weight instead of
staying a small number in a box. Not a decorative invented number; it is
the same figure the stat grid already displayed.

**Numbered eyebrows removed** (`/ 01` through `/ 07`) across every
section - a small, low-risk change that removes the "here is item N of a
numbered list" framing every section carried, reinforcing the sense of
interchangeable stops rather than one narrative.

**What was deliberately left alone**: Hero, Selected Work (`id="work"`),
Capability matrix, Operating History, Credentials/Engineering lab, and
Contact (`id="contact"`) keep their existing structure and copy. These
aren't the V7 add-on sections the repeated-rhythm finding was about, and
decision #2 (preserve one composed narrative, don't hide verified
evidence) argues for leaving working, recruiter-critical content alone
rather than restructuring everything at once.

## Functional dependencies checked before restructuring

Grepped the whole repository for every consumer of the old section IDs
before touching them:

- `id="work"`, `id="spine"`, `id="contact"` are read by
  `CompanionExperience.tsx`'s `SECTION_IDS`/`useActiveSection` (RC-01's
  "Observing · X" label) and by `content/companion.ts`'s tour steps
  (`anchor: "work"`, `anchor: "spine"`, used as
  `document.getElementById(step.anchor)?.scrollIntoView(...)`) - all
  three preserved exactly.
- `id="incidents"`, `id="automation"`, `id="proof-ledger"` had zero
  consumers outside `app/page.tsx` itself (confirmed by grep) - free to
  remove, and removed as part of the merge.
- No test or script hardcodes any homepage heading/eyebrow copy
  (confirmed by grep across `tests/` and `scripts/`) - every copy change
  in this phase was free to make without touching test code.

## A real, previously-undetected mobile bug, found and fixed

Screenshot-verified the recomposed section at a 390px viewport (not just
trusted the automated overflow check) and found the intro paragraph
visibly clipped mid-sentence. Diagnosed with real DOM measurement, not
guessed: `document.getElementById("spine").querySelectorAll("*")` showed
a `<div>` and its children rendering at *576px* wide inside a 390px
viewport. Root cause: `className="grid ... lg:grid-cols-[...]"` patterns
across this codebase never set an explicit mobile-default column count -
below the `lg:` breakpoint, `grid-template-columns` has no override, and
a grid item's implicit `min-width: auto` let a `SpineNode` button's
content force its column's track width past the viewport. Confirmed via
`getComputedStyle(grid).gridTemplateColumns` directly (`576px`, not the
expected 100%-width single column).

**This is not new to Phase 5** - the same `grid ... lg:grid-cols-[...]`
pattern (missing a mobile `grid-cols-1` default) appears in five places
across `app/page.tsx`, all pre-existing from V4-V7, none touched by this
phase's restructuring. It was invisible to the existing
`responsive.spec.ts` suite because that suite checks
`document.documentElement.scrollWidth` for overflow, which `<html>`'s
existing `overflow-x: clip` (a real V7 fix, see the session handoff) also
happens to mask - the page never *scrolls* horizontally, but content can
still be silently clipped without producing a scrollbar. Fixed all five
occurrences with an explicit `grid-cols-1` (or `sm:`-scoped equivalent)
default. Re-verified: the grid's computed width dropped from 576px to
358px (matching the real 390px viewport minus padding), and the
previously-clipped paragraph now wraps correctly - screenshot-confirmed,
not just measured.

**Flagged, not chased further**: this same missing-mobile-default pattern
may exist on other pages (`/about`, `/work`, case-study pages) - not
checked in this phase, since Phase 5's scope is the homepage. Recorded
here as a concrete, specific lead for Phase 6's mobile hardening pass
rather than expanding this phase's blast radius to the whole site.

## Verification

- `npm run build`, `lint`, `typecheck` - clean.
- `npm run test` - 108/108, unchanged (no new pure-logic module this
  phase).
- `node scripts/audit-static-html.mjs` - passed for all 9 routes (heading
  order, single `h1` per route) both before and after the grid fix.
- **Full Playwright suite (this phase's Full Validation checkpoint)**:
  96/96, matching every prior phase - including the RC-01 Reliability
  Spine Tour test (`companion.spec.ts:476`, confirms `anchor: "spine"`
  still resolves and highlights correctly) and every `responsive.spec.ts`
  case, both before and after the mobile grid fix.
- Screenshot-verified at 1440px (desktop) and 390px (mobile) - not just
  automated-test-verified, since this phase's whole subject is visual/
  structural composition, which automated tests alone don't fully cover.
- `scripts/measure-v8-baseline.mjs` - home route idle JS 751,430 B (Phase
  0 baseline: 752,066 B) - no regression; this phase only restructured
  existing markup, added no new dependency.

## Not changed

`/work/[slug]` case-study template variation and the 404 page's visual
disconnect (both named in `docs/PORTFOLIO_V8_DISCOVERY.md` as still-open
V3 findings) are not addressed by this phase - Phase 5's explicit scope,
per the approved instruction, is the homepage narrative only, without
replacing the existing detailed routes.
