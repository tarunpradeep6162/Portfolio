# OPERATIONAL TWIN V7

## Complete Claude Code master project brief

Repository: `https://github.com/tarunpradeep6162/Portfolio`

Owner: Tarun Pradeep

Target: an original, award-calibre, AAA-quality Cloud and DevOps portfolio that
remains fast, accessible, honest, automated and production-ready.

This file is an execution brief. It is not permission to copy any reference
website. Read it completely before changing the repository.

---

## 1. First understand the request correctly

Tarun shared the following website only to demonstrate what is technically
possible with a small Three.js/WebGL experience:

- `https://mengto.github.io/kage/`
- `https://github.com/MengTo/kage`

The reference proves that strong art direction and WebGL do not automatically
require an enormous application. It is **not** the requested V7 design.

### Non-negotiable reference boundary

- Do not copy Kage's source code.
- Do not copy its page structure, chapters, camera path or scene composition.
- Do not copy its temple, Kyoto, garden, lantern, moon or Japanese identity.
- Do not copy its typography arrangement, visual assets, text or artwork.
- Do not clone or install the Kage repository inside the portfolio.
- Do not clone or install MengTo's Skills repository for this project.
- Do not mention Kage on the public portfolio.
- Do not add Kage files, screenshots or links to the portfolio repository.
- Do not produce a themed reinterpretation of Kage.

Three.js and WebGL are approved technologies for V7. They must be used to make
an **original Cloud/DevOps experience** grounded in Tarun's actual work.

Kage is only a performance and restraint case study: one canvas, careful asset
loading, procedural visuals, controlled motion and a coherent art direction.

The existing portfolio is a Next.js/React application with more functionality
than a deliberately small static page, so do not make misleading one-to-one
bundle comparisons. Measure V7 against the final V6 production baseline using
the same stable browser Resource Timing fields.

---

## 2. Execution authority and expected outcome

Build the complete V7 version in the existing portfolio repository after V6
has genuinely closed.

Do not merely create a plan, a design mock-up, a hero-only demo or disconnected
components. Implement, integrate, validate, automate, deploy and document the
complete V7 experience.

The final result should be worthy of award submission, but the public site must
never say it is "award-winning" unless it has actually received an award. Use
"award-calibre" only in internal planning and review documents.

### Primary product goal

In less than two minutes, a recruiter should understand:

1. Tarun is a Cloud and DevOps engineer.
2. He understands the complete path from source to recovery.
3. His projects are backed by clearly separated evidence and limitations.
4. He can automate testing, builds, security validation and deployment.
5. The portfolio itself demonstrates the engineering standards it describes.

An engineer should be able to explore deeper architecture, decisions,
trade-offs, commands, incident stories and real links without encountering
fabricated proof.

---

## 3. Version identity

Version name:

```text
Operational Twin V7
```

Branch:

```text
operational-twin-v7
```

Worktree:

```text
/home/tarun/v7-work/tarun-portfolio
```

Local production-preview port:

```text
3700
```

Final tag, created only after every mandatory release gate succeeds:

```text
operational-twin-v7-final
```

Parent tag:

```text
living-infrastructure-v6-final
```

Never guess the parent commit. Resolve it from Git at execution time.

---

## 4. Git and worktree protection

Before V7 begins, run read-only checks:

```bash
cd /home/tarun/v6-work/tarun-portfolio

git fetch --tags origin
git branch --show-current
git status --short
git rev-parse HEAD
git rev-parse living-infrastructure-v6-final
git tag --points-at HEAD
git worktree list --porcelain
```

V7 may begin only when all of the following are true:

- V6's working tree is clean.
- `living-infrastructure-v6-final` exists.
- The V6 final tag points to the intended completed V6 commit.
- Required hosted V6 validation is genuinely complete.
- The V6 completion report does not contain unresolved mandatory release
  blockers.

If any condition is false, stop and report the precise V6 blocker. Do not create
V7 from a falsely labelled or incomplete parent.

### Creating the worktree

If neither the branch nor worktree already exists:

```bash
git worktree add \
  /home/tarun/v7-work/tarun-portfolio \
  -b operational-twin-v7 \
  living-infrastructure-v6-final
```

If the branch or path already exists, inspect it. Never delete, reset, clean,
overwrite or recreate it automatically.

### Protected history

Do not modify, rebase, force-push, merge into or delete:

- `main`
- `visual-rebuild-v2`
- `award-polish-v3`
- `award-experience-v4`
- `immersive-ops-v5`
- `jury-refinement-v5-1`
- `living-infrastructure-v6`
- any prior final tag

Never use destructive commands such as:

```text
git reset --hard
git clean -fd
git checkout -- <path>
git push --force
```

Do not stash or discard unknown user changes.

---

## 5. Source of truth

At the beginning of V7, inspect the real repository rather than relying on an
older chat summary. Read these documents if they exist:

```text
docs/LIVING_INFRASTRUCTURE_V6_DISCOVERY.md
docs/LIVING_INFRASTRUCTURE_V6_PLAN.md
docs/LIVING_INFRASTRUCTURE_V6_PERFORMANCE_BUDGET.md
docs/LIVING_INFRASTRUCTURE_V6_CONTENT_MATRIX.md
docs/LIVING_INFRASTRUCTURE_V6_COMPLETION_REPORT.md
docs/AUTOMATED_CI_CD.md
CONTENT_GAPS.md
```

Then inspect the actual current code, content, tests, workflows and package
versions. A report is evidence about a past commit; Git and current files are
the source of truth for the V7 parent.

Preserve and evolve, rather than rebuild:

