"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A film's chapter index for the case study (Phase 11): which chapter is
 * on screen, with a progress rule filling as the reader moves through the
 * story. Links jump to each chapter.
 */
export function ChapterRail({ chapters }: { chapters: { id: string; number: string; title: string }[] }) {
  const [active, setActive] = useState(chapters[0]?.id ?? null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const els = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const first = els[0].getBoundingClientRect();
        const last = els[els.length - 1].getBoundingClientRect();
        const total = last.bottom - first.top - window.innerHeight * 0.5;
        setProgress(Math.min(1, Math.max(0, (window.innerHeight * 0.5 - first.top) / Math.max(1, total))));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [chapters]);

  return (
    <nav aria-label="Chapters" className="mt-8 border-t border-[var(--line)] pt-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--accent-secondary)]">Chapters</p>
      <div className="relative mt-4 pl-4">
        <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-[var(--line)]" />
        <span
          aria-hidden
          className="absolute left-0 top-0 w-px origin-top bg-[var(--accent)] transition-[height] duration-300"
          style={{ height: `${progress * 100}%` }}
        />
        <ol className="space-y-2.5">
          {chapters.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={active === c.id ? "location" : undefined}
                className={cn(
                  "flex gap-3 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
                  active === c.id ? "text-[var(--ink)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
                )}
              >
                <span className={active === c.id ? "text-[var(--accent-secondary)]" : undefined}>{c.number}</span>
                {c.title}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
