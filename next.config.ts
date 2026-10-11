import type { NextConfig } from "next";
import { buildCsp, CSP_REPORT_PATH } from "./lib/security/csp";

/**
 * CSP rollout: Report-Only until CSP_ENFORCE=true is set in the Vercel
 * environment (then redeploy). Violations are logged either way via
 * /api/security/csp-report, so the enforce switch is evidence-based.
 */
const cspEnforced = process.env.CSP_ENFORCE === "true";
const cspHeader = cspEnforced ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
const isPreview = process.env.VERCEL_ENV === "preview";

const securityHeaders = [
  // Stops the browser guessing a response's MIME type from its content.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Sends the full referrer to same-origin requests, only the origin
  // (no path/query) cross-origin - a reasonable default, not maximal
  // privacy-at-all-costs which would break some legitimate use cases.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // RC-01's voice input (Web Speech) needs the microphone on this origin
  // only; everything else is denied outright, including for any embed.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // No legitimate reason for this portfolio to be framed by another site.
  { key: "X-Frame-Options", value: "DENY" },
  // Only takes effect over HTTPS (browsers ignore it on plain HTTP, which
  // is what this preview environment serves) - correct to ship now so it
  // is active the moment the site is deployed behind TLS, per the plan's
  // "appropriate HTTPS transport behavior" requirement. Not submitted to
  // any HSTS preload list, so "preload" is deliberately omitted rather
  // than claimed.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Isolates the browsing context from cross-origin windows it opens.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: cspHeader, value: buildCsp({ preview: isPreview, enforce: cspEnforced }) },
  { key: "Reporting-Endpoints", value: `csp-endpoint="${CSP_REPORT_PATH}"` },
];

/** API responses are never cached by shared caches or indexed. */
const apiHeaders = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  // Removes the "X-Powered-By: Next.js" response header.
  poweredByHeader: false,
  // Explicit: never publish browser source maps from production builds.
  productionBrowserSourceMaps: false,
  // Traced, minimal-file production output for the Docker image (Dockerfile
  // copies .next/standalone + .next/static + public) - keeps the runtime
  // image free of node_modules/dev tooling without changing `npm run dev`/
  // `npm run start` behavior for local/Vercel use, both of which ignore
  // this option.
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: apiHeaders,
      },
    ];
  },
};

export default nextConfig;