- Next.js App Router and TypeScript structure
- Existing real routes
- Typed content and `Field<T>` missing-content model
- Reliability Spine
- Infrastructure Observatory
- Living Infrastructure Atlas
- Architecture Time Machine
- Proof Mode
- Recruiter, Engineer and Explorer visitor paths
- RC-01
- Existing intent-only 3D loading
- Reduced-motion, low-power and WebGL fallback chain
- Existing security headers
- Existing unit, Playwright, capture, video, soak and performance tooling
- GitHub Actions, Docker, Jenkins, Dependabot, Trivy and Vercel automation

Do not replace proven systems with parallel versions merely to make V7 look
new.

---

## 6. Product concept: the Operational Twin

V7 turns the portfolio into a digital operational twin of Tarun's engineering
practice.

The Operational Twin is one evolving visual system—not a collection of random
3D sections. It represents the same delivery system at different operational
states:

```text
Commit → Build → Test → Container → Network → Cloud → Observe → Recover
```

As the visitor explores, one shared system transforms to expose:

- source and review flow
- build and test automation
- container construction
- network and cloud topology
- security gates
- observability signals
- incidents and recovery
- supporting project evidence

### Signature interaction: System Trace

The memorable V7 signature is **System Trace**.

Selecting any real Reliability Spine stage sends one trace through every
connected surface:

- the Operational Twin focuses the relevant subsystem
- Atlas highlights the relevant nodes and edges
- Time Machine moves to the corresponding stage
- Proof Mode opens the relevant evidence or limitation
- RC-01 narrates only verified facts for that stage
- project cards reveal which projects genuinely demonstrate that stage

This must use one shared typed state/event model. Do not fake synchronization
with independent local component states.

The trace must encode information, not exist as a decorative glowing line.

---

## 7. Audience modes

Preserve the V6 visitor modes and make them meaningfully different views of the
same truth.

### Recruiter path

Target duration: 60–90 seconds.

Prioritise:

- role and value proposition
- strongest verified outcomes
- primary skills
- four flagship projects
- automation capability
- resume and contact

Do not hide technical content; make deeper layers optional.

### Engineer path

Prioritise:

- architecture
- implementation decisions
- trade-offs
- commands
- test evidence
- performance measurements
- security and recovery
- repository links where they genuinely exist

### Explorer path

Provide the complete cinematic Operational Twin experience with guided System
Trace, project worlds, incident replay and RC-01 integration.

### No-selection behaviour

The site must remain fully usable if no path is chosen. Visitor-mode selection
is an enhancement, never a blocking splash screen.

Persist only the chosen visitor preference locally. Do not create analytics or
remote tracking merely to remember a mode.

---

## 8. Original visual direction

### Design thesis

The site should feel like a precisely engineered object whose internal state is
visible—not a cyberpunk dashboard, a generic SaaS page, a game menu or a dark
template with random neon.

Subject:

```text
Cloud infrastructure becoming understandable under pressure.
```

Audience:

```text
Recruiters, Cloud/DevOps hiring managers, platform engineers and technical
reviewers.
```

Single job:

```text
Turn Tarun's claims into an inspectable path from implementation to proof.
```

### Material language

Use a restrained operational material system:

| Token | Starting direction | Purpose |
|---|---:|---|
| Deep relay | `#090D12` | Primary environment |
| Alloy | `#C7D0D8` | Main readable text and structural surfaces |
| Packet cobalt | `#4E79FF` | Data movement and focus |
| Telemetry mint | `#47D7B0` | Verified healthy state |
| Incident amber | `#F2AD4E` | Warnings, limitations and attention |
| Recovery violet | `#9C8CFF` | Restore, rollback and historical state |

These are starting tokens, not permission to overwrite the existing design
system blindly. Audit V6's actual tokens first, map them deliberately and keep
contrast compliant.

Do not use Kage's vermilion/Japanese palette. Avoid the common AI-design pattern
of pure black plus one acid-green accent.

### Typography

- Preserve the current self-hosted typography if it already carries the brand.
- Use a confident display role for high-level statements.
- Use a highly readable body role for case-study content.
- Use monospace only for commands, metrics, IDs and real system states.
- Do not render every heading in monospace.
- Add at most one new variable font only if the visual audit proves it is
  necessary and it remains inside the font budget.
- Record font licence and source.
- No Google Fonts runtime request.

### Layout

- Use asymmetric composition derived from infrastructure topology.
- Use structural rules and labels only when they encode real relationships.
- Give important evidence breathing room.
- Keep the hero visually decisive without burying navigation or CTA controls.
- Let sections transition through changes in system state, not through unrelated
  templates.
- Preserve normal document flow and browser scrolling.

### Motion

- One orchestrated system transformation should carry the experience.
- Use slow camera interpolation, precise state transitions and restrained
  parallax.
- Use word/line reveals selectively for narrative statements.
- Keep controls immediately responsive.
- Avoid elastic, bouncy, constantly floating or attention-seeking motion.
- Do not scroll-jack.
- Do not make visitors wait through an unskippable intro.

### Originality checkpoint

Before implementation, write three short design directions, compare them and
select one. Reject any direction that resembles:

- Kage or Japanese editorial art
- a generic terminal portfolio
- a generic dark DevOps dashboard
- a sci-fi HUD full of tiny unreadable labels
- a glassmorphism card grid
- an Awwwards clone with no relationship to Tarun's subject

Record the selected direction and why it is specific to Tarun.

---

## 9. Copy direction

Use direct, credible language. Do not fill the site with phrases such as
"passionate developer," "cutting-edge solutions," "seamless experiences" or
"revolutionising the cloud."

Potential thesis direction:

```text
Tarun Pradeep
Cloud & DevOps Engineer

From commit to recovery, every stage leaves proof.
```

Treat this as a direction, not unchangeable copy. Audit real content and improve
it without making unsupported claims.

Suggested primary actions:

