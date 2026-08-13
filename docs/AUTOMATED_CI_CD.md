# Automated CI/CD — Living Infrastructure V6

Why this exists: implementing V6 by hand requires repeatedly running
`npm ci`, lint/typecheck/test/build, Playwright, screenshot capture, route
verification, and preview deploys — each cycle costing real wall-clock time
and, when done through an assistant, real conversational tokens spent
watching logs. This document describes the automation that replaces most of
that manual repetition with unattended checks and a short, targeted failure
summary instead of a full log paste.

## Architecture

```
push/PR  ─────────────▶  Fast CI (GitHub Actions)
                          lint · typecheck · unit · conditional build
                          (no e2e, no deploy, ~5-10 min)

push to branch ────────▶  Vercel Git integration creates a preview
                          deployment automatically (no workflow needed
                          to trigger it)

preview deployment ────▶  Preview Validation (GitHub Actions,
  succeeds                triggered by `deployment_status`)
                          health · routes · headers · desktop/mobile
                          smoke · targeted Playwright

nightly / manual ──────▶  Nightly Deep Validation (GitHub Actions)
                          full lint/typecheck/unit/build · full
                          Playwright (--workers=1) · accessibility ·
                          Trivy filesystem scan · performance
                          measurement · soak test

git tag                ─▶  Release (GitHub Actions)
  living-infrastructure-    validate → Docker image build → Trivy
  v*-final                  image scan → candidate container health/
                             route/header check → performance ×2 →
                             screenshot/video evidence → production
                             promotion (only if VERCEL_PRODUCTION_URL
                             is configured) → post-promotion smoke test

manual / secondary ────▶  Jenkinsfile
                          Same package scripts + scripts/ci/ helpers,
                          run from a self-hosted Jenkins controller.
                          Never deploys production, never duplicates
                          the release pipeline.
```

GitHub Actions is the **primary** CI/CD system. Jenkins is an optional,
secondary/manual validator that reuses the same scripts rather than
reimplementing their logic — useful if you want to validate a build outside
GitHub's runners, not required for normal V6 development.

## Files

| File | Purpose |
|---|---|
| `.github/workflows/ci-fast.yml` | Every push/PR to `living-infrastructure-v6`: lint, typecheck, unit tests, conditional build, `git diff --check`. |
| `.github/workflows/preview-validate.yml` | Validates a Vercel preview once it deploys successfully. |
| `.github/workflows/nightly.yml` | Scheduled (20:30 UTC / 02:00 IST) full validation, also runnable via `workflow_dispatch`. |
| `.github/workflows/release.yml` | Fires on tags matching `living-infrastructure-v*-final`. |
| `.github/dependabot.yml` | Weekly grouped updates: npm, GitHub Actions, Docker base image. |
| `Dockerfile` | Multi-stage, non-root, Next.js `output: "standalone"` production image. |
| `.dockerignore` | Keeps the build context free of secrets, tests, docs, git metadata. |
| `compose.ci.yml` | CI-only stack for validating the built image on port 3600 (never 3500, the manual/local preview port). |
| `Jenkinsfile` | Secondary/manual pipeline; `agent { label 'portfolio-docker' }`. |
| `scripts/ci/detect-changes.mjs` | Decides whether a push needs a production build (app/config changed) or not (docs-only). |
| `scripts/ci/verify-routes.mjs` | Checks the 13 real routes' expected status codes against any base URL. |
| `scripts/ci/verify-headers.mjs` | Checks the 5 security headers + absent `X-Powered-By` against any base URL. |
| `scripts/ci/verify-health.mjs` | Polls a base URL until reachable or a timeout — replaces fixed `sleep` waits. |
| `scripts/ci/create-summary.mjs` | Writes `reports/ci-summary.md` (and `$GITHUB_STEP_SUMMARY`) from a small JSON status object. |
| `scripts/ci/cleanup.mjs` | Stops only the CI-owned server process or compose stack this phase started. |

## One-time setup required (not done by this commit)

These need a human with repository/Vercel-org admin access — they cannot be
done by pushing code, and none were fabricated or assumed complete:

1. **Link the repository to Vercel** (if not already linked): Vercel
   dashboard → Add New Project → import
   `tarunpradeep6162/Portfolio` → keep the Git integration's automatic
   preview-per-branch behavior enabled. Once linked, every push to
   `living-infrastructure-v6` gets its own preview URL automatically —
   no workflow change needed for this part.
2. **`VERCEL_PRODUCTION_URL` repository secret** (Settings → Secrets and
   variables → Actions): the production URL Vercel assigns after linking.
   Only used by `release.yml`'s `promote-and-smoke-test` job to verify a
   production deployment took effect for the tagged commit — the job skips
   itself with a clear warning (not a fabricated pass) if this isn't set.
3. **A `production` GitHub Environment** (Settings → Environments), with
   required reviewers if you want a manual approval gate before
   `promote-and-smoke-test` runs. Optional — the workflow runs without it,
   just without the approval step.
