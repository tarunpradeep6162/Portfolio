# Portfolio V9 — Design Directions

Three genuinely different strategies for *how* to build "Autonomous Cloud
Mission Control" — not whether to build it. The working title and the
seven pillars are the product brief; these directions differ in what gets
rebuilt, what gets reused, and where the engineering risk sits.

## Direction A — Full Spatial Mission Control

One persistent 3D/spatial "control room" viewport that every pillar routes
through — Recruiter, Engineer, and Explorer paths all present as camera
moves or panel states inside a single continuous 3D scene, replacing
Atlas/Operational Twin/RC-01's current separate activation points with one
always-reachable spatial shell.

**Why it's tempting**: closest literal match to "cinematic Cloud Mission
Control," most visually distinctive, strongest single answer to "feels
like one coherent portfolio."

**Why it's risky**: requires substantial new 3D scene/camera/interaction
work beyond what `components/v8/ControlRoomScene.tsx` currently does (it
hosts one scene at a time on user intent; this direction wants one scene
*always* mounted, which conflicts with "zero 3D bytes before user intent"
unless very carefully staged, and raises the one-canvas invariant from "at
most one scene at a time" to "exactly one scene, permanently, on every
visit"). It touches the exact lifecycle code that took 7 phases and one
real regression to stabilize in V8, for a portfolio whose primary
audience (recruiters, on mobile, with 60 seconds) is the least tolerant of
a shaky 3D-first experience. Highest chance of needing new runtime
dependencies and repeated testing cycles — both explicitly to be
minimized per the task instructions.

## Direction B — Guided Mission Control (2D-first, spatial as accent)

Mission Control expressed through UI chrome, typography, motion language,
and a strong navigation/orchestration layer — not through a new persistent
3D scene. The existing intent-loaded 3D systems (Atlas, Operational Twin,
RC-01) are reused exactly as V8 built them, unmodified. New pillars
(Recruiter Flight Plan, Scenario Simulator, Evidence Graph, Command
Interface) are built primarily in HTML/CSS/motion, connecting to and
framing the existing evidence rather than replacing how it's rendered.

**Why it fits**: the actual gap identified in
`docs/PORTFOLIO_V9_DISCOVERY.md` is a missing *connective* layer, not
missing 3D content — V8 already has three working 3D systems and a proven
shared host. The highest-value, lowest-risk move is spending new
engineering effort on wayfinding and narrative connection (which is what
was actually missing), while treating the proven 3D lifecycle as a stable
foundation, not a rebuild target. This also directly serves "cloud
infrastructure only" and "minimize token consumption and repeated
testing" — most of V9's new surface area is content/routing/motion work
that can be validated with fast, targeted checks, not full 3D
regression sweeps.

**Trade-off**: less immediately "wow" than Direction A on first
impression; the cinematic feel has to be earned through typography,
motion discipline, and pacing rather than a single dramatic 3D moment.

## Direction C — Modular Mission Deck

A widget/panel-based console grid (real mission-control-aesthetic:
discrete tiles for health, incidents, evidence, skills, etc.), assembled
per visitor path — Recruiter sees a compact tile set, Engineer sees an
expanded grid, Explorer sees everything.

**Why it's tempting**: fast to build incrementally, each pillar maps
cleanly to one tile, easy to reason about in isolation.

**Why it's disqualifying**: this is architecturally the "collection of
unrelated dashboards" the task explicitly says V9 must *not* feel like.
Modularizing by tile is exactly what produces that impression — V8 already
had this problem at the section level (Phase 5's whole job was undoing
it) and Direction C would reintroduce it one layer up, at the pillar
level.

## Comparison

| Criterion | A — Full Spatial | B — Guided (2D-first) | C — Modular Deck |
|---|---|---|---|
| Feels like one coherent narrative | Strong, if executed well | Strong, via routing/motion | Weak — reintroduces V8's Phase 5 problem |
| Reuses V8's proven scene host as-is | No — requires extending it | Yes, unmodified | Yes, unmodified |
| Zero-3D-before-intent risk | High (always-mounted scene) | None (unchanged from V8) | None (unchanged from V8) |
| New 3D engineering required | Substantial | None | None |
| Recruiter 60s path feasibility | Risky (3D load on entry) | Strong | Strong |
| Regression risk to V8's stabilized systems | High | None | None |
| Token/testing cost to validate | High | Low–moderate | Low–moderate |
| Cinematic/premium feel | Highest ceiling, highest risk | Achievable via motion/type | Lowest — console-of-tiles reads as utilitarian |

## Selected direction: B — Guided Mission Control

Reasoning, in order of weight:

1. **The actual identified gap is connective, not visual.** V8's audit
   found three working, hardened 3D systems and no narrative thread
   between them — not a lack of spatial content. Direction B spends new
   effort exactly where the gap is.
2. **Regression risk.** `components/v8/ControlRoomScene.tsx` is the
   product of 7 phases and one real, subtle, hard-to-catch regression
   (the Phase 7 close-button bug). Direction A would require changing its
   mount-lifecycle assumptions specifically for a permanently-mounted
   scene — the highest-risk possible change to make to that file, for a
   portfolio where a broken hero on a recruiter's phone is the worst
   possible outcome.
3. **Matches the stated constraints directly**: "minimize token
   consumption and repeated testing" favors reusing proven systems over
   rebuilding them; "cinematic but lightweight" is explicitly in tension
   with an always-mounted 3D shell; "responsive input during
   interactions" and "route transitions ≤ 400ms" are far easier to hold
   without a persistent WebGL context competing for the main thread.
4. **Direction C is excluded outright** by the task's own anti-goal.

Direction B does not mean "no new spatial content ever" — a Scenario
Simulator visualization or an Evidence Graph could still use the shared
`ControlRoomScene` host for an *optional*, intent-loaded enhancement,
exactly like Atlas and RC-01 do today. It means the Mission Control
identity is carried by structure, typography, motion, and the new
navigation pillars first, with 3D remaining opt-in and additive — never
the load-bearing element for the 60-second recruiter path.
