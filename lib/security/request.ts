/**
 * Shared request guards for the site's API routes. Every API here is a
 * feature of the site's own pages, so the defaults are strict: same-origin
 * browser requests only, bounded bodies, and a client key that cannot be
 * spoofed on Vercel.
 */

/**
 * Client address for rate-limit keys and (hashed) alerting. On Vercel,
 * x-real-ip / x-vercel-forwarded-for are set by the edge and overwrite
 * anything the client sent; x-forwarded-for is the fallback for other hosts.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * True only for requests the site's own pages make. Modern browsers send
 * Sec-Fetch-Site on every fetch and Origin on every POST, so a request
 * with neither is a script, not a visitor. Both headers can be forged by
 * a non-browser client - this stops cross-site use and casual scripting;
 * volume abuse is the firewall rate limit's job.
 */
export function isSameOriginRequest(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    return new URL(origin).host === headers.get("host");
  } catch {
    return false;
  }
}

export type BodyResult<T> = { ok: true; value: T } | { ok: false; status: 400 | 413 | 415; error: string };

/**
 * Reads a JSON body without ever buffering more than maxBytes, whatever
 * Content-Length claims.
 */
export async function readJsonBody<T = unknown>(request: Request, maxBytes: number): Promise<BodyResult<T>> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/(json|csp-report|reports\+json)\b/i.test(type)) {
    return { ok: false, status: 415, error: "Expected a JSON body." };
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, status: 413, error: "Request body too large." };
  if (!request.body) return { ok: false, status: 400, error: "Missing body." };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return { ok: false, status: 413, error: "Request body too large." };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as T };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON." };
  }
}

/** Constant-time string comparison for bearer tokens and signatures. */
export function safeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}
