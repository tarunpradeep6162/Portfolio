# Award Experience v4 — completion report

## Outcome

V4 is a complete visual and structural rebuild on top of the verified V3 content model. It preserves the Reliability Spine, typed facts, static routes, metadata, accessibility controls, unit tests, and case-study evidence while replacing the restrained V3 template language with a more authored Infrastructure Observatory experience.

The work targets award-submission quality. It does not claim that the portfolio has received an award.

## Git safety

- Branch: `award-experience-v4`
- Base: `award-polish-v3` at `85f20d2`
- `1d94b47` — plan the award-experience v4 rebuild
- `2b515d9` — build the V4 Infrastructure Observatory experience
- V3, V2, and `main` remain untouched.

## Major design changes

### Infrastructure Observatory

The faint WebGL topology and global reading-progress rail were removed. The hero now uses an always-visible, zero-JavaScript SVG observatory built from the real eight Reliability Spine stages. The map uses meaningful labels, an explicit core, deployment traces, infrastructure metadata, and CSS-only ambient motion with a complete reduced-motion state.

### Distinct page silhouettes

- **Home:** asymmetric identity/observatory hero, operational context strip, editorial case-study sequence, dark Reliability Protocol chapter, capability matrix, career record, credentials/lab split, and control-room contact finale.
- **Work:** dark catalogue introduction with derived record counts, lightweight filtering, authored two-column case-study sequence, and ledger-style engineering lab.
- **Case studies:** split hero with route-specific cover art, sticky project record, numbered narrative chapters, exact architecture flow, decisions, challenge, result, and next-system handoff.
- **About:** editorial career narrative, full-scale operating principle, structured operating history, education, and certification record.
- **Résumé:** print-conscious web résumé with a dark identity cover and dense two-column information architecture. The unavailable PDF remains an honest email fallback.
- **Contact:** full-height resolved-endpoint composition with verified contact channels only.
- **404:** an unresolved router visualization using the same system language as the rest of the experience.

### Technical artwork

The four project covers were rebuilt as genuinely different SVG compositions:

1. Container delivery as a routed zig-zag pipeline.
2. Jenkins controller/agent as a distributed execution field.
3. AWS production architecture as nested control-plane tiers.
4. Node.js authentication as a clockwise request loop.

Every label comes from the project's existing `flow` field. No fake dashboard, screenshot, metric, or cloud resource was introduced.

### Typography and delivery

The V3 Archivo Black/Public Sans/Space Mono combination was replaced with Syne Variable, Manrope Variable, and IBM Plex Mono. They are self-hosted through Fontsource packages, so the production build does not depend on Google Fonts being reachable.

Three.js, React Three Fiber, Drei, the adaptive WebGL helper, and the global Flightpath client component were removed from the production dependency graph.

## Performance comparison

| Measure | V3 report | V4 production output | Change |
| --- | ---: | ---: | ---: |
| Total `.next/static/chunks` | 1.7 MB | 788,033 bytes | about 54% smaller |
| Largest JavaScript chunk | 876 KB | 229,078 bytes | about 74% smaller |
| Self-hosted font output | external Google fetch | 217,407 bytes | local and cacheable |

These are build-output measurements, not Lighthouse scores. Lighthouse was not asserted.

## Verification completed

- ESLint: pass
- Next route type generation: pass
- TypeScript: pass
- Vitest: 13/13 pass
- Production build: pass
- Static output: 16 routes generated, including four SSG case studies
- Static HTML audit: pass across 9 application routes
- Route responses: all known routes 200; unknown route 404; sitemap and robots 200
- HTML audit checks: exactly one H1 per route, no heading-level jumps, no duplicate IDs, no empty links, image alt coverage, and no public TODO/Needs Input leakage
- `git diff --check`: pass

## Browser verification limitation in this workspace

The supplied 42 Playwright E2E specifications were preserved and updated for the SVG observatory, but this sandbox could not launch a browser. No Playwright browser binary was preinstalled; a bundled Chromium was obtained for a genuine retry, but the container terminated it with `SIGTRAP` before page creation. The same restriction also prevented V4 screenshot capture here.

The source includes `scripts/capture-v4.mjs`, which captures viewport and full-page screenshots at 375, 768, 1440, and 1920 pixels for Home, Work, a case study, About, Résumé, Contact, and 404. Run the E2E suite and capture script on the Ubuntu VM where V3 Playwright already worked.

## Content integrity

No employment achievement, client, metric, credential, certification identifier, screenshot, repository URL, or production outcome was invented. Derived interface counts—eight protocol stages, four flagship systems, five skill domains, and the lab record count—come directly from the typed content arrays.

`CONTENT_GAPS.md` remains the source of truth for the current résumé PDF, Stackly achievement bullets, certification links/IDs, project screenshots, lab repositories, and the withheld cinematic-project URL.

## Local verification on the Ubuntu VM

```bash
cd /home/tarun/tarun-portfolio
git checkout award-experience-v4
npm ci
npm run verify
npm run test:e2e
npm run build
npm run start -- -H 0.0.0.0 -p 3200
```

In another terminal while the server is running:

```bash
cd /home/tarun/tarun-portfolio
node scripts/capture-v4.mjs
```

The captures will be written to `/home/tarun/screenshots/award-experience-v4`.
