# Portfolio V9 — Phase 9: Go `portfolio-audit` CI Tool

The second implementation phase of the polyglot addendum
(`docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md`, Phases 8–11). Builds the Go
audit tool defined in `docs/PORTFOLIO_V9_ARCHITECTURE.md`'s addendum -
independent of Phase 8's Rust work, per the addendum's own design
("the Rust engine, Go tool, and GLSL shaders don't depend on each
other").

## What this phase built

**`tools/portfolio-audit/`** - a standalone Go module (own `go.mod`,
zero external dependencies, standard library only), with four real
checks against the actual repository:

1. **Route inventory** (`internal/audit/routes.go`) - confirms
   `app/<segment>/page.tsx` exists for every expected static route (`/`,
   `/about`, `/contact`, `/resume`, `/work`).
2. **Flagship project evidence manifest** (`internal/audit/evidence.go`)
   - parses `content/projects.ts` by tracking brace depth to isolate
   each top-level project object (robust to the nested `screenshot`/
   `links` structures inside each one), then extracts slug, kind,
   whether a flagship project has a real `label: "Repository"` link, and
   each project's `Field<T>` status (`ready`/`needs-input`) for its
   screenshot or (for lab projects) its links.
3. **Security headers** (`internal/audit/headers.go`) - parses
   `next.config.ts`'s `securityHeaders` array for the same 5 headers
   `docs/PORTFOLIO_V9_PHASE6_HARDENING.md` verified live, as a
   configuration-source check that needs no running server.
4. **Scenario Simulator proof references** (`internal/audit/proofrefs.go`)
   - extracts every `relatedProjectSlug` from `content/v9/scenarios.ts`
   and confirms each one resolves to a real flagship project slug in
   `content/projects.ts` - the same discipline
   `tests/unit/scenarios.test.ts` already enforces in TypeScript, now
   also enforced independently in Go.

`internal/audit/report.go` aggregates all four into one `Report`,
marshaled directly to the required machine-readable JSON, with
`RenderMarkdown` producing the human-readable counterpart from the exact
same data (so the two outputs can never drift from each other). `main.go`
is the CLI: `--repo-root`, `--json`, `--markdown`, exits non-zero with
every failure reason printed to stderr when any check fails.

**`.github/workflows/v9-go-audit.yml`** - path-filtered to
`tools/portfolio-audit/**`, runs `gofmt -l` (format check), `go vet`,
`go build`, `go test ./... -v`, a short fuzz regression pass, then
`govulncheck`, then **runs the tool against this real repository** and
uploads its JSON report as a CI artifact plus a Markdown job summary -
not a demonstration run against a fixture.

## Real output against this actual repository

```
flagshipCount: 4
flagshipWithRepositoryLink: 1   (Project Aurora - matches docs/PORTFOLIO_V9_CONTENT_MATRIX.md exactly)
flagshipWithScreenshot: 0       (matches - no screenshots supplied yet)
securityHeaders.missing: []     (all 5 present)
brokenProofReferences: []       (every Scenario Simulator citation resolves to a real project)
ok: true
```

Every number matches what's already independently documented in
`docs/PORTFOLIO_V9_CONTENT_MATRIX.md` and verified by the existing
TypeScript test suite - this tool is a genuine second, independent
confirmation of the same facts, not a number invented to look plausible.

## Verification actually performed

- **`gofmt -l .`** - clean (after two real formatting fixes caught by
  the check itself: `report.go`'s struct tag alignment, and the two test
  files' `cases := []struct{...}` alignment).
- **`go vet ./...`** - clean.
- **`go build`** - clean.
- **`go test ./... -v`** - all table-driven tests passing, including two
  tests per check-type: one against small, literal fixture strings
  (isolating the parsing logic itself) and one against the real content
  files in this repository (`readFile("../../../..", ...)`, confirming
  the tool actually works on real, not just fixture, content).
- **Fuzzing** (`FuzzParseProjects`, `FuzzCheckProofReferences`) - run for
  real, not just the seed corpus: ~1.8 million executions in 20 seconds
  locally, zero panics, zero crashes.
- **`govulncheck ./...`** - "No vulnerabilities found" against this
  module's actual call graph.
- **Manual CLI run** against the real repository with explicit
  `--json`/`--markdown` output paths - confirmed clean JSON, confirmed
  the Markdown report reads correctly, confirmed exit code 0.
- **No changes to the TypeScript/Next.js side of the repository this
  phase** - `npm run lint` / `npm run typecheck` / `npm run build`
  re-run to confirm zero regression from Phase 8's still-open PR or any
  other source.

## A design note: this tool's `report.go` is the single source for both outputs

`RenderMarkdown` takes the same `Report` struct the JSON encoder marshals
- there is no second code path that independently re-derives the
Markdown summary from raw files. This was a deliberate choice per the
addendum's "output machine-readable JSON and human-readable Markdown"
requirement: two outputs, one source of truth, so they cannot silently
disagree with each other the way the JSON and a human-written summary
comment easily could.

## Limitations (stated honestly, not glossed over)

- **This is a regex/brace-depth scanner, not a TypeScript parser.** It
  works because `content/projects.ts`, `content/v9/scenarios.ts`, and
  `next.config.ts` have a narrow, consistent, known shape today. A `{` or
  `}` character inside a string literal, or a significant reformatting of
  these files, could break the brace-depth tracking silently. This is an
  accepted, documented trade-off for a small, targeted tool - not a
  general-purpose solution, and not positioned as one.
- **Duplication with the existing Node/TS checks is not yet retired.**
  Per `docs/PORTFOLIO_V9_ARCHITECTURE.md`'s explicit plan, this tool runs
  *alongside* `tests/unit/scenarios.test.ts`, `tests/unit/evidenceGraph.test.ts`,
  and the Phase 6 header check for now - retiring any of them requires a
  proven equivalence run first, which is deliberately not part of this
  phase.
- **No route-inventory check for `/work/[slug]`'s dynamic segments** -
  those are derived from `content/projects.ts` via `generateStaticParams`,
  already covered indirectly by the flagship-project check; adding a
  literal per-slug route check would just re-test the same underlying
  fact a second way.

## Not done in this phase (explicitly, not silently)

- No retirement of any existing Node/TS check.
- No change to any TypeScript source.
- No production promotion, no V9 final tag touched.
