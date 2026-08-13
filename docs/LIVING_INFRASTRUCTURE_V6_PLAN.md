# Living Infrastructure V6 — master plan

**Status: preparation only. No phase below has begun implementation.**
Branch `living-infrastructure-v6`, parented on tag `jury-refinement-v5.1-final`
(commit `8574469`). Preview port 3500. This plan evolves V5.1 — see the
Discovery document's "Reusable systems" table for what each phase is
explicitly required to build on rather than replace.

Protected branches, never modified or merged during this work: `main`,
`visual-rebuild-v2`, `award-polish-v3`, `award-experience-v4`,
`immersive-ops-v5`, `jury-refinement-v5-1`.

## How to read each phase

Every phase lists: **Objective**, **Files/systems affected**,
**Dependencies**, **Acceptance criteria**, **Targeted tests**, **Risks**,
**Rollback boundary** (the last-known-good state to return to if the phase
needs to be abandoned mid-way, without reverting phases before it).

---

## Phase 1 — Baseline protection

**Objective:** Prove the V6 worktree starts from an unmodified, verified
V5.1 state, and keep a continuously-runnable check that V5.1's own
guarantees (route presence, security headers, existing tests) still hold
throughout V6 development — the same discipline V5.1's own Phase 0
established for itself.

**Files/systems affected:** none modified; this phase is verification only
(`git status`, `git log`, `npm ci`, `npm run verify` run once to confirm a
clean starting point).

**Dependencies:** none — this is the first implementation phase.

**Acceptance criteria:** `git log` confirms `living-infrastructure-v6`'s
parent is exactly `jury-refinement-v5.1-final`; `git status --short` is
empty; `npm run verify` passes with the same 31/31 unit test count as the
V5.1 report before any V6 file is touched.

**Targeted tests:** the full existing suite, once, as a baseline — not
rerun after every subsequent phase (see Phase 15 for the targeted-rerun
discipline that follows).

**Risks:** none specific to this phase — it is the phase that exists to
catch risk elsewhere early.

**Rollback boundary:** `git reset --hard jury-refinement-v5.1-final` (only
if literally nothing has been committed yet on this branch).

---

## Phase 2 — Experience architecture

**Objective:** Decide, on paper, the concrete technical shape of "Living
Infrastructure": how Atlas/Time-Machine/RC-01 share (or don't share) a
Canvas, how routes are organized (new routes vs. sections of existing
ones), and how the per-stage event model (`observatoryHighlight.ts`)
extends to a route/project-scoped version — before any component is
written. This is the phase that resolves the Discovery document's
"consistency risk" explicitly rather than leaving it implicit.

**Files/systems affected:** none yet — output is architectural decisions
recorded in this document's later phases and, if needed, a short
addendum; first code touched is Phase 3.

**Dependencies:** Phase 1.

**Acceptance criteria:** a written decision (in this document, refined
here) on: (a) single shared Canvas vs. multiple, given the Performance
Budget's canvas-count limit; (b) whether flagship "worlds" live at new
routes (`/work/[slug]/world`) or as an in-page mode of the existing
`/work/[slug]` case-study page; (c) the exact shape of a route-scoped
`observatoryHighlight` event payload.

**Decisions made in this preparation pass** (to avoid a second, redundant
planning cycle later): Atlas and Time Machine share **one** Canvas with
RC-01, using R3F's support for multiple logical scenes/portals within a
single `<canvas>`, to satisfy the Performance Budget's 1-canvas limit
without forcing mutual exclusion UX. Flagship "worlds" extend the existing
`/work/[slug]` route (a mode/section within it) rather than new routes —
this keeps the existing route allowlist, tests, and sitemap entries valid
without new route-presence rules to design from scratch. The highlight
event gains an optional `scope: { route: string; projectSlug?: string }`
field, defaulting to today's ungscoped behavior when omitted, so existing
home-page listeners need no changes.

