# Portfolio V8 — Phase 0: Baseline

Real measurement, not projection — recorded before any application code
changed. Read-only against a local production build
(`npm run build && npm run start -- -p 3200`), commit `4c3eb233a86dbe734df6ac4cde4c74f257fc6523`
(`portfolio-v8` after merging the preparation PR, application code
identical to the V7 validated commit `cba06cf` — the preparation PR only
added `docs/`). Methodology and raw output: `scripts/measure-v8-baseline.mjs`
(new script, read-only, does not alter application behavior — same pattern
as `scripts/measure-v6-baseline.mjs`); JSON written to `reports/v8/`
(gitignored, same convention as `reports/v7/`).

## Per-route idle baseline (no system activated, matches V6/V7's six tracked routes)

| Route | JS decoded | JS requests | Font transfer | Canvas |
|---|---:|---:|---:|---:|
| `/` | 752,066 B | 16 | 90,260 B | 0 |
| `/work` | 770,556 B | 17 | 90,260 B | 0 |
| `/work/project-aurora` | 770,556 B | 17 | 90,260 B | 0 |
| `/about` | 752,066 B | 16 | 90,260 B | 0 |
| `/resume` | 752,066 B | 16 | 90,260 B | 0 |
| `/contact` | 752,066 B | 16 | 90,260 B | 0 |

Zero canvas before intent on every route, confirmed directly — the
existing invariant holds at the V8 starting line. Font transfer
(90,260 B) is unchanged from the V6/V7 baseline, as expected (no font
changes since).

## Per-system activation cost (fresh browser context per system, so each number is that system's real cost in isolation, not cumulative)

| System | Route | New chunk bytes | New chunks | Canvas before → after |
|---|---|---:|---:|---|
| Atlas | `/work/project-aurora`, "Enter 3D view" | 900,537 B | 3 | 0 → 1 |
| Operational Twin | `/`, "Activate Operational Twin" | 903,311 B | 3 | 0 → 1 |
| RC-01 | `/`, "Activate RC-01" | 965,638 B | 4 | 0 → 1 |

## The actual shared-vendor-bundle number

Exactly **one** chunk file appears in all three systems' activation sets:
`43krk7d24ofg8.js`, confirmed **896,201 bytes** on disk
(`.next/static/chunks/43krk7d24ofg8.js`) — this is the shared
Three.js/`@react-three/fiber` vendor code. No other chunk overlaps between
any two systems.

**Honest reading of this number, correcting the framing in
`docs/PORTFOLIO_V8_PERFORMANCE_BUDGET.md`**: this is *not* triple-paid by
a real visitor in a single session. Next.js's content-hashed chunk naming
means the browser downloads `43krk7d24ofg8.js` once and serves it from
cache for whichever of the other two systems activates next in the same
session — the fresh-context measurement above deliberately isolates each
system to find the shared file, not to claim it's paid for three times by
one visitor. The genuinely non-shared, per-system cost is small:

| System | Total activation cost | Shared vendor (896,201 B) | System-specific code |
|---|---:|---:|---:|
| Atlas | 900,537 B | 896,201 B | **4,336 B** |
| Operational Twin | 903,311 B | 896,201 B | **7,110 B** |
| RC-01 | 965,638 B | 896,201 B | **69,437 B** |

**What this means for Direction A ("Unified Control Room")**: the
byte-size case for consolidation is smaller than the performance-budget
document assumed — the shared vendor chunk is already deduplicated
per-session by ordinary browser caching, so a first-time visitor who
tries only one system today pays roughly 900 KB regardless, and a visitor
who tries two or three pays the ~900 KB vendor cost once plus a few KB to
~70 KB per additional system, not three full ~900 KB downloads. The real
argument for consolidation remains valid but is **structural, not
primarily byte-size**: one typed lifecycle/quality-tier/capability system
instead of three independently-maintained ones, and the one-canvas
invariant becoming impossible to violate by construction instead of
enforced by convention and tests. This correction is recorded here rather
than silently — the performance budget document is not being restated
with these more precise numbers, but this file is the authoritative
number going forward.

## What Phase 0 did not touch

No component, route, or `content/*.ts` file changed. The only additions
are this document and `scripts/measure-v8-baseline.mjs` (a new,
independent, read-only measurement script). `npm run build` completed
cleanly with zero errors before this measurement was taken, confirming
the starting point is healthy.
