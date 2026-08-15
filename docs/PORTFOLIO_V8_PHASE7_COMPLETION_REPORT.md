# Portfolio V8 — Phase 7: Final Validation, Evidence Capture, Completion Report

This phase's own instruction was to run validation once, capture V8-specific
evidence, *inspect every screenshot*, and only then write this report. That
inspection step is what this phase actually earned its name doing — it
caught a real, shipped regression that every automated check up to this
point had missed.

## The regression Phase 7 found

`scripts/capture-v8.mjs`'s capture `02b-rc01-holds-canvas.png` was supposed
to show RC-01's 3D portrait after Atlas and Operational Twin had each
already claimed and released the shared canvas slot. It didn't — it showed
Operational Twin's **static-deck fallback** ("Operational Twin shown as a
static deck (the Operational Twin scene failed to load)") instead, still on
screen after the sequence had already moved on to RC-01.

Direct reproduction confirmed this wasn't a screenshot-timing artifact: on
a fresh page, clicking "Activate Operational Twin" then "Close Operational
Twin" left the UI permanently on the failed-to-load fallback — not the
"Activate Operational Twin" button. No further interaction recovered it;
only a page reload would. The same shape of bug existed in Atlas's and
RC-01's close paths for the same reason, since Phase 2–4 had all three
route their Canvas lifecycle through the one shared
`components/v8/ControlRoomScene.tsx`.

**Root cause.** `ControlRoomScene` distinguishes an intentional close from a
genuine WebGL context loss using an `activeRef` guard, synced from the
`active` prop via `useEffect`. `useEffect` runs after commit and paint.
Three.js's `dispose()` — called synchronously by React when it unmounts the
`<Canvas>` on close — synchronously fires a `webglcontextlost` event on the
same commit. That event reaches the scene's context-loss listener *before*
the post-commit `useEffect` has had a chance to flip `activeRef` to
`false`, so an ordinary close was indistinguishable from a real context
loss and got routed to the error fallback every time.

This is exactly the class of bug the pre-V8 per-system hosts didn't have:
each one used to flip its own ref synchronously inside its Close button's
`onClick`, before dispatching. That synchronous guard was lost when the
three hosts' Canvas lifecycles were consolidated into one shared component
in Phase 1–4 — a real regression introduced by the consolidation itself,
not present in any individual phase's own test suite because every
existing test asserted on canvas *count*, never on which specific UI state
(Activate button vs. error fallback) followed a close.

**Fix.** `ControlRoomScene` now exposes a `markClosing()` method via
`useImperativeHandle` (`ControlRoomSceneHandle`), settable synchronously
from a `ref`. Each host (`AtlasCanvasHost`, `OperationalTwinHost`,
`CompanionExperience`) calls `controlRoomRef.current?.markClosing()`
synchronously in its Close/Deactivate handler, *before* dispatching the
state change that unmounts the Canvas — restoring the same ordering the
pre-V8 hosts had, but through the one shared component instead of three
separate copies. The `ref` is plain-prop-forwarded through each scene's
dynamic-import wrapper (`AtlasControlRoomScene`, `OperationalTwinControlRoomScene`,
`CompanionControlRoomScene`) using React 19's ref-as-prop model — no
`forwardRef` needed, verified by reading `next/dynamic`'s actual source to
confirm it forwards plain props (including `ref`) through transparently.

An earlier fix attempt (mutating the ref directly during render) was
rejected by this project's own ESLint config (`react-hooks`'s "Cannot
access refs during render" rule) — correctly, since that pattern is
genuinely unsafe under concurrent rendering. `useImperativeHandle` is the
lint-clean, React-sanctioned way to expose an imperative synchronous method
from a child to a parent, which is what this fix needed.

Seven files changed: `components/v8/ControlRoomScene.tsx` (the handle),
the three dynamic-import wrappers (ref forwarding), and the three hosts
(`markClosing()` call sites).

## Verification

Every check below was actually executed and inspected this phase, against
commit `c58b9f4` plus the fix (see Git Reconciliation):

- **`npm run lint`** — clean. No `react-hooks/refs` violation (the
  `useImperativeHandle` pattern is lint-safe, unlike the rejected first
  attempt).
- **`npm run typecheck`** — clean.
- **`npm run build`** — clean production build, all 16 routes generated.
- **`npm run test` (Vitest)** — 108/108, unchanged from Phase 6.
- **Full Playwright suite** — 98/98, unchanged from Phase 6. No test
  count change this phase — the bug was real but every existing assertion
  happened to check canvas *count* rather than post-close UI state, so no
  existing test caught it and none needed updating once fixed.
- **Direct repro script** (not committed, ad hoc verification): activated
  and closed Operational Twin 3 times in a row against a fresh production
  server — each time the "Activate Operational Twin" button reappeared
  cleanly, zero fallback-stuck occurrences (previously: stuck every time).
  Same result for Atlas (single cycle) and RC-01 (3 open/close cycles,
  screenshotted before/after each).
- **`node scripts/audit-static-html.mjs`** — clean on all 9 routes.
- **Security headers** — `curl -I` against a fresh local production
  build: all 5 headers present (`X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`,
  `Strict-Transport-Security`), `X-Powered-By` absent. Unchanged from
  Phase 6 — `next.config.ts` was not touched this phase either, checked
  directly rather than assumed.