**Targeted tests:** none (architecture-decision phase).

**Risks:** deciding wrong here is expensive to unwind later — this phase's
output is deliberately conservative (extend existing routes/events rather
than parallel new systems) specifically to bound that risk.

**Rollback boundary:** revert this document's decisions section; no code
exists yet to roll back.

---

## Phase 3 — Infrastructure Atlas foundation

**Objective:** Build the shared spatial/data foundation the four project
"worlds" (Phase 5) will each instantiate — not any single world yet, but
the reusable system: a typed per-project node layout, camera framing
rules, and the route-scoped highlight wiring decided in Phase 2.

**Files/systems affected:** new `lib/atlas/` (node-layout derivation from
each project's `flow` string — reusing the existing string, not inventing
new coordinate data by hand per project), extends
`lib/companion/observatoryHighlight.ts` with the scoped payload from
Phase 2.

**Dependencies:** Phase 2's architecture decisions; the Content Matrix's
per-project `flow`/node data (already complete, no new content needed).

**Acceptance criteria:** given any one flagship project's typed data, the
Atlas foundation can derive a node list and connection order without
per-project hand-authored layout — verified against all four projects'
real data, including the two shortest (Jenkins, 3 stages) and longest
(Aurora, 4 nodes across a longer flow string) to confirm the derivation
doesn't assume a fixed node count.

**Targeted tests:** new unit tests for the node-derivation function
(given a `flow` string, produces the expected node list) — pure function,
no Canvas needed, fast to test.

**Risks:** the **content risk** flagged in Discovery (Node.js Auth's
`container`/"Container-free" inconsistency) surfaces concretely here if
node derivation blindly trusts `spineStages` — the derivation must prefer
the `flow` string's literal stage order, with `spineStages` used only for
cross-project spine-highlight sync, not as the node list itself.

**Rollback boundary:** delete `lib/atlas/`; no other system depends on it
yet at this phase.

---

## Phase 4 — Architecture Time Machine

**Objective:** Build the stage-sequencing/scrubbing mechanism that lets a
visitor move through a project's real delivery stages in order (Source/
Review/Build/Test/... per the brief, mapped onto the *existing* 8-stage
spine vocabulary rather than a new one — see Acceptance criteria).

**Files/systems affected:** new `components/atlas/TimeMachine.tsx` (or
similar), reuses `lib/atlas/` from Phase 3 and the scoped highlight event.

**Dependencies:** Phase 3.

**Acceptance criteria:** for each flagship project, the Time Machine only
ever presents the stages that project's `spineStages` array actually
contains (3 for Jenkins, 4 for the other three) — never pads to a fixed
9-stage sequence with empty/placeholder stages, directly satisfying the
brief's "not every project needs every stage" instruction. Stage labels
and descriptions come verbatim from `content/spine.ts` (already written,
already correct) — no new stage vocabulary is invented to match the
brief's example list (Source/Review/Build/Test/Package/Deploy/Secure/
Observe/Recover), since the existing 8-stage spine already covers the same
ground under names the rest of the site (and RC-01) already uses
consistently.

**Targeted tests:** Playwright coverage that scrubbing through Jenkins'
Time Machine shows exactly 3 stages, and Aurora's shows exactly 4, with
no placeholder/empty stage rendered for either.

**Risks:** temptation to introduce the brief's example stage names
(Source, Review, Package, Deploy, Secure) as a *second* vocabulary
alongside the existing spine's (Commit, Build, Test, Container, Network,
Cloud, Observe, Recover) would fragment the site's information
architecture and require RC-01 to reconcile two naming systems live. This
plan resolves that by treating the brief's list as illustrative, not
literal — the existing 8 stages are the real vocabulary.

**Rollback boundary:** delete `components/atlas/TimeMachine.tsx`; Phase 3's
foundation remains independently useful (e.g. for a future non-Time-
Machine view).

---

## Phase 5 — Flagship project worlds

