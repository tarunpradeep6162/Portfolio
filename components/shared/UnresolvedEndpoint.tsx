"use client";

import { usePathname } from "next/navigation";

/**
 * Small Infrastructure Atlas concept for the 404: an "unresolved endpoint"
 * rendered in the same flow-diagram visual grammar as ArchitectureDiagram
 * (bordered mono-font steps, arrows) and ProjectCoverArt (accent colors),
 * with the final node broken instead of resolved. The route name shown is
 * this specific failed request (real for this visit), not a fabricated
 * system - same honesty rule as everywhere else on the site.
 *
 * Isolated as its own client component (rather than making the whole
 * not-found page a client component) since usePathname() is the only
 * reason any part of this page needs to run client-side.
 */
export function UnresolvedEndpoint() {
  const pathname = usePathname();
  const path = pathname || "/";

  return (
    <div
      role="img"
      aria-label={`Request flow: request received, then ${path} unresolved, no matching route`}
      className="mt-10 flex flex-wrap items-center gap-3 font-mono text-xs"
    >
      <span className="rounded-sm border border-[var(--line)] px-3 py-2 text-[var(--ink)]">Request</span>
      <span aria-hidden className="text-[var(--ink-muted)]">
        &rarr;
      </span>
      <span className="max-w-[40ch] truncate rounded-sm border border-[var(--line)] px-3 py-2 text-[var(--ink-muted)]">
        {path}
      </span>
      <span aria-hidden className="text-[var(--accent)]">
        &rarr;
      </span>
      <span className="rounded-sm border border-dashed border-[var(--accent)] px-3 py-2 text-[var(--accent)]">
        404 &middot; no route matched
      </span>
    </div>
  );
}