```text
Trace the system
Review the evidence
Explore the work
View résumé
Contact Tarun
```

Do not show a résumé-download button if a real downloadable résumé file is not
present and verified.

---

## 10. Required V7 features

### 10.1 Operational Twin hero

Create an SSR-first hero with a lightweight static visual and complete text.

Before user intent:

- no V7 Three.js/R3F chunks
- no V7 canvas
- no scene assets
- no fake progress animation
- complete readable hero and navigation

Provide a clear action such as `Activate Operational Twin`.

After activation, one original Three.js/WebGL scene should transform through
real operational states. It must be valuable even without scroll choreography:
users can select stages directly using semantic controls.

### 10.2 System Trace

Implement the shared typed stage/project trace described earlier.

Requirements:

- keyboard operable
- URL-safe/shareable state where appropriate
- no duplicate source of truth
- deterministic test state
- stable DOM signals for capture and automation
- supports one stage, one project, or all stages
- resets cleanly

### 10.3 Flagship project worlds

Keep the existing `/work/[slug]` route architecture unless the audit finds a
compelling reason to change it.

Each project world must be generated from real typed content and have a distinct
topology:

1. Project Aurora: containerised delivery path and the only currently verified
   external repository link from the V6 content matrix.
2. Distributed Jenkins Controller and Linux Build Agent: controller/agent
   separation and SSH-scoped build execution.
3. Secure AWS Production Architecture: network, cloud, observation and recovery,
   always displaying the learning-implementation/not-real-client disclosure.
4. Node.js Authentication with MySQL/RDS: container-free EC2/RDS deployment if
   that remains the corrected content source of truth.

Do not force all projects into the same visual template. Their topology should
derive from their actual flow.

### 10.4 Deployment Replay

Provide a controllable replay of a project's delivery path.

Controls:

- Previous stage
- Play/pause
- Next stage
- Restart
- Select stage

This is a deterministic explanation, not a claim that a live deployment is
running. Label simulated/replayed state clearly.

### 10.5 Incident Replay

Create an evidence-backed incident narrative surface using only real documented
problems and resolutions.

Each replay must contain:

- observed symptom
- evidence collected
- root cause
- correction
- verification
- prevention or automation added
- known limitation

Do not invent production outages, business impact, MTTR, customer counts or
uptime.

Good candidates may include real documented CI, Jenkins, Docker, deployment,
authentication or portfolio-engineering incidents, but select them only after
auditing the source documents.

### 10.6 Automation Fabric

Visualise the real automation pipeline:

```text
Change → Fast CI → Build → Test → Security → Preview → Release candidate →
Production verification → Rollback readiness
```

Show which system performs each stage:

- GitHub Actions: primary hosted CI/CD
- Docker: reproducible production image
- Trivy: filesystem and image security scanning
- Vercel: preview/production hosting where configured
- Jenkins: secondary/manual validation when its agent is available
- Dependabot: dependency maintenance

Never display a tool as successfully executed unless there is real evidence for
that version.

Kubernetes must not be added just to make the portfolio sound advanced. A
single Next.js portfolio does not need Kubernetes. Keep K3s/Kubernetes/Argo CD
as a separate, honestly labelled learning project if Tarun later supplies real
evidence.

### 10.7 Proof Ledger

Evolve Proof Mode into an inspectable ledger with three strongly separated
states:

- Verified evidence
- Engineering explanation
- Missing/limited evidence

Every important claim should resolve to one of these states.

Suggested typed model:

```ts
type EvidenceStatus = "verified" | "explained" | "missing";

type EvidenceRecord = {
  id: string;
  projectSlug?: string;
  stageId?: SpineStageId;
  claim: string;
  status: EvidenceStatus;
  sourceLabel?: string;
  sourceUrl?: string;
  limitation?: string;
  verifiedAt?: string;
};
```

Adapt naming to the actual repository conventions. Do not build a second content
database when current project fields can be safely mapped.

### 10.8 Project comparison

Allow Engineer-path visitors to compare two real projects by:

- demonstrated stages
- architecture shape
- tools/services
- security controls
- observability
- recovery approach
- evidence available
- known limitations

Use a clear table or synchronized topology, not a decorative radar chart.

### 10.9 RC-01 V7 integration

RC-01 remains a deterministic system guide, not a fake AI assistant.

Upgrade it to:

- focus Operational Twin stages
- open a project trace
- start/pause Deployment Replay
- open matching Proof Ledger evidence
- explain the Automation Fabric
- launch an Incident Replay
- switch visitor path
- reset to a clean state

Every command must map to a fixed typed action and documented response.

Preserve:

- visible captions
- accessible announcements
- mute/low-power controls
- no microphone access
- no speech recognition
- no fabricated live system status
- no uncontrolled free-form command execution

### 10.10 Skills and career topology

Present skills through demonstrated relationships rather than a logo wall.

Examples:

- Docker connects to the projects where it was actually used.
- Jenkins connects to controller/agent evidence.
- AWS services connect to the architecture decisions that use them.
- Monitoring tools connect to real observe/recover content.

Do not load dozens of brand-logo packages. Prefer accessible text and small,
locally controlled vector marks when licences allow.

### 10.11 Contact handoff

Finish with a calm, high-confidence handoff:

- concise availability/value statement
- contact link
- LinkedIn/GitHub if real and present
- résumé action if real
- no intrusive animated form
- clear success/error states
- no exposing private data not already intended for the public portfolio

### 10.12 Optional sound

Sound is optional, off by default and never required to understand the site.

If implemented:

- user must explicitly enable it
- use only original/licensed local assets
- provide a persistent mute control
- no autoplay with sound
- no voice without visible captions
- remain inside the asset budget

Remove sound entirely if it compromises performance, accessibility or schedule.

