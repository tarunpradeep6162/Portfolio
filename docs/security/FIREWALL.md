# Vercel Firewall configuration

Project `tarun-portfolio` (`prj_rmv8uMy0bNlFvoKX4KUN0jCNi70S`), team `tarun-2f6a`.

**Baseline (backed up 2026-10-11):** there is no custom firewall config.
`GET /v1/security/firewall/config/active` returns 404 "config not found".
Only Vercel's always-on platform DDoS mitigation is active. Rolling back
therefore means deleting the rules below, or switching each one to `log`.

## Status (2026-10-11)

- **Published by the owner in the Vercel dashboard** (the REST API returned
  "config not found" for read, create and update, so it could not be applied
  or read back by API).
- **RC-01 rate limit confirmed by the owner:** 25 POSTs from one IP returned
  403 (app) for the first 20, then 429 (firewall). From the verification
  sandbox it could not be tripped, because its traffic exits through
  rotating IPs (95 requests over 17 IPs).
- The site served visitors normally (HTTP 200) throughout testing.

## Rules

Monitoring first: every rule that could catch real visitors starts in `log`
mode and is promoted only after its log shows no false positives.

| # | Rule | Match | Action at rollout | Promote to | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | Managed: **AI Bots** | Vercel-verified AI crawlers | `deny` | - | Verified identities only, so the false-positive risk is minimal. Matches `robots.txt`. |
| 2 | Managed: **Bot Protection** | Unverified automation that pretends to be a browser | `log` | `challenge` after 7 days of clean logs | A challenge can catch unusual but legitimate clients. |
| 3 | Custom: **RC-01 rate limit** | `path = /api/rc01` and `method = POST` | `rate_limit` 20 req / 60 s per IP → deny | - | Global cap for the only endpoint that calls a model API (the app-level limits are per instance). |
| 4 | Custom: **API rate limit** | `path` starts with `/api/` | `rate_limit` 120 req / 60 s per IP → deny | - | Bounds abuse of every API route. A page view makes 1–3 API calls. |
| 5 | Custom: **Scanner probes** | `path` regex `^/(\.env|\.git|\.aws|\.ssh|wp-|wordpress|phpmyadmin|xmlrpc\.php|server-status)|\.(php|sql|bak|old|swp)$` | `log` | `deny` after 48 h | The site has none of these paths, so this traffic is reconnaissance. |

Search engines and link-preview bots (Googlebot, Bingbot, LinkedInBot,
facebookexternalhit, Slackbot and others) are verified bots that Bot
Protection does not challenge, and none of the rules above target them.
No country, ASN or VPN blocks are configured.

## Applying (CLI equivalent)

```bash
vercel firewall rules edit ai-bots --action deny --yes
vercel firewall rules edit bot-protection --action log --yes
vercel firewall rules add "RC-01 rate limit" \
  --condition '{"type":"path","op":"eq","value":"/api/rc01"}' \
  --condition '{"type":"method","op":"eq","value":"POST"}' \
  --action rate_limit --rate-limit-window 60 --rate-limit-requests 20 \
  --rate-limit-keys ip --rate-limit-action deny --yes
```

## Rollback

- One rule: Firewall → Rules → toggle it off (or `vercel firewall rules edit "<name>" --disabled --yes`).
- Everything: delete the custom rules and set AI Bots and Bot Protection back to `allow`/`off`.
- Emergency (rules blocking real visitors): Firewall → **Bypass**, or temporarily disable the firewall config.
  Platform DDoS protection stays on regardless.