**Objective:** Instantiate one explorable "world" per flagship project on
its existing `/work/[slug]` route (per Phase 2's decision), built only
from that project's verified data.

**Files/systems affected:** `app/work/[slug]/page.tsx` (mode/section
addition, not replacement), new per-world presentational components under
`components/atlas/worlds/` or similar, consuming Phase 3/4's shared
systems.

**Dependencies:** Phases 3 and 4; the Content Matrix (complete).

**Acceptance criteria, per the Discovery document's recommendation:**
Project Aurora's world ships first and is validated (including its real
repository link surfaced correctly) before the other three are built, so
the pattern is proven once rather than four times in parallel. The Secure
AWS Production Architecture world **must** render its `labelNote`
("Architecture / learning implementation, not used for a real production
client") wherever the project is presented, not only in a tooltip a
visitor might miss.

**Targeted tests:** one Playwright test per world confirming: correct
node count matches that project's real stage count, the label note renders
for the Secure AWS project specifically, and no fabricated metric/link
appears for the three projects with `links: []`.

**Risks:** the Content Matrix's "statements that must not be made" columns
are the concrete acceptance bar here — any narration or evidence text
that crosses into forbidden territory for a given project (e.g. implying
a repository exists for Jenkins) is a Phase 5 defect, not a later Proof
Mode defect, since worlds are where evidence first gets surfaced.

**Rollback boundary:** each world is additive to its own project's route
section — a single world can be reverted independently without affecting
the other three, since Phase 2 deliberately avoided a shared "all four
worlds must ship together" route structure.

---

## Phase 6 — RC-01 system-guide upgrade

**Objective:** Extend RC-01's existing tour/highlight system to guide
visitors through Atlas/Time-Machine content, using the scoped event model
from Phase 2 — not a new, separate guide character.

**Files/systems affected:** `components/companion/CompanionExperience.tsx`,
`content/companion.ts` (new tour entries only for real, existing project
content — no new facts), `lib/companion/observatoryHighlight.ts` consumers.

**Dependencies:** Phases 2–5.

**Acceptance criteria:** RC-01 can point toward and narrate Atlas/Time-
Machine nodes using the same `dispatchObservatoryHighlight`-style pattern
already proven for the home-page Spine — verified by a test walking a
world-specific tour and asserting the highlighted node changes per step,
mirroring the existing per-stage-highlight test pattern from V5.1's Phase
E. RC-01 continues to refuse unrestricted questions (no change to the
command console's "unknown input always returns the same documented help
text" behavior) and never claims AI, live operational state, or invented
metrics — this is a direct carry-forward of V5's non-negotiables, not a
new decision.

**Targeted tests:** extend `tests/e2e/companion.spec.ts` with world-tour
coverage; explicitly re-run the existing privacy `grep` checks from the V5
report (`getUserMedia`, `microphone`, `SpeechRecognition`, outbound
`fetch`/`analytics`) against all new companion-adjacent files, not just
the original set — the brief's explicit "must not... send interaction
data externally" requirement is verified the same way it always has been:
by grepping the actual source, not by trusting a description of intent.

**Risks:** scope creep toward "RC-01 answers anything" is the most likely
failure mode for a guide upgrade — the acceptance criteria above exist
specifically to keep RC-01 deterministic and content-bounded, matching
the brief's explicit "not fake AI" instruction.

**Rollback boundary:** new tour entries in `content/companion.ts` and new
event dispatches are additive; removing them returns RC-01 to exactly its
V5.1 behavior.

---

## Phase 7 — Proof Mode

**Objective:** Build the evidence-layer view (architecture, stack,
decisions, security controls, validation, commands, failure/recovery,
known limitations, links-when-real) per flagship project, strictly from
the Content Matrix's "verified facts" and "evidence available" columns.

**Files/systems affected:** new `components/work/ProofMode.tsx` (or
similar), consuming `content/projects.ts` directly — no new content
schema needed, since `FlagshipProject`'s existing fields
(`implementationDecisions`, `toolsAndServices`, `challengeAndResolution`,
`links`) already map onto Proof Mode's required sections almost exactly.

**Dependencies:** Phase 5 (worlds provide the spatial context Proof Mode
attaches to); the Content Matrix.

**Acceptance criteria:** three-way visual/structural separation between
verified evidence, design explanation, and missing information is present
for every flagship project — for the three projects with `links: []`,
Proof Mode renders the same honest `Field<>` "needs-input" treatment the
rest of the site already uses elsewhere (e.g. the résumé PDF gap), not a
disabled-looking button that implies a link exists but is broken, and not
an omission that implies no link was ever expected.

**Targeted tests:** Playwright assertion that Proof Mode never renders a
clickable link for a project whose `links` field is empty or
`needs-input`, and does render one for Project Aurora's real repository
URL.

**Risks:** the biggest risk is Proof Mode accidentally *reading better*
than the real evidence supports — e.g. presenting "Validation steps" as a
formal test suite when the actual verified fact is prose like "verified
database connectivity, application response, registration, login, and
stored records end to end." Acceptance criteria require Proof Mode to
quote/closely paraphrase the actual `challengeAndResolution` text, not
reformat it into a more impressive-sounding structure than the source
supports.

**Rollback boundary:** Proof Mode is a new, additive view — removing its
route/section reverts each project page to its pre-Phase-7 (Phase 5)
state.

---

## Phase 8 — Recruiter, Engineer, and Explorer paths

**Objective:** Implement the three visitor-intent entry paths as a
local-only preference that reshapes narration depth and pacing —
extending RC-01's existing Recruiter/Engineering tour distinction (already
proven in V5.1) to a third, cinematic "Explorer" path, and to Atlas/Time-
Machine/Proof-Mode content, not just RC-01's own tours.

**Files/systems affected:** `lib/companion/useCompanionPreferences.ts`
(existing `localStorage`-backed preferences hook — extended, not
replaced), new UI for path selection.

**Dependencies:** Phases 6 and 7 (paths need real guided/evidence content
to differentiate between).

**Acceptance criteria:** path selection persists only in `localStorage`
(matching the existing low-power-toggle pattern) — **no analytics, no
tracking, no network request tied to path selection**, verified the same
way Phase 6's privacy grep is verified: by grepping the actual new files
for `fetch`/`analytics`/`gtag`/`sendBeacon`/external URLs, zero matches
required. Explorer path respects `prefers-reduced-motion` per the
Performance Budget's reduced-motion target (static, navigable steps
instead of a slowed cinematic sequence).

