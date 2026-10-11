# Security policy

## Reporting a vulnerability

Email **tarunpradeep2003@gmail.com** with "Security" in the subject. Please
include the affected URL, steps to reproduce and the impact you observed.
Do not run destructive tests, denial-of-service tests or automated scanners
against the production site. You'll get a reply within 7 days.

Machine-readable contact: [`/.well-known/security.txt`](public/.well-known/security.txt).

## What this site is

A public, statically rendered portfolio on Vercel. There is no visitor
login, no admin UI, no database and no file upload. Administrative control
lives entirely in the owner's **GitHub** and **Vercel** accounts. Those two
accounts are the real security boundary, and both must have 2FA on.

## Controls in this repository

| Control | Where |
| --- | --- |
| Security headers + Content-Security-Policy | `next.config.ts`, `lib/security/csp.ts` |
| API guards (same-origin, body caps, rate limits, validation) | `lib/security/request.ts`, `app/api/*` |
| Security event logging + email alerts | `lib/security/events.ts`, `lib/security/alerts.ts` |
| Owner test-alert endpoint (token-protected) | `app/api/security/test-alert` |
| Vercel webhook receiver (HMAC-verified) | `app/api/security/vercel-webhook` |
| CSP violation collector | `app/api/security/csp-report` |
| AI-training crawler opt-out | `app/robots.ts`, `lib/security/crawlers.ts` |
| CI: secret scan, dependency audit, CodeQL, security tests | `.github/workflows/security.yml` |

Edge firewall rules (Vercel Firewall) are documented in
[`docs/security/FIREWALL.md`](docs/security/FIREWALL.md), and incident handling in
[`docs/security/INCIDENT_RESPONSE.md`](docs/security/INCIDENT_RESPONSE.md).

## Server-side configuration (Vercel environment variables)

All of these are optional. Each feature stays disabled until its variable is
set. Mark every one **Sensitive** and never prefix it with `NEXT_PUBLIC_`.

| Variable | Enables |
| --- | --- |
| `RESEND_API_KEY` | Email delivery of high/critical alerts |
| `SECURITY_ALERT_EMAIL` | Alert recipient (default `tarunpradeep2003@gmail.com`) |
| `SECURITY_ALERT_FROM` | Verified sender (default: Resend's onboarding sender) |
| `SECURITY_ADMIN_TOKEN` | `POST /api/security/test-alert` (≥ 32 random characters) |
| `VERCEL_WEBHOOK_SECRET` | `POST /api/security/vercel-webhook` |
| `OWNER_VERCEL_USER_IDS` | Comma-separated Vercel user IDs allowed to deploy production |
| `SECURITY_HASH_SALT` | Salt for hashed client references in logs/alerts |
| `CSP_ENFORCE` | `true` switches the CSP from Report-Only to enforced (redeploy) |

## Honest limits

- Anything a browser can display (HTML, JavaScript, images, text) can be
  copied. Minification is not encryption.
- `robots.txt` is a request, not access control. User agents can be spoofed.
  The firewall's verified-bot rules are stronger but still not absolute.
- In-app rate limits and duplicate suppression are per serverless instance.
  Global limits are enforced by the Vercel Firewall.
