# Portfolio V9 — Architecture

Direction B (Guided Mission Control, 2D-first) selected in
`docs/PORTFOLIO_V9_DESIGN_DIRECTIONS.md`. This document maps every V9
pillar to what already exists, what extends, and what's genuinely new —
verified against the actual codebase at the V8 final tag, not assumed.

## Reused unchanged (no source changes)

- **`components/v8/ControlRoomScene.tsx` + `lib/v8/canvasOwnership.ts`**
  — the shared Canvas lifecycle. V9 adds zero new permanently-mounted 3D
  content (Direction B), so this host's contract (intent-loaded, one
  scene at a time, `markClosing()` on close) does not need to change. Any
  optional 3D enhancement V9 does add (e.g. an Evidence Graph "explore in
  3D" toggle) must be a fourth `SceneKind`, following the exact
  Atlas/Operational Twin/RC-01 pattern — its own dynamic-import wrapper,
  its own content component, no second Canvas host.
- **Atlas, Operational Twin, RC-01** — all three stay exactly as V8 left
  them. Not touched, not re-themed, not migrated again.
- **`content/*.ts` + `Field<T>` model** — the evidence-honesty substrate
  every new pillar must read from, never bypass.
- **`lib/v7/spineInstruments.ts` / `content/spine.ts`** (Reliability
  Spine, 8 stages) — already the taxonomy every project and incident maps
  against. Evidence Graph reuses this schema rather than inventing a
  parallel one.

## Reused and extended — the biggest finding of this discovery pass

**`VisitorPath` (`lib/v6/types.ts`) already exists**: `"recruiter" |
"engineer" | "explorer" | null`, wired into `ExperienceProvider`'s
reducer, persisted to `localStorage`, dispatched via
`VISITOR_PATH_SET`. Today it's surfaced by exactly one component,
`components/work/VisitorPathSelector.tsx`, and only narrows
framing/pacing on the `/work` index — it has no homepage presence, no
time budget, and nothing reads it outside that one page.

This means V9's Recruiter Flight Plan / Engineer Investigation / Explorer
pillars are **not a new system** — they are the payoff of a system V6
already built and V7/V8 never finished wiring up. V9's job is:

1. Surface `visitorPath` selection earlier (homepage entry, not buried in
   `/work`) — ties directly into the Command Interface (below).
2. Make more surfaces actually *read* `visitorPath` and change what they
   show/how they pace, not just `/work`'s framing text swap. The
   Recruiter path in particular needs an actual fast-path sequence (the
   4 flagship projects, in order, with a visible/implicit time budget),
   not just different copy on the same full page.
3. Everything stays optional and non-gating, exactly as
   `VisitorPathSelector.tsx`'s own doc comment states today — V9 must not
   turn this into a forced onboarding flow.

## New in V9

- **Global Command Interface** (new: e.g. `components/command/CommandPalette.tsx`).
  A `Cmd/Ctrl+K`-invoked, keyboard-first, screen-reader-tested overlay.
  Responsibilities: route search, project search, and setting
  `visitorPath` (replacing/augmenting `VisitorPathSelector` as the primary
  entry point, which can remain on `/work` as a secondary control).
  Client-side only, indexes existing route/content data — no new content
  model, no backend.
- **Recruiter Flight Plan** (new: likely a homepage state/section rather
  than a separate route, to avoid content duplication — see "Routing"
  below). Reads `visitorPath === "recruiter"`, sequences the 4 verified
  flagship projects, verified skills, and the existing contact actions
  into a compressed, time-boxed presentation.
- **Scenario Simulator** (new: `components/simulator/`). Entirely
  client-side, scripted/replayed sequences — traffic spike, deployment
  failure, credential compromise, DB latency, recovery decision — each
  one explicitly labeled "Simulation" in the UI (not just in a tooltip)
  and each one linked to a real, existing incident or spine stage from
  `content/v7/incidents.ts` / `content/spine.ts`. No network calls to any
  external or internal "live" system — this is the pillar most likely to
  accidentally violate "never fake live infrastructure" if built
  carelessly, so it is sequenced *after* the evidence-labeling
  conventions are established by the Evidence Graph (see Implementation
  Plan phase order).
- **Evidence Graph** (new: `components/evidence/`). A graph/tree
  visualization — SVG or styled HTML/CSS, not a new 3D scene, per
  Direction B — of project → commit/repo → CI → screenshot → deployment,
  built directly from the Content Matrix's verified/needs-input status.
  Nodes without real data render as `needs-input`, styled distinctly
  (already an established visual pattern in this codebase, e.g. the
  résumé "Request résumé" treatment), never omitted silently and never
  synthesized.

## Removed / consolidated

Nothing needs removing. V8 already did the consolidation work (three
Canvas lifecycles → one host, four homepage sections → one narrative).
V9 is additive on top of a system that's already been de-duplicated once;
introducing new duplication (e.g. a second visitor-path-like concept, a
second Canvas host, a second incident data source) is the failure mode to
actively guard against in review, not a redesign to plan for.

## Routing structure

Recommendation: **modes on existing routes, not parallel route trees.**

- `visitorPath` continues to live in shared client state
  (`ExperienceProvider`), not the URL path, for the same reason V6 chose
  that originally — Recruiter/Engineer/Explorer are lenses on the same
  content, not different content. A `/recruiter` route that duplicates
  homepage content would violate "one coherent portfolio... not a
  collection of unrelated dashboards" from the other direction (content
  fork instead of system fork).
- Exception worth testing in Phase 2 of implementation: a shareable,
  bookmarkable URL variant (e.g. `/?path=recruiter`) that hydrates
  `visitorPath` from a query param on load — gives recruiters a directly
  shareable link without creating a second copy of the content.
- Evidence Graph and Scenario Simulator are new **sections**, reached via
  the Command Interface and normal in-page navigation, not new top-level
  routes that duplicate `/work`'s project index.

## What this means for implementation risk

Because the highest-value new pillars (Command Interface, Recruiter
Flight Plan) are built on an existing, already-tested reducer field
(`visitorPath`) rather than a new one, V9's Phase 1–2 risk is
substantially lower than a from-scratch build would be — the state
management and persistence layer is proven; the work is UI, sequencing,
and a11y, all of which take targeted Playwright coverage rather than a
new architecture to validate.
