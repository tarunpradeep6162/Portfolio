# Immersive Ops v5 — Reliability Companion plan

Branch: `immersive-ops-v5`, descended from `award-experience-v4` (`c54af78`,
`a32cdd6` confirmed in history; baseline tag `v5-baseline-start` at
`90cf743`). This plan picks up from `docs/AWARD_EXPERIENCE_V4_PLAN.md` and
`docs/AWARD_EXPERIENCE_V4_VERIFICATION_REPORT.md` — it does not redo the V4
rebuild, it adds an interactive layer on top of it.

## Skills selected (Phase 1)

- `react-three-fiber` — component architecture for the procedural RC-01 model
  and Canvas lifecycle (disposal, `useFrame`, avoiding `setState` in the
  render loop).
- `gsap-react` — `useGSAP()` for the DOM-side entrance/caption choreography
  that sits outside the Canvas, with automatic revert-on-unmount.
- `gsap-performance` — transform/opacity-only animation, no layout-thrashing
  properties, cleanup discipline for anything that keeps running off-screen.
- `react-best-practices` — bundle-splitting (`bundle-dynamic-imports`,
  `bundle-conditional`), avoiding re-render storms in the companion's client
  state (`rerender-*` rules).
- `web-design-guidelines` — interface review pass against the fetched Vercel
  guidelines for the new controls (captions, console, tour picker).

No 3D asset-pipeline skill (`blender-web-pipeline`, `substance-3d-texturing`)
is used: RC-01 is built from procedural Three.js geometry only, per the
non-negotiable rule against downloaded assets of uncertain licensing.

## Creative direction

"A living infrastructure observatory operated by an intelligent reliability
companion." RC-01 is a diagnostic tool that happens to be shaped like a small
service robot, not a mascot. It uses the existing V4 palette exactly
(`--color-signal-lime`, `--color-packet-blue`, `--color-signal-coral`,
`--color-control-black`/`--color-telemetry-steel`) so it reads as part of the
Observatory system, not a bolted-on toy. No cartoon face, no new color
language, no particle effects.

## Robot design language

- **Silhouette:** compact torso (rounded box, ~0.9 units tall), a
  slightly-inset spherical/domed head on a short neck joint, two articulated
  arms (shoulder + elbow pivot groups) ending in simple diagnostic-pad hands,
  and a stable tripod-style hover base (three splayed struts + a lit underside
  ring) rather than legs — avoids implying it can walk, which would invite
  cartoon locomotion animation.
- **Materials:** dark graphite body (`MeshStandardMaterial`, low metalness,
  mid roughness), brushed-metal joints (higher metalness, low roughness),
  lime emissive strip along the chest seam and head visor (status light),
  small electric-blue emissive accents at elbow/base joints (diagnostic), one
  coral emissive ring reserved for the error state only.
- **Head/sensor:** a single wide horizontal visor (emissive lime bar, not
  eyes) that narrows/brightens for "thinking" and flashes coral for error —
  expressive without being a face.

## Robot interaction states

A single `CompanionState` enum drives both the Three.js material/pose
targets and the caption/console UI simultaneously, so visual state and
narrated state never disagree:

`boot → idle ⇄ {listening, pointing, briefing, thinking} → success | error → idle → sleep`

- **boot** — visor sweeps from dim to full lime intensity over ~900ms, torso
  rises 4% from a compressed start pose. Runs once per activation.
