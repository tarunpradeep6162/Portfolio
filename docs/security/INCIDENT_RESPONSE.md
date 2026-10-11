# Incident response runbook

Keep a copy of this file **outside** the site (download it, or star the repo
on GitHub), so it stays reachable when the site is down.

Key links:
- Vercel project: https://vercel.com/tarun-2f6a/tarun-portfolio
- Deployments: https://vercel.com/tarun-2f6a/tarun-portfolio/deployments
- Firewall: https://vercel.com/tarun-2f6a/tarun-portfolio/firewall
- Logs (filter `"event":"security"`): https://vercel.com/tarun-2f6a/tarun-portfolio/logs
- GitHub repo: https://github.com/tarunpradeep6162/Portfolio
- Vercel security sessions: https://vercel.com/account/settings/authentication
- GitHub sessions/tokens: https://github.com/settings/sessions and https://github.com/settings/tokens

## 1. Detect and classify

| Severity | Examples | Respond within |
| --- | --- | --- |
| Critical | Production deploy by a non-owner, defacement, leaked secret in use | Immediately |
| High | Repeated owner-token failures, config change you didn't make, firewall attack alert | Same day |
| Medium | Single failed owner token, owner config change (confirm it was you) | 48 h |
| Low | CSP reports, cross-origin API rejects, rate-limit hits | Weekly review |

Alerts arrive by email with an incident ID (`SEC-…`). Search that ID in the
Vercel logs to see the full event.

## 2. Contain (do these first for Critical)

1. **Roll back production**: Vercel → Deployments → pick the last known-good
   deployment → "Promote to Production". (CLI: `vercel rollback <deployment-url>`.)
2. **Under active attack**: Firewall → enable **Attack Challenge Mode**. Every
   visitor gets a browser challenge, and verified search bots pass.
3. **Suspected account compromise**:
   - Vercel: Account → Authentication → sign out all sessions. Then Team →
     Members (remove unknown members) and Tokens (delete all you don't recognise).
   - GitHub: Settings → Sessions (revoke), Tokens / SSH keys / Applications
     (revoke unknown entries), repo → Settings → Collaborators and Deploy keys.
4. **Leaked secret**: rotate it at its provider *first*, then update it in
   Vercel → Settings → Environment Variables, then redeploy.
   - `GEMINI_API_KEY` → https://aistudio.google.com/apikey
   - `RESEND_API_KEY` → https://resend.com/api-keys
   - `SECURITY_ADMIN_TOKEN` → generate a new one: `openssl rand -hex 32`
   - `VERCEL_WEBHOOK_SECRET` → delete and recreate the webhook in Vercel

## 3. Preserve evidence

Before you change anything else, export what you will need later:
- Vercel logs for the incident window (Logs → filter → export), firewall
  traffic view screenshots, and the deployment's source commit SHA.
- GitHub: the audit log (`https://github.com/settings/security-log`).
Save them outside Vercel and GitHub.

## 4. Recover and verify

1. Redeploy from a reviewed commit on the production branch.
2. Check that the site loads, then `curl -I https://portfolio-tarun-dun.vercel.app`
   shows the security headers, and the resume PDF downloads.
3. Send a test alert to prove monitoring works:
   `curl -X POST https://portfolio-tarun-dun.vercel.app/api/security/test-alert -H "Authorization: Bearer $SECURITY_ADMIN_TOKEN"`
4. Turn off Attack Challenge Mode once traffic is normal.

## 5. Review

Within a week, write down the timeline, root cause, what detected it and how
fast, and one change that prevents a repeat. Then update this runbook.
