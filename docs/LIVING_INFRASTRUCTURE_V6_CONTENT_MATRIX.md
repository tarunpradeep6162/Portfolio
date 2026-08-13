# Living Infrastructure V6 — content matrix

Every fact below is transcribed directly from `content/projects.ts` and
`content/spine.ts` as they exist today (V5.1 baseline, unchanged by this
preparation pass). Nothing here is invented, extrapolated, or rounded up.
Where a project has no data for a column, that is stated as "none
documented" rather than left blank or inferred.

## Shared reference: the 8-stage Reliability Spine

| Stage ID | Label | Description (verbatim) |
|---|---|---|
| `commit` | Commit | Version control, branching, and review before anything ships. |
| `build` | Build | Compiling and packaging an application into a deployable artifact. |
| `test` | Test | Verifying behaviour and scanning images before they reach production. |
| `container` | Container | Multi-stage Docker builds, image layering, and service composition. |
| `network` | Network | VPC tiers, security groups, load balancing, and controlled routing. |
| `cloud` | Cloud | Compute, storage, and managed services running the workload. |
| `observe` | Observe | Metrics, logs, and alarms that surface what the system is actually doing. |
| `recover` | Recover | Backups, restore strategy, and the plan for when something breaks. |

## A finding surfaced during this audit (not corrected — content is out of scope)

**Node.js Authentication Application's data is internally inconsistent
between two fields.** `spineStages` includes `"container"`, but the
project's own `flow` string explicitly reads "Build -> **Container-free
deploy** -> Cloud (EC2 + RDS) -> Observe" — i.e. the prose says this
project explicitly did *not* use containers, while the stage-mapping array
says it demonstrates the Container stage. This preparation pass does not
modify content (`content/*.ts` is untouched), but it is flagged here so V6
implementation does not silently narrate "this project used multi-stage
Docker builds" through RC-01 for a project whose own flow text says the
opposite. Resolving this (either the project's `spineStages` array or the
`flow` string is wrong) is a content-team decision, not an implementation
one — see the Plan document's Phase 3 dependency note.

## Project Aurora

| | |
|---|---|
| Slug | `project-aurora` |
| Categories | Cloud, DevOps |
| Spine stages demonstrated | `commit`, `build`, `container`, `cloud` (4 of 8) |
| Flow (verbatim) | Git -> Build -> Image -> Compose Network -> App/MySQL -> Nginx -> EC2 |

**Architecture nodes** (derived only from the `flow` string above): Git,
Build, Image, Compose Network, App/MySQL, Nginx, EC2.

**Verified facts:**
- Summary: a React/Vite frontend and supporting services, containerised
  with multi-stage Docker builds and deployed to AWS EC2.
- Context: needed a repeatable, production-style deployment path instead
  of a manual one-off setup.
- Responsibility: containerised the application, defined the service
  composition, deployed and validated the stack on EC2.
- Implementation decisions: multi-stage Docker builds for a lean production
  image; Nginx for production serving; Docker Compose for service
  networking, persistent volumes, and environment configuration; MySQL
  integration within the same Compose network.
- Tools/services: React, Vite, Docker, Docker Compose, Nginx, MySQL, AWS EC2.
- Challenge/resolution: tested application updates, downtime behaviour, and
  redeployment approaches to confirm the stack could be updated without ad
  hoc manual steps.
- Outcome: a repeatable container-based deployment on EC2, verified end to
  end from build through redeployment.

**Security controls documented:** none. No IAM, network isolation, or
encryption decision is recorded for this project.

**Evidence available:** a real repository link — `https://github.com/tarunpradeep6162/ProjectAurora/`.

**Evidence missing:** no screenshot (`Field<>` status `"needs-input"`).

**Allowed RC-01 narration:** any of the verified facts above, in RC-01's
own words, attributed to this project specifically. May state the real
repository URL. May say "no security controls are documented for this
project" if asked directly, rather than staying silent or implying some
exist.

**Statements that must not be made:** any security posture claim (this
project documents none); any specific CI/CD automation beyond "tested...
redeployment approaches" (no CI tool is named); any uptime, performance,
or traffic metric (none exist); any claim this ran in a real production
environment for a client (not stated either way — do not imply it).

## Distributed Jenkins Controller and Linux Build Agent

