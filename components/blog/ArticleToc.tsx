"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { TocEntry } from "./ArticleBody";

/** Sticky contents rail that tracks the section being read. */
export function ArticleToc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (items) => {
        const visible = items.filter((i) => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <nav aria-label="On this page" className="border-t border-[var(--line)] pt-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">On this page</p>
      <ol className="mt-4 space-y-2.5">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? "pl-4" : undefined}>
            <a
              href={`#${entry.id}`}
              aria-current={active === entry.id ? "location" : undefined}
              className={cn(
                "block border-l pl-3 text-[13px] leading-5 transition-colors",
                active === entry.id
                  ? "border-[var(--accent-secondary)] text-[var(--ink)]"
                  : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
