# Portfolio V9 — Phase 4: Evidence Graph

Additive: one new homepage section, no existing section changed except
the Engineer Investigation bar's jump-link list (Phase 3) gaining one
more real target.

## What was built

- **`lib/v9/evidenceGraph.ts`** — `buildEvidenceGraph()`, a pure function
  reading `content/projects.ts` and `content/spine.ts` directly. For each
  of the 4 flagship projects, produces a chain of two evidence nodes
  (Repository, Screenshot) plus the real Reliability Spine stage labels
  that project demonstrates (`project.spineStages`, resolved to real
  labels via `content/spine.ts`, not raw ids).
- **`components/evidence/EvidenceGraph.tsx`** — a server component (no
  client state needed; every visitor sees the same real evidence)
  rendering the graph as styled HTML, not a new 3D scene, per
  Direction B. A verified node shows a filled check icon and a real
  external link (reusing the existing `ExternalLink` component); a
  needs-input node shows a dashed-circle icon and the project's own real
  explanatory note text - never hidden, never a fabricated placeholder
  link.
- Mounted **generally, not gated behind any `visitorPath`** - unlike the
  Recruiter/Engineer sections, evidence tracing is useful to any visitor,
  matching how Proof Ledger and Automation Fabric already work
  unconditionally.
- Added `#evidence-graph` as a 6th jump target in
  `components/engineer/EngineerInvestigationBar.tsx`'s existing stops
  list, since it's now a real, reachable section.

## Why only flagship projects, and only these two node types

- **Lab projects are excluded**, same reasoning as Phase 1's Command
  Palette: `content/types.ts`'s `LabProject` interface has no
  `screenshot` field at all, so a "Screenshot" node for a lab project
  would have nothing real to report.
- **No fabricated "CI workflow" or "deployment" node per project.**
  The original V9 brief's pillar description imagines a
  "project → commit → workflow → screenshot → deployment" chain, but no
  per-project CI/deployment data exists anywhere in `content/*.ts` -
  only Repository and Screenshot are real, structured, per-project
  fields. This site's *own* CI/CD pipeline is real and already fully
  represented (Automation Fabric, `content/v7/automation.ts` -
  `verified`/`pending` status, real workflow detail) - the Evidence
  Graph deliberately does not re-render that data a second time in a
  different visual form; it links to it instead, via the Engineer
  Investigation bar's existing `#automation-fabric` jump target. Two
  graphs describing the same evidence would be redundant, not connective.

## A real content wrinkle this phase surfaced

The 4 flagship projects' `screenshot.note` text genuinely varies -
Secure AWS's reads "No architecture diagram screenshot supplied yet,"
not the "No screenshot supplied yet for X" pattern the other three
share. The first e2e test draft used a regex too narrow to match that
real variation and failed - fixed by broadening the test's matcher
(`/supplied yet/i`, scoped correctly), not by rewriting the real content
to fit a narrower test. This is the intended direction: content is
truth, tests conform to it.

## Verification

- `npm run lint` / `npm run typecheck` / `npm run build` — clean.
- **`tests/unit/evidenceGraph.test.ts`** — 8/8 passing: exactly one
  chain per flagship project and never for a lab project, Project
  Aurora's repository node is verified with its real GitHub URL, every
  other project's repository node is needs-input with no href, every
  screenshot node is needs-input (matches `CONTENT_GAPS.md`'s "0
  screenshots supplied"), every needs-input node carries a real
  non-empty detail string, spine stage labels are real resolved labels
  not raw ids, the verified/needs-input split is computed generically
  (not a per-slug hardcoded list - confirmed by counting against
  `content/projects.ts` directly), and the screenshot status is
  cross-checked against the existing `isReady()` type guard.
- **`tests/e2e/evidenceGraph.spec.ts`** — 8/8 passing: visible on the
  homepage unconditionally, shows exactly the 4 flagship projects and
  never `kubernetes-fundamentals`, Aurora's repository link is real
  (`target="_blank"`, `rel="noopener"`, the actual GitHub URL), every
  other needs-input node's real detail text renders, real spine stage
  labels render, reachable from the Engineer Investigation bar, no
  horizontal overflow at 360px, and reduced motion renders identically
  with zero canvas.
- **Visual verification**: screenshotted the full section at 1280px -
  confirmed by inspection: clear check-vs-dashed-circle distinction,
  Aurora's real "view" link, honest per-project detail text, real spine
  stage chips per project, consistent with the rest of the site's visual
  language.
- **Regression check**: re-ran `evidenceGraph.spec.ts`,
  `engineerInvestigation.spec.ts`, `recruiterFlightPlan.spec.ts`,
  `commandPalette.spec.ts`, `responsive.spec.ts`, `accessibility.spec.ts`,
  `routes.spec.ts`, `visitorPath.spec.ts`, and `proofMode.spec.ts`
  directly (72/72 passing).
- Full unit suite: 125/125 (117 existing + 8 new).

## What Phase 4 did not do

- Did not add a "simulated" evidence status - not applicable yet; that
  label is introduced honestly in Phase 5 once the Scenario Simulator
  exists to need it. The `EvidenceStatus` type is `"verified" |
  "needs-input"` only, deliberately not pre-extended for a status this
  phase has no real data for.
- Did not re-render Automation Fabric's pipeline data inside the
  Evidence Graph - linked to it instead (see above).
- Did not add the Evidence Graph to the global Command Palette index
  (Phase 1) - that index currently only handles page-level routes, and
  wiring in-page-anchor-after-navigation behavior was judged out of
  scope for this phase; noted here as a real, open gap rather than
  silently skipped.
- Did not run Full Validation (the complete Playwright suite) - still
  reserved for the upcoming RC checkpoint.