---

## 11. Three.js/WebGL engineering requirements

Reuse the existing Three.js and React Three Fiber dependencies. Do not vendor a
second Three.js build or introduce another WebGL framework.

### Canvas invariant

```text
Maximum simultaneously mounted canvas elements: 1
```

The Operational Twin, Atlas and RC-01 may share a renderer/scene director or
use strict mutual exclusion. Choose the safest architecture after auditing V6.
The one-canvas invariant matters more than forcing a risky rewrite.

### Scene Director

Create one typed authority responsible for:

- active scene
- active project
- active Reliability Spine stage
- visitor path
- quality tier
- reduced-motion state
- low-power state
- WebGL capability
- activation lifecycle
- loading/error/recovery state
- RC-01/Atlas/Operational Twin mutual exclusion or scene handoff

Avoid many contexts that can contradict one another. Extend V6's existing
provider/reducer if it remains appropriate.

### Rendering discipline

- Reuse geometries and materials.
- Use instancing for repeated nodes, packets or infrastructure units.
- Avoid one React component per decorative particle.
- Keep light count low.
- Do not use real-time shadows by default.
- Avoid expensive PBR materials when Lambert/basic materials communicate the
  same result.
- Restrict bloom/post-processing to the high tier and only if it materially
  improves the signature system.
- Cap device pixel ratio.
- Pause or reduce rendering when the tab is hidden.
- Stop the permanent render loop while the canvas is inactive.
- Dispose geometries, materials, textures, render targets and listeners.
- Avoid allocating objects inside the animation loop.
- Precompute static topology data.
- Use compressed local images only when procedural/SVG visuals are insufficient.
- Avoid decoder dependencies for one small asset unless measurement justifies
  them.

### Quality tiers

Reuse V6's existing high/balanced/fallback logic and user-controlled low-power
preference.

High:

- full scene density within budget
- carefully limited post-processing
- capped DPR, never unlimited

Balanced:

- reduced density
- cheaper materials
- no expensive post-processing
- lower DPR

Fallback:

- no WebGL canvas
- complete static SVG/HTML experience
- all content and navigation preserved

Reduced motion should generally use the complete static presentation rather
than a slowed version of the same camera journey.

### Stable automation signals

Expose semantic, non-secret state indicators such as:

```text
data-v7-scene
data-v7-stage
data-v7-project
data-v7-quality
data-v7-ready
data-v7-transitioning
```

Use them to wait for real state completion in tests/capture tooling. Do not
create hidden test-only behaviour that differs from production logic.

---

## 12. Performance budget

Phase 0 must measure the completed V6 production build twice using the existing
stable Resource Timing methodology. Record both runs and choose the reproducible
baseline before implementing V7.

Do not reuse the known-racy request-count stabilization heuristic.

### Required V7 budgets

| Metric | V7 requirement |
|---|---|
| V7 Three.js/WebGL before intent | `0 bytes` |
| Canvas before intent | `0` |
| Maximum active canvas | `1` |
| Initial JS per existing route | no more than `+5%` over final V6 same-route baseline |
| V7-specific scene code/data | target `≤350 KB decodedBodySize` excluding already-cached shared Three/R3F vendor code |
| Total first 3D activation JS | target `≤1.25 MB decodedBodySize` on an uncached browser |
| Largest new lazy chunk | target `≤750 KB decodedBodySize` |
| Initial immersive visual assets | target `≤700 KB transferred` |
| Total optional V7 visual assets in one complete visit | target `≤2.5 MB transferred`, loaded on demand |
| Self-hosted fonts | no more than `+5%` over V6 font baseline; prefer no increase |
| CLS | `≤0.1` on every route/state |
| INP | target `≤200 ms` on hosted production |
| Interaction long task | no single task `>50 ms` |
| Route visible transition | target `≤400 ms`, excluding unrequested 3D |
| Desktop animation | target stable `55–60 FPS` on normal hardware |
| Mobile animation | target stable `30 FPS` balanced tier |
| Reduced motion | complete content, no required canvas |

If a target conflicts with correctness/accessibility, preserve correctness and
report the miss honestly. Do not alter measurement fields midway to manufacture
a pass.

### Measurement requirements

- Measure cold and warm navigation separately.
- Measure before intent, after hover/focus intent and after activation.
- Report `transferSize`, `encodedBodySize` and `decodedBodySize` explicitly.
- Identify every loaded V7 chunk by name/URL.
- Reproduce every release number twice.
- Run final performance gates on an uncontended hosted runner or production
  environment, not only Tarun's overloaded VM.
- Store machine-readable JSON and a concise Markdown summary.

---

## 13. Accessibility requirements

Accessibility is part of the design, not a fallback task.

- Preserve semantic HTML before enhancement.
- Every control has a visible label or verified accessible name.
- Entire experience is keyboard operable.
- Focus is visible.
- Escape closes dismissible spatial panels and restores focus.
- No non-modal region traps focus.
- Stage selection exposes current state with appropriate ARIA semantics.
- Captions remain available for every spoken/narrated line.
- Colour is never the only state indicator.
- Text maintains WCAG AA contrast at minimum.
- Touch targets are at least 44×44 CSS pixels where practical.
- At 200% zoom, content remains usable.
- At 320px width, no horizontal document overflow.
- Reduced motion preserves complete reading and interaction.
- WebGL failure preserves complete content.
- Loading and error states explain the next action.
- Decorative canvas is hidden appropriately from assistive technology; the
  equivalent semantic system remains in HTML.
- Do not place semantic HTML elements directly inside the R3F scene tree.

Test with automated checks and real keyboard traversal. Automated accessibility
tools alone are not sufficient.

---

## 14. Mobile requirements

Verify at least:

