# Portfolio V8 — Discovery

## Baseline (confirmed, not assumed)

- **Repository**: `tarunpradeep6162/Portfolio`.
- **Task branch**: `claude/portfolio-v8-prep-dt9uvb`, created from
  `operational-twin-v7` — confirmed via `git merge-base --is-ancestor`.
- **Base branch for V8**: `portfolio-v8` — does **not** yet exist on
  `origin` (`git ls-remote origin portfolio-v8` returns nothing). It will
  be created from the V7 validated commit below when this branch is
  pushed; it is not the repository's default branch
  (`living-infrastructure-v6`, an older, protected historical branch this
  work does not touch).
- **V7 validated application commit**: `cba06cffeaa80d489e52f269df28a0e0c49281af`
  — confirmed identical to the commit `operational-twin-v7-final` (tag
  object `d0c19b7d0ee554e8d86f8caa3014707010c9a0fb`) resolves to.
- **Latest V7 documentation HEAD**: `27960bb02c35252e957e8b769317fbff964ceba8`
  — this task branch's starting point, one documentation-only commit ahead
  of the validated application commit.
- **Working tree**: clean at the start of this task.
- **Production**: `https://portfolio-tarun-dun.vercel.app/` — currently
  serving the validated V7 commit; untouched by this task.

## Method

This audit is drawn from the repository's own record, not reconstructed
from memory: `docs/OPERATIONAL_TWIN_V7_COMPLETION_REPORT.md`,
`docs/OPERATIONAL_TWIN_V7_SESSION_HANDOFF.md`,
`docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md`,
`docs/OPERATIONAL_TWIN_V7_PERFORMANCE_BUDGET.md`,
`docs/OPERATIONAL_TWIN_V7_DESIGN_DIRECTION.md`,
`docs/AWARD_READINESS_AUDIT_V3.md`, `CONTENT_GAPS.md`, `README.md`,
`package.json`, and a direct read of `app/page.tsx`, `app/globals.css`,
and every directory under `components/`, `lib/`, `content/`, `tests/`.
Where a finding traces to a specific prior document, that document is
named — this section does not restate old findings as if newly
discovered.

## What V7 got right — worth preserving into V8

- **The evidence-honesty discipline itself.** `Field<T>` (`content/types.ts`)
  with an explicit `needs-input` state, `CONTENT_GAPS.md` as the single
  place gaps are tracked, and the Proof Ledger's three-state
  verified/explained/missing model are a genuinely distinctive piece of
  information architecture for a portfolio — most portfolios either fake
  completeness or leave silent gaps. Nothing about V8 should weaken this.
- **The Reliability Spine** (`content/spine.ts`,
  `components/spine/ReliabilitySpine.tsx`) as one real taxonomy
  (`Commit → Build → Test → Container → Network → Cloud → Observe →
  Recover`) reused consistently across System Trace, the four project
  topologies, and RC-01's `spine` command — a real backbone, not a
  decorative label set.
- **Code-generated, content-derived visuals.** Project cover art and the
  four topology layouts (`lib/v7/topologyClassifier`/`topologyLayout.ts`)
  are derived from each project's real `flow` data, so visual variety is
  structurally honest rather than art-directed by hand per project. This
  is a real strength worth extending, not replacing with hand-authored
  imagery.
- **The one-canvas mutual-exclusion invariant**, enforced through
  `activeScene` in `lib/v6/experienceReducer.ts` and independently
  verified by three different Playwright suites plus `capture-v7.mjs`'s
  hard assertion. The invariant is correct and should survive V8 — see
  "duplicated systems" below for why *how* it's enforced is the actual
  problem, not the rule itself.
- **The hosted CI/CD platform.** `v7-fast-ci.yml` (required, ~1-2 min,
  every push) plus `v7-full-validation.yml`/`v7-evidence-capture.yml`
  (manual/nightly, full Playwright + Docker + Trivy) is a real,
  proportionate three-tier gate, already GitHub-Actions-native. V8 should
  reuse this structure, not build a parallel one.
