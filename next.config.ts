import type { NextConfig } from "next";

const securityHeaders = [
  // Stops the browser guessing a response's MIME type from its content -
  // a real, low-risk hardening header, not a CSP that would need tuning
  // against every script/style source in the app.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Sends the full referrer to same-origin requests, only the origin
  // (no path/query) cross-origin - a reasonable default, not maximal
  // privacy-at-all-costs which would break some legitimate use cases.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // RC-01 never requests microphone/camera access and this site has no
  // geolocation feature - denying all three at the header level is a real
  // guarantee, not just a code-review claim.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // No legitimate reason for this portfolio to be framed by another site.
  { key: "X-Frame-Options", value: "DENY" },
  // Only takes effect over HTTPS (browsers ignore it on plain HTTP, which
  // is what this preview environment serves) - correct to ship now so it
  // is active the moment the site is deployed behind TLS, per the plan's
  // "appropriate HTTPS transport behavior" requirement. Not submitted to
  // any HSTS preload list, so "preload" is deliberately omitted rather
  // than claimed.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Removes the "X-Powered-By: Next.js" response header.
  poweredByHeader: false,
  // Traced, minimal-file production output for the Docker image (Dockerfile
  // copies .next/standalone + .next/static + public) - keeps the runtime
  // image free of node_modules/dev tooling without changing `npm run dev`/
  // `npm run start` behavior for local/Vercel use, both of which ignore
  // this option.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
