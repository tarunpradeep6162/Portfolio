# Living Infrastructure V6 — discovery document

This is a documentation and audit pass only. Nothing in `app/`, `components/`,
`content/`, or `lib/` was touched to produce this document. It establishes
what V6 inherits, what it can genuinely build on, and where the real risks
are, before any implementation plan is written.

## Verified V5.1 baseline

Branch `jury-refinement-v5-1`, tagged `jury-refinement-v5.1-final` at commit
`8574469`. Per its completion report (`docs/JURY_REFINEMENT_V5_1_COMPLETION_REPORT.md`),
independently re-confirmed by this audit:

- **6 real routes**: `/`, `/work`, `/work/[slug]` (4 static flagship case
  studies), `/about`, `/resume`, `/contact`, plus the custom 404.
- **4 flagship projects**, each with real `spineStages` mapping into a
  shared 8-stage Reliability Spine (`commit`, `build`, `test`, `container`,
  `network`, `cloud`, `observe`, `recover`) — see the Content Matrix
  document for the exact per-project mapping.
- **RC-01**, a procedurally-built (no downloaded 3D assets) Three.js/R3F
  companion, intent-only loaded (`next/dynamic`, no idle-prefetch), with a
  real desktop dock (structural layout reflow, not an overlay), three
  explicit mobile states (collapsed/medium/expanded), per-stage Observatory
  highlighting, tours (Recruiter/Engineering/Project/Reliability Spine),
  a command console, captions-by-default speech via the browser's native
  Web Speech API, WebGL-loss recovery, reduced-motion and low-power
  fallbacks to a static SVG portrait, and a route allowlist (`/`, `/work`,
  `/about`, `/contact`) that keeps it absent from `/resume`, the 404 page,
  and print media.
- **Security headers** (`X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` denying camera/microphone/geolocation,
  `X-Frame-Options: DENY`, HSTS, `poweredByHeader: false`) verified live
  with `curl -I` against a real production preview.
- **70/70 Playwright tests passing** (6 spec files: accessibility,
  companion, links, metadata, responsive, routes), 31/31 unit tests,
  `npm run verify` and `audit:html` clean.
- **69 screenshots** (50 route × breakpoint, 19 companion states) and a
  45.32s interaction video, both individually verified frame-by-frame
  during the V5.1 closure pass, not merely counted.
- **No microphone access, no speech recognition, no outbound network calls
  from the companion** — code-verified with `grep` in the V5 completion
  report, unchanged since.

## Visual strengths to build on

- The Infrastructure Observatory (`components/hero/InfrastructureObservatory.tsx`)
  is an always-visible, zero-JS-cost SVG control surface already built from
  the real 8-stage spine — it is the natural spatial anchor for an
  "Infrastructure Atlas," not something V6 needs to invent from scratch.
- `ReliabilitySpine.tsx` already renders the 8 stages as a real, linear,
  inspectable list with per-stage case-study counts derived from
  `projects.ts` — this is already most of an "Architecture Time Machine"
  in list form; V6's job is spatial/sequential presentation, not new data
  modeling.
- The V4 graphite/lime/packet-blue/coral palette (`--color-control-black`,
  `--color-signal-lime`, `--color-packet-blue`, `--color-signal-coral`) is
  already the exact material language V6's brief asks for — it does not
  need to be redesigned, only extended into new spatial contexts.
- `ProjectCoverArt.tsx` already renders each flagship project's real `flow`
  string as a distinct, code-generated SVG composition (zig-zag pipeline,
  distributed execution field, nested control-plane tiers, clockwise
  request loop) — four already-differentiated visual identities per
  project exist today, not a shared template.

## Interaction strengths to build on

- RC-01's per-stage highlight event model (`lib/companion/observatoryHighlight.ts`)
  is a typed, reusable `CustomEvent` bus that any number of visualizations
  can subscribe to — it was built generically enough (`stageId:
  SpineStageId | "all"`) that a new Atlas/Time-Machine visualization could
  subscribe to the exact same event without touching RC-01's own code.
