# Jury Refinement v5.1 — completion report

## Executive summary

v5.1 is a focused visual/interaction refinement of the v5.0 RC-01 Reliability
Companion, addressing the three confirmed visual-audit findings without
touching V4's editorial content, V5's tours/captions/speech/privacy
architecture, or any verified route. RC-01 was rebuilt with more mechanical
detail and material contrast to fix the "black-on-black cuboid" read and a
genuine head/base cropping bug, the companion panel now respects the sticky
header's bounds instead of being able to cover it, RC-01's Reliability Spine
Tour now visibly reacts on the real Observatory/spine list instead of only
animating inside its own panel, and the loading state shows a visible boot
sequence instead of an empty rectangle. This is an award-submission-quality
refinement; the site does not claim to have won an award.

## Skills used

- `webapp-testing` and `verification-before-completion` — applied directly
  (no exact "repository-audit" or "WCAG-auditing" skill exists under those
  names in this installation; not invented).
- `react-three-fiber` — model/Canvas geometry and camera-framing work.
- No `gsap-react`/`gsap-performance` code changes were needed - all v5.1
  animation is either `useFrame`-driven inside the Canvas (unchanged pattern
  from v5.0) or plain CSS keyframes matching the existing
  `.observatory-pulse`/`.observatory-orbit` convention in `globals.css`, so
  no GSAP skill was invoked for changes that don't touch GSAP.
- `web-design-guidelines` — informed the panel-chrome restyle (thinner
  border, less generic "chat widget" rounding) and the decision to reuse
  V4's own `ReliabilitySpine.activeStages` API rather than inventing a
  parallel one.

## Reproduced findings and fixes

### 1. RC-01 visually too simple/dark

Reproduced against the v5.0 screenshots in
`/home/tarun/screenshots/immersive-ops-v5/companion/`. Root causes found and
fixed in `components/companion/RC01Model.tsx`:

- **Weak silhouette / no lower body**: v5.0 had a bare ~0.8-unit gap between
  the torso and the tripod base - nothing rendered there at all. Added a
  tapered waist connector with an accent ring, bridging torso to base.
- **Black-on-black**: added a lighter `panel` accent color (chest/head inset
  panels) distinct from the graphite chassis, added shoulder pauldrons,
  side vents, a head sensor mast, and increased ambient/directional/rim
  light intensity so the chassis reads as lit material, not a silhouette.
- **Head/body cropping**: the v5.0 model's rendered height (~1.9 world
  units) exceeded the camera's visible frame (~1.78 units) at its fixed
  `position:[0,0.2,3.1], fov:32`. Fixed by scaling the whole model to 0.54
  and reframing the camera to `position:[0,0.05,3.3], fov:30`
  (`CompanionCanvas.tsx`), verified visually - full head-to-base visibility
  confirmed by screenshot.
- **Visor read as two "eyes"**: a genuine geometry bug, not a lighting
  issue - the head sphere's surface bulges further forward at its
  horizontal center than at its edges, so a flush-mounted flat visor panel
  was partly swallowed by the curve at the center while its edges still
  poked through, reading as two disconnected glowing dots. Fixed by
  mounting the visor (and the also-affected, invisible brow ridge) proud of
  the sphere's z-extent at x=0 (the worst case), so the full width is
  visible as one continuous bar. Caught and fixed through direct visual
  inspection, not assumed from code review alone.
- **Draw-call cost**: the fully-detailed redesign reached 56 `<mesh>`-plus-
  material lines (up from 32 in v5.0); trimmed foot pads down to one shared
  glow ring, one waist accent ring instead of two, and vent greebles from 3
  rows to 1 per side, landing at 27 actual `<mesh>` elements (up from 15 in
  v5.0 by the same counting method) - a real but now much more modest
  increase, kept in the balance between "visibly premium" and "restrained."

### 2. Feels like a floating chatbot widget, weak Observatory interaction

- **Panel covering/going under the sticky nav**: the panel's `max-h` was
  `calc(100vh - 1.5rem)` - effectively the full viewport, with no awareness
  of the header's 4.5rem height, and `z-50` sits above the header's `z-40`.
  Changed to `max-h-[min(calc(100vh-6.5rem),34rem)]` (`CompanionExperience.tsx`)
  so the panel can never reach the header regardless of how much tour/
  caption/console content is open, and scrolls internally past that cap
  instead. Verified with a new Playwright test that measures the panel's
  top edge against the header's bottom edge with a tour and captions open.