**Targeted tests:** unit test confirming path selection writes only to
`localStorage`; Playwright test confirming no outbound network request
fires on path selection (matching the existing pattern used to verify
RC-01 has no external calls).

**Risks:** "Explorer" is the least-specified of the three paths in the
brief (a real word — "cinematic guided experience" — but no concrete
mechanism). This plan treats Explorer as a *pacing/depth* setting over the
same real Atlas/Time-Machine/Proof-Mode content the other two paths use,
not a fourth content system — avoiding a maintenance burden of one more
parallel narrative to keep factually honest.

**Rollback boundary:** path selection defaults to an unset state
equivalent to today's single, undifferentiated experience — removing the
preference read returns every visitor to current V5.1 behavior.

---

## Phase 9 — Spatial transitions

**Objective:** Build the camera/scene transitions between Atlas overview,
an individual world, and Time-Machine scrubbing, within the Performance
Budget's route-transition and long-task targets.

**Files/systems affected:** camera-control code within the shared Canvas
system from Phase 2/3, likely `lib/atlas/camera.ts`.

**Dependencies:** Phases 3–5 (needs real scenes to transition between).

**Acceptance criteria:** every transition respects
`prefers-reduced-motion` (instant cut instead of animated camera move, per
the Performance Budget); no transition exceeds the Performance Budget's
long-task threshold — measured, not assumed, via `PerformanceObserver`
`longtask` entries during a Playwright-driven transition.

