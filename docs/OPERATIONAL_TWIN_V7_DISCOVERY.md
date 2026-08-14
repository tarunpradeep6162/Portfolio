# Operational Twin V7 — Discovery

## V6 production verification (Vercel), recorded here per instruction

V6's production deployment was verified directly against the real public URL
before this worktree was created, rather than as a new commit on the
immutable `living-infrastructure-v6` branch. Full results:

- **URL**: `https://portfolio-tarun-dun.vercel.app`
- **Deployed commit**: `669a0a891e4970a9bfc20a38564eca67ca9a00e9` (V6 final)
- **Routes**: 13/13 pass (9 real pages + sitemap + robots + 2 designed 404s)
- **Security headers / `x-powered-by` absence**: 6/6 pass
- **HTTPS**: TLS handshake succeeds, HSTS present
- **Canvas before intent**: 0
- **Atlas 3D activation**: works — canvas mounts, 0 console/page errors
- **Atlas close → reopen**: works cleanly (0 canvas after close, 1 after
  reopen, no "3D view failed to load" fallback text either time — this is
  the exact scenario a serious regression was fixed for during V6's own
  closure, reconfirmed clean on the real deployment)
- **RC-01 activation**: works
- **One-canvas invariant (Atlas + RC-01)**: holds — activating Atlas closes
  RC-01 first, canvas count never exceeds 1
- **Reduced motion**: 0 canvas, full content renders
- **Mobile overflow** (320px/375px, with and without RC-01 open): 0px in
  all four combinations
- **Console/page/network errors**: 0 throughout

An initial automated Playwright pass against this URL produced mass false
failures from a fixed 5s/30s timeout budget colliding with this VM's
software-rendered (swiftshader) WebGL under load — not a real defect;
confirmed by direct, repeated, isolated reproduction with generous polling
instead of fixed assertions. V6's application code was not touched to
"fix" this; it isn't broken.

## Inventory: reusable V6 systems

Audited the actual current code (not the completion report alone) at
`living-infrastructure-v6-final`:

| System | Location | V7 relevance |
|---|---|---|
| Shared experience state | `lib/v6/types.ts`, `lib/v6/experienceReducer.ts`, `lib/v6/ExperienceProvider.tsx` | **This is most of the "Scene Director" the spec asks for already.** `ExperienceState` tracks `activeScene: "atlas" \| "time-machine" \| "rc01" \| null`, `activeProject`, `selectedNodeId`, `selectedStageId`, `rc01Target`, `visitorPath`, `motion`, `power`, `spatialLoad`. The one-canvas invariant is already enforced through `SCENE_CHANGED` exclusivity (this is what made the Atlas/RC-01 mutual-exclusion check pass in production verification above). V7 should extend this reducer — add quality tier, WebGL capability, and trace/evidence linkage fields — not build a parallel state system. |
| Living Infrastructure Atlas | `components/atlas/` (`AtlasCanvasHost`, `AtlasDiagram`, `AtlasSpatialScene`, `TimeMachine`) | Direct precursor to the Operational Twin's node/edge visual language and the Architecture Time Machine (§10 "Deployment Replay" is this, generalized). `AtlasCanvasHost` already owns activation lifecycle, WebGL-context-loss recovery, and reduced-motion/fallback branching. |
| RC-01 companion | `components/companion/` (`CompanionRoot`, `CompanionCanvas`, `CompanionPortrait`, `CompanionTourPanel`, `CompanionConsole`, `RC01Model`) | Deterministic command console already exists (`content/companion.ts`, 261 lines) — V7 §10.9 asks to extend this with fixed typed commands for Twin/Trace/Replay/Ledger, not replace it. |
| Reliability Spine | `components/spine/`, `content/spine.ts` | The exact 8-stage vocabulary (`commit → build → test → container → network → cloud → observe → recover`) the Operational Twin's System Trace is built on already exists and is real, typed content — not something to invent. |
| Typed content + missing-content model | `content/types.ts` (`Field<T>`) | Already exactly the "verified / missing" split the Proof Ledger (§10.7) asks for. `Field<T>` is `{ status: "ready"; value } \| { status: "needs-input"; note }` — the Proof Ledger's `EvidenceStatus` should map onto this rather than duplicating it (the spec's own "explained" state is the one genuinely new addition). |
| Visitor paths | `components/work/VisitorPathSelector.tsx`, `visitorPath` in the shared reducer | Recruiter/Engineer/Explorer already exists and is state-driven, not per-component. |
| Proof Mode | `components/work/ProofMode.tsx` | Direct precursor to the Proof Ledger — evolve, don't duplicate. |
| Evidence/automation tooling | `scripts/capture-v6.mjs`, `record-v6-experience.mjs`, `soak-test-v6.mjs`, `measure-v6-routes.mjs` | Pattern to replicate for `-v7` variants per the master spec's §17 structure, not rewrite from scratch. |
| E2E coverage | `tests/e2e/atlas.spec.ts`, `companion.spec.ts`, `accessibility.spec.ts`, `responsive.spec.ts`, `routes.spec.ts`, `visitorPath.spec.ts`, `proofMode.spec.ts`, `links.spec.ts`, `metadata.spec.ts` | Existing coverage to preserve; V7 adds `v7-*.spec.ts` alongside, not instead of. |

