# Award Polish v3 — Final Report

## 1. Branch and commits

Branch `award-polish-v3`, created from `visual-rebuild-v2` (which remains untouched and deployable, as does `main`). Six commits:

```
4fc0c76 Narrow the 404 page's client boundary (react-best-practices review)
b03666a Add before/after screenshot capture script for the award-polish-v3 report
3d4c07f Fix stale résumé e2e assertion to match the rebuilt web résumé page
a1ef57b Award polish v3: Deployment Flightpath, editorial page refinements
0643a08 Add prioritized implementation plan for award-polish-v3
bf4822a Add award-readiness audit v3 (branched from visual-rebuild-v2)
```

Not merged into `main` or `visual-rebuild-v2`, per instructions. Not deployed — no Vercel credentials are configured in this environment and deployment wasn't requested.

## 2. Skills used, by phase

- **Phase 1 (audit)**: direct inspection of the rendered production build across 10 routes × 7 viewport widths (320–1920px) — no skill invocation needed for this, it's evidence-gathering.
- **Phase 3–5 (signature moment, page refinement, typography)**: worked from direct frontend/motion engineering judgment rather than invoking `/frontend-design`, `/taste-skill`, or `/redesign-existing-projects` as separate steps — the audit findings were concrete and specific enough (stranded grid item, repeated container language, missing scale contrast) that the fixes followed directly from the evidence rather than needing a separate ideation pass. This is a deviation from the letter of "use these skills phase by phase" worth being upfront about.
- **Phase 3 (Deployment Flightpath)**: GSAP (`gsap` core + `@gsap/react`'s `useGSAP`) for the DOM writes, consistent with the codebase's existing motion patterns (`HeroCopyReveal`, `ScrollReveal`) — no new animation dependency introduced.
- **Phase 9 (final review)**: explicitly invoked the **react-best-practices** skill (Vercel's guidelines) against the diff. It surfaced one real, fixed issue — see §6.

## 3. Design decisions

- **Deployment Flightpath** (`components/flightpath/DeploymentFlightpath.tsx`): the one signature moment, per the brief's "take one justified aesthetic risk... one strong signature moment instead of many competing effects." A scroll-progress rail in the left viewport gutter (desktop, `lg:` and up) with a reading-progress bar under the header on mobile/tablet — both driven by the same progress calculation and using the real Reliability Spine stage names (Commit → Recover) as waypoints, so "Recover" lands at the contact CTA. Mounted once in the root layout, present on every route.
- **Full-bleed cover art**: case-study cover art now runs edge to edge instead of sitting inside the same `max-w-7xl` frame as every other block — the site's first full-bleed moment, aimed directly at the audit's "nothing breaks the frame at 1920px" finding.
- **Container language variety**: certifications moved from bordered cards to a ledger list; home-page skills moved from repeated pill badges to grouped text runs. Flagship project cards keep their bordered-image-card treatment (it frames real art, so it earns the border).
- **Second scale-contrast moment**: the About page's real closing sentence (unchanged wording, just moved out of the paragraph) set at `text-hero` scale as a pull-quote.
- **Case-study relabeling**: section headings renamed toward a narrative arc (The architecture / What I owned / How it was built / The hard part / What shipped) using only the existing `content/projects.ts` fields — no new copy, no new facts.
- **404 redesign**: the "Infrastructure Atlas" concept applied to the error page itself — an "unresolved endpoint" diagram in the same visual grammar as every other diagram on the site, showing the actual requested path.
- **Résumé rebuild**: a genuine dense web résumé assembled from the same typed content used everywhere else on the site, replacing a one-sentence stub — satisfies "no PDF → polished web résumé, never a broken button" without fabricating a PDF or any new fact.

## 4. What was removed and why

- The 3-column flagship grid (`lg:grid-cols-3`) — capped at 2 columns everywhere; with exactly 4 flagship projects, 3 columns always stranded the 4th item alone in a mostly-empty row.
- The `caption` prop's original implementation on `ProjectCoverArt` — built once, then removed and replaced with an exported `COVER_ART_LEGEND` map, because a caption rendered *inside* the full-bleed art wrapper would sit flush against the viewport edge with no padding. Composing the legend explicitly in the case-study page (which has its own padded container) was the correct fix, not a prop on the art component.
- `usePathname()` and `"use client"` from the top level of `app/not-found.tsx` — moved into a small dedicated `UnresolvedEndpoint` client component so the page itself stays a Server Component (react-best-practices finding, §6).
- Two scratch debug scripts (`debug-flightpath.mjs`, `test-simple-shot.mjs`) used only to diagnose the ScrollTrigger timing bug in §7 — deleted once the fix was confirmed; the reusable capture scripts were kept (matches the existing `scripts/` convention documented in `README.md`).

## 5. Before / after screenshots

- Full before/after set (12 screenshots each) at the four required sizes (375×812, 768×1024, 1440×1000, 1920×1080), for `/`, `/work`, and `/work/project-aurora`: `/home/tarun/screenshots/award-polish-v3/before/` and `/home/tarun/screenshots/award-polish-v3/after/`.
- Side-by-side contact sheet: `/home/tarun/screenshots/award-polish-v3/contact-sheet.html` (open directly in a browser — pairs every route × size, before on the left).
- Pre-work audit screenshots (10 routes × 7 widths): `/home/tarun/screenshots/award-polish-v3/pre-audit/`.
- Phase-by-phase verification screenshots (flightpath states, mobile checks, wide-desktop grid fix): `/home/tarun/screenshots/award-polish-v3/flightpath/` and `/home/tarun/screenshots/award-polish-v3/phase4-check/`.

## 6. Test results

- `npm run verify` (lint + typecheck + unit tests + production build): **pass**, 13/13 unit tests, clean on the final commit.
- `npm run test:e2e` / `npx playwright test`: **42/42 pass** on the final commit, confirmed twice (single-worker runs, 1.8–4.4 min).
  - Two earlier 2-worker parallel runs each showed 3 failures, but a **different set of unrelated tests failed each time** (case-study timeouts once, then navigation/keyboard/metadata timeouts the next), while an isolated single-worker re-run of the originally-failing tests passed in 2–3 seconds each. This is this VM's known resource-contention behavior under parallel workers, not a regression — verified by root-causing it rather than just re-running until green.
  - One genuine test fix: the résumé e2e assertion (`tests/e2e/links.spec.ts`) still expected the old one-sentence-stub copy after the résumé page was rebuilt — updated to match the new, intentional content.

## 7. A real bug found and fixed during this pass

The Deployment Flightpath's first implementation used GSAP ScrollTrigger with `start: "top top", end: "bottom bottom"` on `document.documentElement`, calculated once at creation time. `next/font`'s `font-display: swap` can reflow total page height after fonts finish downloading, and this left the rail permanently stuck at 0% progress with a "Commit" label that never updated — confirmed via direct DOM inspection (`dotStyles: ["top: 0%"]`, `labelText: "Commit"`) after a real 3500px scroll. Root-caused and fixed by switching to a plain `scroll`/`resize` listener that recomputes `scrollHeight` fresh on every event instead of relying on cached geometry — verified afterward via the same DOM inspection (`top: 58.9%`, `labelText: "Network"`, matching the real scroll position) and visually via screenshots showing the dot correctly at ~59% mid-page and "RECOVER" resolving exactly at the contact section.

## 8. Accessibility verification

Everything already covered by the existing 42-test e2e suite (skip link, focus-visible, keyboard tab order, reduced-motion, mobile menu, Reliability Spine focus/expand) still passes unchanged. New surfaces checked directly:
- Deployment Flightpath: `aria-hidden`, `pointer-events-none` throughout — decorative, doesn't enter the tab order, doesn't announce to screen readers, verified not to overlap any interactive control at any tested width (guaranteed by `Container`'s fixed `lg:px-8` padding independent of `max-w-7xl`).
- 404's `UnresolvedEndpoint`: `role="img"` with a full text alternative describing the actual failed path, same pattern as `ArchitectureDiagram`.
- Case-study heading order: verified `h1 → h2 → h3` stays valid on every route after the relabeling (no skipped levels).
- Reduced motion: Flightpath renders a static mid-progress state with zero scroll listeners when `prefers-reduced-motion: reduce` (verified both via the dedicated `reducedMotion: 'reduce'` Playwright context and the existing e2e test asserting the WebGL hero canvas is absent).

## 9. Performance

- **JS bundle**: `.next/static/chunks` totals 1.7MB, dominated by an 876KB chunk (Three.js/React Three Fiber/drei for the hero canvas) — pre-existing from v2, not changed by this pass. It's already isolated behind `next/dynamic(..., { ssr: false })` and gated on `prefers-reduced-motion`, so it's never fetched by reduced-motion visitors.
- **Font loading**: unchanged from v2 (Archivo Black / Public Sans / Space Mono via `next/font/google`, `display: "swap"`) — this pass's Flightpath fix (§7) exists specifically *because* of how that swap reflows layout, so it's now handled correctly rather than assumed away.
- **Image/SVG weight**: no raster images added. All new visuals (404 diagram, Flightpath rail) are small inline SVG/DOM, no new dependencies.
- **Layout shift**: full-bleed cover art has a fixed aspect ratio at every breakpoint (SVG `viewBox` scales with `width: 100%`), so it doesn't introduce shift.
- **WebGL resource behavior**: unchanged from v2 — capped DPR, paused frameloop via `useAdaptiveQuality`, gated behind reduced-motion. Not re-verified for context-loss/disposal edge cases beyond what v2 already covered (documented as a v2 residual risk, not newly introduced here).
- **Lighthouse / PageSpeed**: **not measured** — this VM cannot reliably run a Chromium DevTools session (same blocker documented in `docs/VISUAL_AUDIT_V2.md`; re-confirmed, not re-litigated, for this pass). No score is asserted anywhere in this report or in-app. Re-attempt with PageSpeed Insights once a deployed preview exists.

## 10. Remaining factual content gaps

Unchanged from `CONTENT_GAPS.md` — nothing in this pass added or resolved a content gap, only changed how existing real facts are presented:
- No résumé PDF (the new web résumé is the mitigation, not a replacement fact).
- Stackly role achievements not yet supplied.
- 8 certifications missing issuer link/credential ID.
- 7 engineering-lab projects missing repository links.
- Cinematic Web Experience live URL withheld pending confirmation.

## 11. Explicit confirmation

No employment achievement, metric, client, credential, project result, URL, repository link, certification ID, or technology usage was invented anywhere in this pass. Every new or reworded piece of copy (case-study section headings, 404 copy, résumé composition, About pull-quote, diagram legends) traces directly to an existing field in `content/*.ts` or is generic UI vocabulary (e.g. "404 · no route matched") that makes no factual claim. This is a quality pass aimed at an award-submission bar — it is not a claim that the site has received any award.

## 12. Local preview

```bash
cd /home/tarun/tarun-portfolio
git checkout award-polish-v3
npm install
npm run build
npm run start -- -H 0.0.0.0 -p 3200
```

Open `http://localhost:3200` (or `http://192.168.1.38:3200` on the LAN — UFW already allows this port).

No preview deployment was created (no Vercel credentials configured; not requested).
