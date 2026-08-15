# Operational Twin V7 — Hosted Development & CI/CD

This is a **separate** document from `docs/AUTOMATED_CI_CD.md`, which
describes V6's own CI/CD and is not touched by this file or anything it
describes. V7 gets its own hosted workflow, deliberately decoupled from the
local Ubuntu/Jenkins server that V7's CI/CD ran on earlier in development.

## Why this exists

V7's local Jenkins pipeline (`Jenkinsfile`, `jenkins/agent/Dockerfile`)
produced genuine, real pipeline evidence during development - see
"Jenkins archival status" below - but depending on one local machine for
build, test, security scanning, and deployment does not scale as an
ongoing development or release workflow, and takes the whole pipeline
offline whenever that machine is off or under load. This moves the
*normal* V7 workflow to hosted infrastructure: GitHub Codespaces for
development, GitHub-hosted Actions runners for CI/testing/scanning, and
Vercel's own Git integration for preview/production hosting. None of this
requires the local server to be running.

## Architecture

```
GitHub Codespace  ──────────▶  Development environment
  (.devcontainer/)             Node 22, Chromium + deps pre-installed,
                                npm ci on create, no local machine needed

push/PR to
operational-twin-v7 ────────▶  V7 Fast CI (GitHub Actions)
                                lint · typecheck · unit · build
                                (parallel job) curated ~15-test
                                @release-fast Playwright smoke suite
                                ~10-15 min, required on every commit

push to
operational-twin-v7 ────────▶  Vercel Git integration creates a preview
                                deployment automatically (no workflow
                                needed to trigger it)

preview deployment
  succeeds ───────────────────▶ Preview Validation (GitHub Actions,
                                 triggered by `deployment_status` - this
                                 workflow already existed and is not
                                 branch-restricted, so it already fires
                                 for V7 previews)
                                 health · routes · headers · smoke ·
                                 targeted Playwright

manual / nightly ───────────▶  V7 Full Validation (GitHub Actions)
                                (parallel) complete Playwright suite +
                                accessibility audit + route/header audit +
                                performance budget + canvas-before-intent
                                (parallel) Docker Buildx image build +
                                Trivy fs + image scan + candidate
                                container health/route check

manual, final
candidate only ─────────────▶  V7 Evidence Capture (GitHub Actions)
                                screenshot matrix · walkthrough video ·
                                soak test · performance evidence ·
                                inventory - does not repeat lint/unit/the
                                full suite; assumes Full Validation already
                                passed for the given candidate_sha
```

GitHub Actions is now the **active hosted automation platform** for V7.
Jenkins is retained as historical evidence only - see below.

## Phase 1 — Codespaces

`.devcontainer/devcontainer.json` defines a reproducible dev environment:
Node 22, `npm ci` on creation, Playwright's Chromium + OS dependencies
pre-installed via `postCreateCommand`, and forwarded ports for the dev
server (3000), the Playwright target port (3100), and a production
candidate preview port (3600).

### Using it

1. On GitHub, go to the repository → **Code** → **Codespaces** tab →
   **Create codespace on operational-twin-v7** (make sure the branch
   selector is set to `operational-twin-v7`, not the default branch).
2. On the machine-type picker, choose a **4-core** machine if one is
   offered - `hostRequirements.cpus: 4` in the devcontainer config filters
   the list to that minimum, but does not force a specific size. A smaller
   machine will still work, just slower for the full build/Playwright run.
3. Wait for the container to build and `postCreateCommand` to finish
   (`npm ci && npx playwright install --with-deps chromium`) - this is a
   one-time cost per Codespace, not per session resume.
4. Start developing: `npm run dev` (forwarded on port 3000, opens
   automatically), or `npm run test:e2e` for Playwright against the
   built-in `webServer` on port 3100.
5. **When done for the day**: from the Codespaces list (or the `Codespaces:
   Stop Current Codespace` command in VS Code), **stop** the Codespace -
   this halts billing for compute while preserving your files/state.
   **Delete** it entirely (Codespaces list → "..." → Delete) once a piece
   of work is fully merged and you don't need to resume that exact
   environment - deleted Codespaces free the storage allocation too.
   GitHub bills Codespaces by compute-minutes while running and by storage
   while stopped-but-not-deleted, so an idle running Codespace is the
   costly state to avoid.

### Verification performed

The devcontainer config was reviewed for correctness (valid JSONC, correct
image/feature references, `postCreateCommand` matching this repo's actual
install/Playwright-setup commands) but **has not been proven by actually
creating a Codespace** - that requires GitHub's own Codespaces
infrastructure, which this session's tools cannot drive directly. This
does not change any application behavior (it only adds a new file under
`.devcontainer/`), so the risk of it being wrong is confined to "the
Codespace fails to build," not to V7's own code or tests. Recommended
follow-up: create one Codespace on `operational-twin-v7` and confirm
`npm run dev` and `npm run test:e2e` both work before relying on it.

## Phase 2 — V7 Fast CI

`.github/workflows/v7-fast-ci.yml`. Triggers on push/PR to
`operational-twin-v7` only - entirely separate from `ci-fast.yml`, which
stays scoped to `living-infrastructure-v6` and is untouched.

Two independent parallel jobs (no `needs:` between them):

- **validate**: repository safety check, `npm ci`, lint, typecheck, unit
  tests, production build.
- **e2e-critical**: `npm ci`, cached Playwright Chromium install, build,
  and the curated `@release-fast`-tagged Playwright subset (the same tag
  used in `Jenkinsfile`'s `RELEASE_FAST` profile - one tag, reused by both
  hosted and local pipelines, not two parallel test selections to keep in
  sync).

