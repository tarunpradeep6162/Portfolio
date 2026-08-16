# Portfolio V9 — Phase 0: Baseline

Real measurement, not projection — recorded before any V9 application
code changed. Read-only against a local production build
(`npm run build && npm run start -- -p 3200`), commit `9111948`
(`portfolio-v9` after merging the preparation PR, application code
identical to the V8 final tag `unified-control-room-v8-final` /
`9459778` — the preparation PR only added `docs/`). Methodology and raw
output: `scripts/measure-v9-baseline.mjs` (new script, read-only, exact
same methodology as `scripts/measure-v8-baseline.mjs`, re-pointed at
`reports/v9/`, gitignored same as `reports/v8/`).

## Per-route idle baseline

| Route | JS decoded | JS requests | Font transfer | Canvas |
|---|---:|---:|---:|---:|
| `/` | 751,647 B | 16 | 90,260 B | 0 |
| `/work` | 769,591 B | 17 | 90,260 B | 0 |
| `/work/project-aurora` | 769,591 B | 17 | 90,260 B | 0 |
| `/about` | 751,647 B | 16 | 90,260 B | 0 |
| `/resume` | 751,647 B | 16 | 90,260 B | 0 |
| `/contact` | 751,647 B | 16 | 90,260 B | 0 |

Byte-for-byte identical to the numbers already recorded in
`docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md` (which cited the V8 Phase 7
re-measurement) — confirming the V9 starting point genuinely matches the
V8 final tag with zero drift, as expected since no application code has
changed between them. Zero canvas before intent holds on all 6 routes.

## Per-system activation cost (fresh context each)

| System | Route | New chunk bytes | New chunks | Canvas before → after |
|---|---|---:|---:|---|
| Atlas | `/work/project-aurora`, "Enter 3D view" | 904,642 B | 3 | 0 → 1 |
| Operational Twin | `/`, "Activate Operational Twin" | 905,960 B | 3 | 0 → 1 |
| RC-01 | `/`, "Activate RC-01" | 968,299 B | 4 | 0 → 1 |

Matches the V8 baseline within normal chunk-hash noise. One shared
vendor chunk (Three.js/`@react-three/fiber`) appears across all three
systems, same as documented in V8's baseline analysis.

## The +15% budget line, in concrete numbers

Per `docs/PORTFOLIO_V9_PERFORMANCE_BUDGET.md`'s stated budget (idle JS
must stay under +15% of this baseline per route):

| Route | Baseline | +15% ceiling |
|---|---:|---:|
| `/` | 751,647 B | 864,394 B |
| `/work`, `/work/project-aurora` | 769,591 B | 885,030 B |
| `/about`, `/resume`, `/contact` | 751,647 B | 864,394 B |

These are the exact numbers each subsequent phase's Full Validation
checkpoint measures against.

## What Phase 0 did not touch

No component, route, or `content/*.ts` file changed. The only addition
is this document and `scripts/measure-v9-baseline.mjs`. `npm run build`
completed cleanly with zero errors before this measurement was taken.