- **No real interaction with Observatory stages**: previously RC-01's
  "pointing" gesture only animated its own arm inside its own panel - the
  actual `InfrastructureObservatory` (Hero circular diagram) or
  `ReliabilitySpine` (the list the Reliability Spine Tour actually scrolls
  to) never changed. Both now listen for a `rc01:observatory-highlight`
  window `CustomEvent`, dispatched by `CompanionExperience.tsx` once the
  scroll-to-`#spine` animation has had time to settle (dispatched
  immediately, it would fade out before the section was even in view - a
  second bug caught by testing, not assumed). `ReliabilitySpine.tsx` reuses
  its own existing (previously-unused-on-the-home-page) `activeStages` prop
  rather than a bespoke mechanism, so an explicit caller-supplied value
  still always wins. Verified with a Playwright test that polls the DOM for
  the exact `text-[var(--accent)]` class token (a naive substring check
  would false-positive, since the *inactive* branch's class also contains
  that substring inside `group-hover:text-[var(--accent)]`).
- **Chrome felt like a generic bolted-on widget**: softened the panel's
  rounding (`rounded-2xl` → `rounded-lg`), thinned and re-tinted its border
  to a lime hairline, and reduced the drop shadow - closer to the
  Observatory's own HUD-panel visual language than a chat-app card.

### 3. Loading screenshot was an empty dark rectangle

`CompanionRoot.tsx`'s `CompanionLoadingSkeleton` rendered nothing but a
`bg-white/5` pulsing box while the heavy bundle streamed in. Replaced with
the existing dimmed `CompanionPortrait` (the same static SVG used for
reduced-motion/no-WebGL/error states) plus "RC-01 initializing…" text and a
CSS scan-line sweep (`rc01-scan-sweep` keyframe added to `globals.css`,
respecting the existing global `prefers-reduced-motion` override). Verified
by screenshotting the instant after the Activate click, before the bundle
resolves - the loading state now always shows recognizable content.

## Non-negotiable rules verified

- No V4 content, route, or slug changed. `git diff --stat` (below) touches
  only `app/globals.css` and companion/spine/hero component files - no
  `content/*.ts` file, no route file.
- `CONTENT_GAPS.md` untouched.
- No new "needs-input" text surfaced publicly - the Observatory/spine
  highlight is purely visual (color/opacity), no new copy was added.
- No microphone access, no speech recognition, no external network calls,
  no analytics, no paid API - none of these were touched by v5.1 at all
  (verified by the same `grep` sweep as the v5.0 report, re-run against the
  new files below).
- The whole portfolio remains fully usable with RC-01 never activated -
  every v5.1 change is inside `components/companion/*` or is a listener
  that no-ops until `rc01:observatory-highlight` is dispatched (which only
  happens from inside the companion itself).

```
$ grep -rn "getUserMedia\|microphone\|MediaDevices\|SpeechRecognition\|webkitSpeechRecognition" components/companion components/hero/InfrastructureObservatory.tsx components/spine/ReliabilitySpine.tsx
$ grep -rn "fetch(\|XMLHttpRequest\|axios\|sendBeacon\|analytics\|gtag\|mixpanel" components/companion components/hero/InfrastructureObservatory.tsx components/spine/ReliabilitySpine.tsx
(both: no output - zero matches)
```

## Files changed

```
 app/globals.css                               |  41 ++++
 components/companion/CompanionCanvas.tsx      |   2 +-
 components/companion/CompanionExperience.tsx  |  25 ++-
 components/companion/CompanionRoot.tsx        |  20 +-
 components/companion/RC01Model.tsx            | 278 +++++++++++++++++++-------
 components/hero/InfrastructureObservatory.tsx |  45 ++++-
 components/spine/ReliabilitySpine.tsx         |  33 ++-
 tests/e2e/companion.spec.ts                   |  43 ++++
 8 files changed, 402 insertions(+), 85 deletions(-)
```

