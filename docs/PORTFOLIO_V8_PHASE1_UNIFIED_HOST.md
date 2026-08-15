# Portfolio V8 — Phase 1: Unified Scene Host

Additive only — nothing in this phase is wired into any live route, and no
existing component changed. Built and verified beside the three existing
systems (Atlas, Operational Twin, RC-01), exactly as
`docs/PORTFOLIO_V8_IMPLEMENTATION_PLAN.md` specifies for Phase 1.

## What exists after V7, inspected before writing anything new

Read in full before design: `components/atlas/AtlasCanvasHost.tsx` +
`AtlasSpatialScene.tsx`, `components/v7/OperationalTwinHost.tsx` +
`OperationalTwinScene.tsx`, `components/companion/CompanionCanvas.tsx` +
`CompanionRoot.tsx` + `CompanionExperience.tsx`, `lib/v6/types.ts` +
`experienceReducer.ts`, `lib/v7/sceneDirector.ts`,
`lib/companion/state.ts`.

All three existing hosts independently reimplement the same nine-part
lifecycle: derive `active` from `ExperienceState.activeScene`, an
`activeRef` guard against Three.js's own `dispose()`-triggered
`webglcontextlost` firing on a deliberate close, a `SceneErrorBoundary`,
a `webglcontextlost` listener wired in `Canvas`'s `onCreated`, dispatching
`SPATIAL_LOAD_STATE_SET`, an intent-gated dynamic import, reduced-motion/
WebGL/low-power eligibility checks, and quality-tier-driven `dpr`/
`antialias` props. Two real, concrete inconsistencies were found by
reading all three side by side rather than assumed:

- **Only `OperationalTwinHost` ever dispatches `QUALITY_TIER_SET`.**
  `AtlasCanvasHost` computes its tier locally
  (`resolveQualityTier(preferences.lowPowerMode)`) and never publishes it,
  so any other surface reading `experienceState.qualityTier` while Atlas is
  the active scene sees a stale/default value.
- **`ExperienceState.power`/`POWER_PREFERENCE_SET` is dead plumbing** -
  grepped across the whole repository, it is dispatched nowhere outside
  its own reducer unit test. The real low-power source of truth every
  existing host actually reads is `useCompanionPreferences().preferences.lowPowerMode`
  (a separate, localStorage-backed hook). Confirmed before writing the new
  host, so it doesn't silently key off a field nothing ever sets.

## What was built

- **`lib/v8/canvasOwnership.ts`** - a small, pure, fully unit-tested module
  (`tests/unit/canvasOwnership.test.ts`, 6 cases including the real
  activate→close→reopen→switch sequence). Turns "at most one canvas" from
  a convention every host happens to follow into a runtime-checked claim/
  release invariant: a second scene claiming ownership while another still
  holds it is a detected violation, not a silent double-mount.
- **`components/v8/ControlRoomScene.tsx`** - the one shared implementation
  of the lifecycle contract above. A scene calls it with its `scene` key
  (`"atlas" | "operational-twin" | "rc01"`), an error reason, an aria
  label, camera settings, and a `children` render-prop for its actual
  Three.js content. `ControlRoomScene` owns: deriving `active` from
  `activeScene` **and independently re-checking eligibility** via
  `lib/v7/sceneDirector`'s existing `decideSceneMount` (reused, not
  duplicated) so a future activation control that forgets its own
  eligibility gate still cannot mount; the `activeRef`/context-loss/error-
  boundary pattern; the canvas-ownership claim/release; and now publishes
  `QUALITY_TIER_SET` for every scene consistently, fixing the Atlas gap
  found above as a direct, natural consequence of sharing one
  implementation instead of three.

Per-scene content stays exactly where it already lives and already works
(`AtlasSpatialScene.tsx`'s node/edge geometry, `OperationalTwinScene.tsx`'s
instrument deck, `RC01Model.tsx`'s chassis) - Phase 1 does not touch any
of it. `ControlRoomScene` takes that content as its `children` render-prop
argument; the caller is still responsible for its own `next/dynamic`
wrapping so per-scene code-splitting is preserved (confirmed against
`node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` for this
pinned Next.js version - unchanged from established usage).

## Why a render-prop, not a global registry

An earlier design considered a single always-mounted host in `app/layout.tsx`
with a `Record<SceneKind, Component>` registry. Rejected after inspecting
the actual props each scene needs: Atlas needs a specific project's `flow`
string (route-scoped content, not global state), Operational Twin needs
`selectedStageId`/`onSelectStage` (already global, via the reducer), and
RC-01 needs local `CompanionState`/accent color (intentionally
component-local, per `CompanionExperience.tsx`'s existing design). A
single generically-typed registry cannot cleanly express that
heterogeneity without inventing new global state for data that is
correctly scoped today. The render-prop keeps each system's own call site
in charge of its own content and props while `ControlRoomScene` still owns
every part of the lifecycle that was actually duplicated three times.

## Verification

- `npm run build`, `lint`, `typecheck` - all clean.
- `npm run test` - 103/103 (97 existing + 6 new `canvasOwnership` tests).
- `@release-fast` Playwright subset - 15/15, unchanged from Phase 0,
  confirming this phase is genuinely additive (no live route imports
  `ControlRoomScene` yet, so no user-visible behavior could have changed).
- No Canvas/R3F behavioral test was written for `ControlRoomScene` itself
  in this phase - consistent with this codebase's own established
  pattern (see `tests/unit/sceneDirector.test.ts`: pure logic is
  unit-tested directly, Canvas-mounting behavior is only ever verified via
  Playwright against a real build, e.g. `atlas.spec.ts`,
  `operationalTwin.spec.ts`). That real, live proof is Phase 2's job, when
  `ControlRoomScene` is wired into the actual Atlas route and
  `atlas.spec.ts`'s existing assertions are what confirm behavioral
  parity - not invented here as a placeholder or claimed as passing before
  it can actually be checked.

## Next

Phase 2: migrate Atlas's real content into `ControlRoomScene`, prove
parity against the existing `atlas.spec.ts` suite, then remove
`AtlasSpatialScene.tsx`'s standalone `Canvas` wrapper (its node/edge
rendering logic itself is unaffected) once parity holds. First Full
Validation checkpoint runs at the end of that phase.