**Targeted tests:** Playwright + `PerformanceObserver` measurement per
transition type (Atlas → world, world → Time Machine, Time Machine stage
scrub).

**Risks:** camera choreography is the single most likely source of a
long-task violation (large procedural geometry rebuilds mid-transition) —
the Performance Budget's guidance to chunk construction across frames
applies most directly here.

**Rollback boundary:** transitions can degrade to instant cuts (no
animation) without removing the underlying navigation — a safe partial
rollback that keeps functionality while dropping only the cinematic layer.

---

## Phase 10 — Mobile and reduced-motion experiences

**Objective:** Extend RC-01's proven three-state mobile pattern
(collapsed/medium/expanded) and existing reduced-motion fallback chain to
Atlas/Time-Machine/Proof-Mode, rather than inventing new mobile
interaction patterns.

**Files/systems affected:** mobile-specific layout for
`components/atlas/*` and Phase 7's Proof Mode.

**Dependencies:** Phases 3–7.

**Acceptance criteria:** at the existing 375px breakpoint, no new
horizontal overflow is introduced (matching the exact assertion style
already used in `tests/e2e/responsive.spec.ts` and
`companion.spec.ts`'s mobile tests); reduced-motion mode across all new
surfaces never mounts a 3D canvas reduced-motion-off mode would (matching
RC-01's existing verified behavior, extended).

**Targeted tests:** extend `tests/e2e/responsive.spec.ts` with Atlas/
Time-Machine/Proof-Mode routes at all 5 existing breakpoints
(375/768/1024/1440/1920px) — the same matrix already proven, not a new one.

**Risks:** the Discovery document's mobile-constraint note (no enforced
canvas-count limit today, only convention) becomes concrete risk here if
Atlas is mounted on mobile alongside RC-01 without the Phase 2 shared-
Canvas decision actually holding under real mobile GPU/memory pressure —
this phase is where that decision gets its first real mobile-device-class
test, not just a desktop-browser Playwright run.

**Rollback boundary:** mobile-specific Atlas/Time-Machine layout can fall
back to a simplified, non-3D list view (reusing `ReliabilitySpine.tsx`'s
existing linear-list pattern) without removing desktop functionality.

---

## Phase 11 — Performance engineering

**Objective:** Measure every target in `LIVING_INFRASTRUCTURE_V6_PERFORMANCE_BUDGET.md`
against a real production build for the first time, and close any gap
found — this is where budgets stop being targets and start being either
met or explicitly reported as not met.

**Files/systems affected:** whichever files measurement reveals need
optimization; new `scripts/` tooling built on `diff-bundle-chunks.mjs`'s
proven Resource-Timing-API pattern (not the older, proven-racy
stabilization heuristic).

**Dependencies:** Phases 3–10 (needs real, complete features to measure —
measuring a partial build would produce numbers that don't mean anything
for the finished feature set).

**Acceptance criteria:** every Performance Budget target has a real
measured number, reproduced at least twice (the V5.1-established standard
for trusting a performance number, after the bundle-comparison
methodology mistake), before being reported as met.

**Targeted tests:** the measurement scripts themselves are the "test" here
— extend `check-bundle-cost.mjs` and `diff-bundle-chunks.mjs` patterns to
cover Atlas/Time-Machine's own chunk boundaries.

**Risks:** the single largest risk in the whole V6 plan, per the Discovery
document — three concurrent spatial systems (RC-01, Atlas, Time Machine)
against a shared Canvas is a genuinely new architecture, not a proven one,
and this is the phase where budget violations, if any exist, become
undeniable rather than theoretical.

**Rollback boundary:** any single feature found to blow its budget can be
gated behind the existing intent-only-loading pattern (load even later,
on a more deliberate second click) rather than being cut entirely — a
softer rollback than removal.

---

## Phase 12 — Accessibility and privacy

**Objective:** Extend V5.1's accessibility guarantees (non-empty
accessible names, non-trapping focus, `aria-live` caption separation,
Escape-to-close, focus-return-on-close) to every new V6 surface, and
re-verify the existing privacy guarantees (no microphone, no speech
recognition, no outbound network calls) against the full, larger V6
codebase.

