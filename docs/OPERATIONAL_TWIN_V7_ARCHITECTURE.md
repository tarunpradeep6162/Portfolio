# Operational Twin V7 — Architecture

## Shared state (Phase 2)

Extended `lib/v6/experienceReducer.ts` / `lib/v6/types.ts` rather than
building a parallel state system — confirmed viable by direct code audit
(see discovery doc): V6's `ExperienceState` already tracked `activeScene`
with mutual-exclusion semantics, `activeProject`, `selectedStageId`,
`selectedNodeId`, `visitorPath`, `motion`, `power`.

Added exactly three new fields, each backed by a real, demonstrated need
from the master spec — not spec-following for its own sake:

| Field | Type | Why it's new |
|---|---|---|
| `qualityTier` | `"high" \| "balanced" \| "fallback"` | Spec §11 requires reusing V6's tier vocabulary; V6 never needed this in shared state because Atlas/RC-01 made this decision locally per-component. The Operational Twin needs it centrally so multiple surfaces (Twin scene, evidence display) can agree on tier without re-deriving it. |
| `webglCapability` | `"unknown" \| "supported" \| "unsupported"` | Same reasoning — detected once, needed by more than one surface once the Twin exists alongside Atlas/RC-01. |
| `traceScope` | `"single" \| "all"` | System Trace's "one stage, one project, or all stages" requirement (§10.2). Deliberately does **not** duplicate stage selection — `selectedStageId`/`activeProject` remain the single source of truth for *which* stage/project; this only flags whether the Twin should focus one or show the whole pipeline. |

`SceneKind` gained one new member (`"operational-twin"`), verified safe by
grep — no code anywhere does an exhaustive `switch` on `SceneKind` that
would silently miss the new case; every existing usage is an equality
check (`=== "atlas"` etc.), which is unaffected by adding a member.

Verified with `next typegen` + `tsc --noEmit` (clean) and the full unit
suite (`vitest run` — 66/66 passed, same count as before the change) that
this extension is genuinely backward-compatible, not just type-compatible.

### What deliberately stays out of the reducer

Per the spec's "prefer pure functions... cheap to test" guidance and to
avoid a second source of truth:

- **Proof Ledger evidence** is not stored state. It's derived by a pure
  mapping function (`lib/v7/evidenceMapper.ts`, to be added in Phase 3+)
  from `activeProject` + `selectedStageId` + the existing `Field<T>`
  content — the same two fields already in the reducer, read differently.
- **Incident/automation records** are static typed content
  (`content/v7/incidents.ts`, `content/v7/automation.ts`), not reducer
  state — they don't change at runtime, only which one is *displayed*
  does, and that's `selectedStageId`/`activeProject` again.
- **Quality-tier *selection logic*** (given device/motion/power/WebGL
  inputs, what tier should apply) is a pure function
  (`lib/v7/qualityPolicy.ts`), not reducer logic — the reducer only stores
  the *result* (`qualityTier`), dispatched once the pure function decides
  it. This keeps the tier-selection algorithm unit-testable without a
  reducer or a mounted component.

## Missing-content states

Reuses `Field<T>` from `content/types.ts` (already the exact "verified /
missing" split the Proof Ledger needs) rather than a new content-status
type. The Proof Ledger's three-state model (`verified / explained /
missing`, spec §10.7) maps as:

- `Field<T>` with `status: "ready"` → **verified**
- A new, explicit engineering-explanation string attached to specific
  claims (not from `Field<T>` — this is genuinely new: content that exists
  and is true, but needs context to not be misread, e.g. Secure AWS's
  learning-implementation disclosure) → **explained**
- `Field<T>` with `status: "needs-input"` → **missing**, rendered using its
  existing `note` field, never hidden

This is a mapping over existing content, not a second content database —
directly satisfying §10.7's "do not build a second content database when
current project fields can be safely mapped."

## Next

Phase 3 (Scene Director/lifecycle) implementation: `lib/v7/qualityPolicy.ts`
and `lib/v7/sceneDirector.ts` as pure, unit-tested functions; wire
`QUALITY_TIER_SET`/`WEBGL_CAPABILITY_SET` dispatch into a detection effect
reusing Atlas's proven `useWebGLSupport` lazy-`useState` pattern (checked
once at mount, not reactively).
