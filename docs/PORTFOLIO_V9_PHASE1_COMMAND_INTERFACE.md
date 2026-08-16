# Portfolio V9 — Phase 1: Global Command Interface

Additive only — no existing page's content changed. One new import line
in `components/layout/SiteHeader.tsx` is the only touch to previously
existing code.

## What was built

- **`lib/v9/commandIndex.ts`** — a pure function (`buildCommandIndex`)
  building the searchable index entirely from data that already ships:
  the 5 real site routes, the 4 flagship project routes (from
  `content/projects.ts`), and the 3 existing `VisitorPath` values
  (`lib/v6/types.ts`). `filterCommandIndex` does plain case-insensitive
  substring matching on label + hint — no fuzzy scoring, so every match
  is literally explainable.
- **`components/command/CommandPalette.tsx`** — the overlay: a
  `role="dialog"` modal with a search input, keyboard navigation
  (arrow keys, Enter, Escape, Tab-trapped focus), opened via a visible
  trigger button *and* the `Ctrl/Cmd+K` shortcut. Selecting a route
  entry calls `router.push()`; selecting a reading-path entry dispatches
  the existing `VISITOR_PATH_SET` action — no new reducer action needed,
  confirming the Architecture doc's finding that this system was already
  built and just needed a better entry point.
- **Mounted in `components/layout/SiteHeader.tsx`**, not a fixed corner
  of the viewport, specifically to avoid overlapping RC-01's own fixed
  bottom-right "Activate" control — the exact "covers key content" bug
  class V8 Phase 6 already tests for in `companion.spec.ts`.

## Deliberate exclusions (evidence-honesty, not an oversight)

- **Lab projects are not indexed.** All 8 lab projects are real (see
  `docs/PORTFOLIO_V9_CONTENT_MATRIX.md`), but none has a case-study
  route to link to. Indexing one would mean rendering a search result
  whose only action is a dead link or a fabricated href — exactly what
  this codebase's `Field<T>` / `needs-input` convention exists to
  prevent. Covered by a dedicated unit test and e2e test asserting
  "Kubernetes" (a real lab project name) returns "No matches."

## Verification

- `npm run lint` / `npm run typecheck` / `npm run build` — clean.
  (One real lint finding during development: `react-hooks/set-state-in-effect`
  on a `useEffect` that reset `activeIndex` when `query` changed — fixed
  by moving that reset into the input's own change handler instead of a
  derived effect, not by suppressing the rule.)
- **`tests/unit/commandIndex.test.ts`** — 9/9 passing. Confirms the
  index contains exactly the 5 real routes, exactly the 4 flagship
  project routes (never a lab project), exactly the 3 real
  `VisitorPath` values, and that `filterCommandIndex` behaves correctly
  on empty/matching/non-matching queries.
- **`tests/e2e/commandPalette.spec.ts`** — 8/8 passing, run directly
  (targeted, not the full suite, per this task's testing policy): open
  via trigger button and via `Ctrl+K`, Escape closes and restores focus,
  typing filters to a real project and Enter navigates to its real
  route, a lab project search correctly shows no matches, selecting a
  reading-path command is verified against the *existing*
  `VisitorPathSelector` component's `aria-pressed` state (proving the
  dispatched action actually reached shared state, not just that the
  palette closed), arrow-key navigation, backdrop click closes, and
  reduced-motion still renders correctly with zero canvas involved.
- **Regression check on `SiteHeader.tsx`**: ran the existing
  `responsive.spec.ts`, `accessibility.spec.ts`, and `routes.spec.ts`
  suites directly (33/33 passing) since those are what actually exercise
  header layout/navigation — including the two tests most likely to
  catch a new header element causing wrap or height overflow
  ("navigation stays on a single line at desktop width," "header height
  stays within the 80px cap").
- Full unit suite: 117/117 (108 existing + 9 new).
- Full Playwright suite: **not** run this phase, per the stated testing
  policy — reserved for the RC checkpoint after Phase 1, and for the
  final closure at Phase 7.

## What Phase 1 did not do

- Did not touch Atlas, Operational Twin, RC-01, or any existing page's
  content — confirmed by `git status` showing only new files plus the
  one-line `SiteHeader.tsx` addition.
- Did not add `.github/workflows/v9-fast-ci.yml` to CI-gate this repo's
  `main`/production branches — it is scoped to `portfolio-v9` only,
  mirroring `v8-fast-ci.yml`'s exact scoping pattern.
- Did not run Full Validation (the complete Playwright suite) — that is
  this phase's RC checkpoint activity, to run before the next phase
  begins, not part of this commit.
