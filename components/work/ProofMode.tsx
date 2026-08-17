"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ExternalLink } from "@/components/ui/ExternalLink";
import type { FlagshipProject } from "@/content/types";
import { cn } from "@/lib/cn";

/**
 * The evidence layer, strictly derived from the project's own existing
 * fields (content/projects.ts) - no new content schema, no facts beyond
 * what's already written elsewhere on the case-study page, just a
 * different, explicit structure: what's verified, why it was built this
 * way, and what's honestly missing. The three-way separation IS the
 * feature - a project with an empty `links` array must never render a
 * clickable link (that would imply evidence that doesn't exist), and must
 * never silently omit the fact that no link exists either.
 */
export function ProofMode({ project }: { project: FlagshipProject }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const missing: string[] = [];
  if (project.links.length === 0) {
    missing.push("No public repository or live link is available for this project.");
  }
  if (project.screenshot.status !== "ready") {
    missing.push("No real product screenshot was supplied - the cover art above is generated from this project's own verified architecture data, not a screenshot.");
  }
  if (project.labelNote) {
    missing.push(project.labelNote);
  }

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]"
      >
        <ChevronDown
          size={13}
          aria-hidden
          className={cn("transition-transform", open && "rotate-180")}
        />
        Proof Mode
      </button>

      {open && (
        <div id={panelId} className="mt-5 grid gap-8 sm:grid-cols-3">
          <section>
            <h3 className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--color-gold-primary)]">
              Verified evidence
            </h3>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--ink-muted)]">
              {project.toolsAndServices.map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
            {project.links.length > 0 && (
              <div className="mt-4 flex flex-col gap-2 font-mono text-[10px] uppercase tracking-[0.08em]">
                {project.links.map((link) => (
                  <ExternalLink key={link.href} href={link.href}>
                    {link.label}
                  </ExternalLink>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--accent-secondary)]">
              Engineering explanation
            </h3>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--ink-muted)]">
              {project.implementationDecisions.map((decision) => (
                <li key={decision}>{decision}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-[var(--ink-muted)]">
              {project.challengeAndResolution}
            </p>
          </section>

          <section>
            <h3 className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              Known limitations
            </h3>
            {missing.length > 0 ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--ink-muted)]">
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-5 text-[var(--ink-muted)]">
                No known gaps recorded for this project.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