- **`scripts/measure-v8-baseline.mjs`** — re-run post-fix. Idle JS per
  route and zero-canvas-before-intent hold on all 6 tracked routes,
  matching Phase 0/6 within normal chunk-hash noise (a few hundred bytes
  from the fix's own code, not a regression). No change to the
  shared-vendor-chunk sharing behavior across the three systems.

## Evidence capture (`scripts/capture-v8.mjs`)

Six captures, each with its own programmatic assertion (canvas count,
element visibility/size, absence of horizontal overflow) — all six passed
their assertions, and **all six screenshots were then visually opened and
inspected**, not just trusted from the assertion result, per this phase's
explicit instruction:

| Capture | What it proves | Visual result |
|---|---|---|
| `01-control-room-narrative` | Phase 5's merged homepage section: exactly one `<h2>`, Incident Replay + Automation Fabric present in the same section | Confirmed — one continuous narrative, not four boxed sections |
| `02a-twin-holds-canvas` | Operational Twin claims the shared canvas | Confirmed — 3D instrument deck rendering |
| `02b-rc01-holds-canvas` | RC-01 claims the canvas next, after Atlas and Twin have each released it | **This is the capture that caught the regression on the first run.** Post-fix: correctly shows RC-01's 3D portrait, not Twin's fallback |
| `03-operational-twin-context-loss-recovery` | A genuine `webglcontextlost` event still correctly falls back to the static deck | Confirmed — this is the *real* error path, distinct from the close-button regression, and still works correctly |
| `04-rc01-context-loss-panel-stays-open` | RC-01's panel survives a genuine context loss (the Phase 4 fix) | Confirmed — panel stays open, static portrait fallback shown |
| `05-mobile-control-room-no-clipping` | Phase 5/6's mobile grid fix, at 390px | Confirmed — no clipping |
| `06-mobile-project-comparison-selects` | Phase 6's select-width fix, at 390px | Confirmed — selects fit within viewport |

Screenshots written to `/tmp/v8-screenshots/v8/` (gitignored — not
committed, same convention as `reports/v8/`). The temporary
`executablePath` override this sandbox environment needs to launch
Chromium was added only for the run, then reverted before commit — the
committed script launches Chromium with no override, matching
`capture-v7.mjs`'s existing pattern exactly.

## Soak test (`scripts/soak-test-v8.mjs`, new)

V7/V6 had `soak-test.mjs`/`soak-test-v6.mjs`; V8 needed its own because
Atlas only mounts on case-study routes and Operational Twin only mounts on
the home page (`components/hero/Hero.tsx`) — unlike V6, where Atlas and
RC-01 shared one route, there is no single route where all three V8
systems can be exercised together. The new script runs two same-page
repeated-cycle sequences instead of one (Atlas↔RC-01 on a case-study
route, Twin↔RC-01 on the home page), plus a mutual-exclusion check per
route pairing, plus cross-route cycles — and specifically checks for the
Phase 7 regression pattern (Activate button visible, error fallback not
visible) after every close, not just canvas count.

Result: **24 same-page activation cycles across the two sequences + 2
mutual-exclusion checks + 5 cross-route cycles, 0 failures** — no canvas
leaks, no listener growth versus baseline, no stuck speech synthesis, no
stuck fallback after any ordinary close, no console errors.

## Git and hosted CI reconciliation

- Base branch: `portfolio-v8` at `4c3eb233a86dbe734df6ac4cde4c74f257fc6523`
  (application code identical to the validated V7 tag
  `operational-twin-v7-final` / `cba06cf`; the merged prep PR only added
  `docs/`).
- Implementation branch: `claude/portfolio-v8-implementation`, Phases 0–6
  through commit `c58b9f4de4aded23f1586546125b0f1fe3d81bdf`.
- **PR #6** (`claude/portfolio-v8-implementation` → `portfolio-v8`),
  opened before this phase per the confirmed plan, so hosted CI would run
  against this branch independent of any local result. At the time of
  writing: `mergeable_state: clean`, all 4 checks green —
  `validate` (×2, from the two workflow runs), `e2e-critical`, and the
  Vercel Preview Comments bot — confirming the Phase 0–6 work
  independently of everything measured locally in those phases.
- This phase's work (the `markClosing()` fix, `scripts/capture-v8.mjs`,
  `scripts/soak-test-v8.mjs`, this report) is committed on top of `c58b9f4`
  on the same branch and will appear as new commits on PR #6 once pushed.

## Not done in this phase (explicitly, not silently)

- **No promotion, no final tag.** Per the explicit instruction, this
  report does not create `operational-twin-v8-final` or any equivalent —
  that requires every closure gate to genuinely pass, and PR #6 review /
  merge into `portfolio-v8` has not happened yet.
- **No Lighthouse/Core Web Vitals run** — consistent with
  `docs/PORTFOLIO_V8_PERFORMANCE_BUDGET.md`'s stated non-goal, unchanged
  from every prior phase.
- **Atlas's own context-loss path still has no dedicated e2e test** — a
  gap already recorded honestly in `docs/PORTFOLIO_V8_PHASE6_HARDENING.md`
  and not closed this phase either. The soak test's cross-route Atlas
  cycle does exercise Atlas's ordinary close path (and would have caught
  this phase's regression there too), but it is not the same as a
  dedicated Playwright context-loss test with a full assertion suite.
- **No résumé PDF, certificates, or additional screenshots were
  fabricated or added** — none were supplied, and per the standing
  instruction, missing content stays missing rather than invented.
- **Direction C (live data)** remains out of scope for V8 core, as
  decided before implementation began. No extension boundary work was
  done this phase since no other phase needed one.