## Real content and known gaps (re-verified against current `content/projects.ts`, not assumed from the report)

Confirmed by direct inspection of the live content file:

- **Project Aurora** (`project-aurora`): only flagship project with a
  non-empty `links` array. `spineStages: ["commit", "build", "container",
  "cloud"]`. Screenshot: `needs-input`.
- **Distributed Jenkins Controller** (`distributed-jenkins-controller`):
  `links: []`. `spineStages: ["commit", "build", "test"]`. Screenshot:
  `needs-input`.
- **Secure AWS Production Architecture**
  (`secure-aws-production-architecture`): `links: []`.
  `spineStages: ["network", "cloud", "observe", "recover"]`. Screenshot:
  `needs-input`. (Learning-implementation disclosure requirement applies —
  verify it's still present in `content/projects.ts` before V7 presents this
  project anywhere.)
- **Node.js Auth with MySQL/RDS** (`nodejs-auth-mysql-rds`): `links: []`.
  `spineStages: ["build", "cloud", "observe"]` — correctly excludes
  `"container"`, consistent with the container-free narrative fixed earlier
  in V6.
- Eight additional **lab projects** (`serverless-employee-api`,
  `s3-static-website-cicd`, `jenkins-persistence-docker-volumes`,
  `vpc-networking-lab`, `alb-auto-scaling-lab`, `elastic-beanstalk-cicd`,
  `kubernetes-fundamentals`, `cinematic-web-experience`) all show
  `links: { status: "needs-input" }` — none have a verified repository link.

This matches the master spec's §16 "known historical gaps" almost exactly.
Two items explicitly called out by §16 were checked directly rather than
left as assumptions:

- **Résumé PDF**: still genuinely absent. `content/site.ts`'s `resumeFile`
  is `{ status: "needs-input", note: "No resume PDF has been supplied yet,
  and the only version referenced elsewhere lists an outdated employer
  timeline. Request the current résumé by email in the meantime." }`, and
  `public/` contains no PDF. `app/resume/page.tsx` already only renders the
  download button when `resumeFile.status === "ready"` — this correctly
  produces no résumé CTA right now. V7 must preserve this, not add a button
  around it.
- **Secure AWS disclosure**: present and intact —
  `labelNote: "Architecture / learning implementation, not used for a real
  production client."` on the `secure-aws-production-architecture` entry in
  `content/projects.ts`. V7 must keep surfacing this wherever the project is
  presented as evidence, per §15.

## Next

Proceed to Phase 1's originality/design-direction work (three directions,
comparison, selection) as its own focused pass — recorded in
`docs/OPERATIONAL_TWIN_V7_DESIGN_DIRECTION.md`.
