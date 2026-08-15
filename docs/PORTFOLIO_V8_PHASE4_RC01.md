# Portfolio V8 — Phase 4: Integrate RC-01 into the Unified Host

The third and last of the three duplicated Canvas systems. Per the
approved product decision, RC-01's controls, captions, tours, and portrait
(`CompanionExperience.tsx`'s DOM UI, `CompanionPortrait.tsx`) are
untouched - only its optional 3D visualization now routes through
`components/v8/ControlRoomScene.tsx`. All three systems now share the
same one Canvas-owning implementation and the same
`lib/v8/canvasOwnership.ts` claim/release invariant.

## What moved

- **`components/companion/CompanionControlRoomScene.tsx`** (new) - the
  dynamic-import boundary, same shape as `AtlasControlRoomScene.tsx`/
  `OperationalTwinControlRoomScene.tsx`. `RC01Model.tsx` needed **no
  extraction step** - unlike the old `AtlasSpatialScene.tsx`/
  `OperationalTwinScene.tsx`, it never owned a `<Canvas>` itself; it was
  already pure content taking `state`/`fullEmissiveDetail`/`accentColor`
  props directly, exactly the shape `ControlRoomScene`'s children
  render-prop needs.
- **`components/companion/CompanionExperience.tsx`** (changed) - its
  `<CompanionCanvas .../>` call replaced with
  `<CompanionControlRoomScene .../>`; the now-unused `qualityTier`/
  `resolveQualityTier`/`qualityPresets` local computation removed (quality
  tier is now derived by `ControlRoomScene` itself, matching Atlas/Twin).
  Nothing else in this file changed - the header, minimise/expand
  controls, Speak/Pause/Stop/Mute/Captions, low-power toggle, sound
  toggle, Tours panel, Console panel, keyboard handling, and every script/
  tour/command are untouched, per the product decision.
- **`components/companion/CompanionCanvas.tsx`** (deleted) - confirmed
  orphaned before removal, same as the previous two phases' old files.

## A real regression, found by the existing test suite itself

Unlike Phases 2-3, this migration's dynamic-import boundary was correct
from the start (`CompanionControlRoomScene` was the target import from the
first version) - `CompanionExperience.tsx` was already entirely behind
`CompanionRoot.tsx`'s own `next/dynamic` boundary in V6/V7, so no new
eager-loading path was possible. Instead, the first Full Validation run
caught a different, real bug: **`components/v8/ControlRoomScene.tsx`
unconditionally dispatches `SCENE_ERROR` on a canvas failure, which clears
the shared `activeScene` field** - correct for Atlas/Operational Twin,
where `scene` and `activeScene` mean exactly the same thing (their
surrounding host component stays mounted regardless; only the canvas
itself is gated by `activeScene`). It is **wrong for RC-01**:
`CompanionRoot.tsx` reads that same `activeScene` field to decide whether
RC-01's *entire panel* - not just its 3D portrait - is mounted. Clearing
it on a canvas error therefore closed the whole companion, not just its
3D layer.

Two tests failed for exactly this reason:
`companion.spec.ts:170` ("a lost WebGL context recovers to the portrait
instead of crashing" - the panel disappeared instead of falling back to
`CompanionPortrait`) and `companion.spec.ts:690` (a mobile minimise/
restore sequence, where the same unwanted panel-closure produced a
detached-DOM-node timeout mid-interaction). Confirmed by direct
reproduction with a real browser and DOM inspection before writing any
fix - the RC-01 panel region (`role="region", name: /RC-01 Reliability
Companion panel/`) itself became unreachable after a simulated
`webglcontextlost` event, not just the canvas.

**Root cause, traced to the original code**: the pre-V8
`CompanionCanvas.tsx`'s `onError` prop never dispatched anything to the
shared reducer - confirmed by grep, RC-01's 3D lifecycle was always
entirely local (`canvasErrored` state in `CompanionExperience.tsx`), a
deliberate difference from Atlas/Twin's hosts, which did (and were
correct to) dispatch `SCENE_ERROR` on their own canvas failures.

**Fix**: `ControlRoomScene` gained a new `deactivateOnError?: boolean`
prop (default `true`, preserving Atlas/Twin's existing, correct
behavior). `CompanionControlRoomScene.tsx` passes `deactivateOnError={false}`,
so a canvas failure still calls the local `onError` callback (flips
`canvasErrored` to `true`, falling back to `CompanionPortrait` exactly as
before) without touching the shared `activeScene`. Re-verified: both
previously-failing tests pass, and the full suite is clean at 96/96.

## `SPATIAL_LOAD_STATE_SET`/`QUALITY_TIER_SET`, left as a minor disclosed side effect

`ControlRoomScene` still publishes these two for RC-01, even though the
original `CompanionCanvas.tsx` never did. Confirmed (Phase 3's doc) that
neither field has any real consumer anywhere in the app today, so this
doesn't produce an observable behavior change - noted here rather than
silently accepted, in case a future surface starts reading
`qualityTier`/`spatialLoad` and needs to account for RC-01 now
contributing to them too.

## Verification

- `npm run build`, `lint`, `typecheck` - clean, before and after removing
  the old file.
- `npm run test` - 108/108, unchanged (no new pure-logic module this
  phase; `RC01Model.tsx`'s animation logic is `useFrame`-driven and, like
  the rest of this codebase's Canvas content, tested only via Playwright
  against a real browser).
- **Full Playwright suite (this phase's Full Validation checkpoint)**:
  first run 94/96 (the two `SCENE_ERROR` regressions above); after the
  fix, 96/96, matching every prior phase's count. Re-confirmed again
  after removing `CompanionCanvas.tsx` on the suites touching shared
  scene lifecycle (`companion.spec.ts`, `atlas.spec.ts`,
  `operationalTwin.spec.ts`): 46/46.
- `scripts/measure-v8-baseline.mjs` - home route idle JS 751,162 B
  (Phase 0 baseline: 752,066 B); RC-01's own activation cost 968,082 B
  (Phase 0: 965,638 B, a ~2.4 KB wrapper cost) - no regression.

## Also generalized this phase: visibility-based frameloop pausing

`ControlRoomScene` gained the pause-when-hidden/out-of-view behavior the
old `CompanionCanvas.tsx` had (`IntersectionObserver` + `visibilitychange`,
pausing the R3F `frameloop` to `"never"`) - previously RC-01-only, since
Atlas and Operational Twin are always already in view at the moment of
activation and never needed it. Generalized to all three scenes rather
than kept as a RC-01-specific branch: a real perf win with no behavioral
downside (pausing frames doesn't change canvas presence/count, only
whether it's actively rendering), and it means a future scene gets this
for free instead of needing to reimplement it a fourth time.

## Result: the duplicated-systems finding is now closed

All three systems identified in `docs/PORTFOLIO_V8_DISCOVERY.md` (Atlas,
Operational Twin, RC-01) now share exactly one Canvas-owning
implementation. The one-canvas invariant is enforced structurally by
`lib/v8/canvasOwnership.ts`'s claim/release check, not by three
independently-written components happening to follow the same convention
correctly.

## Not changed

RC-01's voice/personality, tour content, console commands, and every
piece of `content/companion.ts` are unaffected. `lib/companion/
useCompanionSpeech.ts`, `useActiveSection.ts`, `useCompanionSound.ts`,
and the mobile collapsed/medium/expanded state machine in
`CompanionExperience.tsx` are all untouched.
