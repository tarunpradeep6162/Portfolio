import { NextRequest } from "next/server";
import { isSameOriginRequest, readJsonBody } from "@/lib/security/request";

/**
 * Receives the client's interaction events (lib/analytics/events.ts).
 *
 * There is no analytics store behind this yet, so events are validated and
 * acknowledged, not kept: the previous in-memory log held arbitrary,
 * unbounded payloads from any origin. Same-origin browser requests only,
 * small bodies, strictly shaped names.
 */
const NAME = /^[\w.:-]{1,64}$/;

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request.headers)) {
    return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }
  const body = await readJsonBody<{ name?: unknown; category?: unknown }>(request, 2048);
  if (!body.ok) return Response.json({ error: body.error }, { status: body.status });

  const { name, category } = body.value ?? {};
  if (typeof name !== "string" || typeof category !== "string" || !NAME.test(name) || !NAME.test(category)) {
    return Response.json({ error: "Invalid event." }, { status: 400 });
  }
  if (process.env.NODE_ENV === "development") console.log("[Analytics API]", category, name);
  return new Response(null, { status: 204 });
}
