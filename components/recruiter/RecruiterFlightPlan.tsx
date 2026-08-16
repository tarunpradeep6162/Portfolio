"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { useExperienceDispatch, useExperienceState } from "@/lib/v6/ExperienceProvider";
import { projects } from "@/content/projects";
import { skillDomains } from "@/content/skills";
import { site } from "@/content/site";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import type { FlagshipProject } from "@/content/types";

const flagships = projects.filter((project): project is FlagshipProject => project.kind === "flagship");

/**
 * The V9 Recruiter Flight Plan (docs/PORTFOLIO_V9_ARCHITECTURE.md /
 * docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md Phase 2). Renders only when
 * visitorPath === "recruiter" - the existing full homepage is completely
 * unchanged and still the default for every other visitor, matching
 * VisitorPathSelector's own "never a wall" contract.
 *
 * Every project, skill domain, and contact action here is the exact same
 * real data content/*.ts already provides elsewhere on this site - this
 * component is a compressed *sequence* through existing evidence, not a
 * new content source. The "60 seconds" budget is why it shows exactly
 * the 4 flagship projects' one-line outcome (never the full case study
 * detail) and skill domain names (never all ~60 individual skill items) -
 * see the Content Matrix for why these 4 are "the top 4," not a new
 * curation decision made here.
 */
export function RecruiterFlightPlan() {
  const { visitorPath } = useExperienceState();
  const dispatch = useExperienceDispatch();

  if (visitorPath !== "recruiter") return null;

  return (
    <section
      aria-label="Recruiter flight plan"
      data-field="manual"
      className="border-b border-white/10 bg-[var(--color-control-black)] py-14 text-[var(--color-cloud-linen)] sm:py-20"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-signal-lime)]">
              Recruiter flight plan
            </p>
            <h2 className="mt-3 max-w-[24ch] font-display text-2xl font-semibold leading-tight sm:text-3xl">
              Four real systems, verified skills, one way to reach me.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: "VISITOR_PATH_SET", path: null })}
            className="mt-1 shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ink-muted)] underline decoration-white/20 underline-offset-4 hover:decoration-[var(--color-signal-lime)]"
          >
            Exit flight plan
          </button>
        </div>

        <ol className="mt-8 flex flex-col gap-4">
          {flagships.map((project, index) => (
            <li key={project.slug}>
              <Link
                href={`/work/${project.slug}`}
                className="group flex flex-col gap-1 rounded border border-white/10 p-4 transition-colors hover:border-[var(--color-signal-lime)]/50 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-mono text-[10px] text-[var(--ink-muted)]">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold leading-snug">{project.title}</p>
                    <p className="mt-1 max-w-[60ch] text-sm leading-6 text-[var(--ink-muted)]">
                      {project.outcome}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  aria-hidden
                  className="ml-8 shrink-0 text-[var(--ink-muted)] transition-colors group-hover:text-[var(--color-signal-lime)] sm:ml-0"
                />
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            Verified skill domains
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {skillDomains.map((domain) => (
              <li
                key={domain.domain}
                className="rounded border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)]"
              >
                {domain.domain}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8">
          <CopyEmailButton email={site.email} />
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent("Résumé request")}`}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)] transition-colors hover:text-[var(--color-signal-lime)]"
          >
            <Mail size={14} aria-hidden />
            Request résumé by email
          </a>
        </div>
      </div>
    </section>
  );
}
