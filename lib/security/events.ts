import { deliverAlert, newIncidentId, type DeliveryResult, type Severity } from "./alerts";

/**
 * One entry point for everything security-relevant the app itself can
 * observe. Every event becomes a structured log line (searchable in Vercel
 * logs as `"event":"security"`); high and critical events are also emailed.
 *
 * Correlation: an event may declare `escalate` - when the same category
 * from the same client repeats `count` times inside `windowMs`, the event
 * is raised to that severity (e.g. one failed owner-token attempt is
 * medium, five in ten minutes is high). Counters are per warm instance.
 */
export interface SecurityEventInput {
  category: string;
  severity: Severity;
  route: string;
  reason: string;
  action: string;
  nextStep?: string;
  ip?: string;
  escalate?: { count: number; windowMs: number; to: Severity; nextStep?: string };
}

const recent = new Map<string, number[]>();
const MAX_KEYS = 2000;

const SEVERITY_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 };

/** Short, salted, non-reversible client reference for logs and emails. */
export async function hashClient(ip: string, salt = process.env.SECURITY_HASH_SALT ?? "portfolio-security"): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
}

function countRecent(key: string, windowMs: number, now: number): number {
  const hits = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  recent.delete(key);
  recent.set(key, hits);
  if (recent.size > MAX_KEYS) {
    const oldest = recent.keys().next().value;
    if (oldest !== undefined) recent.delete(oldest);
  }
  return hits.length;
}

export async function recordSecurityEvent(
  input: SecurityEventInput,
  deps: Parameters<typeof deliverAlert>[1] & { log?: (line: string) => void } = {},
): Promise<{ id: string; severity: Severity; delivery: DeliveryResult | null }> {
  const now = deps.now ?? Date.now();
  const log = deps.log ?? ((line: string) => console.warn(line));
  const clientRef = input.ip ? await hashClient(input.ip) : undefined;

  let severity = input.severity;
  let nextStep = input.nextStep ?? "Review the Vercel logs for related requests.";
  let occurrences = 1;
  if (input.escalate) {
    occurrences = countRecent(`${input.category}|${clientRef ?? "?"}`, input.escalate.windowMs, now);
    if (occurrences >= input.escalate.count && SEVERITY_RANK[input.escalate.to] > SEVERITY_RANK[severity]) {
      severity = input.escalate.to;
      nextStep = input.escalate.nextStep ?? nextStep;
    }
  }

  const id = newIncidentId(now);
  log(
    JSON.stringify({
      event: "security",
      id,
      severity,
      category: input.category,
      route: input.route,
      reason: input.reason,
      action: input.action,
      client: clientRef,
      occurrences,
      at: new Date(now).toISOString(),
    }),
  );

  if (SEVERITY_RANK[severity] < SEVERITY_RANK.high) return { id, severity, delivery: null };

  const delivery = await deliverAlert(
    {
      id,
      severity,
      category: input.category,
      route: input.route,
      reason: occurrences > 1 ? `${input.reason} (${occurrences}x in window)` : input.reason,
      action: input.action,
      nextStep,
      clientRef,
      occurredAt: new Date(now),
    },
    deps,
  );
  log(JSON.stringify({ event: "security.alert_delivery", id, ...delivery }));
  return { id, severity, delivery };
}

/** Test seam. */
export function resetEventState() {
  recent.clear();
}