| | |
|---|---|
| Slug | `distributed-jenkins-controller` |
| Categories | DevOps, Systems |
| Spine stages demonstrated | `commit`, `build`, `test` (3 of 8 — shortest of the four) |
| Flow (verbatim) | Commit -> Build (on agent) -> Test |

**Architecture nodes:** Commit, Build (on agent), Test — a two-host
topology (controller + agent) per the responsibility/decisions text below,
though the `flow` string itself only names the pipeline stages, not the
two hosts explicitly.

**Verified facts:**
- Summary: Jenkins on Ubuntu with a dedicated Linux build agent connected
  over SSH, separating orchestration from build execution.
- Context: a single Jenkins controller running builds directly does not
  scale and couples orchestration to execution.
- Responsibility: installed and configured Jenkins, connected a dedicated
  Linux agent over SSH, configured credentials, labels, executors, and the
  remote working directory.
- Implementation decisions: separated the controller from build execution
  by routing jobs to a dedicated Linux agent; configured SSH-based agent
  connection with scoped credentials; set executor labels so jobs are
  pinned to the correct agent.
- Tools/services: Jenkins, Ubuntu, SSH.
- Challenge/resolution: verified pipeline execution actually ran on the
  agent rather than the controller, confirming the separation held under
  real jobs.
- Outcome: orchestration and build execution running on separate hosts,
  improving maintainability and giving a path to scale build capacity
  independently of the controller.

**Security controls documented:** SSH-based agent connection with *scoped
credentials* — the only security-relevant decision recorded for this
project.

**Evidence available:** none (no repository link — `links: []`).

**Evidence missing:** no screenshot; no repository/deployment link at all.

**Allowed RC-01 narration:** the verified facts above. May state that
credentials were scoped for the SSH connection. Must not claim there is a
repository to explore for this project — there is none.

**Statements that must not be made:** "explore the repository" or any
phrasing implying a `links` entry exists (`links: []`); any claim about
what specific jobs ran (only that "real jobs" were verified, unspecified);
any security control beyond scoped SSH credentials (no further hardening
is documented).

## Secure AWS Production Architecture