4. **Jenkins** (optional, only if you want the secondary pipeline): a
   Jenkins controller with an agent labeled `portfolio-docker` that has
   Node 20 and Docker installed, and a job pointed at this repository using
   `Jenkinsfile`.

## GitHub authentication / publication status

As of this automation commit, `gh auth status` reports a valid, logged-in
token (account `tarunpradeep6162`, scopes `gist`, `read:org`, `repo`,
`workflow`) and `origin/living-infrastructure-v6` already exists on GitHub.
The previous session's push blocker (no credential helper available) is
resolved. See the completion report for the exact push/tag commands run and
their results for this specific session.

## Local Docker validation status

The Dockerfile was structurally reviewed (multi-stage, non-root user,
`output: "standalone"` tracing, healthcheck, no BuildKit-only syntax after
removing the `--mount=type=cache` line - see the Dockerfile's own comment)
and `.dockerignore`/`compose.ci.yml` were reviewed for correctness, but a
**full local `docker build` did not complete** on this development VM: two
separate attempts both got through `npm ci` successfully within the
documented ~15-17 minute baseline (494 packages), then the legacy Docker
builder hung indefinitely committing that layer to disk - never progressing
to the next build step, with no error, under the same VM I/O contention
Phase 0 documented for `npm run verify`. This is an environment limitation
of this local daemon (no `buildx` plugin installed, legacy builder, heavy
disk contention), not a defect found in the Dockerfile itself.

**What this means concretely:** the image has not been proven to build and
boot successfully anywhere yet. The real build/validate step is
`release.yml`'s `docker-image` and `candidate-runtime-check` jobs, which run
on a GitHub-hosted runner with `docker/setup-buildx-action` (real BuildKit,
no local VM contention) and are structurally correct per this review, but
have likewise not yet executed for real (no release tag has been pushed).
Do not treat the Docker image as verified until one of those jobs has
actually run and its logs show a successful build, a passing healthcheck,
and passing route/header checks against the running container - reproduce
locally with `docker build -t tarun-portfolio:local .` on a machine/daemon
without this VM's constraints if independent confirmation is wanted sooner.

## Severity policy (Trivy)

- **Blocks the release pipeline**: `CRITICAL` or `HIGH` severity findings
  **that have a known fix available** (`ignore-unfixed: true` in
  `release.yml`'s image scan). A vulnerability with no upstream fix yet
  cannot be resolved by any change to this repository, so it is reported
  (via the uploaded Trivy artifact) rather than used to block indefinitely.
- **Does not block**: `MEDIUM`/`LOW` findings, and any finding without a
  fix. These are visible in the archived scan output for manual review, not
  silently dropped.
- **Nightly's filesystem scan** (`nightly.yml`) runs with `exit-code: "0"`
  — informational, archived, never blocks the nightly run itself, since
  nightly's job is visibility, not gatekeeping (that's the release
  pipeline's job).
- **False positives**: if Trivy flags something confirmed to be a false
  positive, document the CVE ID and the reasoning in this file's "Known
  Trivy exceptions" section below before adding a `.trivyignore` entry —
  never suppress silently.

### Known Trivy exceptions

None recorded yet.

## CI summary discipline

Every workflow's failure path writes `reports/ci-summary.md` (never
committed to Git — see `.gitignore`) with: commit, workflow, status,
first actionable error, the exact targeted reproduction command, and which
stages already passed for that commit. The intent, stated directly in the
V6 brief that created this automation: a fix session should read this one
file, not a full pasted CI log, and should not rerun stages the summary
already shows passed unless the fix could plausibly affect them.

## Kubernetes — explicitly excluded from this release path

This portfolio is a single Next.js application with one deployment target
(Vercel, or a single Docker container). Kubernetes' value proposition —
multi-node scheduling, rolling updates across replicas, Service/Ingress
abstraction over multiple pods — has no problem to solve here; adopting it
would add a control plane, node pool, and manifest set to maintain for
software that runs as one process. It is deliberately not part of this
automation phase.

### Future learning-lab possibility (not built, not scheduled)

If Kubernetes experience is wanted as a *separate* learning project later,
a plausible shape (documented here only as a reference, not committed to):
a local **K3s** cluster, a `Deployment` + `Service` + `Ingress` for this
same portfolio image, readiness/liveness probes reusing
`scripts/ci/verify-health.mjs`'s logic, **Argo CD** for GitOps-style sync
from this repository, and a deliberate rolling-update/rollback drill. This
would live in its own repository or a clearly separate directory, never
mixed into the canonical release path described above.

## Rollback

Automated rollback is **not** implemented or claimed. If a production
promotion needs to be undone:

- **Vercel**: dashboard → Deployments → select the last known-good
  deployment → "Promote to Production". Vercel retains prior deployments
  independently of this repository's automation, so this is available
  regardless of what CI does.
- **Git**: the tag `jury-refinement-v5.1-final` (commit `8574469`) remains
  the permanent, unmodified V5.1 fallback for the entire V6 effort — see
  the Plan document's Phase 16 rollback boundary.
