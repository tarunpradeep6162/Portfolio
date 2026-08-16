"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsap } from "@/lib/motion/gsapConfig";

interface SkillTagsProps {
  items: string[];
}

export function SkillTags({ items }: SkillTagsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!containerRef.current) return;

      const tags = containerRef.current.querySelectorAll("[data-skill-tag]");
      if (tags.length === 0) return;

      gsap.registerPlugin(ScrollTrigger);

      gsap.from(tags, {
        opacity: 0,
        y: 16,
        filter: "blur(4px)",
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          once: true,
        },
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-2"
    >
      {items.map((item) => (
        <span
          key={item}
          data-skill-tag
          className="inline-flex items-center rounded-full border border-[var(--accent-secondary)]/40 bg-[var(--accent-secondary)]/10 px-3 py-1.5 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-secondary)] transition-all hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/20 hover:shadow-[0_0_12px_rgba(116,140,255,0.2)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