- **Self-hosted fonts, zero image assets.** No Google Fonts dependency, no
  image-weight risk anywhere on the site — a real, quantified performance
  decision, not an accident.

## Honest weaknesses

### Visual and interaction

- **The homepage is still a stack of independently-added blocks, not one
  narrative.** `app/page.tsx` runs eleven sections
  (Hero → Selected work → System Trace/Reliability Spine → Incident
  Replay → Automation Fabric → Proof Ledger/Comparison → Capability
  matrix → Experience → Credentials/Lab → Contact), each wrapped in the
  same `Container` → `Eyebrow` → heading rhythm. This is not a new
  finding — the V7 session handoff itself lists **"Phase 7 (full homepage
  narrative recomposition): not yet started — sections were added
  incrementally around the existing V6 homepage structure, not yet
  recomposed as one deliberate narrative arc"** as explicitly unfinished.
  Confirmed still true by direct read of the current file.
- **`AWARD_READINESS_AUDIT_V3.md`'s core structural finding —
  one repeated eyebrow → h2 → content-block rhythm, one container
  language (hairline border, `rounded-sm`) used for every card on the
  site, no second moment of scale contrast after the hero — was never
  actually resolved.** V4 through V7 added new *content* (Atlas, RC-01,
  Operational Twin, System Trace, Incident Replay, Automation Fabric,
  Proof Ledger) inside that same unchanged rhythm rather than replacing
  it. Confirmed by direct read of `app/page.tsx`: `Eyebrow` + numbered
  section labels (`/ 01` … `/ 07`) still frame every block exactly as V3
  described.
- **Three case-study pages (`/work/[slug]`) share one template** with no
  layout variation between projects beyond the generated diagram shape —
  a V3 finding, not independently re-verified visually this session, but
  nothing in any later phase doc claims it was addressed.
- **The 404 page and `/resume`** were flagged in V3 as the two weakest
  pages on the site (generic starter-template 404; a résumé page that is
  one sentence and one button pending a PDF). `CONTENT_GAPS.md` confirms
  the résumé PDF is still not supplied as of the V7 baseline.

### Performance

