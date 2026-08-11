# Visual Rebuild v2 — Completion Report

Branch: `visual-rebuild-v2` (9 commits ahead of `main`, `main` untouched and still deployable as-is).

## 1. Visual problems identified (docs/VISUAL_AUDIT_V2.md)

- The same eyebrow → heading → text-block → gap rhythm repeated across ~8 sections with no visual hierarchy distinguishing the hero from any other section.
- The Reliability Spine rendered three times on the home page (hero 3D canvas, a static DOM copy directly beneath it, and again as the mid-page interactive walkthrough) with no new information between instances.
- A ~720px-tall "Needs project screenshot" placeholder box on every flagship card and case-study page — the single biggest flagged issue.
- Public "Needs input" text visible on the résumé page, the Stackly experience entry, and 8 certifications.
- Hero typography was the same weight/scale as body headings — nothing established the page owner's name as the dominant visual element.

## 2. Art direction selected

**Infrastructure Atlas** — the existing "Reliability Spine" concept (`Commit → Build → Test → Container → Network → Cloud → Observe → Recover`, real data in `content/spine.ts`) kept as the sole information architecture, but re-expressed as:
- A full-viewport hero with "TARUN PRADEEP" as dominant typography (`--text-name` fluid token, `clamp(3.5rem, 1rem + 12vw, 11rem)`) and the topology's 3D nodes threading behind/around the letters instead of sitting in a masked side-panel.
- Typography swapped to Archivo Black / Public Sans / Space Mono (see `docs/VISUAL_AUDIT_V2.md` §4 for the rejected alternatives and why).
- Code-generated architecture cover art (SVG, per-project composition) replacing every screenshot placeholder, built only from each project's real `flow` data.

## 3. Major files changed

| Area | Files |
|---|---|
| Typography system | `app/layout.tsx`, `app/globals.css` |
| Content-gap handling | `CONTENT_GAPS.md` (new), `components/about/{ExperienceTimeline,CertificationList}.tsx`, `app/resume/page.tsx`, `components/shared/NeedsInput.tsx` (deleted) |
| Project cover art | `components/work/ProjectCoverArt.tsx` (new), `components/work/NeedsScreenshot.tsx` (deleted), `components/work/ProjectCard.tsx`, `app/work/[slug]/page.tsx` |
| Work page structure | `components/work/WorkFilterBar.tsx`, `components/work/LabProjectList.tsx` (new) |
| Hero rebuild | `components/hero/Hero.tsx`, `components/hero/HeroSpineCanvas.tsx`, `components/hero/HeroSpineLoader.tsx`, `components/hero/HeroSpineFallback.tsx` (deleted), `lib/motion/useFinePointer.ts` (new) |
| Motion choreography | `components/shared/ScrollReveal.tsx` (new), `lib/motion/tokens.ts`, plus `data-reveal` wiring across `app/page.tsx`, `components/spine/ReliabilitySpine.tsx`, `components/about/ExperienceTimeline.tsx`, `components/about/CertificationList.tsx`, `components/work/LabProjectList.tsx`, `components/work/WorkFilterBar.tsx`, `app/work/[slug]/page.tsx` |
| Test infra | `tests/unit/setup.ts` (global `matchMedia` polyfill), `tests/e2e/links.spec.ts` (updated stale assertion) |

## 4. Screenshots

- Baseline (pre-rebuild): `/home/tarun/screenshots/visual-rebuild-v2/baseline/`
- Hero, before/after the node-label collision fix: `/home/tarun/screenshots/visual-rebuild-v2/hero/`
- Cover art, all 4 flagship projects + card grid: `/home/tarun/screenshots/visual-rebuild-v2/cover-art/`
- Motion verification (real scroll, not fullPage): `/home/tarun/screenshots/visual-rebuild-v2/wheel-scroll/`
- Final full-site sweep, every route × 375/768/1440px: `/home/tarun/screenshots/visual-rebuild-v2/final-sweep/`

## 5. Test / build results (final run)

- `npm run verify` (lint + typecheck + unit tests + production build): **pass**, 13/13 unit tests.
- `npm run test:e2e`: **42/42 pass**, including reduced-motion canvas-gating, horizontal-overflow checks at 6 breakpoints, and console-error checks on every route.
- Lighthouse: not measured — this VM could not run a Chromium DevTools session reliably (documented in `docs/VISUAL_AUDIT_V2.md`); not asserted anywhere in this report.

## 6. Defects found and fixed during this pass

- `ProjectCoverArt`'s tiered AWS diagram initially paired real flow steps (`Observe`, `Recover`) with fabricated AWS-tier labels (`"Data tier — RDS Multi-AZ"`) that didn't correspond to those steps — replaced with honest `TIER 01–04` labels.
- Fixed-width pipeline/flow-diagram boxes overflowed for longer step names (`"Container-free deploy"`) — both now size to content.
- Hero 3D node labels initially collided with the dominant name typography — fixed by only labeling nodes past the text column's right edge; unlabeled spheres crossing behind the letters read as intentional depth instead.
- `/work` mixed flagship (image) and lab (text-only) cards in one grid, producing ragged row heights — split into two labeled sections with correct heading order.
- A stale e2e assertion (`links.spec.ts`) still expected "Needs input" text that Step 6 had intentionally removed — updated to match the real, intentional copy.

## 7. Remaining content gaps (unchanged from CONTENT_GAPS.md, tracked not fabricated)

No résumé PDF; Stackly role achievements withheld; 8 certifications missing issuer link/credential ID; Engineering-lab repo links (7 projects) not yet supplied; Cinematic Web Experience live URL withheld pending confirmation. None of these render as public "Needs input" text anymore — see `CONTENT_GAPS.md` for the internal tracking and exactly which `content/*.ts` field to update when each is supplied.

## 8. Local preview

```bash
cd /home/tarun/tarun-portfolio
npm run build && npm run start
```

Then open `http://localhost:3200` (or `http://192.168.1.38:3200` from another device on the LAN — UFW already allows this port).

## 9. Not done in this pass

- Deployment (gated on Vercel credentials, per the original build plan).
- A literal cross-page "traveling" canvas (the topology now appears once decoratively in the hero and once as the canonical interactive walkthrough mid-page, rather than a persistent element that visually moves between sections — judged a better cost/benefit than a much larger WebGL-scroll-linkage effort, see `components/hero/HeroSpineLoader.tsx` comment).