```text
320×568
375×812
390×844
768×1024
1024×768
1440×900
1920×1080
```

Mobile is not a scaled-down desktop cinematic scene.

- Use the existing collapsed/medium/expanded spatial-control model where it
  remains appropriate.
- Default to a readable lightweight experience.
- Load WebGL only after intent.
- Prefer tap-to-select over hover-dependent interaction.
- Keep hero text and primary CTA visible.
- No fixed panel may cover the entire page without an obvious close/collapse
  control.
- Respect safe-area insets.
- Avoid device-orientation permissions.
- Balanced/fallback quality should be selected conservatively.
- Test landscape orientation.
- Ensure RC-01, Atlas and Operational Twin cannot compete for screen space.

---

## 15. Security, privacy and content honesty

### Security

- Preserve and verify current security headers.
- Do not add CSP unless it is implemented and tested against every required
  route and asset source.
- No secret is committed, logged, printed or captured.
- Validate external URLs before rendering them.
- Use `rel="noopener noreferrer"` where appropriate.
- Keep dependencies minimal.
- Run dependency, filesystem, secret, misconfiguration and image scans.
- Production container remains non-root and health-checked.
- Do not expose Jenkins, Vercel or GitHub credentials to client code.

### Privacy

- No analytics by default.
- No session replay.
- No microphone/camera/geolocation permission.
- No fingerprinting.
- No outbound companion telemetry.
- Visitor preference may remain localStorage-only.
- Document any new runtime network call and justify it.

### Honesty

- Never invent repository links.
- Never invent screenshots.
- Never invent uptime, traffic, cost, latency, team size or customer impact.
- Never call a learning architecture a client production deployment.
- Always surface Secure AWS's learning-implementation disclosure wherever that
  project is presented as evidence.
- Preserve the corrected Node.js Auth container-free narrative if it remains
  the source of truth.
- Distinguish simulation/replay from live status.
- Distinguish explanation from verified evidence.
- Mark missing content rather than hiding it behind decorative UI.
- Generated illustration must never be presented as a real project screenshot.

---

## 16. Content model and missing content

Audit current content before adding new types.

Known historical gaps to verify again rather than blindly repeat:

- only Project Aurora had a verified repository link in the V6 content matrix
- some flagship projects had no repository link
- flagship projects lacked real screenshots
- some certifications lacked credential links/IDs
- a résumé PDF may or may not now exist in the repository
- some experience entries may lack quantified achievements

Do not block V7 on missing user-supplied content. Build honest designed missing
states and record an exact request list in:

```text
docs/OPERATIONAL_TWIN_V7_CONTENT_GAPS.md
```

Never substitute invented content.

---

## 17. Suggested implementation structure

Adapt this to the repository after audit; do not create duplicate directories
when equivalent V6 files already exist.

```text
components/v7/
  OperationalTwinHost.tsx
  OperationalTwinScene.tsx
  OperationalTwinFallback.tsx
  SystemTrace.tsx
  DeploymentReplay.tsx
  IncidentReplay.tsx
  AutomationFabric.tsx
  ProofLedger.tsx
  ProjectComparison.tsx
  V7ExperienceShell.tsx

lib/v7/
  types.ts
  sceneDirector.ts
  traceReducer.ts
  qualityPolicy.ts
  evidenceMapper.ts
  incidentModel.ts
  performanceSignals.ts

content/v7/
  incidents.ts
  automation.ts
  evidence.ts

tests/unit/
  v7*.test.ts

tests/e2e/
  v7-operational-twin.spec.ts
  v7-system-trace.spec.ts
  v7-incident-replay.spec.ts
  v7-responsive.spec.ts
  v7-accessibility.spec.ts

scripts/
  capture-v7.mjs
  record-v7-experience.mjs
  soak-v7.mjs
  measure-v7-performance.mjs
  audit-v7-evidence.mjs
```

Prefer pure functions for topology, evidence mapping, state transitions and
quality selection so they remain cheap to test.

---

## 18. Implementation phases

Each phase requires: objective, affected files, dependencies, acceptance
criteria, targeted check, performance impact, accessibility impact and rollback
boundary.

### Phase 0 — Verify V6 final baseline

- Confirm exact V6 tag/commit, clean worktree and remote status.
- Read final V6 report and current code.
- Run the completed V6 baseline validation once only if the final report does
  not already contain trustworthy current evidence.
- Measure the production baseline twice.
- Record exact route/test/evidence counts.

### Phase 1 — V7 discovery and originality audit

- Inventory reusable V6 systems.
- Inventory real content and gaps.
- Create three original design directions.
- Select one and document why it is specific to Tarun.
- Record the Kage non-copying boundary without adding Kage to public assets.

### Phase 2 — Information and evidence architecture

- Define how Operational Twin, System Trace, Proof Ledger and RC-01 share state.
- Extend existing typed models carefully.
- Define deterministic incident and automation records.
- Define missing-content states.

### Phase 3 — Scene Director and lifecycle

- Implement one active-canvas authority.
- Integrate quality, reduced motion, low power and WebGL fallback.
- Add lifecycle cleanup and stable automation signals.
- Unit-test reducer/lifecycle decisions.

### Phase 4 — SSR hero and intent loader

- Build complete server-rendered hero.
- Add honest activation/loading/error/recovery states.
- Prove zero V7 3D bytes/canvas before intent.

### Phase 5 — Operational Twin scene

- Build the original procedural system.
- Reuse the eight-stage vocabulary.
- Make every visual subsystem correspond to actual content.
- Optimise geometry/material/light strategy during construction.

### Phase 6 — System Trace

- Synchronise stage/project state across the Twin, Atlas, Time Machine, Proof
  Ledger and RC-01.
- Add keyboard and direct-selection controls.
- Add stable reset/clean state.

