# Operational Twin V7 — Performance Budget

## Phase 0: V6 production baseline (measured, reproduced twice)

Measured against the real, verified V6 production deployment:
`https://portfolio-tarun-dun.vercel.app` (commit `669a0a891e4970a9bfc20a38564eca67ca9a00e9`,
tag `living-infrastructure-v6-final`).

### Methodology

`scripts/measure-v6-baseline.mjs` reads the browser's own Resource Timing
entries (`performance.getEntriesByType("resource")`) once each route reaches
`load` and settles, rather than polling live request counts until they stop
changing. The request-count heuristic used by V6's own
`scripts/measure-v6-routes.mjs` is racy by construction (a still-in-flight
request can be missed depending on exact timing); reading the complete
resource timeline after the fact is not. This script reports `transferSize`,
`encodedBodySize` and `decodedBodySize` separately per the master spec's
measurement requirements — they are materially different numbers, not three
ways of writing the same one.

Run twice, cold context each time (a fresh browser context per route, so no
warm-cache carryover between runs):

| Run | Output file |
|---|---|
| 1 | `reports/v7/v6-baseline-1786676967277.json` |
| 2 | `reports/v7/v6-baseline-1786677113010.json` |

Both runs produced byte-identical results for every route, on every field
(`jsDecodedBodySize`, `jsRequestCount`, `fontTransferSize`, `canvasCount`) —
confirming the methodology is stable and reproducible, not a coincidence of
timing.

### Baseline (cold load, decoded JS bytes)

| Route | JS decoded | JS requests | Font transfer | Canvas before intent |
|---|---:|---:|---:|---:|
| `/` | 701,531 B | 13 | 90,260 B | 0 |
| `/work` | 696,620 B | 13 | 90,260 B | 0 |
| `/work/project-aurora` | 581,843 B | 12 | 90,260 B | 0 |
| `/about` | 566,679 B | 11 | 90,260 B | 0 |
| `/resume` | 566,679 B | 11 | 90,260 B | 0 |
| `/contact` | 567,914 B | 12 | 90,260 B | 0 |

Full per-resource breakdown (`transferSize`, `encodedBodySize`,
`decodedBodySize` per request) is in the two JSON files above.

**Note on the discrepancy with V6's own completion report**: the V6
completion report's per-route table (e.g. home: "120,627 JS bytes") measured
`encodedBodySize`/transferred bytes via `response.body().length` — the
over-the-wire, compressed size. The 701,531 B figure above is
`decodedBodySize` — the uncompressed size the browser actually executes.
Both are real, correct measurements of different things; V7's own budget
table (master spec §12) explicitly asks for `decodedBodySize` on several
targets, so decoded bytes is the number V7's "+5% over V6 baseline" checks
will compare against.

## V7 required budgets (from the master spec, §12)

Copied here for quick reference during implementation — not restated with
invented numbers:

| Metric | V7 requirement |
|---|---|
| V7 Three.js/WebGL before intent | 0 bytes |
| Canvas before intent | 0 |
| Maximum active canvas | 1 |
| Initial JS per existing route | no more than +5% over the V6 baseline above |
| V7-specific scene code/data | target ≤350 KB decodedBodySize (excl. shared Three/R3F vendor) |
| Total first 3D activation JS | target ≤1.25 MB decodedBodySize, uncached |
| Largest new lazy chunk | target ≤750 KB decodedBodySize |
| Initial immersive visual assets | target ≤700 KB transferred |
| Total optional V7 visual assets, one visit | target ≤2.5 MB transferred, on demand |
| Self-hosted fonts | no more than +5% over 90,260 B (V6 baseline above) |
| CLS | ≤0.1 |
| INP | target ≤200 ms hosted |
| Interaction long task | no single task >50 ms |
| Route visible transition | target ≤400 ms, excl. unrequested 3D |
| Desktop animation | target 55–60 FPS |
| Mobile animation | target 30 FPS balanced |
| Reduced motion | complete content, no required canvas |

These will be re-measured against V7 routes using the same
`measure-v6-baseline.mjs` methodology (generalized) once V7 scenes exist.