- The tour system (`CompanionTourPanel.tsx`, `content/companion.ts`) already
  encodes "Recruiter" and "Engineering" as two distinct narration paths
  through the same underlying facts — the V6 brief's Recruiter/Engineer/
  Explorer paths are an extension of an existing pattern, not a new one.
- The desktop dock's real-layout-reflow technique (`data-rc01-docked`
  attribute + CSS `padding-right`, verified via `getBoundingClientRect()`
  geometry assertions) is a proven, test-backed pattern for "spatial UI
  that structurally cannot overlap content" — directly reusable for any
  new spatial panel V6 introduces.
- Intent-only loading is proven and measured: zero RC-01 bytes before
  interaction, a real (not fabricated) small hover-prefetch cost, and the
  bulk of the R3F/Three.js payload only after the click — confirmed via
  the browser's own Resource Timing API after an earlier measurement
  methodology was found to be racy and fixed (see the V5.1 report's Phase
  D section for the full account, including the mistake).

## Current limitations

- **RC-01's Reliability Spine Tour and per-stage highlighting only exist
  on the home page.** `InfrastructureObservatory` and `ReliabilitySpine`
  are both home-page components; a project-specific "world" per flagship
  project (V6 Pillar 1) does not yet have an equivalent spatial surface on
  `/work/[slug]` to highlight against.
- **The companion's route allowlist is (`/`, `/work`, `/about`,
  `/contact`)** — `/work/[slug]` case-study pages are covered by the
  `/work` prefix match, but this was verified for RC-01's general
  presence, not for any deeper per-project spatial integration, since none
  exists yet.
- **No soak-testing beyond RC-01 activate/deactivate cycles.** Phase I's
  soak test (`scripts/soak-test.mjs`) covers RC-01 specifically; it does
  not cover repeated navigation through a hypothetical new Atlas/Time-
  Machine spatial UI, since that UI doesn't exist yet.
- **The V4→V5→V5.1 JS bundle growth investigation found the initial home-page
  JS load is already 663–697KB** across all three versions (V4 included) —
  a real, measured, pre-existing cost from the framework, GSAP, and page
  content, not something V5.1 introduced. Any new V6 spatial/3D system adds
  to this existing baseline, not a clean-slate budget.
- **No project has a real screenshot or architecture-diagram image
  supplied** — every visual is code-generated from typed data
  (`ProjectCoverArt`, `InfrastructureObservatory`). V6's "worlds" and
  "evidence layers" must continue this pattern; there is no photographic
  or diagrammatic source material to build from.

## Reusable systems (do not rebuild)

| System | File(s) | Reuse for V6 |
|---|---|---|
| Typed content + `Field<T>` "needs-input" pattern | `content/types.ts`, `content/projects.ts`, `content/spine.ts` | Content Matrix, Proof Mode's verified/missing split |
| Per-stage highlight event bus | `lib/companion/observatoryHighlight.ts` | Time Machine ↔ RC-01 sync |
| Reduced-motion / low-power / WebGL-fallback chain | `lib/motion/useReducedMotion.ts`, `lib/companion/useWebGLSupport.ts`, `CompanionPortrait.tsx` | Any new 3D/spatial surface must plug into this existing chain, not invent a parallel one |
| Route allowlist gating | `components/companion/CompanionRoot.tsx` | Extending presence rules to new routes/worlds |
| Desktop dock / mobile 3-state pattern | `CompanionExperience.tsx`, `app/globals.css` (`data-rc01-docked`) | Any new persistent spatial panel |
| Speech + caption sync | `lib/companion/useCompanionSpeech.ts`, `content/companion.ts` | RC-01 narration for new Atlas/Time-Machine content |
| Security headers | `next.config.ts` | Unchanged, extend if new routes are added |
| Screenshot/video capture tooling (with two known race-condition classes already found and fixed) | `scripts/capture-v5-1.mjs`, `scripts/record-interaction-video.mjs` | Template for V6 capture tooling — reuse the "wait for real settle, not a fixed delay" lessons directly |

