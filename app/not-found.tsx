"use client";

import { usePathname } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

/**
 * Small Infrastructure Atlas concept for the 404: an "unresolved endpoint"
 * rendered in the same flow-diagram visual grammar as ArchitectureDiagram
 * (bordered mono-font steps, arrows) and ProjectCoverArt (accent colors),
 * with the final node broken instead of resolved. The route name shown is
 * this specific failed request (real for this visit), not a fabricated
 * system - same honesty rule as everywhere else on the site.
 */
function UnresolvedEndpoint({ path }: { path: string }) {
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

export default function NotFound() {
  const pathname = usePathname();

  return (
    <Section field="manual" className="pt-16">
      <Eyebrow>404</Eyebrow>
      <h1 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
        This route doesn&rsquo;t resolve.
      </h1>
      <p className="mt-4 max-w-[50ch] text-[var(--ink-muted)]">
        Every real route on this site resolves to a page. This one didn&rsquo;t &mdash; it was moved,
        renamed, or never existed.
      </p>
      <UnresolvedEndpoint path={pathname || "/"} />
      <div className="mt-10">
        <Button href="/">Back to home</Button>
      </div>
    </Section>
  );
}
