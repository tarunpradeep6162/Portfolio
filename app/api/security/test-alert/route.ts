import { NextRequest } from "next/server";
import { recordSecurityEvent } from "@/lib/security/events";
import { clientIp, safeEqual } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Owner-only: sends a test alert through the real pipeline so delivery to
 * the security inbox can be verified end to end.
 *
 *   curl -X POST https://<site>/api/security/test-alert \
 *     -H "Authorization: Bearer $SECURITY_ADMIN_TOKEN"
 *
 * Disabled (404) unless SECURITY_ADMIN_TOKEN is configured. Wrong tokens
 * are logged; five from one client in ten minutes raise a high alert.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.SECURITY_ADMIN_TOKEN;
  if (!expected || expected.length < 32) return new Response(null, { status: 404 });

  const ip = clientIp(request.headers);
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!safeEqual(supplied, expected)) {
    await recordSecurityEvent({
      category: "owner_auth_failed",
      severity: "medium",
      route: "/api/security/test-alert",
      reason: "Invalid owner token presented",
      action: "Request rejected (401)",
      ip,
      escalate: {
        count: 5,
        windowMs: 10 * 60 * 1000,
        to: "high",
        nextStep: "If this was not you, rotate SECURITY_ADMIN_TOKEN in Vercel and redeploy.",
      },
    });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await recordSecurityEvent({
    category: "test_alert",
    severity: "high",
    route: "/api/security/test-alert",
    reason: `Owner-triggered test alert at ${new Date().toISOString()}`,
    action: "None - this is a test",
    nextStep: "No action needed. If you received this, alert delivery works.",
    ip,
  });
  return Response.json({ incident: result.id, delivery: result.delivery });
}

export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