## Technical debt

- `scripts/compare-bundle-sizes.mjs` remains in the repo as a known-flawed
  measurement script (its "wait until request count stabilizes" heuristic
  proved racy) — kept as a record per the V5.1 report's own instruction,
  superseded by `scripts/diff-bundle-chunks.mjs`. Any V6 bundle-measurement
  tooling should be built on the Resource-Timing-API pattern from
  `diff-bundle-chunks.mjs`, not the older heuristic.
- The scroll-timing bug found in Phase G (a JS-invoked `scrollIntoView({behavior:
  "smooth"})` silently overriding a CSS `scroll-behavior: auto !important`
  override) is a real Chromium behavior, not a one-off — any new
  V6 camera/scroll choreography that mixes JS-driven scrolling with
  screenshot/video capture tooling will hit the same class of race unless
  it waits for real settle (poll `scrollY`/camera position) rather than a
  fixed delay.
- No CSP is configured (`next.config.ts` explicitly omits one, per prior
  instruction not to ship an untested CSP). If V6 introduces new script
  sources (e.g. a CDN font, an analytics-free but externally-hosted
  library), this becomes a real gap to close, not defer again.

## Project-specific opportunities

Derived only from `content/projects.ts`'s real fields — see the Content
Matrix document for the complete per-project breakdown:

- **Project Aurora** (`commit → build → container → cloud`): the only
  flagship project with a real repository link. Its `flow` string
  ("Git -> Build -> Image -> Compose Network -> App/MySQL -> Nginx -> EC2")
  already reads as a literal path through space — a strong candidate for
  the first "world" built, since it has the most external verification
  available (a real, clickable repo).
- **Distributed Jenkins Controller** (`commit → build → test`): the
  shortest spine path (3 stages) of the four — a good candidate for
  proving out the Time Machine's minimum-viable sequence before building
  the longer paths.
