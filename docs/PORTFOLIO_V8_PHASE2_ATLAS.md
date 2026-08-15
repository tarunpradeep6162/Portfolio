# Portfolio V8 — Phase 2: Migrate Atlas into the Unified Host

Atlas's real content now renders through `components/v8/ControlRoomScene.tsx`
(Phase 1); its old standalone `Canvas` wrapper is removed. Additive-then-
subtractive, as planned: the new path was built and proven beside the old
one, parity was confirmed, and only then was the old file deleted.

## What moved

- **`components/atlas/AtlasSceneContent.tsx`** (new) - Atlas's real node/
  edge geometry (`AtlasNode`, `AtlasEdges`, the lighting), moved unchanged
  from the old `AtlasSpatialScene.tsx`. No visual or interaction logic
  changed - same box geometry, same emissive damping, same edge material.
- **`lib/v8/atlasSceneGeometry.ts`** (new) - the pure position/edge/
  centerX computation extracted from the old file's inline code, so both
  the camera (which needs `centerX` before any Canvas content renders)
  and the content component (which needs the full node/edge positions)
  compute from one shared, unit-tested function instead of two copies
  that could silently drift.
- **`components/atlas/AtlasControlRoomScene.tsx`** (new) - see "a real
  regression, found and fixed" below for why this exists as its own file.
- **`components/atlas/AtlasCanvasHost.tsx`** (changed) - kept only what's
  genuinely Atlas-specific (fallback messages, the Enter/Close controls,
  intent-based prefetching); the Canvas/error-boundary/context-loss/
  activeRef/one-canvas boilerplate it used to own directly is gone,
  delegated to `ControlRoomScene`.
- **`components/atlas/AtlasSpatialScene.tsx`** (deleted) - confirmed
  orphaned (`grep` for real imports, not just comment mentions) before
  removal, only after the checks below passed with it already unreferenced.

## A real regression, found and fixed before it shipped

The first version of this migration had `AtlasCanvasHost.tsx` import
`ControlRoomScene` **statically** and dynamically import only
`AtlasSceneContent`. That's wrong: `ControlRoomScene` itself imports
`{ Canvas } from "@react-three/fiber"` at module scope, so a static import
of it pulls Three.js into whatever imports it - and `AtlasCanvasHost` is
itself imported (indirectly, via `AtlasSection`) on every `/work/[slug]`
page load, not behind any dynamic boundary.

Caught by `scripts/measure-v8-baseline.mjs` (built in Phase 0 specifically
to measure real bytes, not assume them): idle `/work`/`/work/project-aurora`
JS jumped from a Phase-0-baseline ~770KB to **~1.68MB** - Three.js was
loading on every case-study page visit regardless of whether "Enter 3D
view" was ever clicked, a direct violation of the "zero 3D bytes before
intent" hard requirement.

**Fix**: `AtlasControlRoomScene.tsx` - a single small wrapper that imports
`ControlRoomScene` and `AtlasSceneContent` together, and is itself the one
thing `AtlasCanvasHost` dynamically imports. This is the correct general
shape for every future scene migration (Phase 3, Phase 4): the caller
dynamically imports a per-scene wrapper that bundles the shared host with
that scene's content, never the shared host directly.

Re-measured after the fix: idle `/work`/`/work/project-aurora` back to
770,012 B (Phase 0 baseline: 770,556 B - the ~500 B difference is normal
chunk-hash-length noise, not a regression). Atlas's real activation cost
is now 905,780 B (Phase 0's pre-migration Atlas cost: 900,537 B) - a ~5 KB
increase from the new wrapper module, not the ~900 KB the broken version
would have added to every idle case-study page load.

## Verification

- `npm run build`, `lint`, `typecheck` - clean.
- `npm run test` - 108/108 (103 existing + 5 new
  `atlasSceneGeometry.test.ts` cases, each proving the extracted geometry
  function produces byte-identical output to the original inline
  computation for all four flagship projects' real `flow` data).
- **Full Playwright suite (this phase's Full Validation checkpoint)**:
  96/96 passed, matching V7's own documented count exactly - re-run again
  after the code-splitting fix on the specific suites touching shared
  scene lifecycle (`atlas.spec.ts`, `companion.spec.ts`,
  `operationalTwin.spec.ts`, `responsive.spec.ts`): 62/62.
- `scripts/measure-v8-baseline.mjs` re-run against a genuinely fresh local
  production server (a stale `next-server` process from an earlier phase's
  build was found still holding port 3200 mid-session and gave one round
  of misleading numbers - identified via `lsof`/`ps`, killed, and the
  measurement re-run cleanly; noted here so it isn't mistaken for an
  application defect).

## Not changed

RC-01's own canvas and Operational Twin's own canvas are untouched -
still their own V7-era hosts, migrated in Phases 3-4. Atlas's 2D diagram
(`AtlasDiagram.tsx`), its topology classification/layout
(`lib/v7/topologyClassifier.ts`/`topologyLayout.ts`), and its content data
are all unchanged.