- **idle** — slow breathing scale (±1.5% on the torso, ~4s sine cycle) and a
  restrained head-tracking clamp (±12° yaw / ±6° pitch toward the pointer,
  damped with `gsap.quickTo`-style lerp, never full head rotation, never
  toward the pointer during scroll to avoid feeling like it's chasing).
- **greeting** — a single small forward nod + both arms lift ~15° once.
- **pointing** — one arm extends toward the active Observatory stage/DOM
  target's screen-space direction (clamped angle, never full extension).
- **briefing** — alternating slight arm gestures synced to caption sentence
  boundaries, not per-word.
- **thinking** — visor pulses at a faster, uneven cadence; no body motion.
- **success** — single lime flash + short upward torso bounce.
- **error** — single coral flash on the visor ring only, no shake, no sound.
- **sleep** — visor dims to ~8% intensity, breathing slows to a 9s cycle;
  entered automatically after inactivity or user-triggered "Stop".

All transitions are single-shot tweens or bounded loops — nothing chases the
pointer continuously, and nothing loops indefinitely except idle breathing
and sleep dimming.

## 3D architecture

- `components/companion/RC01Model.tsx` — pure procedural geometry
  (`sphereGeometry`, `boxGeometry`, `cylinderGeometry`, `torusGeometry`),
  grouped joints (`<group>` per shoulder/elbow/head), driven by refs +
  `useFrame`, never `setState` inside the frame loop.
- `components/companion/CompanionCanvas.tsx` — owns the `<Canvas>`: DPR
  capped at `[1, 1.5]`, `frameloop="always"` while active but paused
  (`invalidate`/manual RAF gate) when `document.hidden` or the canvas leaves
  the viewport (`IntersectionObserver`), no shadow maps, no post-processing.
  A `class` error boundary wraps the Canvas subtree; a `webglcontextlost`
  listener plus a caught render error both fall back to
  `CompanionPortrait` (static SVG) rather than a blank canvas.
- `components/companion/CompanionPortrait.tsx` — zero-JS-cost static SVG/CSS
  portrait of RC-01 in the same palette, used for: reduced motion, low-power
  mode, WebGL unavailable, canvas error, and as the pre-activation resting
  state so nothing 3D loads until requested.
- `components/companion/CompanionRoot.tsx` — the only piece imported by
  `app/layout.tsx`. Renders just the fixed-position "Activate RC-01" button
  (plain HTML/CSS, no Three.js in this module) and, only after idle time,
  viewport visibility, or the activation click, `next/dynamic`-imports the
  heavy `CompanionExperience` bundle (`ssr: false`) which contains
  `@react-three/fiber`, `three`, the model, speech, tours, and console.

Quality tiers (`high` / `balanced` / `fallback`), selected from
`navigator.hardwareConcurrency`, `navigator.deviceMemory` when available, and
a user-facing manual "Low-power mode" toggle that always wins:

| Tier | DPR cap | Antialias | Emissive detail |
| --- | --- | --- | --- |
| high | 1.5 | on | full |
| balanced | 1 | on | full |
| fallback | 1 | off | reduced (fewer emissive meshes) |

No shadows or post-processing exist in any tier — removed as a variable
entirely rather than conditionally disabled.

## Speech architecture

`lib/companion/useCompanionSpeech.ts` wraps `window.speechSynthesis`
directly (no server round-trip, no external API, no paid service). Speech
only ever starts inside a user gesture handler (the Activate button, a tour
selection, or a console command) — never in an effect on mount, never on
hover. Each script is an ordered array of sentences; the hook speaks one
`SpeechSynthesisUtterance` per sentence sequentially so captions can advance
on `utterance.onend` (sentence-level sync, not word-level, since `boundary`
events are not reliably supported across engines). If
`"speechSynthesis" in window` is false, the hook exposes
`supported: false` and the UI skips straight to caption-only playback.

## Caption architecture

Every script lives once, in `content/companion.ts`, as plain visible text
computed from `content/spine.ts`, `content/projects.ts`, `content/skills.ts`,
and `content/site.ts` — the same array feeds both the spoken utterances and
the on-screen caption panel, so speech can never say something the captions
don't also show, and nothing here is authored free-text disconnected from
the typed content. The caption panel is a dismissible, `aria-live="polite"`
region with a persistent captions on/off toggle that defaults to on.

## Keyboard controls

- `Tab`/`Shift+Tab` — reach every companion control in DOM order (button,
  then panel controls when open); no custom tab-trapping beyond a
  standard focus-return-on-close dialog pattern.
- `Escape` — closes the open panel/tour/console and stops any speech in
  progress; focus returns to the control that opened it.
- `Enter`/`Space` — activates buttons and console submit.
- Arrow keys are not required and are not overloaded, since RC-01 is not a
  game.

## Mobile fallback

Below `640px`, the companion renders a compact mode: a smaller corner
button, the 3D canvas (when active) capped to a fixed small square rather
than a large panel, and the tour/console panel becomes a bottom sheet
instead of a floating card so it never overlaps primary content or nav
touch targets (64px mobile nav targets are preserved untouched).

## Reduced-motion fallback

`useReducedMotion()` (existing hook, already the single source of truth used
by the rest of V4) gates the companion the same way it gates
`ScrollReveal`: when true, `CompanionRoot` never dynamic-imports the R3F
bundle at all and Activate immediately shows `CompanionPortrait` — a static
image, not a low-frame-rate animation.

## Low-power-device fallback

A manual "Low-power mode" toggle (persisted in `localStorage`) is offered in
the companion panel. When on, it behaves exactly like reduced motion for the
3D layer (skips the R3F bundle, shows the static portrait) regardless of
device capability — an honest, user-controlled switch rather than a
fabricated device benchmark.

## Loading strategy

1. Page loads with existing V4 HTML/CSS/SVG Observatory — unaffected.
2. `CompanionRoot` (a few KB, no three.js) mounts and renders the Activate
   button.
3. On idle (`requestIdleCallback`, falling back to a `setTimeout`), if the
   user has WebGL, hasn't asked for reduced motion, and hasn't set low-power
   mode, the heavy bundle is prefetched in the background — not rendered.
4. The Canvas and model only mount when the user actually activates RC-01.

## Bundle strategy

`three` + `@react-three/fiber` are added as dependencies (no `@react-three/
drei` — the model needs no loaders, controls, or environment maps, so
pulling in the full helper library for zero used helpers would violate the
"avoid importing an entire library for one minor effect" instruction). Every
import of the companion's heavy module goes through `next/dynamic(...,
{ ssr: false })` so it is its own chunk, absent from the initial route
bundle for every page. Bundle size is compared against the V4 baseline in
the completion report.

## Testing strategy

Unit tests (Vitest + Testing Library) mock `window.speechSynthesis` and
`SpeechSynthesisUtterance` (jsdom provides neither) and assert: no
utterance is created before a click, mute/stop halt playback, captions
render the same text as the mocked utterance, and unsupported-speech still
renders captions. Playwright e2e tests cover activation, keyboard operation,
Escape handling, tour selection, console commands, reduced-motion mode
(`contextOptions.reducedMotion`), mobile viewport layout, and — critically —
that every existing V4 route/nav/404/metadata test still passes unmodified.
WebGL-unsupported is exercised by stubbing `HTMLCanvasElement.
getContext` to return `null` before navigation.

## Failure recovery

| Failure | Recovery |
| --- | --- |
| WebGL unavailable | `CompanionPortrait` (static SVG) shown instead of Canvas |
| WebGL context lost mid-session | listener catches `webglcontextlost`, swaps to portrait, offers a "Restart RC-01" control instead of a silent black box |
| Speech synthesis unsupported/throws | captions continue advancing on a timer instead of `onend`; controls hide Speak-specific affordances that would no-op |
| Companion module fails to load (network) | Activate button shows an inline "RC-01 unavailable — showing systems map" message; SVG Observatory is untouched |
| JavaScript disabled entirely | Companion never renders (it's 100% client-mounted); rest of the page is the existing server-rendered V4 markup |

## Definition of done

Matches the prompt's Definition of Done section verbatim: RC-01 visibly
premium, restrained animation, speech only after explicit interaction with
full captions, factual-only content, functions without WebGL/without speech
synthesis/with reduced motion, mobile-complete, V4 functionality intact,
tests passing or honestly documented, screenshots captured and reviewed,
this plan plus the completion report written, all work committed to
`immersive-ops-v5` only.
