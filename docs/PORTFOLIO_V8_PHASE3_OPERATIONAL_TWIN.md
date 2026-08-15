# Portfolio V8 — Phase 3: Migrate the Operational Twin into the Unified Host

Same additive-then-subtractive method as Phase 2, applied to the second of
three duplicated Canvas systems. The dynamic-import-boundary lesson from
Phase 2 was applied from the start this time, so no regression shipped.

## What moved

- **`components/v7/OperationalTwinSceneContent.tsx`** (new) - the
  Instrument Deck's real content (`InstrumentDeckInstances`, `StatusPips`,
  `OrbitCamera`, lighting, the deck plane), moved unchanged from the old
  `OperationalTwinScene.tsx`. Same instanced-mesh geometry, same
  `demonstratedByCount`-driven bar heights, same 90-second orbit period.
- **`components/v7/OperationalTwinControlRoomScene.tsx`** (new) - the
  dynamic-import boundary, same shape as
  `components/atlas/AtlasControlRoomScene.tsx`: bundles
  `components/v8/ControlRoomScene.tsx` together with
  `OperationalTwinSceneContent`, so `OperationalTwinHost.tsx` only ever
  dynamically imports this one wrapper, never `ControlRoomScene` directly.
- **`components/v7/OperationalTwinHost.tsx`** (changed) - kept
  `decideSceneMount`'s eligibility check (Twin's fallback-vs-button
  decision, unlike Atlas which always shows its 2D diagram regardless),
  the Activate/Close controls, intent-based prefetching, and the
  `WEBGL_CAPABILITY_SET` publish (unrelated to Canvas lifecycle, left
  as-is). Removed its own `QUALITY_TIER_SET` and `SPATIAL_LOAD_STATE_SET`
  dispatches - `ControlRoomScene` now publishes both for every scene
  (Phase 1 already made this host the one that revealed the original
  inconsistency: it was the *only* one of the three that dispatched
  `QUALITY_TIER_SET` at all).
- **`components/v7/OperationalTwinScene.tsx`** (deleted) - confirmed
  orphaned before removal, same as Phase 2's `AtlasSpatialScene.tsx`.

## Applying Phase 2's lesson, not repeating its mistake

`OperationalTwinControlRoomScene.tsx` was written as the dynamic-import
target from the very first version of this phase, not added after a
measured regression. Verified anyway, not assumed: `scripts/measure-v8-baseline.mjs`
against a genuinely fresh local server showed the home route's idle JS at
751,205 B - matching the Phase 0 baseline (752,066 B) within normal
chunk-hash-length noise, confirming Three.js is not reachable from any
eagerly-loaded module this time. Twin's own activation cost is 907,238 B
(Phase 0: 903,311 B), a ~4 KB increase from the new wrapper module -
the same small, expected cost Atlas's equivalent wrapper added.

## `data-v7-*` attributes, dropped deliberately

The old host set `data-v7-scene`/`data-v7-quality`/`data-v7-ready` on its
markup. Grepped across the whole repository before removing them: no
test, script, or other component reads any of the three - they were
informational only. `ControlRoomScene` already sets `data-v8-scene` on
its own wrapper; rather than plumb three more scene-specific attributes
through `ControlRoomScene`'s props for markers nothing consumes, they
were dropped and this decision recorded here rather than silently.

## Verification

- `npm run build`, `lint`, `typecheck` - clean, both before and after
  removing the old file.
- `npm run test` - 108/108 (unchanged from Phase 2; this phase added no
  new pure-logic module worth a dedicated unit test beyond what
  `sceneDirector.test.ts` and `spineInstruments.test.ts` already cover).
- **Full Playwright suite (this phase's Full Validation checkpoint)**:
  96/96, matching V7's and Phase 2's own counts. Re-run again after
  removing the old file on the suites touching shared scene lifecycle
  (`atlas.spec.ts`, `companion.spec.ts`, `operationalTwin.spec.ts`):
  46/46.
- `scripts/measure-v8-baseline.mjs` - clean, no regression (see above).

## Not changed

RC-01's own canvas is untouched - migrated in Phase 4. Atlas is untouched
since Phase 2. `lib/v7/spineInstruments.ts`'s content-derived instrument
data, System Trace, Deployment Replay, Incident Replay, Automation
Fabric, Proof Ledger, and project comparison are all unaffected - none of
them render inside the Operational Twin's Canvas, so none of them needed
to change for this migration.