### Phase 7 — Homepage narrative integration

- Recompose the homepage around the Operational Twin without removing readable
  HTML content.
- Preserve navigation, CTA visibility and no-selection behaviour.
- Add deliberate transitions without scroll hijacking.

### Phase 8 — Flagship project worlds

- Give all four projects distinct topology derived from real content.
- Preserve project-specific disclosures and missing evidence.
- Avoid adding routes without a demonstrated need.

### Phase 9 — Deployment Replay

- Implement deterministic stage replay.
- Ensure controls, pause, restart and reduced-motion modes work.
- Clearly label replayed state.

### Phase 10 — Incident Replay

- Select only documented incidents.
- Implement symptom → evidence → root cause → fix → verification → prevention.
- Link each claim to Proof Ledger state.

### Phase 11 — Automation Fabric

- Visualise the real CI/CD system.
- Connect it to actual workflow and script names.
- Surface executed/unexecuted state honestly.

### Phase 12 — Proof Ledger and comparison

- Evolve Proof Mode without duplicating its source of truth.
- Add accessible two-project comparison.
- Verify missing links never render as fake actions.

### Phase 13 — RC-01 V7 upgrade

- Add fixed typed commands/actions.
- Synchronise with V7 state.
- Preserve captions, privacy and one-canvas invariant.

### Phase 14 — About, résumé, skills and contact refinement

- Extend the visual system across existing routes without making every page a
  heavy canvas experience.
- Keep content first and 3D optional.
- Verify all real links and missing fields.

### Phase 15 — Mobile and alternate experiences

- Implement mobile composition, low power, reduced motion and WebGL failure.
- Test 320px through 1920px.
- Remove desktop-only assumptions.

### Phase 16 — Performance engineering

- Profile actual working scenes, not fallbacks.
- Reduce chunks, geometry, materials, renders and assets.
- Verify resource measurements twice.
- Do not lower budgets after implementation to manufacture success.

### Phase 17 — Accessibility, privacy and security hardening

- Complete keyboard review.
- Complete automated accessibility checks.
- Validate zoom, contrast, focus and announcements.
- Verify headers and privacy grep/audit.
- Review dependency and browser security impact.

### Phase 18 — Automation integration

- Update fast CI only for cheap checks.
- Add V7 heavy validation to manual/nightly/release workflows.
- Reuse Docker/Jenkins/Trivy/Vercel architecture.
- Ensure evidence scripts are mandatory for release, not warning-skipped.

### Phase 19 — Final evidence closure

- Run one complete validation pass.
- Capture and inspect all screenshots.
- Record and inspect the walkthrough video.
- Run soak and performance twice.
- Run real hosted automation.
- Build and scan the real container.
- Verify preview and production deployments.

### Phase 20 — Completion report and final tag

- Write exact results and limitations.
- Confirm clean Git status and remote synchronization.
- Create/push `operational-twin-v7-final` only after all mandatory gates pass.
- Record rollback and restart instructions.

---

## 19. Testing-frequency and token-efficiency policy

Tarun specifically wants expensive checks performed at the end because repeated
full validation consumes hours, VM resources and Claude tokens.

### During implementation

Permitted:

- syntax check for a changed script
- TypeScript check limited to a changed subsystem when practical
- one directly related unit-test file
- one directly related Playwright spec when interaction behaviour cannot be
  validated safely otherwise
- `git diff --check`
- focused browser inspection for the exact feature being built

Do not repeatedly run:

- full lint/typecheck/test/build after every phase
- full Playwright
- the full breakpoint screenshot matrix
- video recording
- soak testing
- complete performance measurements
- Docker builds
- Trivy scans
- Jenkins pipeline
- nightly/release workflows
- Vercel production deployment

Implement in large logical batches, then perform one comprehensive closure
pass.

Small targeted checks are still required when needed to prevent building many
phases on top of broken code. "Test at the end" does not mean knowingly ignore
syntax errors or a broken shared reducer.

### Commit/push policy

- Commit locally after each meaningful completed batch.
- Use clear, reversible commits.
- Do not push every tiny commit.
- Prefer two or three consolidated milestone pushes before final release.
- Fast CI may run on milestone pushes.
- Heavy CI runs only manually/nightly/release-candidate.
- Never force-push.

### Claude token policy

- Do not narrate every command.
- Do not paste complete successful logs into chat.
- Report concise totals and the first actionable failure.
- Read a document once and reuse notes.
- Do not repeatedly scan the whole repository without cause.
- Do not use multiple Claude agents/subagents unless Tarun explicitly requests
  them; parallel agents can consume the plan limit quickly.
- Reuse existing scripts/components before generating replacements.
- Keep machine-readable output in `reports/` and summarize it.

### Session continuity

Maintain:

```text
docs/OPERATIONAL_TWIN_V7_SESSION_HANDOFF.md
```

Update it before a session approaches its limit with:

- exact HEAD and branch
- clean/dirty status
- files intentionally changed
- completed phases
- checks actually run and exact results
- current blocker
- next three concrete tasks
- commands to resume server/worktree
- claims that remain unverified

Do not include old history that the next session does not need.

If the session must stop, commit complete work, preserve incomplete work without
destructive cleanup, update the handoff and provide a short continuation prompt.

---

## 20. Automated testing, build and deployment architecture

### Fast CI — push/pull request

Keep it fast:

- repository safety/secret check
- dependency install with Node version matching the lockfile/tooling
- lint
- typecheck
- unit tests
- changed-area build or production build when relevant
- HTML audit
- concise summary

Use concurrency cancellation for superseded branch runs.

### Nightly/manual heavy validation

- full production build
- complete Playwright
- accessibility suite
- route/header audit
- filesystem/secret/misconfiguration Trivy scan
- V7 soak test
- V7 performance measurements twice
- upload reports as artifacts

