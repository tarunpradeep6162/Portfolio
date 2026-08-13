# Jury Refinement v5.1 — completion report (rewritten after two corrections)

This report replaces the version committed at `584ca80`, which documented
only the first three visual-audit fixes and declared the work complete. A
first correction identified 22 additional confirmed-missing items and
mandated a 9-phase (A–I) closure plan, tracked in
[`docs/JURY_REFINEMENT_V5_1_PLAN.md`](./JURY_REFINEMENT_V5_1_PLAN.md). A
second, later correction ("FINAL EVIDENCE CLOSURE") found that the
resulting report still fell short of the agreed Definition of Done — a
stale section heading, a missing per-chunk bundle breakdown, screenshots
and video sequences that had been counted but not individually verified,
and several report sections that were simply absent. This document is the
result of closing every item on that second list, and states plainly
where evidence was found to be wrong along the way rather than smoothing
it over.

## Branch, exact parent commit, and commits

All work is on `jury-refinement-v5-1`. Its exact parent — the commit it
branched from — is:

```
a72ada0 Add Immersive Ops v5 completion report (2026-08-12 09:23:29 +0530)
```

on `immersive-ops-v5`. No protected branch (`main`, `visual-rebuild-v2`,
`award-polish-v3`, `award-experience-v4`, `immersive-ops-v5`) was touched.

Pre-correction commits (the three original visual-audit fixes):

- `aafe022` — Redesign RC-01: fix silhouette, material contrast, and head/base cropping
- `b3af715` — Integrate RC-01 with the real Observatory instead of its own panel
- `83eb883` — Fix the loading state's empty rectangle with a visible boot sequence
- `0eb665c` — Add test coverage for the v5.1 panel-bounds and Observatory-reaction fixes
- `584ca80` — Add Jury Refinement v5.1 completion report (**superseded**)

First-correction-pass commits:

- `78d76db` — Document the honest gap-closure plan for the correction pass
- `c5df38d` — Phase C+D: gate RC-01 by route allowlist, load only on real intent
- `52099fc` — Phase F: add response security headers, remove X-Powered-By
- `844965c` — Phase A+B+E: real desktop dock, mobile states, per-stage highlight
- `4f877d2` — Phase G: add capture-v5-1.mjs for deterministic screenshot capture
- `9349a32` — Phase H: add record-interaction-video.mjs
- `59a6022` — Phase I: add soak-test.mjs
- `ed56979` — Add check-bundle-cost.mjs to verify Phase D's zero-cost-before-intent claim
- `67b0404` — Rewrite the v5.1 completion report to reflect the actual correction-pass state
- `b7cbc4c` — Fix the blank individual-stage-pointing capture: wait for real scroll settle
- `a6b0575` — Add compare-bundle-sizes.mjs for the V4 vs V5 vs V5.1 bundle comparison
- `705e0e3` — Update completion report: both previously-open items are now closed

Second-correction-pass ("FINAL EVIDENCE CLOSURE") commits are listed at the
end of this document once made — see **Final commit record** below, which
is filled in from real `git log` output, not written in advance.

## Skills used, by phase

Named skills (invoked via the Skill tool) were used for the original V5
build (`webapp-testing`, `verification-before-completion`,
`react-three-fiber` — see the V5 completion report). For this correction
pass and this closure pass, work was direct engineering — Playwright
scripts, React/Next.js component edits, CSS, and Bash-driven verification
— without invoking additional named skills through the Skill tool. Stating
this plainly rather than listing skills that were not actually invoked:

| Phase | Skill(s) actually invoked |
|---|---|
| A–I (first correction) | None beyond direct engineering |
| This closure pass | `claudeskills` (router, this invocation itself) |

## Files created, modified, and removed (whole `jury-refinement-v5-1` branch vs. its parent)

Nothing was removed. Diff stat vs. `immersive-ops-v5`:

**Modified:**
- `app/globals.css`
- `components/companion/CompanionCanvas.tsx`
- `components/companion/CompanionExperience.tsx`
- `components/companion/CompanionRoot.tsx`
- `components/companion/RC01Model.tsx`
- `components/hero/InfrastructureObservatory.tsx`
- `components/spine/ReliabilitySpine.tsx`
- `content/companion.ts`
- `next.config.ts`
- `tests/e2e/companion.spec.ts`

**Created:**
- `docs/JURY_REFINEMENT_V5_1_COMPLETION_REPORT.md` (this file)
- `docs/JURY_REFINEMENT_V5_1_PLAN.md`
- `lib/companion/observatoryHighlight.ts`
- `scripts/capture-v5-1.mjs`
- `scripts/check-bundle-cost.mjs`
- `scripts/compare-bundle-sizes.mjs` (superseded by `scripts/diff-bundle-chunks.mjs` — see Phase D)
- `scripts/diff-bundle-chunks.mjs`
- `scripts/record-interaction-video.mjs`
- `scripts/soak-test.mjs`

## Phase-by-phase status

### Phase A — Desktop dock (done)

Not a height-capped overlay: a `data-rc01-docked` attribute on `<body>`
reserves `padding-right` equal to the panel's own width via a CSS rule in
`app/globals.css`, and the panel is positioned into that exact reserved
space. This is real non-overlap by construction — the hero, name, CTA, and
Observatory core genuinely reflow into a narrower column.

Verified with `getBoundingClientRect()` geometry assertions in
`tests/e2e/companion.spec.ts` (5 tests, all passing): the panel's top edge
is at or below the sticky header's bottom edge, and the h1 / hero statement
/ primary CTA / Observatory core all have their right edge strictly left of
the dock's left edge. Minimise and Close stay visible at every state.

### Phase B — Mobile states (done)

Three explicit states — collapsed peek (default on activation), medium, and
expanded — with safe-area insets, internal scroll, and Close/Minimise/Stop
retained in every state. 5 targeted tests, all passing, including a
dedicated check that focus returns to the Activate button after
deactivating specifically from the expanded state.

### Phase C — Route presence (done)