**Files/systems affected:** all Phase 3–9 components, audited; no new
systems.

**Dependencies:** Phases 3–9 substantially complete (auditing incomplete
features produces incomplete results).

**Acceptance criteria:** every new interactive control has a verified
non-empty accessible name (test-verified, matching V5.1's own standard,
not just convention); no new surface traps focus; the four privacy `grep`
checks from the V5 completion report re-run against the entire `components/`
and `lib/` tree (not just the companion directory) return zero matches.

**Targeted tests:** extend `tests/e2e/accessibility.spec.ts` with Atlas/
Time-Machine/Proof-Mode coverage; rerun the exact `grep` commands from the
V5 report, expanded in scope, with their output pasted into the eventual
completion report exactly as V5's did.

**Risks:** a second/third 3D system is a second/third opportunity to
reintroduce a `role="dialog"`-style focus trap by accident, or to forget
the `aria-live` caption separation pattern in a new narration surface —
this phase exists specifically to catch drift from an established, proven
pattern into a subtly different, unproven one.

**Rollback boundary:** accessibility fixes are corrections to existing
Phase 3–9 code, not new features — no independent rollback boundary; they
travel with the phase they correct.

---

## Phase 13 — Security

**Objective:** Confirm V6 introduces no new attack surface beyond what
V5.1's headers already cover, and extend header coverage to any new route
introduced (though Phase 2 deliberately avoided new routes, so this is
primarily re-verification, not new configuration).

**Files/systems affected:** `next.config.ts` (only if Phase 2's
route-reuse decision changes during implementation and a new route is
introduced after all).

**Dependencies:** Phase 2's route decision (if it holds, this phase is
verification-only).

**Acceptance criteria:** `curl -I` against every real route (existing +
any new one) on the port-3500 production preview shows all five existing
security headers, `X-Powered-By` absent — the exact verification method
V5.1's Phase F used, reapplied.

**Targeted tests:** no new automated test needed beyond re-running the
existing header-verification `curl` commands against the expanded route
set.

**Risks:** low, given Phase 2's decision to avoid new routes — the main
risk is scope drift during implementation reintroducing a new route
without this phase being revisited.

**Rollback boundary:** N/A — this phase either confirms an already-correct
state or fixes a config regression; no feature to roll back.

---

## Phase 14 — Capture and video tooling

**Objective:** Build V6's screenshot/video capture tooling directly on the
lessons from V5.1's Phase G/H — real-settle detection instead of fixed
delays, individual inspection instead of counting, from the start.

**Files/systems affected:** new `scripts/capture-v6.mjs`,
`scripts/record-v6-interaction-video.mjs`, modeled on
`capture-v5-1.mjs`/`record-interaction-video.mjs`'s final (corrected)
patterns, not their first-draft ones.

**Dependencies:** Phases 3–10 (needs finished UI to capture).

**Acceptance criteria:** the capture script polls for real settle
(matching the `window.scrollY` stability pattern that fixed V5.1's
blank-screenshot bug) for any new scroll/camera-driven capture, rather
than reintroducing a fixed-delay race; every captured screenshot is
individually opened and inspected before being reported complete, per the
explicit standard the second V5.1 correction established.

**Targeted tests:** none (tooling, not application code) — its own output
(the screenshots/video) is the verification artifact, reviewed per Phase
16.

**Risks:** repeating either of V5.1's two found capture bugs (scroll-race
blank frames, incomplete video-sequence coverage) is the concrete risk
this phase exists to prevent — both are documented in detail in the V5.1
report specifically so V6 tooling doesn't rediscover them independently.

