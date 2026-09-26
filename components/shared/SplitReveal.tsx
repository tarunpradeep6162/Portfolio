"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { registerGsap, shouldSkipLateReveal } from "@/lib/motion/gsapConfig";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { shots } from "@/lib/motion/tokens";

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * Cinematic heading reveal: each word rises out of its own mask, staggered,
 * when the heading scrolls into view. The full sentence stays in the DOM as
 * real text (one accessible label, SEO intact); reduced motion shows it
 * immediately.
 */
export function SplitReveal({
  as = "h2",
  children,
  className,
  delay = 0,
}: {
  as?: Tag;
  children: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      registerGsap();
      const words = ref.current?.querySelectorAll<HTMLElement>(".split-word > span");
      if (!words?.length) return;
      if (reducedMotion || shouldSkipLateReveal(ref.current)) {
        gsap.set(words, { yPercent: 0 });
        return;
      }
      // A "reveal" shot: each word rises out of its mask, un-skewing and
      // coming into focus, like type on a camera move.
      // Transform + opacity only (compositor-friendly); the mask does the reveal.
      gsap.set(words, { yPercent: 115, skewY: 7, opacity: 0.2, transformOrigin: "0% 100%" });
      gsap.to(words, {
        yPercent: 0,
        skewY: 0,
        opacity: 1,
        duration: shots.reveal.duration * 1.1,
        ease: "cinema.reveal",
        stagger: 0.055,
        delay,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      });
    },
    { scope: ref, dependencies: [reducedMotion] },
  );

  const words = children.split(/\s+/).filter(Boolean);
  const Tag = as;
  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={`kinetic-skew ${className ?? ""}`}>
      {/* Screen readers (and search engines) get the sentence once, intact. */}
      <span className="sr-only">{children}</span>
      {/* Real (breakable) spaces between masked words, so headings still wrap. */}
      {words.flatMap((word, i) => [
        <span key={`w${i}`} className="split-word" aria-hidden>
          <span>{word}</span>
        </span>,
        i < words.length - 1 ? " " : null,
      ])}
    </Tag>
  );
}
