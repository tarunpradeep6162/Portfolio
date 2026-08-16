# Portfolio V9 — Phase 3: Engineer Investigation Connective Pass

Additive only, and true to the Implementation Plan's framing for this
phase: **no new content system**. Every jump target this phase links to
already existed before this commit - the only new things are the links
themselves and 4 stable `id` attributes.

## What was built

- **`components/engineer/EngineerInvestigationBar.tsx`** — renders only
  when `visitorPath === "engineer"`. A compact bar (deliberately lighter
  than the Recruiter Flight Plan - this path wants full detail, not a
  compressed summary) with 5 real jump links:
  - "Architecture & decisions" → `/work` (the real project index; each
    flagship project's own page already has `implementationDecisions`
    and `challengeAndResolution` - full detail, nothing new written).
  - "Incident reconstruction" → `#incident-replay`
  - "Deployment history" → `#automation-fabric`
  - "Security & performance proof" → `#proof-ledger`
  - "Compare systems" → `#project-comparison`

  An "Exit investigation" control clears the path, matching the
  Recruiter Flight Plan's and `VisitorPathSelector`'s existing pattern.

- **Four stable `id` attributes added in `app/page.tsx`** - wrapping
  `<IncidentReplay />`, `<AutomationFabric />`, `<ProofLedger />`, and
  `<ProjectComparison />` each in a plain `<div id="...">`, since none of
  those V7 components exposed a stable anchor target themselves (the
  `id`s generated internally are React `useId()` values - correct for
  `aria-*` attribute wiring, but not meant to be stable, human-readable
  URL fragments). This is the only change to those components' rendered
  output; their own source files were not touched.

## Why this phase is smaller than Phase 1/2

Per the Implementation Plan, this phase was scoped as "mostly
navigation/UI work" - and it genuinely was. There was no new data to
source, no new evidence to render, and no new interaction pattern beyond
what `RecruiterFlightPlan.tsx` already established (a path-gated section
with an exit control). The actual engineering content Recruiters
skip - full case-study detail, incident records, the automation
pipeline, proof/comparison data - was already complete before V9 started;
this phase's entire job was making it reachable in one jump instead of
requiring a scroll through the whole page.

## Verification

- `npm run lint` / `npm run typecheck` / `npm run build` — clean.
- **`tests/e2e/engineerInvestigation.spec.ts`** — 8/8 passing: hidden by
  default, appears via `?path=engineer` with all 5 real links present
  and pointing at the correct real targets, every in-page anchor
  actually scrolls its target section into view (not a dead link - the
  test asserts `toBeInViewport()` after each click, not just a URL
  change), the off-page link navigates to the real `/work` route,
  Exit clears the path, mutually exclusive with the Recruiter Flight
  Plan (both read the same single `visitorPath` field, so this is
  structural, not a special case handled here), no horizontal overflow
  at 360px, reduced motion renders correctly with zero canvas.
- **Visual verification**: screenshotted the bar directly at 1280px -
  confirmed by inspection, correct framing text, all 5 link chips
  rendering with the right icon treatment (down-arrow only on in-page
  anchors, not on the off-page `/work` link).
- **Regression check**: re-ran `engineerInvestigation.spec.ts`,
  `recruiterFlightPlan.spec.ts`, `commandPalette.spec.ts`,
  `responsive.spec.ts`, `accessibility.spec.ts`, `routes.spec.ts`,
  `visitorPath.spec.ts`, and `proofMode.spec.ts` directly (64/64 passing)
  - `proofMode.spec.ts` specifically because it exercises the exact
    `#spine` section subtree (`ProjectComparison`, evidence links) this
    phase wrapped with new `id`s, confirming that wrapping didn't
    disturb anything.
- Full unit suite: 117/117 (unchanged - no new unit-testable pure logic
  this phase).

## What Phase 3 did not do

- Did not create a `/engineer` route, matching the same routing
  decision as Phase 2.
- Did not touch any V7 component's own source
  (`IncidentReplay.tsx`, `AutomationFabric.tsx`, `ProofLedger.tsx`,
  `ProjectComparison.tsx`) - only wrapped their existing render output
  in `app/page.tsx`.
- Did not run Full Validation (the complete Playwright suite) - still
  reserved for the RC checkpoint, not yet reached.
