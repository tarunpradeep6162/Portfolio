import { createHmac } from "node:crypto";
import type { Severity } from "./alerts";
import { safeEqual } from "./request";

/** Vercel signs webhook bodies with HMAC-SHA1 (hex) using the webhook secret. */
export function verifySignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha1", secret).update(raw).digest("hex");
  return safeEqual(signature, expected);
}

export interface WebhookEvent {
  type?: string;
  payload?: {
    target?: string | null;
    user?: { id?: string };
    deployment?: { url?: string; meta?: Record<string, string> };
    project?: { id?: string };
  };
}

export function classify(
  event: WebhookEvent,
  owners: string[],
): { severity: Severity; reason: string; nextStep: string } | null {
  const type = event.type ?? "unknown";
  const actor = event.payload?.user?.id;
  const isOwner = actor ? owners.includes(actor) : false;

  if (type.startsWith("deployment.") && event.payload?.target === "production") {
    if (type !== "deployment.created") return null;
    if (owners.length > 0 && !isOwner) {
      return {
        severity: "critical",
        reason: `Production deployment created by a non-owner account (${actor ?? "unknown"})`,
        nextStep: "Check the deployment in Vercel; if unexpected, roll back (docs/security/INCIDENT_RESPONSE.md) and review team members and tokens.",
      };
    }
    return { severity: "low", reason: "Production deployment created by the owner", nextStep: "None." };
  }
  if (/^project\.(env-variable|domain)|^domain\.|^project\.(created|removed)|integration-configuration/.test(type)) {
    return {
      severity: isOwner ? "medium" : "high",
      reason: `Security-sensitive configuration change: ${type}${isOwner ? " (by owner)" : ""}`,
      nextStep: isOwner ? "Confirm you made this change." : "Confirm this change was yours; if not, revoke tokens and review team access.",
    };
  }
  if (/firewall|attack|ddos/i.test(type)) {
    return {
      severity: "high",
      reason: `Vercel firewall event: ${type}`,
      nextStep: "Open the Firewall tab, review the traffic, and consider Attack Challenge Mode.",
    };
  }
  return null;
}
