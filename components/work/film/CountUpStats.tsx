"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Counts real, countable facts about a case study (flow nodes, decisions,
 * tools, protocol stages) up from zero when they enter view - the
 * "numbers on screen" beat of a title sequence, with nothing invented.
 */
export function CountUpStats({ stats }: { stats: { value: number; label: string }[] }) {
  const ref = useRef<HTMLDListElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion) return;
    const nums = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"));
    nums.forEach((n) => (n.textContent = "00"));
    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1400);
          const e = 1 - Math.pow(1 - t, 4);
          nums.forEach((n) => {
            n.textContent = String(Math.round(Number(n.dataset.count) * e)).padStart(2, "0");
          });
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      nums.forEach((n) => (n.textContent = String(n.dataset.count).padStart(2, "0")));
    };
  }, [reducedMotion]);

  return (
    <dl ref={ref} className="mt-9 grid max-w-xl grid-cols-2 border border-white/10 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="border-b border-r border-white/10 p-3.5 last:border-r-0 sm:border-b-0">
          <dt className="sr-only">{s.label}</dt>
          <dd>
            <span
              data-count={s.value}
              className="block font-display text-3xl font-semibold tabular-nums tracking-[-0.04em] text-[var(--color-signal-lime)]"
            >
              {String(s.value).padStart(2, "0")}
            </span>
            <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-telemetry-steel)]">
              {s.label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
