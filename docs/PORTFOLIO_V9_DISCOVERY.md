# Portfolio V9 — Discovery

## V8 closure, confirmed

- **V8 final tag**: `unified-control-room-v8-final` → commit
  `9459778ae519e8236e469e2248860cd098eb083e` (merge of PR #6, "Portfolio V8
  — Unified Control Room," into `portfolio-v8`).
- **Production**: `https://portfolio-tarun-dun.vercel.app/` — confirmed
  live via direct fetch, serving V8's recomposed homepage ("THE CONTROL
  ROOM" / "One protocol, traced live across everything below.").
- **Validation**: V8 Fast CI green on the exact tagged commit —
  https://github.com/tarunpradeep6162/Portfolio/actions/runs/31895694368
- **Documentation**: `docs/PORTFOLIO_V8_PHASE0_BASELINE.md` through
  `docs/PORTFOLIO_V8_PHASE7_COMPLETION_REPORT.md` — one doc per phase,
  each with real findings and verification detail, no gaps.

V9 preparation starts from this exact tagged, production-verified state.
No application source has been touched to reach this point.

## V8 audit — what to keep

- **The shared scene host** (`components/v8/ControlRoomScene.tsx` +
  `lib/v8/canvasOwnership.ts`). One typed Canvas lifecycle — mount
  eligibility, context-loss recovery, a runtime-enforced one-canvas
  invariant — instead of three independently-maintained copies. Proven
  across three real migrations (Atlas, Operational Twin, RC-01) and one
  real regression found and fixed post-migration (the Phase 7
  close-button bug). This is V9's single most valuable inherited asset:
  any new intent-loaded 3D content should mount through this host, never
  build a parallel one.
- **Evidence-honesty as an engineering habit, not a slogan.** The
  `Field<T>` content model (`content/types.ts`) that renders "needs-input"
  content as simply absent rather than as a placeholder or a fabricated
  value; `CONTENT_GAPS.md` tracking every real gap; Proof Ledger and
  Project Comparison built directly from `content/projects.ts`, never
  invented figures. This is the property V9 has the most to lose if
  violated, and the most to gain by extending (see Evidence Graph below).
- **Reduced-motion and no-WebGL parity** as a first-class path, not an
  afterthought — every 3D system has a complete, real static/HTML
  fallback, verified in Playwright.
- **Mobile hardening discipline** — Phase 5/6's grid-default and
  select-width fixes came from systematic whole-repo greps, not
  spot-fixes. The pattern (grep for the bug class, fix every instance,
  re-verify) is worth repeating for any new V9 UI.

## V8 audit — what's still a gap, honestly

- **Still reads as several systems under one roof, not one narrative.**
  V8 Phase 5 merged four *sections* into one homepage story, and Phase
  1–4 merged three Canvas *lifecycles* into one host — but Atlas,
  Operational Twin, and RC-01 remain conceptually separate experiences a
  visitor discovers independently (three different Activate buttons in
  three different places). There is no single connective layer that says
  "you are looking at one system, from three angles." This is the exact
  problem V9's pillars target — Mission Control, Command Interface, and
  Evidence Graph are all, at root, proposals for that missing connective
  layer.
- **No fast recruiter path.** Every existing route assumes an engaged,
  patient reader. A recruiter with 60 seconds has no dedicated on-ramp —
  they'd land on the homepage and have to do the same discovery work as
  everyone else.
- **No global search or command interface.** Finding a specific project,
  skill, or piece of evidence requires scrolling and reading section by
  section.
- **No explicit evidence-provenance UI.** The evidence *exists*
  (commits, CI runs, screenshots where supplied, real repo links where
  supplied) but it's scattered across Proof Ledger, Project Comparison,
  and each case-study page, with no single place that traces a claim back
  to its source.
- **Content depth has not grown since V6.** Same 4 flagship + 8 lab
  projects, same 1-of-4 flagship projects with a verified repo link
  (Project Aurora), same missing résumé PDF, same 0 project screenshots,
  same 8 certifications missing issuer links. V9 must not let new UI
  surfaces imply more evidence exists than actually does — see
  `docs/PORTFOLIO_V9_CONTENT_MATRIX.md` for the exact, current list.

## The seven proposed pillars, evaluated against what's real

| Pillar | Assessment |
|---|---|
| **1. Mission Control** | High value, low *new* engineering risk if it reuses the existing scene host and existing project/spine data rather than inventing a new data model. Real risk: "no fake real-time telemetry" is easy to violate accidentally (e.g. an animated "live" counter that isn't backed by anything) — every number shown must trace to `content/*.ts` or a real, timestamped CI/deploy event. |
| **2. Recruiter Flight Plan** | High value, low risk, almost entirely a content-sequencing and UI problem, not a new-systems problem. The "strongest four projects" are already identified (the 4 flagship case studies); "verified skills" already exist in `content/skills.ts`. Main design work is compressing an existing, real story into a fast path, not inventing new claims. |
| **3. Engineer Investigation** | Already substantially exists (Project pages, Incident Replay, Automation Fabric, Proof Ledger, Project Comparison). V9's job here is mostly *connecting* these, not building new ones — see Evidence Graph. |
| **4. Scenario Simulator** | Legitimate and valuable **if and only if** every scenario is labeled as a simulation in the UI itself, not just in a doc — this is the single highest risk item for accidentally violating "never fake live infrastructure." The simulator must run entirely client-side against scripted/replayed data, with no claim of live backend state, and each scenario's "what this demonstrates" must cite a real, existing project or incident (`content/v7/incidents.ts`), not an invented one. |
| **5. Evidence Graph** | High value — this is the most direct answer to "one coherent narrative" and to the connective-layer gap above. Must be built strictly from real edges (project → real commit/PR URLs where they exist → real CI run URLs → real screenshots where supplied → real deployment). Where an edge doesn't exist (no screenshot, no repo link), the graph must show that node as `needs-input`, exactly like the rest of the site — never synthesize a placeholder edge. |
| **6. Global Command Interface** | High value for wayfinding and accessibility, moderate engineering effort, low content risk (it's a navigation layer, not a content layer). Must be built keyboard-first and screen-reader-tested from the start, not retrofitted. |
| **7. Premium Art Direction** | Necessary but is a cross-cutting discipline applied to all the above, not a separate build item — folded into `docs/PORTFOLIO_V9_DESIGN_DIRECTIONS.md` and `docs/PORTFOLIO_V9_ARCHITECTURE.md` rather than its own phase. |

**Recommendation for V9 core scope**: pillars 1, 2, 3 (mostly reused), 5,
and 6 are safe, high-value, and buildable without fabricating evidence.
Pillar 4 (Scenario Simulator) is worth including but is the pillar
requiring the most explicit labeling discipline, and should land later in
the implementation sequence (after the labeling/evidence conventions are
already established by pillars 1/5/6), not first. Pillar 7 is not a
separate phase.

## Explicit non-goals, carried over from the task instructions

- No Kubernetes or any other platform added merely for visual complexity.
  If a scenario or architecture diagram needs a "what if this used K8s"
  angle, it must connect to something the candidate has actually done
  (`content/projects.ts` has a real `kubernetes-fundamentals` lab entry —
  reference that, do not invent a K8s production deployment).
- No dependency on the Ubuntu/Jenkins server — V9 must be validated and
  deployed entirely through GitHub Actions and Vercel, exactly as V8 is
  today.
- No modification to V8 production. `unified-control-room-v8-final` and
  the live `portfolio-tarun-dun.vercel.app` deployment stay untouched
  until a V9 promotion decision is explicitly made, the same way V7
  stayed untouched throughout all of V8's development.
