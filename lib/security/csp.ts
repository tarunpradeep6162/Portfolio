/**
 * Content-Security-Policy for the portfolio, built from what the app
 * actually loads (audited October 2026):
 *
 * - Scripts: only this origin. 'unsafe-inline' stays because every page is
 *   statically prerendered and Next.js inlines its hydration payload
 *   (self.__next_f.push) plus the boot-gate script into the HTML; per-request
 *   nonces would force every page to render dynamically and lose the CDN
 *   cache. No 'unsafe-eval': nothing in the production bundle needs it.
 * - Styles: 'unsafe-inline' for the style="" attributes React server-renders
 *   (positions, CSS variables). Style injection cannot run script.
 * - Images/media: this origin plus blob:/data:, which the GLTF loader uses
 *   for textures embedded in the 3D models.
 * - Connections: this origin (RC-01, CSP reports) and the public GitHub API
 *   (activity pulse + stats card). data:/blob: for embedded GLTF buffers.
 * - No framing anywhere (frame-ancestors 'none'), no plugins, no <base>
 *   hijacking, forms may only post to this origin.
 *
 * upgrade-insecure-requests is only sent when the policy is enforced:
 * browsers ignore it in Report-Only mode and log an error saying so.
 *
 * Preview deployments additionally allow vercel.live so Vercel's preview
 * toolbar keeps working; production does not.
 */
export const CSP_REPORT_PATH = "/api/security/csp-report";

export function buildCsp({ preview = false, enforce = false }: { preview?: boolean; enforce?: boolean } = {}): string {
  const vercelLive = preview ? ["https://vercel.live"] : [];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...vercelLive],
    "style-src": ["'self'", "'unsafe-inline'", ...vercelLive],
    "img-src": ["'self'", "data:", "blob:", ...vercelLive, ...(preview ? ["https://vercel.com"] : [])],
    "font-src": ["'self'", "data:", ...vercelLive],
    "media-src": ["'self'", "blob:", "data:"],
    "connect-src": [
      "'self'",
      "https://api.github.com",
      "data:",
      "blob:",
      ...(preview ? ["https://vercel.live", "wss://ws-us3.pusher.com"] : []),
    ],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "frame-src": preview ? ["https://vercel.live"] : ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    // Browsers reject this directive (with a console error) in Report-Only.
    ...(enforce ? { "upgrade-insecure-requests": [] } : {}),
    "report-uri": [CSP_REPORT_PATH],
    "report-to": ["csp-endpoint"],
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(" "))
    .join("; ");
}