- **No real-user Lighthouse/Core Web Vitals measurement exists anywhere
  in the documented history.** Every performance claim across V3 through
  V7 is a synthetic budget check (`decodedBodySize`, request counts,
  canvas-before-intent) run via custom scripts, not a Lighthouse or
  field-data run — `AWARD_READINESS_AUDIT_V3.md` states this outright
  ("Lighthouse/PageSpeed: not measured, same environment blocker as v2").
  Nothing in V4-V7 closes that gap. V8's budget targets should keep using
  the proven synthetic methodology (it's real and reproducible) but should
  not claim Core Web Vitals compliance without an actual Lighthouse run.
- **Three independent WebGL/Canvas subsystems now exist** (see
  "duplicated systems" below), each carrying its own quality-tier
  detection, WebGL-capability probe, and mount/unmount lifecycle. The V7
  performance budget only measures the six pre-existing routes' base JS
  plus V7-specific scene code in isolation — there is no measured number
  for "all three systems' shared vendor cost" as a single figure, which
  is the number that actually matters for a first-time visitor's worst
  case.
- Full Validation's home-route budget check (`802,000-byte budget`) is a
  pass/fail gate, not a trend — there is no historical chart showing
  whether each version's addition (V5 → V6 → V7) has been eating the
  margin. Worth establishing before V8 adds anything.

### Accessibility

- **Diagrams have text alternatives but no visible legend for sighted
  users** — `AWARD_READINESS_AUDIT_V3.md`: `ArchitectureDiagram`/
  `ProjectCoverArt` have `role="img"`/`aria-label` but "no visible
  caption/legend/reading-order indicator." Nothing in V4-V7's scope
  addresses this; it applies equally to the newer System Trace and
  topology visuals, which were not built with a legend either (confirmed
  by reading `components/v7/SystemTrace.tsx` and the topology
  components — no caption/legend markup present).
  by
- **Reduced-motion correctness is real but was proven fragile under
  contention.** The V7 completion report documents a genuine environment
  bug: headless Chromium did not reliably honor
  `reducedMotion: "no-preference"` immediately after hydration, and the
  fix was in the *test harness* (polling), not the application. That's
  the right call for CI, but it means production reduced-motion behavior
  under real slow-hydration conditions (a real low-end device, not just
  CI) has not been independently re-verified since.
- Keyboard reachability and focus-visible are verified by the existing
  e2e suite for the routes it covers — no gap found here, but coverage is
  only as good as the suite, and the suite has not been extended for
  every new V7 surface with the same density as V6's.

### Mobile

- **Nothing is broken, but nothing is composed for mobile either** — a
  V3 finding still true by direct inspection: every section is the
  desktop stack collapsed to one column. The V7 session handoff records
  a real, separately-fixed overflow bug (`<html>` missing
  `overflow-x: clip`), which is a correctness fix, not a mobile
  *composition* pass — no phase in V4-V7 redesigned any section
  specifically for a narrow viewport rather than just making the desktop
  version not overflow there.
- The Operational Twin, Atlas, and RC-01 all degrade to a static
  reduced/fallback state on mobile-class hardware by the same
  quality-tier mechanism used for reduced motion — functionally correct,
  but it means the *majority* of the site's signature visual investment
  (three separate WebGL systems) is invisible or minimized for a mobile
  visitor, who is a large fraction of first-touch recruiter traffic.

### Content gaps (from `CONTENT_GAPS.md`, still open at the V7 baseline)

- No résumé PDF — `/resume` and the hero's secondary CTA fall back to a
  "Request résumé" email action.
- Stackly role (current, May 2026–Present) has no achievements listed.
- Eight certifications are missing issuer link and/or credential ID.
- All four flagship case studies still use generated cover art in place
  of real project screenshots.
- Seven lab projects have no repository links.
- The "Cinematic Web Experience" project's live URL is deliberately
  withheld pending a content/access review.

None of this is a defect — it's honest, tracked, and intentionally not
fabricated. It is, however, a real constraint on V8: any creative
direction that depends on real screenshots, a résumé PDF, or richer lab
evidence needs that content supplied before it can be more than a
placeholder, exactly as V7 handled it.

### Duplicated systems that should not grow further

This is the single most concrete structural finding of this audit,
confirmed by direct inspection, not inferred from prior docs:

**Three separate `@react-three/fiber` `Canvas`-mounting subsystems
coexist**, each with its own lifecycle:

| System | Files | Own quality/capability logic? |
|---|---|---|
| Atlas (topology explorer) | `components/atlas/*` (5 files, ~750 LOC) | Yes — `AtlasCanvasHost.tsx` |
| Operational Twin (instrument deck) | `components/v7/OperationalTwin*` (`Host`, `Scene`, `Fallback` — ~550 LOC) | Yes — its own quality-tier/WebGL-capability fields added to the shared reducer specifically because Atlas's were component-local |
| RC-01 companion | `components/companion/CompanionCanvas.tsx` + `RC01Model.tsx` (part of 7-file, own-state `companion/` module) | Yes — its own `QualitySettings`/error-boundary/context-loss recovery, separate from both of the above |

They are coordinated only by convention — the shared `activeScene` field
in `lib/v6/experienceReducer.ts` plus test assertions that check "at most
one canvas" after the fact. Nothing in the type system or component tree
makes a fourth accidental canvas impossible; it's prevented by discipline
and by an ever-growing test surface, which is exactly the shape of a
system that gets harder to keep correct as it grows. `lib/v7/ARCHITECTURE.md`
itself already had to add three new reducer fields
(`qualityTier`/`webglCapability`/`traceScope`) specifically because the
Operational Twin needed centrally-agreed values that Atlas had previously
kept local — a visible symptom of the same underlying duplication, not a
one-off.

**This should not gain a fourth independent system in V8.** Whatever
direction V8 takes, new "living infrastructure" surfaces should either
extend one of the three existing scene hosts or, better, this is the
opportunity to consolidate — see Direction A below.

## Three V8 creative directions

### Direction A — "Unified Control Room" (consolidation)

Collapse Atlas, the Operational Twin, and RC-01's 3D portrait into **one**
scene host with one shared quality/capability/lifecycle system, presented
as a single continuous "control room" the visitor steps into once, rather
than three separate systems that happen to take turns. The Reliability
Spine becomes the site's literal navigational spine — not a homepage
section, but the persistent structure the whole one-page (or lightly
multi-page) narrative is built around, replacing the current
eyebrow/h2/`Container` rhythm section-by-section rather than leaving it
in place around new content. RC-01 keeps its personality but loses its
independent canvas — it becomes a console/portrait rendered inside the
same shared scene, not a fourth WebGL context.

This directly answers three confirmed findings at once: the duplicated-
systems problem (one scene host instead of three), the no-narrative-arc
problem (the Spine becomes structure, not decoration), and part of the
performance risk (one shared vendor/scene budget instead of three
independently-budgeted ones, likely a net bundle-size *reduction* since
today's home route already pays for Atlas + Twin + RC-01 code existing
even before any one of them activates).

**Risk**: the highest-effort direction to build correctly — it requires
migrating three working systems' state and visual language into one
without regressing any of the honesty/evidence guarantees or the existing
Playwright coverage for all three. Mitigated by the phased, reversible
plan in `PORTFOLIO_V8_IMPLEMENTATION_PLAN.md`: build the unified host
alongside the existing three, prove parity, then retire the old systems
one at a time — never a single big-bang rewrite.

### Direction B — "Field Report" (editorial, narrative-first, minimal-3D)

De-emphasize spectacle in favor of clarity: the primary experience becomes
scroll-driven editorial storytelling (GSAP/SVG, no R3F) built around the
Reliability Spine as a literal reading path through each case study, with
all three current WebGL systems demoted to an explicit, clearly-labeled
"Explore in 3D" opt-in rather than a default part of the page. This
directly targets the recruiter-clarity, accessibility, mobile-composition,
and performance-cost weaknesses — a recruiter skimming on a phone gets a
fast, legible, fully-composed-for-mobile page by default; the 3D work
still exists for anyone who wants it.

**Risk**: this quietly retires most of what V4-V7 spent their effort
building, without removing the code (still three systems to maintain, now
behind an extra click) — real originality/technical-storytelling upside
is smaller than Direction A's, because it doesn't solve the underlying
duplication, only hides it by default. Reject-list risk: could read as
"gave up on the hard part" rather than "made a deliberate trade," if the
3D opt-in isn't presented with real craft.

### Direction C — "Live System" (real-time evidence)

Keep the Instrument Deck/Proof Ledger metaphor but make its evidence
genuinely live: real GitHub API data (recent commit activity, latest
Actions run status per repo already linked from the lab section), and
real health checks against the user's own deployed lab projects, feeding
directly into the existing Proof Ledger UI in place of static content —
turning "verified/explained/missing" from a documentation exercise into
an actually-live state. Highest originality and technical-storytelling
ceiling of the three — nothing else in the reject-list or prior audits
describes anything like it, and it's a genuine, distinctive demonstration
of the exact skill set (cloud/DevOps, real systems, real monitoring) the
site exists to prove.

**Risk**: the highest implementation and ongoing-maintenance risk by a
wide margin — external API dependency (GitHub rate limits, third-party
uptime), a caching/data-fetching layer that doesn't exist today, new
failure modes for the evidence-honesty model to handle (what does "proof"
mean when the live check itself is down?), and it does nothing to fix the
homepage-rhythm, duplicated-systems, or mobile-composition findings
above — it would be adding a fourth, more operationally complex system on
top of an already-duplicated set of three.

## Comparison

| Criterion | A — Unified Control Room | B — Field Report | C — Live System |
|---|---|---|---|
| Originality | High — no other portfolio audited in this project's own history took a "consolidate three systems into one honest room" approach | Medium — editorial/scrollytelling portfolios are a known, if well-executed, genre | Highest — genuinely live infrastructure evidence is rare |
| Recruiter clarity | High — one coherent story, Spine as literal structure | Highest — content-first by design, fastest to scan | Medium — compelling if it loads correctly, but adds a live-data failure mode a recruiter could hit |
| Technical storytelling | High — "I noticed three systems were fighting for the same canvas and unified them" is itself a real engineering story | Medium — strong content, less of a systems-engineering demonstration | Highest — literally live DevOps evidence, if it works |
| Mobile behavior | Good — one system to make mobile-first is tractable | Best — mobile-first by construction | Unchanged/worse — doesn't touch mobile composition, adds more JS |
| Accessibility | Good — one lifecycle to get right (captions/legends included) instead of three | Best — minimal-3D default is the most accessible path | Unchanged — inherits every existing gap plus new ones (live-data loading states) |
| Performance cost | Likely net reduction — one shared vendor bundle instead of three | Best — 3D fully deferred behind opt-in | Worst — new network dependency, caching layer, more JS |
| Implementation risk | Medium-high — real migration work, but reversible and phased | Low-medium — mostly subtractive/restructuring | High — new infra, new failure modes, ongoing maintenance |

## Recommendation

**Direction A — "Unified Control Room."**

It is the only one of the three that resolves the audit's most concrete,
independently-verifiable finding (three duplicated Canvas subsystems
coordinated only by convention) rather than working around it or adding a
fourth system on top of it. It also structurally forces the homepage
narrative-recomposition that the V7 session handoff already flagged as
incomplete (Phase 7), because "one control room" cannot be built as eleven
independently-added sections — the Spine has to become real structure,
not a section among sections. It keeps every piece of Direction B's
recruiter-clarity and mobile-composition upside available as an explicit
design constraint on the unified host (the current three-system version
already proves mobile/reduced-motion fallbacks work; the unified version
inherits that discipline instead of rebuilding it), without discarding
four versions of real WebGL engineering investment behind an opt-in
click. Direction C's live-data idea is genuinely compelling and should be
kept on the roadmap — but as a *later*, optional phase layered onto a
consolidated system, once there is one canvas and one state model to add
it to, not three.

## Constraints carried into V8 unchanged

- `Field<T>` / `CONTENT_GAPS.md` evidence-honesty model — do not fabricate,
  do not hide gaps, do not build a second content database.
- Maximum one active canvas at a time — Direction A makes this structural
  rather than convention-enforced, it does not relax it.
- Self-hosted fonts, zero image assets, Syne/Manrope/IBM Plex Mono role
  split — no new font without a demonstrated need.
- V7 production (`https://portfolio-tarun-dun.vercel.app/`) stays live and
  untouched throughout V8 development; all V8 verification happens on
  Vercel preview deployments.
- `operational-twin-v7-final` tag and `main`/protected historical branches
  are never modified.

## Open questions requiring your input

1. **Content**: is a résumé PDF, any of the eight missing certification
   links/IDs, real project screenshots, or the seven lab repo links likely
   to become available during V8 development? Direction A doesn't require
   any of them, but several would meaningfully strengthen it if supplied.
2. **Scope of consolidation**: should RC-01's *personality* (voice,
   command console, tours) be preserved exactly as-is inside the unified
   host, or is this also an opportunity to reconsider RC-01's role now
   that it's no longer a separate canvas?
3. **Direction C**: confirm whether "live system" evidence (real GitHub
   API/uptime data) is something you want scoped as an explicit later V8
   phase, or deliberately left out of V8 entirely.
4. **Multi-page vs. one-page**: Direction A's "Spine as literal structure"
   works either as a recomposed single homepage or as a short sequence of
   spine-stage routes — no strong signal yet on your preference; the
   implementation plan defaults to keeping the current single-page-plus-
   case-study-routes structure unless you'd rather explore a route-per-stage
   layout.
