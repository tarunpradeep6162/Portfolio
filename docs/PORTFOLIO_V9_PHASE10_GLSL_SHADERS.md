# Portfolio V9 — Phase 10: GLSL Shader Pass

The third implementation phase of the polyglot addendum
(`docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md`), and the one flagged in
advance as the highest regression risk - the only phase modifying
already-shipped, already-hardened V8 rendering code rather than adding
an isolated new module. Scoped and verified accordingly.

## A scoping decision, made explicitly

`docs/PORTFOLIO_V9_ARCHITECTURE.md`'s addendum names Atlas, Operational
Twin, and RC-01 as candidate shader-attachment points. This phase
touches **two of the three: Atlas and Operational Twin.** RC-01
(`components/companion/RC01Model.tsx`, 428 lines, five actively-animated
material refs, the most heavily-tested single component in this
codebase per `companion.spec.ts`'s ~50 tests) was deliberately left
untouched - the risk/benefit case for adding a purely decorative shader
there, on top of its already-substantial animation and state machinery,
was not as clear or as low-risk as the two systems actually chosen. This
is a real scoping decision, not an oversight: the addendum's own
non-goal ("no full-screen effects merely to claim shader usage") applies
equally to "touch every system merely to claim full coverage."

## What this phase built

- **`lib/v9/shaders/atlasNodeRim.ts`** - a fresnel rim-light shader
  replacing `AtlasNode`'s `meshLambertMaterial`
  (`components/atlas/AtlasSceneContent.tsx`). Real justification:
  `MeshLambertMaterial` is purely N·L diffuse shading with no
  view-direction term at all, so it structurally cannot produce a glow
  that brightens toward a mesh's silhouette edge - the fresnel term this
  shader adds is not achievable with a standard material, not a stylistic
  preference. Base color (idle/active) and the existing emissive-pulse
  damping logic are unchanged; only the rim term is new.
- **`lib/v9/shaders/operationalTwinDeckGrid.ts`** - a procedural
  grid-line shader replacing the Instrument Deck's flat
  `meshLambertMaterial color="#0d1218"` ground plane
  (`components/v7/OperationalTwinSceneContent.tsx`). Real justification:
  rendering grid lines from a flat color material requires either an
  external texture asset (which this codebase's 3D systems deliberately
  avoid everywhere, per the "no external 3D assets" convention already
  established in V6/V7) or a procedural shader computing line distance
  from UV coordinates - this is that shader. Static; the ground plane
  was never animated before either.

Both are small (under 40 lines of GLSL combined across both vertex+
fragment pairs), decorative, and nonessential: each one's fallback is
simply the prior `meshLambertMaterial` call, one JSX element away from
either file's `git revert`.

## Why no new runtime fallback logic was needed

The addendum requires respecting reduced motion, low-power mode, and
WebGL failure. All three are **already fully handled upstream** of where
these shaders attach, by `lib/v7/sceneDirector.ts`'s existing
`decideSceneMount`:

- `motion === "reduced"` → `shouldMount: false` - the Canvas never mounts
  at all, so neither shader ever runs.
- `lowPowerMode` (manual toggle or the constrained-device heuristic in
  `lib/companion/state.ts`) → `resolveQualityTier` returns `"fallback"` →
  `shouldMount: false` - same result.
- WebGL unsupported/lost context → handled by
  `components/v8/ControlRoomScene.tsx`'s existing context-loss recovery,
  which un-mounts back to each system's static deck - unchanged by this
  phase, since neither shader is more fragile than the standard
  materials it replaced (both are minimal, defensive GLSL: no exotic
  extensions, `fwidth` only, which requires no explicit extension
  pragma under the WebGL2 context this Three.js version defaults to).

This is not an assumption - it's confirmed by re-running the exact
existing reduced-motion, low-power, and WebGL-context-loss tests for
both systems unchanged (below), which is the actual verification this
claim rests on.

## Verification actually performed

- **`npm run lint` / `npm run typecheck` / `npm run build`** - clean.
  Build output confirms both new `lib/v9/shaders/*.ts` files compile as
  plain TypeScript string exports (no new build tooling, no new
  dependency - GLSL ships as template-literal strings passed to R3F's
  built-in `<shaderMaterial>`, exactly like every other Three.js
  material already in this codebase).
- **Manual browser verification** against a real `next start` production
  server (temporary sandbox `executablePath` override, reverted before
  commit): activated Atlas on `/work/project-aurora` and Operational
  Twin on `/`, confirmed zero console/page errors in both (a shader
  compile failure surfaces as a console error - none occurred), and
  **visually inspected** both resulting screenshots before citing this
  result:
  - Atlas: node boxes render correctly; selecting a node shows the
    active-state highlight exactly as before, now with the rim term
    active (subtle at the captured viewing angle, present and
    non-broken).
  - Operational Twin: the ground plane's procedural grid lines render
    clearly and correctly under the instrument bars - confirmed by
    directly viewing the captured screenshot, not inferred from the
    absence of a console error.
- **Targeted regression suite** - `tests/e2e/atlas.spec.ts`,
  `tests/e2e/operationalTwin.spec.ts`, `tests/e2e/companion.spec.ts`
  (RC-01, untouched but re-run to confirm zero cross-system regression),
  `tests/e2e/responsive.spec.ts` - **64/64 passing**, including every
  existing reduced-motion, WebGL-context-loss, and low-power-mode test
  for all three systems, unchanged and still green.
- **Full unit suite** - 134/134, unchanged (no new testable pure logic
  this phase - shaders are visual, not unit-testable the way Phase 8/9's
  calculation logic was).
- **Full Validation (this phase's explicit RC-checkpoint gate)** - the
  complete Playwright suite, **149/149 passing**, confirming zero
  regression anywhere else in the already-shipped V9 surface.

## Not done in this phase (explicitly, not silently)

- RC-01/`RC01Model.tsx` was not touched - see the scoping decision above.
- No new npm dependency added (no `@react-three/drei` or similar) -
  GLSL ships as plain string exports consumed by React Three Fiber's
  built-in `<shaderMaterial>` primitive, matching this project's existing
  "no new heavy dependencies" discipline.
- No change to any interaction logic, click targets, node identity, or
  information conveyed by either system - both shaders are strictly
  material-level, confirmed by the fact that zero non-visual test
  assertions needed updating.
- No production promotion, no V9 final tag touched.
