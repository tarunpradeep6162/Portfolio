import { NextRequest } from "next/server";
import { inBackground } from "@/lib/security/background";
import { recordSecurityEvent } from "@/lib/security/events";
import { classify, verifySignature, type WebhookEvent } from "@/lib/security/vercelWebhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Receives Vercel account webhooks (deployments, project/env/domain
 * changes, firewall events where the plan emits them) and turns the
 * security-relevant ones into alerts.
 *
 * Authenticity: x-vercel-signature must equal HMAC-SHA1(raw body,
 * VERCEL_WEBHOOK_SECRET). Unsigned or mis-signed requests are rejected and
 * logged; repeated ones escalate. Disabled (404) until the secret is set.
 *
 * OWNER_VERCEL_USER_IDS (comma-separated) marks who may deploy production;
 * a production deployment by anyone else is critical.
 */
const MAX_BYTES = 256 * 1024;

export async function POST(request: NextRequest) {
  const secret = process.env.VERCEL_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 404 });

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) return new Response(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return new Response(null, { status: 413 });

  if (!verifySignature(raw, request.headers.get("x-vercel-signature"), secret)) {
    inBackground(() =>
      recordSecurityEvent({
        category: "webhook_signature_invalid",
        severity: "medium",
        route: "/api/security/vercel-webhook",
        reason: "Webhook request with a missing or invalid signature",
        action: "Rejected (401)",
        ip: request.headers.get("x-real-ip") ?? undefined,
        escalate: { count: 10, windowMs: 10 * 60 * 1000, to: "high" },
      }),
    );
    return new Response(null, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return new Response(null, { status: 400 });
  }

  const owners = (process.env.OWNER_VERCEL_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const verdict = classify(event, owners);
  if (verdict) {
    inBackground(() =>
      recordSecurityEvent({
        category: `vercel_${(event.type ?? "unknown").replace(/[^\w.-]/g, "_")}`,
        severity: verdict.severity,
        route: "vercel:project",
        reason: verdict.reason,
        action: "Logged" + (verdict.severity === "high" || verdict.severity === "critical" ? " and emailed" : ""),
        nextStep: verdict.nextStep,
      }),
    );
  }
  return Response.json({ received: true });
}
