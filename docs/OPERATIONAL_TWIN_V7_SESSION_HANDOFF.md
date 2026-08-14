# Operational Twin V7 — Session Handoff

## Current state

- **Worktree**: `/home/tarun/v7-work/tarun-portfolio`
- **Branch**: `operational-twin-v7`
- **Parent**: `living-infrastructure-v6-final` (commit
  `669a0a891e4970a9bfc20a38564eca67ca9a00e9`) — confirmed ancestor via
  `git merge-base --is-ancestor`
- **HEAD at last commit**: see `git log -1 --format=%H` for the exact value;
  do not hardcode it here (a doc committed alongside its own hash is
  self-referential and impossible — same reasoning V6's completion report
  applied to its own final-HEAD wording).
- **Working tree**: clean at last commit.
- **V6**: verified closed and untouched. `living-infrastructure-v6` branch,
  the `living-infrastructure-v6-final` tag, and commit `669a0a8` were not
  modified during this session. V6's real production deployment
  (`https://portfolio-tarun-dun.vercel.app`) was independently verified —
  full results in `docs/OPERATIONAL_TWIN_V7_DISCOVERY.md`.

## Completed phases

- **Phase 0 (V6 baseline)**: done. V6 final tag/commit/remote confirmed.
  Production baseline measured twice with a new, non-racy Resource-Timing
  based methodology (`scripts/measure-v6-baseline.mjs`) — byte-identical
  across both runs. Recorded in
  `docs/OPERATIONAL_TWIN_V7_PERFORMANCE_BUDGET.md`.
- **Phase 1 (discovery), partial**: reusable-system inventory and real
  content-gap audit done, grounded in the actual current code (not the V6
  report alone) — `docs/OPERATIONAL_TWIN_V7_DISCOVERY.md`. **Not yet done**:
  the three original design directions, comparison, and selection (spec
  §8's "Originality checkpoint"), and `docs/OPERATIONAL_TWIN_V7_CONTENT_GAPS.md`
  as its own file (the gaps are currently only recorded inside the
  discovery doc).

## Checks actually run (exact results)

- `git worktree add ... -b operational-twin-v7 living-infrastructure-v6-final`
  — succeeded, HEAD landed on `669a0a8` as expected.
- `npm ci` in the new worktree — succeeded (worktrees don't share
  `node_modules`; this was required before anything could run).
- `node scripts/measure-v6-baseline.mjs` — run twice, identical results both
  times (see performance-budget doc for the numbers).
- V6 production Playwright/manual verification — see discovery doc; the
  short version is everything passed, with one methodological note (fixed
  5s/30s timeouts vs. this VM's software-WebGL speed under load caused
  false failures in the first automated pass; direct reproduction with
  generous polling confirmed the real behavior is correct).

No V7 application code exists yet — nothing to lint/typecheck/test/build
against. Do not run those checks until there's V7-specific code to check.

## Current blocker

None. Next work is purely creative/architectural (design direction), not
waiting on any external input or unresolved failure.

## Next three tasks

1. Write `docs/OPERATIONAL_TWIN_V7_DESIGN_DIRECTION.md`: three original
   design directions grounded in the discovery doc's findings (the
   `ExperienceState` reducer, the 8-stage spine, the `Field<T>`
   verified/missing model), compare them against §8's reject-list (Kage,
   generic terminal portfolio, generic dark DevOps dashboard, sci-fi HUD,
   glassmorphism grid, Awwwards-clone), select one, and record why it's
   specific to Tarun.
2. Phase 2: define how the Operational Twin, System Trace, Proof Ledger,
   and RC-01 share state — as an extension of `lib/v6/experienceReducer.ts`
   (see discovery doc's architecture finding), not a parallel system.
   Produce `docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md`.
3. Split content gaps out into `docs/OPERATIONAL_TWIN_V7_CONTENT_GAPS.md`
   as its own file per spec §16, and begin Phase 3 (Scene Director
   extension + lifecycle).

## Commands to resume

```bash
cd /home/tarun/v7-work/tarun-portfolio
git status --short
git log --oneline -5
npm run dev   # or: npm run build && npm run start -- -p 3700
```

## Claims that remain unverified

- Whether any V7-specific visual asset budget is achievable is not yet
  testable — no V7 scene exists yet to measure.
- The `resumeFile` and Secure AWS disclosure checks above are current as of
  this session; re-verify if significant time has passed before relying on
  them, per the content model's own "don't trust a stale snapshot" logic.
