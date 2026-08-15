# Portfolio V8 — Content Matrix

Inventory of what exists today, its `Field<T>` status, and what Direction
A ("Unified Control Room", see `docs/PORTFOLIO_V8_DISCOVERY.md`) needs
from it. Source of truth for status remains `content/*.ts` and
`CONTENT_GAPS.md` — this table does not duplicate that data, it maps it
against V8 scope so nothing gets rebuilt as a second content database.

## Legend

- **Ready** — real data, `status: "ready"` in the relevant `content/*.ts`.
- **Gap (tracked)** — `status: "needs-input"`, already listed in
  `CONTENT_GAPS.md`.
- **V8 need** — Required / Nice-to-have / Not needed, specific to
  Direction A.

## Core identity and navigation

| Content | Status | Source | V8 need |
|---|---|---|---|
| Name, email, GitHub/LinkedIn URLs, hero copy | Ready | `content/site.ts` | Required — unchanged, feeds the unified host's entry state |
| About narrative | Ready | `content/site.ts` | Required — becomes the control room's framing text, not a separate résumé-as-HTML page (see Direction A's homepage recomposition) |
| Résumé PDF | Gap (tracked) | `content/site.ts` `resumeFile` | Nice-to-have — Direction A does not depend on it; `/resume` keeps the existing honest "Request résumé" fallback until supplied |

## Reliability Spine (becomes literal site structure under Direction A)

| Content | Status | Source | V8 need |
|---|---|---|---|
| Eight spine stages (Commit…Recover) | Ready | `content/spine.ts` | Required — this is the backbone Direction A's unified navigation is built on; no new stages need inventing |
| Per-project `spineStages` references | Ready | `content/projects.ts` | Required — drives per-project instrument/topology variety inside the unified scene, same as V7 |

## Flagship projects (×4: Aurora, Distributed Jenkins Controller, Secure AWS Production Architecture, Node.js Auth + RDS)

| Content | Status | Source | V8 need |
|---|---|---|---|
| Case-study prose (Responsibility/Tools/Implementation/Challenge/Outcome) | Ready | `content/projects.ts` | Required — V3's finding that all four case studies share one indistinguishable layout is a presentation problem for the implementation phases to solve, not a content gap |
| `flow` data (drives generated topology + cover art) | Ready | `content/projects.ts` | Required — this is exactly what Direction A's unified scene reads to build each project's instrument/topology variant; nothing new to author |
| Real screenshots (×4) | Gap (tracked) | `content/projects.ts` `screenshot` | Nice-to-have — generated cover art stays the honest default; real screenshots would strengthen but are not blocking |

## Engineering lab (×7 lab projects)

| Content | Status | Source | V8 need |
|---|---|---|---|
| Lab project entries (name, description) | Ready | `content/projects.ts` (`kind: "lab"`) | Required — unchanged |
| Repository links (×7) | Gap (tracked) | `content/projects.ts` | Nice-to-have — if Direction C ("Live System," deferred per the discovery doc's recommendation) is ever scoped, these links become required first; not needed for Direction A |

## Experience

| Content | Status | Source | V8 need |
|---|---|---|---|
| Role/company/dates (all roles) | Ready | `content/experience.ts` | Required — unchanged |
| Stackly achievements (current role, May 2026–Present) | Gap (tracked) | `content/experience.ts` `achievements` | Nice-to-have — omitted cleanly today per `Field<T>`; would strengthen the "Operating history" section but blocks nothing |

## Certifications

| Content | Status | Source | V8 need |
|---|---|---|---|
| Certification names/issuers | Ready | `content/certifications.ts` | Required — unchanged |
| Issuer link / credential ID (×8 certifications) | Gap (tracked) | `content/certifications.ts` | Nice-to-have — same honest omission pattern continues into V8 |

## Incidents, automation, evidence (V7-originated, feeds Direction A's Proof surfaces)

| Content | Status | Source | V8 need |
|---|---|---|---|
| Three real incidents (Atlas regression, Suspense-boundary build failure, topology line-crossover) | Ready | `content/v7/incidents.ts` | Required — these are real, already-documented engineering events; Direction A's unified control room continues to surface them, doesn't need new ones invented |
| Automation Fabric pipeline stages (verified vs. pending) | Ready | `content/v7/automation.ts` | Required — unchanged; continues to honestly split real V6/V7 evidence from genuinely-not-yet-run stages |
| Proof Ledger mapping (`Field<T>` → verified/explained/missing) | Ready (derived, not stored) | `lib/v7/evidenceMapper.ts` | Required — Direction A keeps this as a pure mapping function, not a new content database, exactly per the existing architecture decision |

## Cinematic Web Experience (separate project, access-gated)

| Content | Status | Source | V8 need |
|---|---|---|---|
| Live URL | Gap (tracked, deliberately withheld) | `CONTENT_GAPS.md` | Not needed — withheld pending your review of personal-content/access-control fit; V8 does not change this decision |

## Net content posture for V8

Direction A requires **zero new content authoring** to begin — every
piece of data its unified scene needs (spine stages, per-project `flow`,
incidents, automation stages) already exists and is `status: "ready"`.
The open gaps (résumé PDF, Stackly achievements, 8 certification
links/IDs, 4 project screenshots, 7 lab repo links, the Cinematic Web
Experience URL) all strengthen V8 if supplied during development but
block nothing — consistent with how V7 shipped honestly around the same
gaps. See the open questions in `docs/PORTFOLIO_V8_DISCOVERY.md` for
which of these you may want to prioritize supplying.
