import { NextRequest } from "next/server";
import { createRateLimiter } from "@/lib/rc01/rateLimit";
import { inBackground } from "@/lib/security/background";
import { recordSecurityEvent } from "@/lib/security/events";
import { clientIp, readJsonBody } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Collects Content-Security-Policy violation reports (both the legacy
 * report-uri format and the Reporting API format) as low-severity security
 * events. These drive the Report-Only -> enforce decision; they are never
 * emailed individually. URLs are reduced to origin + path so query strings
 * (which can carry personal data) never reach the logs.
 */
const limiter = createRateLimiter({ limit: 120, windowMs: 60 * 1000 });

function stripUrl(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) return value.slice(0, 40); // "inline", "eval", ...
  try {
    const url = new URL(value);
    return url.protocol.startsWith("http") ? `${url.origin}${url.pathname}`.slice(0, 200) : url.protocol;
  } catch {
    return "invalid";
  }
}

interface Violation {
  directive: string;
  blocked: string;
  page: string;
}

function extract(body: unknown): Violation[] {
  const reports = Array.isArray(body) ? body : [body];
  return reports.slice(0, 10).flatMap((report) => {
    const r = report as Record<string, Record<string, unknown> | undefined>;
    const legacy = r?.["csp-report"];
    const modern = r?.type === ("csp-violation" as unknown) ? r.body : undefined;
    const source = legacy ?? modern;
    if (!source) return [];
    return [
      {
        directive: String(source["effective-directive"] ?? source.effectiveDirective ?? source["violated-directive"] ?? "").slice(0, 40),
        blocked: stripUrl(source["blocked-uri"] ?? source.blockedURL),
        page: stripUrl(source["document-uri"] ?? source.documentURL),
      },
    ];
  });
}

export async function POST(request: NextRequest) {
  if (!limiter.check("csp").allowed) return new Response(null, { status: 429 });
  const body = await readJsonBody(request, 16 * 1024);
  if (!body.ok) return new Response(null, { status: body.status });

  const ip = clientIp(request.headers);
  const violations = extract(body.value);
  inBackground(async () => {
    for (const v of violations) {
      await recordSecurityEvent({
        category: "csp_violation",
        severity: "low",
        route: v.page || "unknown",
        reason: `${v.directive} blocked ${v.blocked || "unknown"}`,
        action: process.env.CSP_ENFORCE === "true" ? "Blocked by CSP" : "Reported only (CSP in Report-Only mode)",
        ip,
      });
    }
  });
  return new Response(null, { status: 204 });
}
