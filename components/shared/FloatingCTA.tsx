"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

export function FloatingCTA() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (!buttonRef.current || reducedMotion) return;

      const button = buttonRef.current.querySelector("a");
      if (!button) return;

      // Pulse animation on the button
      gsap.to(button, {
        boxShadow: "0 0 20px rgba(216, 255, 79, 0.4)",
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: buttonRef, dependencies: [reducedMotion] },
  );

  return (
    <div
      ref={buttonRef}
      className="fixed bottom-8 right-8 z-30 hidden lg:block"
      aria-label="Contact floating action button"
    >
      <a
        href="#contact"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--color-control-black)]/80 text-[var(--accent)] backdrop-blur-sm transition-[transform,background-color] hover:bg-[var(--color-control-black)] hover:scale-110 active:scale-95"
        aria-label="Scroll to contact section"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </a>
    </div>
  );
}