### Release candidate

Add `workflow_dispatch` with a non-production candidate mode. It must:

- validate a specified branch/commit
- run the complete suite
- build the Docker image
- run Trivy image scan
- boot candidate container
- verify health/routes/headers
- capture screenshots
- record video
- run soak
- run performance twice
- deploy/verify a preview when configured
- never promote production when `promote=false`

### Production release

Production promotion requires:

- exact approved/tagged commit
- completely green hosted full suite
- mandatory evidence artifacts present
- Docker and Trivy pass according to documented policy
- preview verification pass
- configured Vercel project and credentials
- production smoke test
- rollback target recorded

No evidence step may silently skip because a script is missing.

### Jenkins

Jenkins is a secondary/manual validator and learning proof. Reuse the same
scripts as GitHub Actions. Do not create a second independent definition of
correctness, and do not require Tarun's local VM to be online for every commit.

### Docker

- multi-stage build
- Next.js standalone output
- non-root runtime user
- health check
- immutable commit-SHA image tag
- no build secrets in final image
- candidate route/header check
- documented local and hosted commands

### Trivy

- filesystem
- secrets
- misconfiguration
- final image
- documented severity/fix policy
- machine-readable and Markdown output
- no suppression without explanation

### Vercel

- preview for branch/release candidate
- production only after all gates
- validate real HTTPS URL
- verify headers, routes, 404s and core interactions
- never print tokens
- if credentials/project linking are missing, stop with exact minimal setup
  instructions rather than pretending deployment succeeded

---

## 21. Unit and integration test requirements

Add focused tests for:

- Scene Director reducer/state transitions
- one-canvas mutual exclusion
- trace selection/reset
- evidence mapping
- missing-evidence behaviour
- incident replay state machine
- deployment replay play/pause/restart
- quality-tier selection
- reduced-motion/fallback selection
- content disclosure rules
- project comparison mapping
- RC-01 fixed command actions
- asset/scene manifest validation

Do not test implementation details that make harmless refactors difficult.

---

## 22. Playwright requirements

At minimum verify:

- every real route returns the correct page
- invalid routes return designed 404 responses
- SSR content works before JavaScript enhancement
- V7 canvas/chunks are absent before intent
- activation loads the working scene rather than an error fallback
- maximum canvas count remains one
- every Reliability Spine stage can be selected
- System Trace synchronizes all participating surfaces
- Operational Twin and RC-01/Atlas never compete incorrectly
- every project world derives the correct real flow
- Secure AWS disclosure always appears
- Node.js Auth never falsely claims containerisation
- empty repository links render no fake action
- Deployment Replay controls work
- Incident Replay exposes evidence/root cause/fix/verification
- Automation Fabric does not mark unexecuted systems as passed
- visitor paths persist/reset locally
- keyboard navigation/focus restoration works
- reduced motion mounts no unnecessary canvas
- WebGL failure renders the complete fallback
- low-power mode remains stable
- mobile collapsed/medium/expanded states work
- no horizontal overflow at every required viewport
- contact/external links are correct
- no page errors or relevant console errors
- scene deactivation returns a clean state

The final hosted Playwright suite must be completely green. An isolated rerun of
a failed test is diagnostic evidence, not a green full-suite result.

---

## 23. Screenshot evidence

Create `scripts/capture-v7.mjs` using configurable environment variables:

```text
V7_BASE_URL
V7_EVIDENCE_DIR
```

Use real DOM/application state signals, not arbitrary sleeps.

### Route matrix

Capture every existing public route at the standard breakpoints used by the
project, including 375, 768, 1024, 1440 and 1920 widths where appropriate.

### Required V7 companion states

At minimum capture:

- SSR hero, no canvas
- activation intent/loading
- working Operational Twin
- each of the eight Reliability Spine stages
- System Trace active
- every flagship project world
- Deployment Replay paused and playing
- Incident Replay symptom/root-cause/verification states
- Automation Fabric
- Proof Ledger verified/explained/missing
- project comparison
- Recruiter/Engineer/Explorer modes
- RC-01 integrated state
- minimise and restore
- low-power mode
- reduced motion
- WebGL failure
- scene error recovery
- mobile collapsed/medium/expanded
- 320px narrow layout
- tablet portrait and landscape
- 404 page
- clean deactivated final state

Create an inventory with filename, route, viewport, state and expected visible
evidence.

Individually inspect every final screenshot. Counting files is not inspection.

---

## 24. Video evidence

Create `scripts/record-v7-experience.mjs`.

Record a concise, coherent 60–90 second walkthrough showing:

1. SSR-first initial page
2. visitor path selection
3. Operational Twin activation and real loading
4. working 3D system
5. System Trace across stages
6. one flagship project world
7. Deployment Replay
8. Incident Replay
9. Proof Ledger
10. Automation Fabric
11. RC-01 synchronized guidance and captions
12. minimise/restore
13. mobile state
14. reduced-motion/static equivalent
15. clean deactivation

Extract frames at clean intervals and around every required transition. Inspect
them in order and record timestamps. Do not infer success from video duration.

---

## 25. Soak and lifecycle evidence

Create `scripts/soak-v7.mjs`.

Run at least 20 cycles containing:

- activate Operational Twin
- select multiple stages
- switch project
- start/stop replay
- open/close Proof Ledger
- activate/deactivate RC-01
- enter/exit Atlas if applicable
- minimise/restore
- return to clean state

Assert:

- no crash/page error
- maximum one canvas
- no stuck loading/transition state
- no duplicate controls or scene roots
- no obvious DOM/listener accumulation
- no continuing animation loop after deactivation
- stable final focus
- successful final deactivation
- no meaningful upward trend in DOM/canvas/listener proxy counts

