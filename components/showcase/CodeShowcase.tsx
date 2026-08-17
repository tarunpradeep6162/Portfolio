"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsap } from "@/lib/motion/gsapConfig";

interface CodeShowcaseProps {
  language: string;
  title: string;
  code: string;
}

export function CodeShowcase({ language, title, code }: CodeShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!linesRef.current) return;

      const lines = linesRef.current.querySelectorAll("[data-code-line]");
      if (lines.length === 0) return;

      gsap.registerPlugin(ScrollTrigger);

      gsap.from(lines, {
        opacity: 0,
        x: -20,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          once: true,
        },
      });
    },
    { scope: containerRef },
  );

  const codeLines = code.split("\n").filter((line) => line.trim());

  return (
    <div
      ref={containerRef}
      className="group overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--color-control-black)]/40 transition-all hover:border-[var(--accent)]/50"
    >
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3 sm:px-6">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--accent-secondary)]">
            {language}
          </p>
          <p className="mt-1 font-mono text-xs text-[var(--ink-muted)]">
            {title}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500/60" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
          <div className="h-2 w-2 rounded-full bg-green-500/60" />
        </div>
      </div>

      <div
        ref={linesRef}
        className="overflow-x-auto px-4 py-4 sm:px-6 font-mono text-[13px] leading-6 text-[var(--ink-muted)] sm:text-sm"
      >
        {codeLines.map((line, index) => (
          <div key={index} data-code-line className="whitespace-pre text-[12px]">
            <span className="inline-block w-8 select-none text-right text-[var(--line)] mr-4">
              {index + 1}
            </span>
            <span>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
