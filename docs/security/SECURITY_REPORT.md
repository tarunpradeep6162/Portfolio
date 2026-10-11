# Portfolio security hardening report

**Date:** 2026-10-11 · **Owner:** Tarun Pradeep B ·
**Site:** https://portfolio-tarun-dun.vercel.app · **Repo:** `tarunpradeep6162/Portfolio`
(public) · **Hosting:** Vercel, team `tarun-2f6a`, project `tarun-portfolio`

## 1. Executive summary

The site is a statically rendered Next.js portfolio. It has no login, no
admin UI, no database and no uploads. Its attack surface is four API routes,
plus the GitHub and Vercel accounts that control it. No secrets were found in
the repository or its history, and no sensitive files are publicly served.

The verified weaknesses were:
- an outdated Next.js release with critical advisories;
- no Content-Security-Policy;
- a chat API that any script could use as a free LLM proxy;
- an analytics endpoint that accepted unbounded payloads from any origin;
- no security monitoring, alerting or CI security checks;
- account-level gaps: no branch protection, production deploying from a
  feature branch, and an API key that was exposed in a chat.

All code-level findings are fixed on branch `claude/repo-research-review-u10h4g`
(commit `b438d1e`) and tested. Account-level items, firewall rules, email
alert credentials and the production deploy need the owner's approval or
access; they are listed in section 9.

## 2. Before and after

| Area | Before | After (this branch) |
| --- | --- | --- |
| Next.js | 16.3.0, 1 critical + 2 high production advisories | 16.4.0. `npm audit --omit=dev`: **0 vulnerabilities** |
| CSP | none | Built from real dependencies, no `unsafe-eval`, `frame-ancestors 'none'`; Report-Only until `CSP_ENFORCE=true` |
| Other headers | nosniff, Referrer-Policy, XFO, HSTS, Permissions-Policy | + COOP, Reporting-Endpoints, `no-store`/`noindex` on APIs, wider Permissions-Policy |
| `/api/rc01` | Any script without an Origin header got answers (HTTP 200) | Same-origin browser requests only, 64 KB body cap, edge-set IP for limits, abuse events |
| `/api/analytics` | Cross-origin POST stored arbitrary JSON in memory | Same-origin only, 2 KB cap, strict schema, nothing stored |
| AI crawlers | robots.txt allowed everything | 21 AI-training crawler tokens disallowed, search and link previews allowed, `/api/` disallowed |
| Monitoring and alerts | none | Structured security events, correlation and escalation, email alerts (Resend) with retry, dedup, rate cap and idempotency |
| CI | no security checks | gitleaks (full history), npm audit, CodeQL, security unit and e2e tests (CSP enforced) |
| Disclosure | none | `/.well-known/security.txt`, `SECURITY.md`, incident runbook |

## 3. Verified findings

The probes were non-destructive requests against production on 2026-10-11.
Evidence is reproducible without secrets.

| # | Severity | Finding | Evidence | Status |
| --- | --- | --- | --- | --- |
| F1 | High | Next.js 16.3.0 has critical advisories (unauthenticated RCE via the Image Optimization API with AVIF; Windows-host RCE). The practical exposure was low: `next/image` is unused and Vercel runs Linux. | `npm audit --omit=dev` | **Fixed:** 16.4.0 |
| F2 | Medium | No Content-Security-Policy, so an XSS bug would have no second line of defence. | `curl -I /` has no CSP header | **Fixed:** policy shipped Report-Only; full e2e suite passes with it enforced |
| F3 | Medium | `/api/rc01` answered scripted requests (no Origin header), so it could drain the Gemini free-tier quota. | `curl -X POST /api/rc01 -d '{"messages":[…]}'` → 200 | **Fixed in app.** Headers can be forged, so firewall rule 3 is still needed |
| F4 | Medium | `/api/analytics` accepted cross-origin, unbounded JSON and kept up to 1000 payloads in memory (memory abuse; data never used). | Cross-origin POST → `{"success":true}` | **Fixed** |
| F5 | Medium | Supply chain: no branch protection or rulesets, production deploys from a feature branch, public repo. | `GET /repos/…/rulesets` → `[]`; deployment metadata | **Owner action** (section 9) |
| F6 | Medium | `GEMINI_API_KEY` was pasted into an AI chat earlier. The Vercel value has never been rotated (created = updated). | Vercel env metadata (value not read) | **Owner action:** rotate |
| F7 | Low | `Permissions-Policy: microphone=()` silently broke RC-01's voice input (a security header causing a functional bug). | Header + `useVoiceInput` | **Fixed:** `microphone=(self)` |
| F8 | Low | JSON-LD was serialised with `JSON.stringify` inside `<script>`. Not exploitable today (static content) but unsafe by construction. | `app/layout.tsx` | **Fixed:** escaped serialiser |
| F9 | Low | Rate-limit key came from the first `x-forwarded-for` entry. | `app/api/rc01/route.ts` | **Fixed:** prefers edge-set `x-real-ip` |
| F10 | Low | Dev-only advisories (eslint-config-next → micromatch/braces; vitest mocker). Not shipped to visitors; the only fix is a breaking downgrade. | `npm audit` | **Accepted**, tracked by CI and Dependabot |
| F11 | Info | `access-control-allow-origin: *` on static pages (Vercel default). No cookies or credentials exist, so the impact is negligible. | `curl -I /` | Accepted |