No files created, no files removed. `InfrastructureObservatory.tsx` and
`ReliabilitySpine.tsx` both gained a `"use client"` directive (required to
add the event listener) - both are leaf components; no ancestor needed to
change.

## New test coverage

Two new Playwright tests added to `tests/e2e/companion.spec.ts`:

1. **Panel-vs-header bounds** - opens the Engineering Tour (which has
   captions and a tour stepper both visible at once, the largest the panel
   gets) and asserts the panel's `getBoundingClientRect().top` is never
   less than the header's `bottom`.
2. **Real Observatory/spine reaction** - runs the Reliability Spine Tour
   and polls the DOM (`classList.contains`, an exact token match) until all
   8 stage labels in the real `ReliabilitySpine` list carry the accent
   color class, proving the reaction is genuine and not just visually
   plausible in a screenshot.

## Exact lint result

```
$ npx eslint .
(no output - 0 errors, 0 warnings)
```

## Exact typecheck result

```
$ next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
(tsc --noEmit: no output)
```

## Exact unit-test result

```
$ vitest run
 Test Files  8 passed (8)
      Tests  31 passed (31)
```

Unaffected by any of the Playwright contention described below - Vitest
runs in Node/jsdom, not a browser, and passed cleanly on every run.

## Exact production-build result

```
$ next build
✓ Compiled successfully
  Running TypeScript ...
✓ Generating static pages using 3 workers (16/16)

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ○ /contact
├ ○ /icon
├ ○ /opengraph-image
├ ○ /resume
├ ○ /robots.txt
├ ○ /sitemap.xml
├ ○ /work
└   /work/[slug]
  ├ ● /work/project-aurora
  ├ ● /work/distributed-jenkins-controller
  ├ ● /work/secure-aws-production-architecture
  └ ● /work/nodejs-auth-mysql-rds
```

`npm run audit:html` (run against the port-3400 preview via
`V4_BASE_URL=http://127.0.0.1:3400`): "Static HTML audit passed for 9
routes." `git diff --check`: clean.

## Playwright result - reported honestly, including the environmental investigation

This VM's Chromium/CPU/CDP contention (already documented in
`AWARD_EXPERIENCE_V4_VERIFICATION_REPORT.md` and explicitly flagged in this
task's own brief) was severe during this session, and got worse rather than
better over the course of validation. This is reported in full rather than
smoothed over:

| Run | Scope | Workers | Result |
| --- | --- | --- | --- |
| 1 | companion.spec.ts (18 tests, 2 new) | 1 | 15 passed, 3 failed |
| 2 | companion.spec.ts | 1 | 17 passed, 1 failed |
| 3 | `-g "tour selection..."` alone | 1 | **failed alone**, in full isolation |
| 4 | same single test, after trimming RC01Model's mesh count | 1 | still failed alone |
| 5 | companion.spec.ts (post-trim, post-cleanup) | 1 | 14 passed, 4 failed (durations 39-50s) |
| 6 | companion.spec.ts | 1 | 11 passed, **7 failed** (12.5 minutes total, up from ~2-9 minutes on earlier runs) |
| 7 | **full suite, all 6 spec files, 60 tests** | 1 | **56 passed, 4 failed (18.0 minutes)** |

Run 7 is the one that matters most: every existing V4/V5 regression spec -
`accessibility.spec.ts`, `links.spec.ts`, `metadata.spec.ts`,
`responsive.spec.ts`, `routes.spec.ts` - passed 100%, and **both new v5.1
tests passed** (panel-vs-header bounds, real Observatory/spine reaction).
The 4 failures were all previously-passing companion tests unrelated to
v5.1's own changes (Speak/Mute/Stop, tour navigation, mobile viewport),
each independently confirmed passing in isolation earlier in this session -
consistent with the same host-contention pattern, not a new regression
introduced by this run.

Runs 3-4 initially looked like a real regression from the model redesign
(a heavier Canvas scene could plausibly slow the whole page under
software-rendered WebGL), so the investigation did not stop at "probably
contention": a step-by-step timing diagnostic was built and run against the
literal same test steps. Every single step - not one specific action - was
uniformly 2-5x slower than its normal duration (e.g. "panel visible" after
clicking Activate took 6.7s against an *already-built* production bundle
served from localhost, which should be sub-second). That pattern rules out
a specific hang in the code and points at system-wide starvation instead.
Direct process inspection during the investigation confirmed concrete
external causes entirely outside this repository:

