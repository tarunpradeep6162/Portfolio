/**
 * Security alert email pipeline (Resend's HTTP API - no SDK dependency).
 *
 * Guarantees, honestly scoped:
 * - Never throws into the request that raised the alert.
 * - Retries 429/5xx and network errors with backoff (3 attempts).
 * - Duplicate suppression: the same fingerprint is emailed at most once per
 *   window per warm instance, and Resend's Idempotency-Key collapses the
 *   same fingerprint+window across instances.
 * - Rate cap per instance (critical alerts bypass it - that is the
 *   escalation path).
 * - Never includes credentials, tokens, cookies or request bodies; client
 *   addresses appear only as a short salted hash.
 *
 * Configuration (Vercel environment, server-only):
 *   RESEND_API_KEY          required to send; without it alerts are logged only
 *   SECURITY_ALERT_EMAIL    recipient (default below)
 *   SECURITY_ALERT_FROM     verified sender (default: Resend's onboarding sender,
 *                           which can only deliver to the Resend account's own email)
 *   SECURITY_DASHBOARD_URL  link included in every alert
 */
export type Severity = "low" | "medium" | "high" | "critical";

export interface SecurityAlert {
  id: string;
  severity: Severity;
  category: string;
  route: string;
  reason: string;
  action: string;
  nextStep: string;
  /** Short salted hash of the client address, never the raw value. */
  clientRef?: string;
  occurredAt: Date;
}

export type DeliveryResult =
  | { status: "sent"; providerId: string; attempts: number }
  | { status: "suppressed"; reason: "duplicate" | "rate_limited" }
  | { status: "skipped"; reason: "not_configured" }
  | { status: "failed"; error: string; attempts: number };

const DEFAULT_RECIPIENT = "tarunpradeep2003@gmail.com";
const DEFAULT_SENDER = "Portfolio Security <onboarding@resend.dev>";
const DEFAULT_DASHBOARD = "https://vercel.com/tarun-2f6a/tarun-portfolio/logs";
const DEDUP_WINDOW_MS = 15 * 60 * 1000;
const MAX_ALERTS_PER_HOUR = 10;

const lastSent = new Map<string, number>();
let hourWindowStart = 0;
let sentThisHour = 0;

export function fingerprint(alert: Pick<SecurityAlert, "category" | "route" | "reason">): string {
  return `${alert.category}|${alert.route}|${alert.reason}`;
}

export function newIncidentId(now = Date.now()): string {
  const random = crypto.getRandomValues(new Uint8Array(4));
  return `SEC-${now.toString(36).toUpperCase()}-${Array.from(random, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderAlert(alert: SecurityAlert, dashboardUrl: string) {
  const when = `${alert.occurredAt.toISOString().replace("T", " ").replace(/\.\d+Z$/, "")} UTC`;
  const rows: [string, string][] = [
    ["Incident", alert.id],
    ["Time", when],
    ["Severity", alert.severity.toUpperCase()],
    ["Category", alert.category],
    ["Route / service", alert.route],
    ["Detection", alert.reason],
    ["Action taken", alert.action],
    ["Recommended next step", alert.nextStep],
    ...(alert.clientRef ? ([["Client reference (hashed)", alert.clientRef]] as [string, string][]) : []),
    ["Dashboard", dashboardUrl],
  ];
  const subject = `[${alert.severity.toUpperCase()}] Portfolio security: ${alert.category} (${alert.id})`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table style="font:14px/1.5 system-ui,sans-serif;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:4px 12px 4px 0;vertical-align:top">${escapeHtml(k)}</th><td style="padding:4px 0">${
          k === "Dashboard" ? `<a href="${escapeHtml(v)}">${escapeHtml(v)}</a>` : escapeHtml(v)
        }</td></tr>`,
    )
    .join("")}</table>`;
  return { subject, text, html };
}

type Fetch = typeof fetch;

export async function deliverAlert(
  alert: SecurityAlert,
  {
    env = process.env,
    fetchImpl = fetch,
    now = Date.now(),
    sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)),
  }: { env?: NodeJS.ProcessEnv; fetchImpl?: Fetch; now?: number; sleep?: (ms: number) => Promise<unknown> } = {},
): Promise<DeliveryResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { status: "skipped", reason: "not_configured" };

  const key = fingerprint(alert);
  const previous = lastSent.get(key);
  if (previous !== undefined && now - previous < DEDUP_WINDOW_MS) return { status: "suppressed", reason: "duplicate" };

  if (now - hourWindowStart > 60 * 60 * 1000) {
    hourWindowStart = now;
    sentThisHour = 0;
  }
  if (alert.severity !== "critical" && sentThisHour >= MAX_ALERTS_PER_HOUR) {
    return { status: "suppressed", reason: "rate_limited" };
  }

  const dashboard = env.SECURITY_DASHBOARD_URL || DEFAULT_DASHBOARD;
  const { subject, text, html } = renderAlert(alert, dashboard);
  const idempotencyKey = `${key}|${Math.floor(now / DEDUP_WINDOW_MS)}`;
  const body = JSON.stringify({
    from: env.SECURITY_ALERT_FROM || DEFAULT_SENDER,
    to: [env.SECURITY_ALERT_EMAIL || DEFAULT_RECIPIENT],
    subject,
    text,
    html,
    tags: [
      { name: "severity", value: alert.severity },
      { name: "category", value: alert.category.replace(/[^\w-]/g, "_").slice(0, 64) },
    ],
  });

  let lastError = "unknown";
  let attempts = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    attempts = attempt;
    try {
      const res = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.slice(0, 256),
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        lastSent.set(key, now);
        sentThisHour++;
        return { status: "sent", providerId: data.id ?? "unknown", attempts: attempt };
      }
      lastError = `HTTP ${res.status}`;
      if (res.status !== 429 && res.status < 500) break; // bad request/auth: retrying won't help
    } catch (error) {
      lastError = error instanceof Error ? error.name : "network_error";
    }
    if (attempt < 3) await sleep(500 * 2 ** (attempt - 1));
  }
  return { status: "failed", error: lastError, attempts };
}

/** Test seam: clears per-instance dedup/rate state. */
export function resetAlertState() {
  lastSent.clear();
  hourWindowStart = 0;
  sentThisHour = 0;
}
