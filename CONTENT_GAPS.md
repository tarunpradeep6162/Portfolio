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