Optimizations: `actions/setup-node`'s built-in `cache: npm`; a
version-keyed Playwright browser cache (`actions/cache`, keyed off the
exact resolved `@playwright/test` version so a version bump invalidates it
automatically rather than silently testing a stale browser); a
concurrency group with `cancel-in-progress: true` so superseded commits on
the same branch/PR don't queue behind each other; minimal artifact
uploads (only Playwright traces, only on failure); per-job timeouts
(12/15 minutes).

## Phase 3 — V7 Full Validation

`.github/workflows/v7-full-validation.yml`. Triggers: `workflow_dispatch`
(with a `candidate_ref` input, default `operational-twin-v7`) and a
nightly schedule (21:15 UTC, offset from V6's 20:30 UTC nightly so the two
never contend for the same runner-minute).

Two independent parallel jobs, both depending only on `setup` (which
resolves the exact candidate SHA once so both jobs validate the identical
commit):

- **validate**: full unfiltered Playwright suite (every test, not just
  `@release-fast`), then against a local `npm start` server: structural/
  accessibility HTML audit, route verification (including the custom-404
  check), security-header verification, performance-budget measurement,
  canvas-before-intent verification.
- **docker-scan-candidate**: Trivy filesystem scan, Docker Buildx image
  build (`docker/setup-buildx-action` + `docker/build-push-action`, real
  BuildKit on a GitHub-hosted runner - no local `buildx`-plugin
  installation needed, unlike this repository's local Jenkins agent,
  which required installing it explicitly), Trivy image scan
  (CRITICAL/HIGH, fixed vulnerabilities only, exit-code 1 - blocks), then
  the built image is actually run as a container and health/route/header-
  checked, not just scanned statically.

Evidence capture (screenshots/video/soak) is deliberately **not** part of
this workflow - see Phase 4.

## Phase 4 — V7 Evidence Capture

`.github/workflows/v7-evidence-capture.yml`. `workflow_dispatch` only,
requiring a `candidate_sha` input - every artifact this workflow produces
refers to that one exact commit, never "whatever HEAD happens to be."

Does not repeat lint, unit tests, or the complete Playwright suite - an
advisory (non-blocking) step checks GitHub's own Actions API for a prior
successful `V7 Full Validation` run against the given SHA and emits a
`::warning::` if none is found, but does not re-verify correctness itself
or fail the run. Captures: screenshot matrix, walkthrough video, soak
test, final performance evidence, and a generated inventory - archived as
a single artifact named after the commit SHA with a 90-day retention.

## Phase 5 — Vercel

Vercel's GitHub App integration was already connected and already creates
a preview deployment automatically for every `operational-twin-v7` push -
confirmed directly via `gh api repos/.../deployments`, not assumed. The
existing `preview-validate.yml` workflow (part of V6's original
automation, not branch-restricted) already fires on every one of those
preview deployments via the `deployment_status` event.

**Real finding, not a hypothetical**: every V7 preview deployment
validated this session returned HTTP 302 on every route, redirecting to
`vercel.com/sso-api` - confirmed with a direct `curl -I` against a real
preview URL. This is Vercel's own **Deployment Protection** (SSO
authentication wall), a project-level setting, not an application defect.
`gh run list` showed this had silently failed on every one of ~19
consecutive `Preview Validation` runs.

Fix in progress: a **Protection Bypass for Automation** secret
(Vercel dashboard → Project Settings → Deployment Protection), added as
the `VERCEL_AUTOMATION_BYPASS_SECRET` GitHub Actions secret and wired into
the validation workflows as an `x-vercel-protection-bypass` header - this
lets CI verify previews while the SSO wall stays up for casual visitors
(the alternative, disabling protection outright, was not chosen).

Production stays V6 exclusively until a V7 candidate SHA has passed both
V7 Fast CI and V7 Full Validation and its preview has been independently
verified - no production promotion has been attempted or claimed.

## Phase 6 — Jenkins archival status

See the "Jenkins" section of
`docs/OPERATIONAL_TWIN_V7_SESSION_HANDOFF.md` for the full, itemized
account of what actually ran on the local Jenkins controller/agent this
session (diagnostic job, the numbered fix history across ten real pipeline
runs, the final RELEASE_FAST/FULL_VALIDATION/EVIDENCE_ONLY reduction).
Summary for this document:

- The local Jenkins controller and its `portfolio-docker`-labeled agent
  produced genuine, real pipeline execution evidence for V7 - not
  fabricated, not simulated. That evidence remains valid as a
  demonstration of Jenkins/Docker/Trivy CI/CD engineering.
- **Known limitation, stated plainly**: this agent runs on a single local
  VM with real, measured resource contention (documented throughout this
  session - slow package-mirror throughput, occasional VM-load test
  flakiness, one full host reboot mid-build) - it is not a reliable
  always-on CI target, which is exactly why GitHub Actions has replaced it
  as the active hosted platform for normal V7 development.
- Jenkins is **not** shown as currently operating unless it demonstrably
  is at the time this is read - do not infer "Jenkins is live" from this
  document; check the current session's own status reporting instead.
- No Jenkins IP address, API token, SSH key, or other credential is
  recorded in this file or any other committed file.
- Jenkins is not shut down automatically by this work. Safe shutdown
  commands are provided separately, only after the hosted replacement
  (this document's Phases 2-3) has genuinely passed.