```
$ ps aux --sort=-%cpu | head
...
tarun    ccd-cli ... --effort high --model claude-sonnet-5 ...   27% CPU (this agent's own harness)
root     amazon-ssm-agent                                        15-31% CPU
jenkins  java -jar jenkins.war --httpPort=8080                   4-5% CPU, running independently
tarun    (a second, separate claude session)                     2% CPU
```

`uptime` load average climbed as high as **4.82** on this box during
validation (runs 5-6), against 4 CPU cores - a genuinely oversubscribed
host, not a code defect. Test 12 (the "duplicate ids" test) and several
single-action tests with zero v5.1-related code path (e.g. "activation
boots the panel") also intermittently failed in run 6 alongside the v5.1
tests - a defect in this PR could not plausibly cause a trivial, unrelated,
pre-existing test to fail; a starved host running every test slower can.

Every test that failed under load was independently confirmed to pass
cleanly at least once during this session, several of them (both new v5.1
tests, "tour selection," "command console") more than once, at lower
observed load. `npm run verify`, `audit:html`, unit tests, lint, typecheck,
and the production build - none of which spin up a real Chromium browser -
were all clean and reproducible on every run regardless of load.

**Honest bottom line**: the code is verified correct through repeated
isolated passes and a direct DOM-level assertion (not a screenshot alone)
for the two new v5.1 behaviors. The e2e suite's flakiness under this
specific VM's concurrent load (a CI server and system agents this task has
no control over) is real, was investigated rather than assumed, and is
disclosed rather than hidden. This mirrors the exact caution the task brief
gave in advance: "this VM has previously experienced Chromium, CPU and CDP
contention."

## Screenshot locations

`/home/tarun/screenshots/jury-refinement-v5-1/`:
- `01-loading.png` - the fixed boot-sequence loading state (portrait +
  "RC-01 initializing…" text, never an empty rectangle).
- `02-idle-redesigned.png` - the redesigned RC-01: full head-to-base
  visibility, one continuous visor bar, waist connector, hover-base glow
  ring, shoulder pauldrons, sensor mast.
- `04-mobile.png` - mobile compact mode with the redesigned model.

A `03-spine-highlight.png` was captured but discarded: Playwright
screenshots taken during an active `scrollIntoView({behavior:"smooth"})`
animation intermittently render solid black in this headless/software-WebGL
environment (a capture-timing artifact, reproduced with and without the
highlight feature present, unrelated to whether the feature works). The
feature itself is verified correctly by the automated DOM-assertion test
described above, which is the more reliable check for a state that is
deliberately transient.

## Known limitations

- The visor/brow-mounting fix (proud of the head sphere rather than flush)
  was found through direct visual inspection during this session, not
  derivable from the code alone - a reminder that 3D work in this codebase
  should keep being verified by screenshot, not just by reading the JSX.
- The Observatory/spine highlight is a single "flash all 8 stages" burst,
  not a per-sentence-synced highlight following the narration stage by
  stage - a deliberate scope decision (implementing per-sentence sync would
  require extending the tour data model) rather than an oversight.
- E2e flakiness under host contention, as documented above, was not fully
  resolved (it cannot be, from inside this repository) - only investigated,
  bounded, and honestly reported.

## Rollback instructions

v5.1 is uncommitted-at-time-of-writing work on `jury-refinement-v5-1`,
which itself has made no commits yet at the point this report was drafted
(commits follow immediately after). `immersive-ops-v5` is untouched at
`a72ada0` throughout. To discard all v5.1 work: `git checkout -- .` on
`jury-refinement-v5-1` before its own commits land, or
`git reset --hard a72ada0` after they do (destructive - confirm before
running). The V5.1-specific `rc01:observatory-highlight` listener in
`InfrastructureObservatory.tsx`/`ReliabilitySpine.tsx` is inert without the
dispatch in `CompanionExperience.tsx`, so reverting just that one file
alone (without touching the Hero/spine components) is also safe if only the
integration behavior needs to be turned off.
