"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registerGsap } from "@/lib/motion/gsapConfig";

interface Tech {
  name: string;
  icon: string;
  color: string;
}

interface TechStackProps {
  techs: Tech[];
}

export function TechStack({ techs }: TechStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      gsap.registerPlugin(ScrollTrigger);

      if (!containerRef.current) return;

      const icons = containerRef.current.querySelectorAll("[data-tech-icon]");
      if (icons.length === 0) return;

      icons.forEach((icon, index) => {
        gsap.from(icon, {
          opacity: 0,
          scale: 0.8,
          y: 20,
          duration: 0.6,
          delay: index * 0.08,
          ease: "back.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            once: true,
          },
        });

        // Add hover animation
        icon.addEventListener("mouseenter", () => {
          gsap.to(icon, {
            y: -8,
            duration: 0.3,
            ease: "power2.out",
          });
        });

        icon.addEventListener("mouseleave", () => {
          gsap.to(icon, {
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6"
    >
      {techs.map((tech) => (
        <div
          key={tech.name}
          data-tech-icon
          className="group flex flex-col items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--ink)]/[0.02] p-4 transition-all hover:border-[var(--accent)] hover:bg-[var(--accent)]/[0.05] cursor-pointer"
        >
          <div
            className="text-3xl sm:text-4xl transition-transform"
            style={{
              filter: `drop-shadow(0 0 8px ${tech.color}00)`,
            }}
          >
            {tech.icon}
          </div>
          <p className="text-center font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent)]">
            {tech.name}
          </p>
        </div>
      ))}
    </div>
  );
}
