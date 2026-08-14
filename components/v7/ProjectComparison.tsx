"use client";

import { useId, useState } from "react";
import { projects } from "@/content/projects";
import type { FlagshipProject } from "@/content/types";
import { compareProjects } from "@/lib/v7/projectComparison";

const flagships = projects.filter((p): p is FlagshipProject => p.kind === "flagship");

/**
 * Project comparison (spec Section 10.8): a plain table, not a radar
 * chart - the spec explicitly rejects decorative charts for this. Every
 * cell comes from lib/v7/projectComparison.ts, which only reads real
 * project fields; nothing here is computed or displayed by this
 * component itself beyond selecting which two projects to show.
 */
export function ProjectComparison() {
  const [leftSlug, setLeftSlug] = useState(flagships[0].slug);
  const [rightSlug, setRightSlug] = useState(flagships[1]?.slug ?? flagships[0].slug);
  const leftId = useId();
  const rightId = useId();

  const left = flagships.find((p) => p.slug === leftSlug) ?? flagships[0];
  const right = flagships.find((p) => p.slug === rightSlug) ?? flagships[0];
  const rows = compareProjects(left, right);

  return (
    <div className="mt-10 border-t border-[var(--line)] pt-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">
        Project comparison
      </p>
      <p className="mt-1.5 max-w-[62ch] text-[11px] leading-5 text-[var(--ink-muted)]">
        Two real projects, every row derived from their own recorded
        content - not a decorative score.
      </p>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1.5">
          <span id={leftId} className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Project A
          </span>
          <select
            aria-labelledby={leftId}
            value={leftSlug}
            onChange={(event) => setLeftSlug(event.target.value)}
            className="rounded border border-[var(--line)] bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--ink)]"
          >
            {flagships.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span id={rightId} className="font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
            Project B
          </span>
          <select
            aria-labelledby={rightId}
            value={rightSlug}
            onChange={(event) => setRightSlug(event.target.value)}
            className="rounded border border-[var(--line)] bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--ink)]"
          >
            {flagships.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
          <caption className="sr-only">
            Comparison of {left.title} and {right.title}
          </caption>
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th scope="col" className="py-2 pr-4 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                Dimension
              </th>
              <th scope="col" className="py-2 pr-4 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--accent-secondary)]">
                {left.title}
              </th>
              <th scope="col" className="py-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--accent-secondary)]">
                {right.title}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dimension} className="border-b border-[var(--line)] align-top">
                <th scope="row" className="py-3 pr-4 font-mono text-[9px] font-normal uppercase tracking-[0.06em] text-[var(--ink-muted)]">
                  {row.dimension}
                </th>
                <td className="py-3 pr-4 text-[11px] leading-5 text-[var(--ink)]">{row.left}</td>
                <td className="py-3 text-[11px] leading-5 text-[var(--ink)]">{row.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
