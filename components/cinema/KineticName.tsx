"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Phase 7 - kinetic type for the hero name. Each letter rises out of its
 * own mask with Syne's variable weight swelling from 400 to its resting
 * 700 (CSS, staggered, timed to the cold open). Afterwards the letters
 * respond to the pointer: weight and lift follow a smooth falloff around
 * the cursor, like a lens passing over the word. The real text is one
 * accessible string; the per-letter spans are presentation only.
 */
export function KineticName({ lines }: { lines: { text: string; className?: string }[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const letters = Array.from(root.querySelectorAll<HTMLElement>(".kinetic-letter"));
    let frame = 0;
    let px = -9999;
    let py = -9999;
    const apply = () => {
      frame = 0;
      for (const el of letters) {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / 260);
        const e = k * k * (3 - 2 * k);
        el.style.setProperty("--kw", String(Math.round(700 + e * 100)));
        el.style.setProperty("--ky", `${(-e * 0.06).toFixed(3)}em`);
      }
    };
    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      px = py = -9999;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const section = root.closest("section") ?? root;
    section.addEventListener("pointermove", onMove as EventListener);
    section.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", onMove as EventListener);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, [reducedMotion]);

  let index = 0;
  return (
    <span ref={ref} className="kinetic-name">
      <span className="sr-only">{lines.map((l) => l.text).join(" ")}</span>
      {lines.map((line, li) => (
        <span key={li} aria-hidden className={`block whitespace-nowrap ${line.className ?? ""}`}>
          {Array.from(line.text).map((ch, ci) => {
            const i = index++;
            return (
              <span key={ci} className="kinetic-mask">
                <span className="kinetic-letter" style={{ "--i": i } as React.CSSProperties}>
                  {ch}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
