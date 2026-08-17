"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ExperienceRole } from "@/content/types";

export function InteractiveTimeline({ roles }: { roles: ExperienceRole[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([roles[0]?.org]));

  const toggleExpand = (org: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(org)) {
      newExpanded.delete(org);
    } else {
      newExpanded.add(org);
    }
    setExpanded(newExpanded);
  };

  return (
    <ol className="border-t border-[var(--line)]">
      {roles.map((role, index) => {
        const isExpanded = expanded.has(role.org);
        return (
          <li
            key={`${role.org}-${role.dates}`}
            data-reveal
            className="group border-b border-[var(--line)] transition-all duration-300 hover:bg-[var(--ink)]/[0.02]"
          >
            <button
              onClick={() => toggleExpand(role.org)}
              className="w-full cursor-pointer py-7 sm:py-8 sm:grid sm:grid-cols-[3rem_1fr] sm:gap-6 gap-4 hover:no-underline"
            >
              <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--accent-secondary)]">
                0{index + 1}
              </span>
              <div className="flex w-full items-start justify-between gap-5">
                <div className="text-left">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
                    <h3 className="font-display text-xl font-semibold tracking-[-0.035em] text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">
                      {role.role}
                    </h3>
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-muted)]">
                      {role.dates}
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent-secondary)]">
                    {role.org}
                    {role.location ? ` · ${role.location}` : ""}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-[var(--ink-muted)] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {isExpanded && role.achievements.status === "ready" && (
              <div className="overflow-hidden border-t border-[var(--line)]/50 bg-[var(--ink)]/[0.01]">
                <div className="px-4 py-6 sm:grid sm:grid-cols-[3rem_1fr] sm:gap-6 gap-4 sm:pl-0">
                  <div />
                  <ul className="grid gap-3 lg:grid-cols-2">
                    {role.achievements.value.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-6 text-[var(--ink-muted)] animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <span
                          aria-hidden
                          className="mt-2.5 h-1 w-1 shrink-0 bg-[var(--accent)]"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