Report per-cycle results and final summary.

---

## 26. Final validation order

Run this expensive pipeline once after all application/tooling code is complete
and committed locally:

1. Git safety and diff checks
2. lint
3. typecheck
4. unit tests
5. production build
6. HTML audit
7. route/404/header verification
8. complete Playwright suite
9. accessibility automation plus keyboard review
10. privacy/security static audit
11. screenshot capture
12. individual screenshot inspection
13. walkthrough recording
14. frame-by-frame video inspection
15. soak test
16. per-route performance measurement run 1
17. per-route performance measurement run 2
18. Docker image build
19. candidate-container health/route/header checks
20. Trivy filesystem/secret/misconfiguration scan
21. Trivy image scan
22. Jenkins validation if configured/available
23. hosted nightly/manual heavy workflow
24. hosted release candidate with `promote=false`
25. Vercel preview validation
26. production promotion
27. post-production smoke, route, header and core-interaction checks
28. final report reconciliation
29. clean status/remote synchronization
30. final tag creation and push

If a step fails:

- identify and fix the real cause
- rerun the failed step
- rerun only affected downstream steps
- rerun the complete hosted Playwright suite if application behaviour changed
- regenerate only evidence invalidated by the fix
- never relabel a failed run as a pass

---

## 27. Award-calibre review rubric

Before final release, score V7 with evidence:

| Category | Weight | Release expectation |
|---|---:|---|
| Original art direction | 15 | unmistakably specific to Tarun and DevOps |
| Narrative/content clarity | 15 | recruiter understands value rapidly |
| Interaction quality | 15 | System Trace feels precise and purposeful |
| Technical execution | 15 | robust state/lifecycle, no canvas conflicts |
| Performance | 15 | budgets measured and met or honestly blocked |
| Accessibility/mobile | 15 | complete equivalent experience across modes |
| Evidence honesty | 10 | claims, proof and limitations clearly separated |

Mandatory blockers override the score. A visually impressive page with broken
keyboard navigation, fabricated content, excessive loading or incomplete
release evidence is not final.

Perform a final originality audit against all references and earlier portfolio
versions. Remove one unnecessary decorative feature before release if it does
not strengthen the narrative.

---

## 28. Required documentation

Create and maintain:

```text
docs/OPERATIONAL_TWIN_V7_DISCOVERY.md
docs/OPERATIONAL_TWIN_V7_DESIGN_DIRECTION.md
docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md
docs/OPERATIONAL_TWIN_V7_CONTENT_MATRIX.md
docs/OPERATIONAL_TWIN_V7_CONTENT_GAPS.md
docs/OPERATIONAL_TWIN_V7_PERFORMANCE_BUDGET.md
docs/OPERATIONAL_TWIN_V7_AUTOMATION.md
docs/OPERATIONAL_TWIN_V7_TEST_PLAN.md
docs/OPERATIONAL_TWIN_V7_SESSION_HANDOFF.md
docs/OPERATIONAL_TWIN_V7_COMPLETION_REPORT.md
```

Keep planning documents concise enough to use. Do not duplicate the same long
history in every file.

---

## 29. Completion report requirements

The final report must contain real outputs only:

- exact V6 parent tag and commit
- exact V7 preparation and final commits
- complete V7 commit inventory
- file inventory and change statistics
- final architecture decision
- original design direction and originality audit
- content changes and unresolved gaps
- exact route/build counts
- exact unit and Playwright totals
- accessibility results
- screenshot inventory and inspection result
- video path, duration and timestamp inventory
- soak-cycle result
- per-route performance table, two reproduced runs
- before-intent and activation chunk inventory
- canvas/lifecycle results
- Docker image/build/health result
- Trivy filesystem/image results
- Jenkins result or precise unavailability blocker
- GitHub Actions run URLs and conclusions
- Vercel preview and production URLs
- security headers and 404 verification
- privacy audit
- limitations
- restart command
- rollback command and previous production target
- final Git status and remote synchronization
- final tag record

Do not write final commit/tag claims in advance. Fill them from real Git output
as the last documentation change.

---

## 30. Final tag gate

Do not create `operational-twin-v7-final` unless all mandatory conditions are
true:

- complete application implementation
- no unresolved release-blocking content inconsistency
- lint/typecheck/unit/build/HTML audit pass
- completely green hosted Playwright suite
- accessibility and responsive checks pass
- screenshots captured and individually inspected
- video recorded and frame-inspected
- soak test passes
- performance reproduced twice
- zero 3D bytes/canvas before intent
- one-canvas invariant passes
- Docker candidate passes
- Trivy policy passes
- preview validation passes
- production deployment and smoke verification pass
- completion report reconciled
- branch clean and pushed

If an external requirement is unavailable, report the blocker and do not create
the final tag.

---

## 31. Final response format

At completion, provide a concise report containing only:

- V7 final HEAD
- parent tag/commit
- branch and worktree status
- commits created
- core features completed
- validation totals
- performance headline numbers
- screenshot/video/soak inventory
- Docker/Trivy/Jenkins/GitHub Actions conclusions
- preview and production URLs
- remaining limitations/blockers
- whether `operational-twin-v7-final` was created
- exact continuation command if anything remains

Do not repeat the entire project plan in the final chat response.

---

## 32. Start instruction

Begin by verifying the V6 final tag and repository state.

If V6 is not genuinely final, stop and report the exact closure blocker.

If V6 is final, create or safely resume the V7 worktree, audit the real code,
write the focused V7 discovery/design/architecture documents, then continue
into implementation in large logical batches.

Do not implement Kage. Build Tarun's original Operational Twin V7 using
efficient Three.js/WebGL principles, real content, one canvas, intent loading
and complete automated release evidence.
