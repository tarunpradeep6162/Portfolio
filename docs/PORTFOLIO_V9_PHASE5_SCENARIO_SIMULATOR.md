# Portfolio V9 — Phase 5: Scenario Simulator

The highest-risk pillar identified in `docs/PORTFOLIO_V9_DISCOVERY.md` -
"the pillar requiring the most explicit labeling discipline," sequenced
last among the new pillars deliberately, after the verified/needs-input
visual convention was already established by Phase 4's Evidence Graph.
Additive: one new homepage section, plus one more real jump target added
to the Engineer Investigation bar.

## What was built

- **`content/v9/scenarios.ts`** — 5 scripted scenarios, exactly matching
  the 5 categories named in the V9 brief (traffic spike, deployment
  failure, compromised credentials, database latency, recovery
  decision). Each scenario has 2–3 choices; exactly one per scenario is
  marked `recommended`. Every choice's `skillLabel` is a real, verbatim
  string from `content/skills.ts` and every `relatedProjectSlug` a real
  flagship project - both enforced by a dedicated test, not just
  written carefully by hand.
- **`components/simulator/ScenarioSimulator.tsx`** — an accordion of
  scenario cards. A persistent, visible "SIMULATION" badge renders on
  every card, collapsed or expanded - not a tooltip, not only a doc
  comment. An explicit disclaimer sentence ("not connected to any real
  or live infrastructure") sits at the top of the section, always
  visible. Selecting a choice reveals its outcome plus a "Connects to:
  [skill] → [project]" citation, linking to the real case-study page.
  Entirely local `useState` - no network request, no persistence, no
  external state of any kind.
- Added `#scenario-simulator` as a jump target in
  `components/engineer/EngineerInvestigationBar.tsx`.

## The specific safety rules enforced, and how

Per `docs/PORTFOLIO_V9_DISCOVERY.md`'s own risk callout, three rules
were treated as load-bearing, not stylistic - each has a corresponding
test, not just a comment:

1. **No invented metric with false precision.** No "340ms," no "94%
   CPU" anywhere in the scenario text - `tests/unit/scenarios.test.ts`
   regex-scans every `setup` and `outcome` string for a number followed
   by `ms`/`%`/`req/s`/etc. and fails the suite if one appears.
2. **No claim of a live/real-time connection to actual
   infrastructure.** Checked twice, at two different layers:
   `tests/unit/scenarios.test.ts` scans the raw content strings;
   `tests/e2e/scenarioSimulator.spec.ts` scans the *rendered* page text
   after every scenario has been expanded, which is what a real visitor
   actually sees.
3. **Every skill/project reference is real, not invented.** Both content
   fields are cross-checked against `content/skills.ts` and
   `content/projects.ts` directly in the unit test - a typo or an
   invented skill name fails the suite immediately rather than shipping
   silently.

## A genuine test-design correction made during this phase

The first draft of the "no live-infrastructure claim" e2e test used
`/\blive (data|infrastructure|system)\b/i` and immediately failed
against the section's *own* honest disclaimer text ("not connected to
any real or **live infrastructure**") - the naive regex couldn't tell
an honest negation apart from a false affirmative claim. Fixed by
rewriting the check to look for affirmative constructions specifically
("is/shows/displays live X", "connected to real/live/actual
infrastructure") and by adding a positive assertion that the disclaimer
sentence is actually present - so the test now verifies both "no false
claim" and "the honest disclaimer is genuinely there," rather than a
regex that happened to fail on the correct behavior. A second, unrelated
test failure in the same batch (a "zero network requests" check) was a
real false positive too: Next.js's own `<Link>` prefetching
(`?_rsc=...` requests, standard App Router navigation plumbing) was
being counted as if the simulator had fetched something - fixed by
excluding that known, unrelated pattern rather than by weakening what
the test actually checks for.

## Verification

- `npm run lint` / `npm run typecheck` / `npm run build` — clean.
- **`tests/unit/scenarios.test.ts`** — 9/9 passing (see rules above).
- **`tests/e2e/scenarioSimulator.spec.ts`** — 10/10 passing: visible by
  default, all 5 categories present each with its own visible
  SIMULATION badge (5 badges, not 1 for the whole section), the badge
  stays visible alongside the setup text once expanded, choosing an
  option reveals a real outcome with a real working project link,
  a non-recommended choice is visually distinguished from the
  recommended one, zero simulator-originated network requests,
  no affirmative live-infrastructure claim anywhere in the rendered
  text (with the disclaimer's actual presence positively confirmed),
  reachable from the Engineer Investigation bar, no horizontal overflow
  at 360px, and reduced motion renders identically with zero canvas.
- **Visual verification**: screenshotted both the collapsed state (5
  cards, each with a SIMULATION badge and spine-stage tag) and an
  expanded scenario with a choice selected (setup text, 3 choices, the
  selected one highlighted, the recommended-approach outcome with a
  checkmark, the skill→project citation) - confirmed by inspection to
  match the intended honest, clearly-labeled design.
- **Regression check**: re-ran `scenarioSimulator.spec.ts`,
  `evidenceGraph.spec.ts`, `engineerInvestigation.spec.ts`,
  `recruiterFlightPlan.spec.ts`, `commandPalette.spec.ts`,
  `responsive.spec.ts`, `accessibility.spec.ts`, `routes.spec.ts`,
  `visitorPath.spec.ts`, and `proofMode.spec.ts` directly (82/82
  passing).
- Full unit suite: 134/134 (125 existing + 9 new).

## What Phase 5 did not do

- Did not add any scenario type beyond the 5 named in the brief.
- Did not connect any scenario to a live/external data source of any
  kind - confirmed by both the content-level and rendered-page-level
  tests above.
- Did not run Full Validation (the complete Playwright suite) - this is
  the last of the new-pillar phases; Full Validation is Phase 6's job.
