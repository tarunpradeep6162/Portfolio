# Award Polish v3 — Implementation Plan

Ordered by perceptual impact (highest first). Each item: problem → intended result → affected files → verification.

## 1. Deployment Flightpath (signature moment)
**Problem:** the topology exists only as hero decoration; nothing carries the "system flow" idea through the rest of the page. No second scale-contrast moment after the hero.
**Result:** one lightweight SVG path, in the page gutter, tracking real scroll progress (dash-offset via GSAP, not pinned/scrubbed-hijack), with waypoints at the real spine stages, from hero through work into contact. Static/fully-drawn under reduced motion.
**Files:** new `components/flightpath/DeploymentFlightpath.tsx`, `app/page.tsx` (mount + wrap sections in a positioning context), `lib/motion/tokens.ts` (new easing/duration if needed).
**Verify:** manual scroll test at 375/1440, reduced-motion e2e, keyboard tab-through unaffected, no `aria-hidden` content read by screen readers as meaningful, no horizontal overflow.

## 2. Fix flagship grid stranding 4th item
**Problem:** `lg:grid-cols-3` with 4 flagship projects strands the 4th alone in an empty row (confirmed `work-1920.png`).
**Result:** cap the flagship grid at 2 columns at every width — reads as curated pairs, not a commodity grid, and never strands an item.
**Files:** `components/work/WorkFilterBar.tsx`, `app/page.tsx` (home grid already 2-col, confirm consistency).
**Verify:** screenshot at 1024/1440/1920, filter through each category (1-4 result counts).

## 3. Full-bleed moment(s)
**Problem:** `max-w-7xl` container used everywhere; nothing breaks the frame at wide desktop.
**Result:** case-study cover art and the Flightpath's contact resolution go edge-to-edge (outside `Container`) on their own routes; body copy stays measured.
**Files:** `app/work/[slug]/page.tsx`, `components/work/ProjectCoverArt.tsx` wrapper.
**Verify:** screenshot at 1920, confirm no double-scrollbar/overflow.

## 4. Container/card language variety
**Problem:** every card/badge/list on the site is the identical bordered rectangle.
**Result:** differentiate by content type — skills as grouped text runs (not pills), certifications as a compact ledger/table row style, lab list keeps hairline dividers, flagship cards keep the bordered-image-card (it earns its border by framing art).
**Files:** `components/ui/Badge.tsx` usage sites (`app/page.tsx` skills block), `components/about/CertificationList.tsx`.
**Verify:** visual diff before/after at 1440/375.

## 5. Section rhythm variation (home page)
**Problem:** 7 sections all read as eyebrow → h2 → block.
**Result:** vary alignment/width/density between sections — at minimum: one full-width statement moment (pull-quote from real `about.narrative`), one asymmetric two-column moment, keep the rest but vary spacing rhythm so it doesn't scan as one repeated component.
**Files:** `app/page.tsx`.
**Verify:** full-page screenshot 1440/375, confirm heading order still h1→h2→h3 valid.

## 6. 404 page — Infrastructure Atlas concept
**Problem:** generic starter-template 404.
**Result:** small honest concept — an "unresolved endpoint" framed with the same flow-diagram visual language (real component, fake/placeholder route data is fine here since it's explicitly a 404, not a claim about a real system).
**Files:** `app/not-found.tsx`, reuse `components/work/ProjectCoverArt.tsx`'s pattern or a small new component.
**Verify:** screenshot, confirm still keyboard/screen-reader accessible, `Back to home` remains primary action.

## 7. Résumé page — real polished web résumé
**Problem:** current page is one sentence + one button; spec requires a polished web résumé when no PDF exists, not a thin stub.
**Result:** compose a genuine on-page résumé from existing typed content (`experience.ts`, `education.ts`, `certifications.ts`, `skills.ts`) — print-friendly, single column, no invented facts.
**Files:** `app/resume/page.tsx`.
**Verify:** cross-check every rendered fact against its `content/*.ts` source, confirm `CONTENT_GAPS.md` still accurate (PDF still missing).

## 8. About page — editorial, not résumé-in-cards
**Problem:** narrative paragraph + 3 plain lists reads as a résumé dump.
**Result:** pull-quote treatment for the strongest line of the real narrative at large scale (second scale-contrast moment), experience as a visual timeline rather than plain `<li>` stack, same real data.
**Files:** `app/about/page.tsx`, `components/about/ExperienceTimeline.tsx`.
**Verify:** screenshot, confirm no new facts introduced (diff against `content/experience.ts`).

## 9. Case-study narrative relabeling + diagram captions
**Problem:** all 4 case studies are visually identical templates; diagrams have no visible caption/legend.
**Result:** relabel existing section headings toward the 9-beat narrative (context/constraint/responsibility/decision/build/tradeoff/result — using only real existing fields, no new content), add a caption/legend line under `ArchitectureDiagram` and `ProjectCoverArt` explaining color/reading order.
**Files:** `app/work/[slug]/page.tsx`, `components/work/ArchitectureDiagram.tsx`, `components/work/ProjectCoverArt.tsx`.
**Verify:** screenshot all 4 case studies, confirm every heading still maps 1:1 to real `content/projects.ts` fields.

## 10. Typography/composition pass
**Problem:** flat visual weight between hero and footer; `text-display`/`text-heading` too close.
**Result:** widen the gap between heading tiers, tune line-length/tracking at each tier, verify in-browser at every breakpoint.
**Files:** `app/globals.css` (`@theme` scale).
**Verify:** screenshot comparison, `npm run test:e2e` responsive suite must still pass.

## 11. Motion audit
**Problem:** `ScrollReveal` identical everywhere; no motion communicates hierarchy/state.
**Result:** vary reveal distance/stagger by content density; Flightpath (item 1) becomes the one true "responds to scroll" moment; keep everything else restrained per spec (no new scroll-hijacking effects).
**Files:** `components/shared/ScrollReveal.tsx`, `lib/motion/tokens.ts`.
**Verify:** wheel-scroll capture script (proven reliable in v2), reduced-motion e2e.

## 12. Mobile-specific composition
**Problem:** mobile is desktop-stacked, not separately composed.
**Result:** intentional mobile treatment for hero name wrap, topology (accept it's hidden below ~430px, document why), Flightpath (simplified to a single margin line), diagrams (confirm legibility at 320).
**Files:** `app/globals.css`, `components/hero/Hero.tsx`, `components/flightpath/DeploymentFlightpath.tsx`.
**Verify:** screenshot at 320/375/390, 44px touch-target audit, e2e overflow suite.

## Explicitly out of scope for this pass
- New WebGL work beyond the existing hero canvas (spec forbids a costly persistent cross-page canvas).
- Any new fact, metric, client, or credential not already in `content/*.ts`.
- Deployment (no credentials configured, not requested).
