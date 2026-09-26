"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

type Mode = "default" | "link" | "scan" | "drag";

/**
 * Cinematic cursor (Phase 17). Runs entirely outside React's render loop
 * (the previous version re-rendered on every mousemove):
 *
 * - a precise dot plus a trailing ring (lerped each frame)
 * - links/buttons: the ring opens up
 * - over any 3D canvas or [data-cursor="scan"]: the ring becomes a
 *   scanner reticle with a readout of the pointer's position
 * - over sliders ([data-cursor="drag"], range inputs): a drag hint
 * - [data-magnetic] elements lean toward the pointer and settle back
 * - [data-hover-light] / project cards get a soft light that follows the
 *   pointer across their surface (CSS vars --mx / --my)
 *
 * Fine pointers only; touch devices and reduced motion keep native input.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let visible = false;
    let mode: Mode = "default";
    let magnet: HTMLElement | null = null;
    let raf = 0;

    const setMode = (next: Mode) => {
      if (next === mode) return;
      mode = next;
      ring.dataset.mode = next;
      dot.dataset.mode = next;
    };

    const releaseMagnet = () => {
      if (!magnet) return;
      magnet.style.transform = "";
      magnet = null;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        ring.style.opacity = "1";
        dot.style.opacity = "1";
      }
      const target = event.target as Element | null;
      const interactive = target?.closest?.("a, button, [role='button'], summary, label");
      const scan = target?.closest?.("canvas, [data-cursor='scan']");
      const drag = target?.closest?.("input[type='range'], [data-cursor='drag']");
      setMode(drag ? "drag" : scan ? "scan" : interactive ? "link" : "default");

      // Magnetic lean.
      const m = target?.closest?.("[data-magnetic]") as HTMLElement | null;
      if (m !== magnet) releaseMagnet();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        const dx = (x - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (y - (r.top + r.height / 2)) / (r.height / 2);
        m.style.transform = `translate(${(dx * 6).toFixed(2)}px, ${(dy * 5).toFixed(2)}px)`;
      }

      // Hover light.
      const lit = target?.closest?.("[data-hover-light], .project-card") as HTMLElement | null;
      if (lit) {
        const r = lit.getBoundingClientRect();
        lit.style.setProperty("--mx", `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
        lit.style.setProperty("--my", `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
      }

      if (mode === "scan") {
        label.textContent = `SCAN ${String(Math.round(x)).padStart(4, "0")}·${String(Math.round(y)).padStart(4, "0")}`;
      } else if (mode === "drag") {
        label.textContent = "DRAG";
      } else {
        label.textContent = "";
      }
    };

    const onLeave = () => {
      visible = false;
      ring.style.opacity = "0";
      dot.style.opacity = "0";
      releaseMagnet();
    };
    const onDown = () => ring.classList.add("is-pressed");
    const onUp = () => ring.classList.remove("is-pressed");

    const tick = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      releaseMagnet();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div aria-hidden className="cine-cursor">
      <div ref={ringRef} className="cine-cursor-ring" data-mode="default">
        <span className="cine-cursor-bracket tl" />
        <span className="cine-cursor-bracket tr" />
        <span className="cine-cursor-bracket bl" />
        <span className="cine-cursor-bracket br" />
        <span ref={labelRef} className="cine-cursor-label" />
      </div>
      <div ref={dotRef} className="cine-cursor-dot" data-mode="default" />
    </div>
  );
}
