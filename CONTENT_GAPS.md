# Content gaps

Internal tracking only — none of this is rendered publicly. The underlying
`Field<T>` typed model (`content/types.ts`) still marks each of these as
`"needs-input"`; production components simply omit the unavailable control
instead of announcing it, per the visual rebuild's Step 6.

## Résumé
- No PDF supplied yet. `/resume` and the hero's secondary CTA show a
  "Request résumé" email action instead of a disabled download link.

## Experience
- Stackly (Cloud Engineer, May 2026–Present): role, company, and dates are
  shown; detailed achievements are not yet supplied, so the achievements
  list is simply omitted for that entry (not shown as empty or flagged).
  TODO: supply 3-5 real accomplishment bullets in `content/experience.ts`
  (see the inline TODO comment on that entry) - e.g. infrastructure/IaC
  work, automation shipped, incidents handled, delivery or cost outcomes.
  Only add what actually happened; the Vaata Smart entry above it is the
  bar for specificity.

## Certifications — missing issuer link and/or credential ID
- Microsoft Certified: Azure Administrator Associate
- Google IT Support Certificate
- Accenture Technology Consulting Virtual Experience Certificate
- IBM Cognitive Class Certificate
- Linux & Python Module for Cloud & DevOps
- CCNA Network Essentials Course Student Certificate
- Server Application & Virtualization Module for Cloud & DevOps
- Data Migration & Resilience Module for Cloud & DevOps

## Project screenshots (all 4 flagship case studies)
- Project Aurora, Distributed Jenkins Controller, Secure AWS Production
  Architecture, Node.js Auth + RDS — no real screenshots supplied. Each now
  renders code-generated architecture cover art (SVG, built from the
  project's own real `flow` data) instead of a "Needs project screenshot"
  placeholder.

## Flagship repository links — 3 of 4 unverified
- Only Project Aurora has a public repository link (`content/projects.ts`).
  Distributed Jenkins Controller, Secure AWS Production Architecture, and
  the Node.js Auth + RDS app all have an empty `links: []`. Each case
  study's own Proof Mode panel (`/work/<slug>`, "Proof Mode" toggle)
  already states this honestly per project ("No public repository or live
  link is available for this project.") — TODO: either publish a real
  public repo for each (even a cleaned-up/redacted one) and add it to
  `links`, or add a `labelNote` explaining why it stays private, matching
  the Secure AWS entry's existing "Architecture / learning implementation"
  note. Do not add a placeholder/fake URL.

## Incident Replay — real incidents from actual job experience
- The 3 entries in `content/v7/incidents.ts` are genuine, but they're all
  incidents from building this portfolio site itself (V6/V7 development),
  not from production work. The 7-step postmortem structure (Observed
  symptom → Evidence → Root cause → Correction → Verification → Prevention
  → Known limitation) is real and reusable — TODO: supply 1-2 real,
  appropriately anonymized incidents from actual Stackly/Vaata Smart work
  to replace or sit alongside these, in the same structure.

## Hero copy — tone pass
- The closing CTA ("Bring me the system that cannot stay manual.",
  `app/page.tsx`'s final section) is sharper and more specific than the
  hero copy in `content/site.ts` (`hero.primaryLine` /
  `hero.supportingCopy`). TODO: a copy rewrite pass on the hero to match
  that voice — this is a judgment call on tone, not a factual gap, so it's
  flagged here rather than auto-rewritten.

## Engineering lab — missing repository links
- Serverless Employee API, S3 Static Website CI/CD, Jenkins Persistence
  with Docker Volumes, VPC Networking Lab, ALB and Auto Scaling Lab,
  Elastic Beanstalk CI/CD, Kubernetes Fundamentals

## Cinematic Web Experience
- Live URL withheld until confirmed the personal content and access
  controls are appropriate for a professional portfolio.

## When any of these are supplied
Update the corresponding `content/*.ts` entry from
`{ status: "needs-input", note: "..." }` to `{ status: "ready", value: ... }`.
See `README.md`'s "Editing content" section for the exact field to change
per item.
