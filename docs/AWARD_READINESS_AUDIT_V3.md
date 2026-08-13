# Award Readiness Audit — v3

Judged from the rendered production build (`npm run build && npm run start -- -H 0.0.0.0 -p 3200`), not from the v2 completion report. Screenshots backing this audit: `/home/tarun/screenshots/award-polish-v3/pre-audit/` (10 routes × 7 widths: 320/375/390/768/1024/1440/1920) plus the existing `/home/tarun/screenshots/visual-rebuild-v2/` set.

## What is visually distinctive

- The dominant "TARUN PRADEEP" name treatment in the hero, with the 3D topology's real node labels (Commit/Build/Test/.../Recover) threading behind and around the letters, is a genuine signature moment. Nothing else on the page competes with it for attention.
- The code-generated SVG cover art (four different compositions — horizontal pipeline, controller/agent hub-spoke, tiered VPC, compact request flow) is a real point of view: it's honest about what data exists and turns that honesty into the visual, rather than hiding the gap behind a stock photo.
- Dark "control" hero → light "field manual" body is a legible, intentional structural idea, not just a color swap.

## What still feels like a template

- **Every section below the hero uses the identical eyebrow → `h2` → content-block rhythm**: "Selected work", "How it fits together", "Capabilities", "Experience", "Education & certifications", "Engineering lab", "Contact" all read as the same component repeated seven times with different children. This is the exact pattern the v2 audit flagged and it was never actually broken — v2 fixed content problems (placeholders, "Needs input") inside that rhythm, not the rhythm itself.
- **Every "card" on the site is the same visual object**: a hairline `border-[var(--line)]` rectangle with `rounded-sm` corners — skill badges, certification cards, the flagship grid frame, the lab list dividers. There is exactly one container language on the entire site. That's the concrete shape of "component-library demo."
- The 404 page is a bare heading/paragraph/button with zero connection to the Infrastructure Atlas identity — could belong to any Next.js starter.
- The About page is a career-story paragraph followed by three plain lists (Experience, Education, Certifications) — functionally a résumé rendered as HTML, which is exactly what the brief warns against.

## Typography and hierarchy issues

- Archivo Black / Public Sans / Space Mono is a real, deliberate choice (documented rejection of Big Shoulders and Space Grotesk in the v2 audit) and reads well at hero scale. Below the hero, `text-display` (`h2`) and `text-heading` (`h3`) are close enough in weight/size that section headings and card titles don't clearly separate — everything between the hero and the footer sits in a narrow band of visual weight.
- No page has a second moment of scale contrast after the hero. Once the eye leaves "TARUN PRADEEP," nothing on the rest of the page is large again until the next page's hero-less heading — flat for the remaining ~90% of scroll depth.

## Repeated layout/animation patterns

- `ScrollReveal` is applied almost uniformly: fade + 24px rise, 0.6s, `power3.out`, on every section. It's the same GSAP tween nine times with different targets. It communicates "the page loaded," not hierarchy, system state, or route progress — this is the "repetitive fade-and-slide" the brief explicitly calls out.
- The Reliability Spine still appears as two near-identical static row-of-nodes renderings (decorative hero canvas, then the DOM walkthrough) with no motion or visual thread connecting them — a visitor scrolling past has no sense that these are the same system reappearing, just two separate diagrams that happen to share content.

## Weak or empty areas

- **1920px is the biggest concrete gap.** `max-w-7xl` (1280px) centers a fixed-width column in a much wider viewport with no full-bleed moment anywhere on the site — every section looks like it's floating in unused background. The hero topology's node spread was tuned for ~1440px and doesn't fill the extra width at all.
- **The flagship grid breaks at `lg:grid-cols-3` in `WorkFilterBar`** (`/work`) — 4 items in a 3-column grid strands the 4th project alone in a mostly-empty row. Confirmed in `work-1920.png`.
- The résumé page (no PDF yet) is a single sentence and one button in an otherwise full-height section — technically correct (per `CONTENT_GAPS.md`, no fabrication), but visually the weakest page on the site.

## Mobile composition problems

- Nothing is broken (no horizontal overflow at 320/375/390, confirmed both by the e2e suite and this sweep) — but nothing is *composed* for mobile either. Every section is the same desktop stack collapsed to one column; the hero topology effectively disappears below ~430px (nodes fall outside the narrow frustum), which is a graceful degradation rather than an intentional small-viewport version of the concept.

## Confusing interactions

- None found that break usability — filter buttons, mobile nav, spine node focus/expand, copy-email all work and are keyboard-reachable. The main interaction gap is that scroll itself carries no meaning beyond "reveal the next block" — there's no interaction on the site right now that visibly *responds* to where the visitor is in the story.

## Performance risks

- Hero mounts an R3F `Canvas` with 8 `drei` `Html` overlays (labels) — capped DPR and paused frameloop already in place (`useAdaptiveQuality`), gated behind `prefers-reduced-motion`. Real risk is untested: no WebGL-context-loss handling, and disposal on unmount was never explicitly verified (relying on R3F/drei defaults).
- No image assets on the site at all — all visuals are inline SVG/Canvas — so there is no image-weight risk, only JS bundle weight (Three.js + drei + GSAP) to watch.
- Lighthouse/PageSpeed: **not measured**, same environment blocker as v2 (documented, not invented).

## Content weaknesses

- All real, none fabricated. The weakness is presentational, not factual: case studies present real facts in generic prose blocks (Responsibility / Tools / Implementation decisions / Challenge / Outcome) with no visual variation between the four pages — swap the words and the four case-study routes are indistinguishable in layout.

## Page-by-page scorecard (internal target: 8/10 each)

| Page | Design | Usability | Creativity | Content | Notes |
|---|---|---|---|---|---|
| Home | 6 | 8 | 6 | 8 | Hero is strong; everything after it is one repeated rhythm |
| Work index | 6 | 8 | 6 | 8 | Cover art is the highlight; 3-col/4-item grid gap is a real defect |
| Case study (×4) | 6 | 7 | 5 | 8 | Identical template across all 4; diagrams need captions/legend |
| About | 5 | 7 | 4 | 7 | Résumé-as-HTML; no distinct visual identity of its own |
| Résumé | 5 | 8 | 4 | 8 | Honest, but the thinnest page on the site |
| Contact | 6 | 8 | 5 | 8 | Functional, no relationship to the rest of the site's visual system |
| 404 | 4 | 8 | 2 | 7 | Generic starter-template page |

## Semantics, SEO, accessibility, animation — current state (not re-litigated, spot-checked)

- Metadata, JSON-LD, sitemap, robots.txt, Open Graph: present and correct (`lib/seo/metadata.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`) — unchanged, no new issues found.
- Heading order, focus-visible, skip link, reduced-motion, keyboard reachability: verified working by the existing 42-test e2e suite; spot-checked this session, still correct.
- Diagrams (`ArchitectureDiagram`, `ProjectCoverArt`) have `role="img"`/`aria-label` text alternatives but no visible caption/legend/reading-order indicator for sighted users — a real gap the brief specifically calls out ("avoid diagrams that are attractive but technically ambiguous").

## Bottom line

V2 solved every *content-integrity* problem the original audit found (placeholders, fabrication risk, "Needs input" leakage) and built one genuinely strong signature moment (the hero). What's left is structural: one repeated section rhythm, one container language used for everything, no second scale-contrast moment after the hero, a broken grid math at wide desktop, and zero connection between "the topology" as a decorative hero element and "the topology" as the site's actual information architecture. That gap — decoration in the hero, plain HTML everywhere else — is exactly what Phase 3–5 of this pass needs to close.