**Rollback boundary:** N/A — tooling only, no application behavior
depends on it.

---

## Phase 15 — Automated testing

**Objective:** Consolidate all the per-phase "Targeted tests" above into
the actual `tests/e2e/*.spec.ts` and `tests/unit/*` additions, and run the
full suite once, completely, for the first time since Phase 1's baseline.

**Files/systems affected:** `tests/e2e/*.spec.ts` (extended, not
replaced), possibly a new `tests/e2e/atlas.spec.ts` if the existing
`companion.spec.ts` would become unwieldy combined with world/Time-
Machine coverage.

**Dependencies:** Phases 3–13 complete (this is explicitly the
consolidation phase, not a parallel-track one — per this preparation
pass's own instruction not to run the full suite repeatedly during
non-behavioral work, full-suite runs are reserved for points like this
where a real batch of behavioral change has landed).

**Acceptance criteria:** the full suite passes with `--workers=1` (the
V5.1-established isolation discipline for this VM's environment), and any
environmental flakiness is diagnosed per V5's established method (isolate,
rerun, confirm non-reproducible under isolation) rather than hidden or
endlessly retried.

**Targeted tests:** this phase *is* the targeted-tests phase for every
prior one — see each phase's own "Targeted tests" line for what
specifically gets added here.

**Risks:** test-count growth (V5.1 already has 70 e2e + 31 unit) means
full-suite wall-clock time will grow further; `--workers=1` isolation,
already necessary on this VM per V5's own documented CPU-contention
findings, will take proportionally longer — budget real time for this,
not assume it stays at V5.1's ~11.4 minutes.

**Rollback boundary:** N/A — this phase surfaces defects in earlier
phases; fixes apply to those phases, not this one.

---

## Phase 16 — Production validation and completion report

**Objective:** The exact V5.1 discipline, applied to V6: real production
build, real `curl` header checks, real route-by-route verification, real
measured Performance Budget numbers, complete screenshot/video inventory
individually inspected, honest reporting of anything not fully done,
commits with real hashes, a completion report that states what's true
rather than what was intended.

**Files/systems affected:** new `docs/LIVING_INFRASTRUCTURE_V6_COMPLETION_REPORT.md`.

**Dependencies:** all prior phases.

**Acceptance criteria:** matches every item in V5.1's own completion
report structure — exact parent commit, skills used by phase, complete
file inventory, known limitations stated (not omitted), remaining content
gaps stated, preview URL, exact restart command, rollback instructions,
complete screenshot inventory, video verification inventory, final commit
record. Any Performance Budget target not met is reported as not met,
with the real measured number, not silently dropped.

**Targeted tests:** the full suite, one final time, plus the complete
Phase 11 measurement set, plus the complete Phase 14 capture set,
individually reviewed per Phase 14's standard.

**Risks:** the temptation to declare V6 "done" before every item above is
either complete or explicitly logged as incomplete — the exact failure
mode the second V5.1 correction had to fix after the first V5.1
correction. This plan states the same standard up front specifically so
V6 doesn't need a correction pass to reach it.

**Rollback boundary:** the tag `jury-refinement-v5.1-final` remains the
permanent, unmodified fallback for the entire V6 effort — at any point
before V6 is itself tagged/merged, the portfolio can be restored to
exactly the verified V5.1 state by checking out that tag.

---

## Proposed implementation order

Phases are numbered in dependency order already; the practical execution
grouping is: **1–2** (protection + architecture decisions) → **3–5**
(Atlas/Time-Machine/worlds, Aurora first) → **6–8** (RC-01 upgrade, Proof
Mode, visitor paths) → **9–10** (transitions, mobile/reduced-motion) →
**11–13** (performance, accessibility, security — measurement and
hardening) → **14–16** (tooling, tests, final validation and report).