**Checked and clean:**
- Secret patterns (Google, Anthropic, Groq, GitHub, AWS, Resend keys, private keys) across all commits: none.
- No `.env` files ever committed.
- No source maps served (`*.js.map` → 403).
- `/.env`, `/.git/*`, `/package.json`, `/.next/*`, `/Dockerfile`, `/admin` → 404.
- The AWS account ID and IPs from the project PDFs are not in the repo or its history.
- `credentials.webp` shows credential names only.
- The app sets no cookies.
- The only `NEXT_PUBLIC_` variable is a model URL.
- `GEMINI_API_KEY` is stored as Sensitive.

## 4. Firewall and bot protection

The rules, rollout modes and rollback are in [`FIREWALL.md`](FIREWALL.md).
Before this work there was **no custom firewall config** (backed up as "none"),
and **nothing has been applied yet**: firewall changes affect production
traffic, so they wait for owner approval.

I chose the Vercel Firewall (edge, before the cache) over a Next.js
`proxy.ts`. A proxy would turn every static page view into a function call,
adding latency for recruiters and duplicating what the firewall does.

## 5. Authentication and access control

- The portfolio has no admin interface, and none was added. The owner's
  control plane is GitHub and Vercel, so 2FA on both accounts is the critical
  control. I can't read either account's 2FA status (the APIs don't expose
  it to this session).
- The only privileged endpoint is `POST /api/security/test-alert`. It uses a
  ≥32-character bearer token, compared in constant time; it returns 404 when
  unconfigured; failures are logged, and 5 failures in 10 min trigger an
  emailed alert.
- `POST /api/security/vercel-webhook` verifies HMAC-SHA1 signatures and
  rejects (and logs) everything else.
- Verified by unit tests and e2e (`tests/unit/security.test.ts`,
  `tests/e2e/security.spec.ts`).

## 6. Alerts

| Event | Severity | Emailed |
| --- | --- | --- |
| Production deploy by a non-owner (webhook) | Critical | Yes, and bypasses the rate cap |
| Env var, domain or project change by a non-owner (webhook) | High | Yes |
| Firewall or attack webhook events | High | Yes |
| 5+ invalid owner tokens from one client in 10 min | High | Yes |
| 30+ scripted or cross-site RC-01 calls, or 20+ rate-limited calls, from one client in 10 min | High | Yes |
| Single invalid token, owner config changes | Medium | Logged |
| CSP reports, single rejects | Low | Logged |

Every email has an incident ID, a UTC timestamp, severity, category, route,
detection reason, action taken, next step, a hashed client reference and a
dashboard link. It never includes tokens, bodies or raw IPs (tested).

**Delivery:** not yet verified. It needs a Resend account and API key (section 9).
I won't claim an email was delivered until the test alert reaches
tarunpradeep2003@gmail.com.

**Not implemented:** a daily low-severity digest. It needs a persistent
store, such as Upstash Redis or Vercel KV; per-instance memory would give
wrong totals. For now, low-severity events are searchable in Vercel logs
(`"event":"security"`).

## 7. CI/CD and repository

The new `.github/workflows/security.yml` runs on every push and PR, and weekly:
- gitleaks over the full history;
- `npm audit` (production gated at high, all deps gated at critical);
- CodeQL `security-extended`;
- typecheck, security unit tests, and the e2e security suite with CSP enforced.

Actions are pinned to commit SHAs, and Dependabot (already configured)
updates them.

## 8. Regression results (local production build, commit `b438d1e`)

- Unit: **175/175** pass (19 new security tests).
- Typecheck and lint: clean.
- Full e2e with **CSP enforced**: **120/121** pass. The one failure is
  `rc01-chat.spec.ts` "streams a grounded answer". It mocks the API in the
  browser, never reaches the changed server code, and was already flaky
  before this work (1 failure in 14 repeated runs).
- CSP sweep: **0 violations** on every route, including the 3D stage and
  RC-01's 3D companion.
- Performance: no client-side JavaScript added. All new code runs server-side
  or as response headers, and static pages stay statically cached.
- Accessibility: unchanged (the accessibility e2e suite passes).

**Preview deployment:** `tarun-portfolio-pl84qxcxi-tarun-2f6a.vercel.app` is
protected by Vercel Authentication. The bypass link was rejected, so I
could not test it externally; it is reachable when you're signed in to Vercel.

## 9. Owner actions and residual risks

Needs your approval or access:
1. **Approve the production deploy** of `b438d1e`.
2. **Approve the firewall rules** in `FIREWALL.md`. I can apply them through
   the Vercel API; paid features (OWASP ruleset, extra rate-limit rules) are
   checked against your plan first.
3. **Email alerts:** create a free Resend account with
   tarunpradeep2003@gmail.com and add `RESEND_API_KEY` (Sensitive) in Vercel.
   Add `SECURITY_ADMIN_TOKEN` (`openssl rand -hex 32`) and
   `OWNER_VERCEL_USER_IDS=TX3f3MvcOe2lB7CNTq1Xb4vW`. Then I'll send a test alert.
4. **Rotate `GEMINI_API_KEY`** (F6).
5. **Turn on 2FA** for GitHub and Vercel (passkeys if available).
6. **Repository:**
   - make `living-infrastructure-v6` (or `main`) the production branch;
   - add a ruleset requiring PRs and passing `Security` checks;
   - turn on secret scanning with push protection (free for public repos).
   - Keeping it public keeps CodeQL and secret scanning free. Making it
     private removes the public code, but those features then need GitHub
     Advanced Security.

Residual limits:
- Public content can always be copied.
- robots.txt is voluntary, and user agents can be spoofed.
- Origin headers can be forged by non-browser clients.
- In-app limits and dedup are per instance.
- CSP keeps `'unsafe-inline'` for scripts: static prerendering inlines
  hydration data, and nonces would force dynamic rendering of every page.
