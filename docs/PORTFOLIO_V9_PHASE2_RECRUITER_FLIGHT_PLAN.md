# Portfolio V9 — Phase 2: Recruiter Flight Plan

Additive only — the existing homepage is unchanged for any visitor who
has not selected the recruiter reading path. Two new files
(`components/recruiter/RecruiterFlightPlan.tsx`,
`components/recruiter/PathQueryHydrator.tsx`) plus a 4-line addition to
`app/page.tsx` (two new imports, two new JSX lines right after `<Hero />`).

## What was built

- **`components/recruiter/RecruiterFlightPlan.tsx`** — renders only when
  `visitorPath === "recruiter"` (the existing, already-tested field from
  `lib/v6/types.ts`). Shows the exact 4 flagship projects (title + their
  real `outcome` field from `content/projects.ts`, linking to their real
  case-study route), the 5 real skill domain names from
  `content/skills.ts` (never individual items — ~60 would defeat the
  60-second budget — and never a score/percentage, matching this
  codebase's existing no-scoring convention), and the two existing
  contact actions (`CopyEmailButton`, reused directly, plus a résumé
  request mailto). An "Exit flight plan" control clears the path.
- **`components/recruiter/PathQueryHydrator.tsx`** — the
  `?path=recruiter` shareable-URL exception from
  `docs/PORTFOLIO_V9_ARCHITECTURE.md`. Reads the query param once on
  mount via `useSearchParams()` (wrapped in `<Suspense>` in `page.tsx`,
  confirmed not to break `/`'s static generation - still `○ Static` in
  the build output) and dispatches the existing `VISITOR_PATH_SET`
  action if the value is one of the 3 real paths and no path is already
  selected. Never overrides an already-active path - a stale or
  accidentally-shared link should not silently switch someone mid-session
  into a different framing.

## Deliberate constraints (evidence-honesty, not oversight)

- Shows exactly the 4 flagship projects — never a lab project. No new
  curation happened here; "top 4" is simply "the ones that already have
  case-study pages," per the Content Matrix.
- Skill domains only, not individual skill items or any score — matches
  `content/skills.ts`'s own documented convention
  ("no percentage bars, star ratings, 'expert' labels").
- No new content was invented for this phase; every string rendered
  traces to `content/projects.ts`, `content/skills.ts`, or `content/site.ts`.

## Verification

- `npm run lint` / `npm run typecheck` / `npm run build` — clean.
  `next build` confirms `/` is still statically generated (`○`) despite
  the new `useSearchParams()` usage, because it's isolated behind its own
  `<Suspense>` boundary.
- **`tests/e2e/recruiterFlightPlan.spec.ts`** — 9/9 passing: hidden by
  default, appears via the command palette and shows exactly the 4 real
  projects (never the `kubernetes-fundamentals` lab project), every
  project link is real and navigates correctly, skill domains render
  with no score/percentage/rating text anywhere, the Exit control clears
  the path, `?path=recruiter` hydrates correctly, an invalid `?path=`
  value is ignored, no horizontal overflow at 360px, and reduced motion
  renders correctly with zero canvas involved.
- **Visual verification, not just assertions**: screenshotted the
  section directly at 1280px and 375px. Confirmed by inspection - clean
  card layout, correct real project outcomes, skill domain chips, and
  contact actions rendering as intended at both widths; no clipping.
- **Regression check**: re-ran `commandPalette.spec.ts`,
  `responsive.spec.ts`, `accessibility.spec.ts`, `routes.spec.ts`, and
  the pre-existing `visitorPath.spec.ts` directly (52/52 passing)
  since `app/page.tsx` changed and this phase reads/writes the same
  shared `visitorPath` state `visitorPath.spec.ts` already covers.
- Full unit suite: 117/117 (unchanged from Phase 1 - no new unit-testable
  pure logic was added this phase; behavior is covered by the e2e suite
  above).

## A real CI failure this phase surfaced and fixed (Phase 1 follow-up)

Hosted CI on PR #9 caught a genuine timing race in
`tests/e2e/commandPalette.spec.ts`'s Ctrl+K test - passed locally, failed
once on the slower CI runner. Root cause: the Ctrl+K listener is attached
inside a `useEffect`, so it doesn't exist until React has committed;
`page.goto()`'s default wait ("load") doesn't guarantee hydration has
finished. Fixed with an explicit settle wait before the keypress at every
affected spot in that file (6 tests) - the same fix shape
`docs/PORTFOLIO_V8_PHASE6_HARDENING.md` already used for an equivalent
race in Operational Twin's context-loss test. Verified 3/3 clean local
runs after the fix; pushed and confirmed green on CI.

## What Phase 2 did not do

- Did not create a `/recruiter` route — per the Architecture doc's
  routing decision, this stays a lens on the one shared homepage.
- Did not touch the full (`visitorPath === null`) homepage experience,
  `/work`, or any case-study page.
- Did not run Full Validation (the complete Playwright suite) - reserved
  for the RC checkpoint, not this commit.