An allowlist (`/`, `/work`, `/about`, `/contact`), not a denylist — this is
the only mechanism needed for "absent on /resume" and "absent on 404" at
once, since an unmatched path is never in the list by construction.
Navigating to a disallowed route (e.g. via a tour's own route suggestion)
fully deactivates the companion; returning to an allowed route requires
Activate again, not silent resumption. Re-verified visually during this
closure pass: all 5 breakpoints of the 404 page were opened directly and
show no Activate control (an initial rapid pass had misread this — see
**Known limitations** below for how that was caught and corrected).

### Phase D — Intent-only loading (done, numbers corrected during this closure pass)

Removed the `requestIdleCallback` auto-prefetch entirely.

**Cost before vs. after interaction** (`scripts/check-bundle-cost.mjs`, port
3400): before any interaction, the baseline is reproducibly **697,303
bytes** across 12 chunk requests — zero bytes attributable to RC-01. The
*total* cost of a full hover-then-click activation is also reproducible:
**960,257 bytes** across two independent runs. What is **not** reliably
reproducible is the exact split of those bytes between "loaded on hover"
and "loaded on click" — one run measured 24,888 bytes on hover / 935,369 on
click, a second measured 949,746 / 10,511. The sum was identical both
times; the split was not. This is reported honestly as a measurement
limitation (chunk-loading timing races against a fixed observation window)
rather than picking whichever run's split looked cleaner. The qualitative
claim - hover arms a real, non-zero, non-free prefetch, and the bulk of the
R3F/Three.js payload is what loads on the actual click - is still correct
and is what `companion.spec.ts`'s passing tests verify structurally; only
the precise byte split between the two moments is what's unreliable to
pin down this way.

**V4 vs. V5 vs. V5.1 bundle comparison.** The version committed at
`a6b0575` (`scripts/compare-bundle-sizes.mjs`) reported V4 78.8KB / V5
163.5KB / V5.1 681.0KB. **Those numbers were wrong.** Its
"wait until the request count stops changing" heuristic raced against
Next.js's own chunk-loading schedule: rerunning the *identical*
measurement against the *identical*, unchanged V5.1 server produced 12
chunks/697KB, then 6 chunks/289KB, then 4 chunks/106KB across three
consecutive runs with nothing else different. A fixed wall-clock cutoff
cannot reliably tell "still loading" apart from "already finished."

The real comparison, produced by `scripts/diff-bundle-chunks.mjs`, queries
the browser's own Resource Timing API after `page.waitForLoadState("load")`
instead of guessing when loading has settled from the outside. This
reproduced identically across two independent runs:

| Version | JS chunk requests | Total bytes (home page, no interaction) |
|---|---|---|
| V4 (no companion at all) | 12 | 663,419 |
| V5 (idle-prefetch, pre-correction) | 12 | 676,278 |
| V5.1 (intent-only, this correction) | 12 | 697,303 |

V5→V5.1's net +21,025 bytes is fully accounted for by three specific
chunks, downloaded and grepped directly rather than guessed at:

- **`0nd_7s8xa2hgi.js`** (+19,594 bytes, new): contains the strings
  `InfrastructureObservatory`, `ReliabilitySpine`, and
  `useObservatoryHighlight` — this is Phase E's own per-stage-highlight
  wiring, genuinely new page-component code.
- **`1aoqwlsudg9c1.js`** (+24,739 bytes, new): contains `CompanionExperience`
  and `CompanionRoot` — but as a `next/dynamic()` lazy-load reference
  (`(0,r.default)(()=>e.A(49416).then(e=>e.CompanionExperience),...)`), the
  module-path string the lazy loader needs to know *which* chunk to fetch
  later, not the actual heavy component implementation.
- **`164s8ca84ebwg.css`** (+2,535 bytes net vs. V5's equivalent CSS chunk):
  contains `data-rc01-docked`, `observatory-highlight-ring`, and
  `rc01-scan` — the exact selectors added in Phases A and E.
- Two V5-only chunks (`21iy0a97m-fy9.js`, `3a60pcb3522ek.js`, totalling
  25,843 bytes) are no longer loaded in V5.1, offsetting some of the above.

Both new chunks were also grepped directly for `THREE.`, `react-three`,
`WebGLRenderer`, and `BufferGeometry` — zero matches in either, confirming
the R3F payload does not leak into the initial load. The large shared
chunks (the ~229KB framework chunk, the ~158KB and ~115KB GSAP-containing
chunks) are **byte-identical** between V5 and V5.1 whenever they appear —
same filename hash, same size — meaning their content is provably
unchanged; GSAP itself is present in all three versions' initial bundles,
including V4's, so it isn't part of what changed either. `scripts/compare-bundle-sizes.mjs`
is left in the repo as a record of the flawed methodology rather than
deleted, superseded by `scripts/diff-bundle-chunks.mjs`.

### Phase E — Per-stage Observatory integration (done)

Replaced the all-eight-stages flash with per-stage highlighting.
`lib/companion/observatoryHighlight.ts` is a typed `CustomEvent` model that
`InfrastructureObservatory.tsx` (hero) and `ReliabilitySpine.tsx` (linear
list) both listen for, so RC-01's pointing gesture highlights the one
specific stage it is narrating on whichever visualization is actually on
screen. Verified in `companion.spec.ts` via a test that walks the tour two
steps and asserts exactly one stage is highlighted at each step, and that
the highlighted stage changes between steps (not the same one, not zero,
not all eight). Re-verified visually during this closure pass via both the
fixed `06-individual-stage-pointing.png` screenshot and multiple extracted
video frames showing "Commit" then "Build" turn lime-green in the spine
list in sync with the caption text.

Project briefings use a project-specific accent color instead of the
generic idle color, verified by inspecting `companion/08-project-briefing.png`
directly: real content ("Project Aurora: Containerised Application on AWS
EC2," actual stack details), not placeholder text.

### Phase F — Security headers (done)

`X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy: camera=(),
microphone=(), geolocation=()`, `X-Frame-Options: DENY`,
`Strict-Transport-Security: max-age=63072000; includeSubDomains`, plus
`poweredByHeader: false`. No CSP was added, per the explicit instruction not
to ship an untested one.

Verified live with `curl -I` against the running port 3400 production
server, on the home page, the 404 page, and a project case-study page —
all five headers present on every route type checked, `X-Powered-By`
absent everywhere:

```
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

### Phase G — Screenshot matrix (done — expanded to 19 companion states, all 69 individually inspected)

`scripts/capture-v5-1.mjs` produces a route × breakpoint matrix (5
breakpoints × 10 routes = 50 shots) plus **19** companion-state captures
(69 screenshots total), with pre-capture content assertions and a hard
failure (non-zero exit) if any assertion doesn't pass rather than silently
saving a bad screenshot. During this closure pass, two companion states
were found missing against the required list and added:
`04b-minimised-desktop.png` (desktop Minimise, not just the mobile
collapsed state) and `04c-tour-selection.png` (the tour picker itself,
before any tour is chosen).

Two real bugs were found and fixed while building this script:

1. The Tours button toggles its own subpanel, and selecting a tour does not
   close it — a blind "click Tours" before every tour selection could
   toggle it *closed* if a previous capture left it open, causing several
   tour-dependent captures to fail. Fixed with a `startTour()` helper that
   checks real UI state instead of assuming a fixed sequence.
2. `06-individual-stage-pointing.png` was captured as a solid black frame
   despite its DOM assertion (exactly one stage highlighted) passing.
   Diagnosed in two stages: first, `forceInstantScroll`'s CSS override
   turned out not to be applied to this particular capture block at all
   (fixed, but the frame was *still* black afterward); second, and this
   was the real root cause, the app's `scrollIntoView({behavior: "smooth"})`
   call **overrides** the page-level `scroll-behavior: auto !important` CSS
   trick rather than being neutralized by it — confirmed live with
   `window.scrollY` instrumentation showing the real scroll animation takes
   ~1 second, well past the 650ms mark when the highlight class this
   capture waits for already applies. Fixed by polling `window.scrollY`
   until it stops changing (400ms of no movement, 5s hard cap) before
   screenshotting, instead of trusting the CSS override or a fixed delay.
   Verified: the capture went from 6.5KB (blank) to 831KB and visually
   shows "Commit" highlighted, matching "Stage 1 - Commit" in the panel.

**Every one of the 69 screenshots was individually opened and visually
inspected during this closure pass** (not sampled, not just counted) — see
**Complete screenshot inventory** below for the full file list and what
each was checked for.

### Phase H — Interaction video (done — re-recorded to cover all 9 required sequences)

The first recorded video (66.2s) covered activation, boot, idle, two
generic tours (recruiter, engineering), mute/unmute, and captions, but on
review during this closure pass did not actually demonstrate four of the
nine required sequences: the Reliability Spine Tour specifically (i.e.
individual-stage pointing), a clear tour-*selection* beat (as opposed to a
tour already chosen), Minimise, or either mobile state — it ran at a fixed
1440×960 desktop viewport throughout. Per the explicit instruction to
re-record rather than claim partial coverage was sufficient, it was
rewritten and re-recorded (`scripts/record-interaction-video.mjs`) to
deliberately hit all nine beats in order, with generous dwell time at each
one:

1. Initial fallback (page before any activation)
2. Activation and boot
3. Integrated RC-01 (idle, docked)
4. Tour selection (the picker itself, all four tours visible, before choosing)
5. Individual-stage pointing (the Reliability Spine Tour, two steps advanced)
6. Captions (visible throughout the tour narration in step 5)
7. Minimise (desktop)
8. Mobile collapsed (deactivate, resize to 375×812, reactivate fresh so the
   real collapsed-by-default mount behaviour triggers — merely resizing an
   already-mounted panel would not, since that initial state is computed
   once at mount time)
9. Mobile expanded (restore to medium, then Tours auto-expands)

Output: `rc01-interaction-walkthrough.webm`, 45.32 seconds, 4.5MB. **All
nine sequences were verified by extracting and individually viewing frames
across the full timeline** (not spot-checked) — see **Video verification
inventory** below for the specific timestamp and what each frame shows.

### Phase I — Soak test (done)

`scripts/soak-test.mjs`. First draft compared each route's one-time
listener footprint against a single `/`-only baseline and reported "leaks"
on every cycle — traced to a flawed test design: `page.goto()` is a real
browser navigation that creates a fresh `window` every time, so nothing can
actually leak *across* navigations, and different routes simply have
different natural listener counts. Rewritten to two passes:

- **Pass 1** — 15 repeated activate/deactivate cycles on the *same* page
  instance (no navigation), which is the only design that can observe real
  cumulative growth.
- **Pass 2** — one activate/deactivate cycle on each of the 4 allowlisted
  routes, confirming cleanup holds across routes.

A second false-positive was found and fixed in the same pass: the baseline
was captured immediately after `networkidle`, before some ordinary
page-load effects (unrelated to RC-01) had finished registering their own
listeners, making them look like RC-01 had added them. Fixed by waiting
for the listener count to stay stable for a full second before treating it
as settled.

Final result: **15 same-page cycles + 4 cross-route cycles, no leaks
detected.** Single `<canvas>` throughout, no retained companion DOM after
deactivation, listener counts on `window` never drift from the settled
baseline, `speechSynthesis.cancel()` called on every cycle (60 times across
15 cycles).

## Final validation sweep (real numbers)

- `npm run verify` (lint + typecheck + unit tests + build): **passed**.
  Lint clean, typecheck clean, **31/31** unit tests passed (8 test files),
  build succeeded (16 static routes).
- `npm run audit:html` (pointed at the port 3400 build via `V4_BASE_URL`):
  **passed for all 9 routes.**
- `npm run test:e2e -- --workers=1` (full suite, 6 spec files):
  **70/70 passed**, 11.4 minutes.
- `git diff --check`: clean, no whitespace errors.

Per the explicit instruction for this closure pass, this full application
test suite was **not** rerun again here, since no application or test code
changed during this pass — only capture/recording scripts and this report
changed. Those script changes were verified with targeted reruns (linting
each changed script, rerunning the specific capture/recording/comparison
scripts to completion, and re-inspecting their output directly), not by
re-running the unrelated Playwright application suite.

The Phase G blank-screenshot defect (now fixed) and the Phase D bundle
methodology bug (now fixed) are both real examples of something
`test:e2e` did not and could not catch — they were bugs in verification
tooling, not application defects, so no amount of passing application
tests would have surfaced either one. Both were found only by directly
inspecting output (a screenshot, a rerun's numbers) and noticing it looked
wrong, not by trusting that an assertion or a first measurement had passed.

## Final production review (port 3400)

All 9 real routes plus a nonexistent path checked live:

| Route | Status | Response time |
|---|---|---|
| `/` | 200 | 16ms |
| `/work` | 200 | 19ms |
| `/work/project-aurora` | 200 | 18ms |
| `/work/distributed-jenkins-controller` | 200 | 16ms |
| `/work/secure-aws-production-architecture` | 200 | 8ms |
| `/work/nodejs-auth-mysql-rds` | 200 | 14ms |
| `/about` | 200 | 6ms |
| `/resume` | 200 | 11ms |
| `/contact` | 200 | 7ms |
| `/sitemap.xml` | 200 | 214ms |
| `/robots.txt` | 200 | 34ms |
| (nonexistent path) | **404** | 44ms |

`sitemap.xml` lists all 9 real routes with valid `<lastmod>` timestamps.
`robots.txt` allows all and correctly references the sitemap. Security
headers confirmed present on home, 404, and a project page (see Phase F).
The 404 page was re-checked at all 5 breakpoints during this closure pass
and confirmed to show no Activate control at any of them (see **Known
limitations** for a self-caught misreading of this during the same pass).

**Preview URL:** `http://192.168.1.38:3400` (also reachable at
`http://localhost:3400` from this machine). This is a local production
preview (`next start`), not a public deployment.

## Exact restart command

From the `jury-refinement-v5-1` worktree (`/home/tarun/v5-1-work/tarun-portfolio`):

```bash
npm run build && npx next start -p 3400
```

`npm run build` runs `next build`; `next start` defaults to port 3000, so
`-p 3400` matches the port used throughout this report and the earlier V5.1
work.

## Rollback instructions

This branch never touched any protected branch, so no rollback of shared
history is needed to undo its effect elsewhere. To specifically undo or
inspect prior states *within* `jury-refinement-v5-1`:

- **Return to the pre-correction state** (the version the first,
  now-superseded completion report described): `git checkout 0eb665c` (the
  last commit before the first correction's closure work began).
- **Return to before any V5.1 work existed at all**: `git checkout
  immersive-ops-v5` (the untouched parent branch).
- **Abandon this branch's changes entirely without deleting them**: the
  commits remain reachable by hash even if `jury-refinement-v5-1` is never
  merged; nothing here rewrites or force-pushes over existing history.

No database, infrastructure, or deployed environment is touched by this
project — rollback is purely a matter of which commit/branch is checked
out and rebuilt.

## Remaining factual content gaps

Tracked in the pre-existing `CONTENT_GAPS.md` (internal tracking only, not
rendered publicly) and unchanged by this correction pass:

- No résumé PDF supplied yet — `/resume` and the hero's secondary CTA use
  an email request action instead.
- One experience entry (Stackly, Cloud Engineer, May 2026–Present) has no
  detailed achievements supplied yet; the achievements list is simply
  omitted for that entry.
- Eight certifications are missing issuer link and/or credential ID.
- All four flagship case studies use code-generated architecture cover art
  (built from each project's own real data) rather than real screenshots,
  since none were supplied.
- Seven Engineering Lab entries are missing repository links.
- A "Cinematic Web Experience" project's live URL is withheld pending
  confirmation its content and access controls suit a professional
  portfolio.

None of these are new to this correction pass, and none were introduced or
resolved by Phases A–I — RC-01 and the companion system do not touch this
content, only how it's narrated once supplied.

## Known limitations

- **Phase D's hover/click byte split is not reliably reproducible** (see
  above) — the total activation cost is, the split between hover and click
  specifically is timing-sensitive in this environment.
- **The first-pass V4/V5/V5.1 bundle numbers (`a6b0575`) were wrong** and
  are superseded by the numbers in this document; `compare-bundle-sizes.mjs`
  is left in the repo as a record rather than silently deleted.
- **A rapid, non-careful first pass through the 404 route screenshots
  during this closure sweep misread them as showing the Activate button**,
  based on pattern-matching against adjacent route screenshots rather than
  looking closely. Caught and corrected by re-reading each 404 screenshot
  individually before finalizing this report; the 404 page genuinely never
  shows the control, at any breakpoint. Recorded here as a limitation of
  fast batch-review rather than erased from the record.
- **Verification scripts (`capture-v5-1.mjs`, `check-bundle-cost.mjs`,
  `compare-bundle-sizes.mjs`, `diff-bundle-chunks.mjs`) are ordinary Node
  scripts, not part of `npm run test:e2e`** — they are not run by CI and
  must be run manually against a live preview server, as documented in each
  script's own header comment.
- This is a local preview, not a public deployment — the security headers
  and HTTPS-only `Strict-Transport-Security` behavior are verified as
  configured correctly, but the site is not actually served over HTTPS in
  this environment.

## Complete screenshot inventory (69 files)

### Route × breakpoint matrix (50 files, `/home/tarun/screenshots/jury-refinement-v5-1/routes/`)

5 breakpoints (375×812, 768×1024, 1024×900, 1440×1000, 1920×1080) × 10
routes (`home`, `work`, `case-aurora`, `case-jenkins`, `case-secure-aws`,
`case-nodejs-auth`, `about`, `resume`, `contact`, `not-found`). Every file
individually opened and checked for: correct route content, no dock/panel
overlap with hero content, no horizontal overflow, and — for `not-found`
specifically — genuine absence of the Activate control at all 5
breakpoints.

### Companion states (19 files, `/home/tarun/screenshots/jury-refinement-v5-1/companion/`)

| File | State verified |
|---|---|
| `01-initial-fallback.png` | Pre-activation Observatory + Activate button |
| `02-intent-prefetch-hover.png` | Hover-armed prefetch indicator |
| `03-boot-loading.png` | Boot skeleton, not an empty rectangle |
| `04-integrated-idle-desktop-dock.png` | Idle, docked, real layout reflow |
| `04b-minimised-desktop.png` | Desktop Minimise ("MINIMISED — SELECT RESTORE TO REOPEN") |
| `04c-tour-selection.png` | Tour picker, all 4 tours, none chosen yet |
| `05-recruiter-tour.png` | Recruiter Tour step 1 |
| `06-individual-stage-pointing.png` | Reliability Spine Tour, "Commit" highlighted lime-green |
| `07-engineering-tour.png` | Engineering Tour on /work |
| `08-project-briefing.png` | Real Project Aurora content, project accent color |
| `09-captions.png` | Caption panel with narration text |
| `10-muted.png` | Mute control active |
| `11-low-power.png` | Low-power mode active |
| `12-webgl-failure.png` | Static SVG portrait fallback, no crash |
| `13-error-recovery.png` | Recovered to portrait after simulated context loss |
| `14-reduced-motion.png` | No 3D canvas mounted |
| `15-mobile-collapsed.png` | Mobile default: hero/CTA fully visible behind peek |
| `16-mobile-medium.png` | Mobile medium: canvas + controls, no tour/console |
| `17-mobile-expanded.png` | Mobile expanded: Tours open, no horizontal overflow |

## Video verification inventory

`rc01-interaction-walkthrough.webm`, 45.32 seconds. Frames extracted at
2-second intervals across the full timeline and individually viewed to
confirm each required sequence, not spot-checked:

| Approx. timestamp | Sequence confirmed | What the frame shows |
|---|---|---|
| ~2–8s | Initial fallback | Observatory + Activate button, no panel |
| ~9–12s | Activation and boot | "RC-01 INITIALIZING…" skeleton, then BOOT badge |
| ~14s | Integrated RC-01 | IDLE badge, docked panel, real layout |
| ~15–20s | Tour selection | TOURS pressed, all 4 tour options listed, none chosen |
| ~23–26s | Individual-stage pointing | POINTING badge, "Stage 1 — Commit," "Commit" lime-green in the spine list |
| ~26s | Captions | Caption text "Stage 1, Commit: Version control, branching, and review before anything ships." visible |
| ~29s | (stage 2, confirms per-stage not all-eight) | "Stage 2 — Build," "Build" now lime-green, "Commit" no longer highlighted |
| ~24–32s | Minimise | "MINIMISED — SELECT RESTORE TO REOPEN," IDLE badge |
| ~38s | Mobile collapsed | 375px width, MINIMISED state, hero/CTA behind it |
| ~41s | Mobile expanded | 375px width, Tours picker open, Collapse-to-medium control visible |
| ~44s | Clean end state | Deactivated, Activate button restored |

An earlier extraction attempt used inconsistent, arbitrarily-spaced
timestamps and one indexing mistake led to two frames being described
under the wrong labels; this was caught by re-extracting frames at clean,
unambiguous 2-second intervals and re-viewing them in order before writing
the table above.

## Final commit record

This section is filled in with real `git log` and `git status` output as
the very last step of this closure pass, after every change above is
committed — not written in advance of that happening.
