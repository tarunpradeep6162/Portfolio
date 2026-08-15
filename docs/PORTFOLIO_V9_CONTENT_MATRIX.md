# Portfolio V9 — Content Matrix

Every row below is verified directly against `content/*.ts` and
`CONTENT_GAPS.md` at commit `9459778` (the V8 final tag) — nothing here is
inferred or projected. This matrix is the single source of truth V9's
Recruiter Flight Plan, Evidence Graph, and Scenario Simulator must all
draw from; none of them may show a project, link, or metric that isn't
listed as `verified` below.

## Projects → path relevance → evidence status

| Project | Recruiter (top 4) | Engineer | Explorer | Repo link | Screenshot |
|---|:---:|:---:|:---:|---|---|
| Project Aurora (containerised app, AWS EC2) | ✓ | ✓ | ✓ | **verified** — `github.com/tarunpradeep6162/ProjectAurora` | needs-input |
| Distributed Jenkins Controller + Linux build agent | ✓ | ✓ | ✓ | needs-input | needs-input |
| Secure AWS Production Architecture | ✓ | ✓ | ✓ | needs-input | needs-input |
| Node.js Auth + MySQL/RDS | ✓ | ✓ | ✓ | needs-input | needs-input |
| Serverless Employee API | | ✓ (lab) | ✓ | needs-input | — (no case-study page) |
| S3 Static Website CI/CD | | ✓ (lab) | ✓ | needs-input | — |
| Jenkins Persistence w/ Docker Volumes | | ✓ (lab) | ✓ | needs-input | — |
| VPC Networking Lab | | ✓ (lab) | ✓ | needs-input | — |
| ALB and Auto Scaling Lab | | ✓ (lab) | ✓ | needs-input | — |
| Elastic Beanstalk CI/CD | | ✓ (lab) | ✓ | needs-input | — |
| Kubernetes Fundamentals | | ✓ (lab) | ✓ | needs-input | — |
| Cinematic Web Experience | | | ✓ | live URL withheld pending review | — |

The "top 4" for the Recruiter Flight Plan are exactly the 4 existing
flagship case studies — this is not a new curation decision, it matches
how `content/projects.ts` and the existing `/work` index already
distinguish flagship from lab entries.

## Other content areas

| Area | Status | Detail |
|---|---|---|
| Résumé | needs-input | No PDF. `/resume` and hero CTA show a "Request résumé" email action. V9 must keep this pattern, not add a fake download link. |
| Experience — Stackly (current role) | partial | Role/company/dates shown; achievements list omitted (not shown empty or flagged) pending detail. |
| Experience — 2 prior roles | verified | Full entries present in `content/experience.ts`. |
| Education | verified | 2 institutions present in `content/education.ts`. |
| Certifications (8 of N) | needs-input | Missing issuer link and/or credential ID: Microsoft Azure Administrator Associate, Google IT Support, Accenture Technology Consulting, IBM Cognitive Class, Linux & Python Module, CCNA Network Essentials, Server Application & Virtualization Module, Data Migration & Resilience Module. |
| Skills | verified | Present in `content/skills.ts`, used as-is by Proof Ledger and comparison views today. |
| Incidents (Incident Replay) | verified | Real, documented engineering incidents in `content/v7/incidents.ts` — reusable directly by Evidence Graph and Engineer Investigation. |
| Automation pipeline (Automation Fabric) | verified | Real CI/CD stages for this site's own delivery, in `content/v7/automation.ts` — reusable directly. |
| Reliability Spine (8 stages) | verified | `content/spine.ts` — the taxonomy every project/incident is already mapped against; Evidence Graph should use this as its existing schema, not invent a new one. |

## What this means for each V9 pillar

- **Recruiter Flight Plan**: fully buildable today with verified content
  — 4 flagship projects, verified skills, 2 verified prior roles + 1
  partial current role, no fabrication needed. The only real constraint:
  the résumé step must stay an email request, not a download.
- **Evidence Graph**: buildable today for Project Aurora (real repo
  link) and for the site's own CI/CD (Automation Fabric data is real and
  complete). Every other project's "commit/repo" node must render as
  `needs-input`, exactly like the rest of the site does — the graph
  cannot imply more provenance than exists.
- **Scenario Simulator**: has real material to connect to (Incident
  Replay's documented incidents, the Reliability Spine's 8 stages) —
  scenarios should be framed as "this simulates the class of problem
  documented in [real incident]," not as free-standing hypotheticals.
- **Engineer Investigation**: no new content required; this pillar is
  materially about connecting existing verified content (architecture,
  incidents, automation, proof ledger), not sourcing new content.

## Content blockers requiring user input before V9 can claim more than V8 already does

1. Résumé PDF.
2. Screenshots for the 4 flagship case studies.
3. Repository links for the 8 lab projects.
4. Issuer link and/or credential ID for 8 certifications.
5. Stackly (current role) achievement details.
6. Decision on whether/when to publish the Cinematic Web Experience live
   URL.

None of these block V9 *preparation* or the reversible-phase
implementation plan — they block specific content from appearing as
`verified` rather than `needs-input` inside new V9 surfaces. Per the task
instructions, V9 will render every one of these as absent/needs-input
until supplied, exactly as V8 already does.