| | |
|---|---|
| Slug | `secure-aws-production-architecture` |
| Categories | Cloud |
| Spine stages demonstrated | `network`, `cloud`, `observe`, `recover` (4 of 8) |
| Flow (verbatim) | Network -> Cloud -> Observe -> Recover |
| **Explicit label note (must always accompany this project's presentation)** | "Architecture / learning implementation, not used for a real production client." |

**Architecture nodes:** Network, Cloud, Observe, Recover — plus, from the
implementation decisions, the specific sub-components: IAM users/groups/
roles, public/private VPC tiers, security groups, Application Load
Balancer, RDS (with Multi-AZ/read replicas/encryption/backup-restore),
CloudWatch, SNS.

**Verified facts:**
- Summary: an IAM, VPC, load-balanced compute, and RDS architecture
  designed around least privilege, tiered network access, and monitored
  recovery.
- Context: a production-style AWS environment needed IAM, network,
  compute, database, and monitoring decisions made deliberately rather
  than defaulted.
- Responsibility: designed IAM users/groups/roles under least privilege;
  the public/private VPC tiers and security groups; the ALB, compute tier,
  and RDS configuration; the CloudWatch/SNS monitoring layer.
- Implementation decisions: least-privilege IAM rather than broad standing
  permissions; public/private VPC tiers with security groups scoped to
  actual traffic needs; an ALB in front of the compute tier; RDS engine
  selection with Multi-AZ availability, read replicas, encryption, and a
  defined backup/restore strategy; CloudWatch metrics/logs with alarms
  routed to SNS.
- Tools/services: AWS IAM, AWS VPC, Application Load Balancer, Amazon RDS,
  CloudWatch, SNS.
- Challenge/resolution: worked through RDS engine, Multi-AZ, and
  backup/restore tradeoffs; validated that CloudWatch alarms actually
  fired to SNS as configured.
- Outcome: a documented, security-and-recovery-aware AWS architecture with
  monitoring wired through to alerting.

**Security controls documented (the richest of the four projects):**
least-privilege IAM, VPC network tiering, security groups scoped to actual
traffic, RDS encryption, RDS Multi-AZ availability, defined backup/restore
strategy, CloudWatch alarms routed to SNS (verified to actually fire, not
just configured).

**Evidence available:** none (no repository link — `links: []`).

**Evidence missing:** no screenshot; no repository/deployment link.

**Allowed RC-01 narration:** the verified facts above, including the rich
security-control list — this is the strongest project for a "Secure" or
"Recover" stage narration precisely because it has the most documented
detail. **RC-01 must state the label note ("learning implementation, not
used for a real production client") whenever this project is presented as
a case study or evidence source, not only when directly asked** — this is
the clearest instance in the whole content set of a fact that changes how
everything else about the project should be framed.

**Statements that must not be made:** any implication this ran or runs in
a real production environment for a real client (the label note explicitly
forecloses this); any specific metric (request volume, cost, uptime
percentage — none are recorded); "explore the repository" (`links: []`).

## Node.js Authentication Application with MySQL and Amazon RDS

| | |
|---|---|
| Slug | `nodejs-auth-mysql-rds` |
| Categories | Cloud, DevOps |
| Spine stages demonstrated | `build`, `container`, `cloud`, `observe` (4 of 8 — **see the flagged inconsistency above**: `container` appears here despite the flow text saying "Container-free deploy") |
| Flow (verbatim) | Build -> Container-free deploy -> Cloud (EC2 + RDS) -> Observe |

**Architecture nodes:** Build, (Container-free) Deploy, Cloud (EC2 + RDS),
Observe.

**Verified facts:**
- Summary: a Node.js/Express app on Ubuntu EC2 with bcrypt-hashed
  authentication against MySQL on Amazon RDS, managed by PM2.
- Context: an authentication flow needed a real deployment target rather
  than running only in a local dev environment.
- Responsibility: deployed the Node.js/Express app on Ubuntu EC2, connected
  it to MySQL via mysql2/promise pooling, implemented bcrypt-based
  registration and login, managed the process with PM2.
- Implementation decisions: mysql2/promise connection pooling instead of
  per-request connections; bcrypt password hashing for registration and
  login; environment variables for database/session configuration; PM2
  for process management.
- Tools/services: Node.js, Express, MySQL, Amazon RDS, bcrypt, PM2, AWS EC2.
- Challenge/resolution: verified database connectivity, application
  response, registration, login, and stored records end to end after
  deployment.
- Outcome: a working authentication application deployed and
  process-managed on EC2 against a managed RDS database.

**Security controls documented:** bcrypt password hashing (application-
level), environment-variable-based configuration (avoids hardcoded
secrets, though this is inferred from "environment variables for database
and session configuration" — the decision text does not explicitly say
"instead of hardcoding," so RC-01 should state the fact as written, not
add the implied contrast).

**Evidence available:** none (no repository link — `links: []`).

**Evidence missing:** no screenshot; no repository/deployment link.

**Allowed RC-01 narration:** the verified facts above. May describe bcrypt
hashing and connection pooling as the project's security/reliability
decisions. **Must not describe this project's deployment as containerized**
given the explicit "Container-free deploy" wording in its own flow — this
is the one place in the content set where two fields disagree, and the
more specific, prose field (`flow`) should be treated as authoritative
over the categorical one (`spineStages`) until a content-team correction
resolves it.

**Statements that must not be made:** "this project uses Docker" or any
containerization claim (contradicts its own `flow` text); "explore the
repository" (`links: []`); any claim about session security beyond what's
stated (no session-fixation, CSRF, or rate-limiting decision is recorded).

## Cross-project summary table

| Project | Stages | Security controls | Repo link | Screenshot | Special constraint |
|---|---|---|---|---|---|
| Project Aurora | commit, build, container, cloud | None documented | Yes (real) | No | — |
| Distributed Jenkins Controller | commit, build, test | Scoped SSH credentials | No | No | — |
| Secure AWS Production Architecture | network, cloud, observe, recover | Richest: least-privilege IAM, VPC tiering, encryption, Multi-AZ, backup/restore, alarms | No | No | **Must always carry the "learning implementation, not a real production client" note** |
| Node.js Auth + RDS | build, container*, cloud, observe | bcrypt hashing, env-var config | No | No | **`container` stage flagged as inconsistent with "Container-free deploy" in its own flow text — narrate with caution** |

Only Project Aurora has a real, verifiable external link. Any V6 pillar
that implies "inspect the real repository" for the other three projects
would misrepresent what's actually available — Proof Mode (Pillar 4) must
render the honest `Field<>` "needs-input" state for those, exactly as the
rest of the site already does for missing content elsewhere.
