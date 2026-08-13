# Jury Refinement v5.1 — gap-closure plan

This replaces nothing already merged; it documents the honest current state
against the full v5.1 brief and defines the order the remaining work will
land in. Written before continuing implementation, per instruction.

## Completed so far (5 commits on `jury-refinement-v5-1`, before this plan)

| Commit | What |
| --- | --- |
| `aafe022` | RC-01 model redesign: waist connector, shoulder pauldrons, sensor mast, lighter panel accent, rescaled/reframed to fix head/base cropping, fixed a visor-occlusion geometry bug, trimmed mesh count |
| `b3af715` | RC-01's Reliability Spine Tour dispatches a `rc01:observatory-highlight` event; `InfrastructureObservatory.tsx` and `ReliabilitySpine.tsx` both react (all 8 stages flash together - not yet per-stage, see Phase E below) |
| `83eb883` | Loading skeleton shows a dimmed portrait + "RC-01 initializing…" text + scan line instead of an empty box |
| `0eb665c` | Two new Playwright tests: panel-vs-header bounds, DOM-verified Observatory/spine reaction |
| `584ca80` | First completion report (superseded - documented partial state without flagging how much of the brief remained) |

**Correctly identified as incomplete**: only 3 of the ~9 required phases were
addressed, and even those partially (max-height alone is not a real dock;
the all-8-stage flash is not per-stage sync). The rest of this plan closes
every item on the confirmed-missing list.

## Remaining work, in implementation order

1. **Phase C — Route presence** (contained, highest signal-to-effort):
   gate `<CompanionRoot />` by route so it renders only on Home, never on
   `/resume` or the 404 page, and is removed under `@media print`. Add
   Playwright coverage per route.
2. **Phase D — Intent-only loading**: remove the `requestIdleCallback`
   auto-prefetch entirely; wire `onPointerEnter`/`onFocus`/`onTouchStart`
   on the Activate button as the only prefetch triggers (plus the click
   itself). Measure real request/transfer sizes before and after intent,
   and pull the V4/V5/V5.1 numbers into one honest comparison table.
3. **Phase F — Security headers**: `next.config.ts` headers config
   (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
   disabling camera/microphone/geolocation, `X-Frame-Options`/frame-ancestors,
   HSTS on the production server), `poweredByHeader: false`. Verify with
   `curl -I` against the real production server and paste exact output.
4. **Phase A — Desktop dock**: replace the fixed-overlay panel with a
   docked panel that reserves layout space below the header rather than
   floating above content, so it structurally cannot cover the hero/CTA/
   Observatory core. Add geometry-based Playwright assertions for all four
   non-overlap requirements (name, hero statement, primary CTA,
   Observatory core).
5. **Phase B — Mobile states**: collapsed peek (default on activation) /
   medium / expanded, with explicit state transitions, safe-area insets on
   expanded, and a11y-correct focus handling.
6. **Phase E — Per-stage Observatory sync**: extend the tour data model
   with a per-step `stageId`, dispatch a typed, stage-specific event,
   listener cleanup verified, project briefings get a project-specific
   accent. Capture real evidence of one single-stage highlight (fixing the
   capture-timing issue rather than discarding the shot).
7. **Phase G — Screenshot repair**: `scripts/capture-v5-1.mjs` with
   pre-capture content assertions and `reducedMotion`/no-smooth-scroll
   capture mode; full breakpoint × route × state matrix; every screenshot
   opened and reviewed, not just counted.
8. **Phase H — Interaction video**: Playwright video recording covering
   the required sequence with visible captions.
9. **Phase I — Soak test**: repeated activate/deactivate + route
   navigation, asserting single Canvas, no duplicate listeners/companion
   roots, cancelled speech, no retained UI state.
10. **Final validation, final production review, commits, and a
    completion report rewritten only after all the above is either done or
    explicitly logged as not done** - with every real commit hash, no
    placeholders.

## Honest scoping note

Item 13 (interaction video) and the full ~19-state × 5-breakpoint ×
9-route screenshot matrix in Phase G are the largest single line items by
wall-clock cost. They are scheduled last among the implementation phases
(after C/D/F/A/B/E, which change actual behavior) so that if time runs out,
what's cut is capture/documentation breadth on already-correct behavior,
not a behavioral requirement left unimplemented. Any item not completed
will be named explicitly in the final report - not implied as done.