- **Secure AWS Production Architecture** (`network → cloud → observe →
  recover`): carries an explicit `labelNote` ("Architecture / learning
  implementation, not used for a real production client") that any V6
  narration or evidence layer must continue to surface verbatim — this is
  exactly the kind of honesty constraint Proof Mode exists to enforce.
- **Node.js Auth + RDS** (`build → container → cloud → observe`): the only
  project whose `flow` includes "Container-free deploy" as an explicit
  contrast point — a real opportunity for the Time Machine to show two
  projects taking different paths through the same `cloud` stage, if V6
  wants to demonstrate stage reuse across projects rather than one path
  per project.

## Mobile constraints

- Existing breakpoints tested: 375, 768, 1024, 1440, 1920px (5 breakpoints,
  matching `scripts/capture-v5-1.mjs`'s matrix).
- RC-01's mobile pattern (collapsed peek default → medium → expanded, with
  safe-area insets) is proven and tested; any new V6 spatial UI on mobile
  should follow the same three-state discipline rather than introduce a
  fourth interaction pattern for visitors to learn.
- No canvas-count limit is currently enforced in code (only convention: one
  Canvas, verified by the soak test's own assertion) — V6 introducing
  multiple concurrent 3D surfaces (Atlas + Time Machine + RC-01) needs an
  explicit, enforced limit, not just a convention, especially on mobile
  where GPU/memory budgets are tighter.

## Accessibility constraints

- Every companion control has a verified non-empty accessible name (tested).
- `Escape` closes the open panel and returns focus (document-level
  listener, not scoped to a subtree that can lose focus — a real bug this
  fixed).
- The companion is `role="region"`, not a modal — it never traps focus.
  Any new V6 spatial UI (Atlas, Time Machine, Proof Mode) must follow the
  same non-trapping pattern unless there's a specific, justified reason for
  a true modal.
- Captions are `aria-live="polite"` on an `sr-only` element separate from
  the always-visible caption list — new narration surfaces must preserve
  this separation, not just add more visible text.
- No reduced-motion-specific accessibility test exists yet for anything
  beyond RC-01's own Canvas (e.g. `prefers-reduced-motion` disabling a
  hypothetical camera fly-through) — this needs new test coverage, not an
  assumption that the existing `useReducedMotion()` hook alone suffices for
  new camera-movement-heavy features.

## Content dependencies

Per `CONTENT_GAPS.md` (unchanged, internal tracking only, `Field<T>`
"needs-input" pattern — see the Content Matrix document for the full,
current list): no résumé PDF, one experience entry missing achievement
bullets, 8 certifications missing issuer link/credential ID, all 4
flagship projects missing real screenshots (code-generated cover art used
instead), 7 lab projects missing repository links, and the "Cinematic Web
Experience" lab project's live URL withheld pending a content/access
review.

**This directly blocks or shapes several V6 pillar ideas** — flagged
explicitly in the Content Matrix's "statements that must not be made"
column per project, and summarized in the Plan document's dependency notes
per phase.

## V6 risks

- **Scope risk**: seven pillars (Atlas, Time Machine, RC-01 upgrade, Proof
  Mode, three visitor paths, spatial design system, performance budgets)
  is a large surface for one portfolio site. The Plan document sequences
  phases so that a partial V6 (e.g. Atlas + Time Machine shipped, Proof
  Mode deferred) is still a coherent, honestly-describable increment, not
  a half-built mess.
- **Performance risk**: V5.1's own investigation found the *existing*
  initial JS load is already 663–697KB before any V6 feature exists.
  Adding a second and third concurrent spatial system (Atlas, Time
  Machine) on top of RC-01 without hard, enforced budgets risks
  regressing intent-only loading's core promise. The Performance Budget
  document sets targets before implementation, per explicit instruction,
  and nothing in it should be read as already achieved.
- **Consistency risk**: RC-01's per-stage highlight event bus was built
  for a single home-page Observatory + Spine pair. Extending it to
  per-project worlds on `/work/[slug]` requires either a route-scoped
  event payload or separate listener wiring per world — an architectural
  decision the Plan document must make explicitly, not leave implicit.
- **Content risk**: several pillar ideas (per-project "worlds," detailed
  evidence in Proof Mode) are only as rich as the real facts in
  `projects.ts` allow. Two of four flagship projects have empty `links: []`
  arrays (no repository) — any V6 feature implying "explore the real
  repository" for those two projects would misrepresent what's actually
  available.
- **Regression risk to V5.1**: this is a new branch parented on the
  verified, tagged V5.1 state specifically so V5.1 can be pointed to
  independently if V6 stalls or is descoped — the Plan's Phase 1 (baseline
  protection) exists to keep that guarantee real throughout implementation,
  not just at the start.

## Recommendations

1. Treat the Infrastructure Observatory and Reliability Spine as the
   literal foundation of the Atlas and Time Machine pillars — extend them,
   don't replace them. They already contain the real data model V6 needs.
2. Build Project Aurora's "world" first — it has the most real, verifiable
   content (an actual repository link) and the most complete stage
   coverage (4 stages) to prove the pattern before committing to all four.
3. Extend `observatoryHighlight.ts`'s event model with a route/project
   scope rather than building a second, parallel event system for
   per-project worlds.
4. Do not build Proof Mode's "Repository or deployment links" section for
   the two projects with empty `links: []` until real links are supplied —
   render the same honest "needs-input" pattern the rest of the site
   already uses, not a placeholder that implies a link exists.
5. Set and gate on the Performance Budget document's numbers before
   building the second concurrent 3D system — measure Atlas alone against
   budget before adding Time Machine, rather than building both and
   measuring once at the end.
6. Reuse the exact screenshot/video capture lessons from V5.1's Phase G/H
   (wait for real settle, not fixed delays; individually inspect every
   capture, don't just count them) in any new V6 capture tooling from the
   start, rather than rediscovering the same race conditions.
