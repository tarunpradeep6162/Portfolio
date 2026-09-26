import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shots, type ShotName } from "./tokens";

let registered = false;

/**
 * cubic-bezier(x1, y1, x2, y2) as an easing function (the same maths CSS
 * uses), so GSAP eases match the CSS --ease-* curves exactly.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Newton-Raphson, falling back to bisection.
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return sampleY(t);
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      const v = sampleX(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}

/** Registers GSAP plugins and the "cinema.*" eases exactly once, client-side only. */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  for (const name of ["push", "reveal", "cut", "settle"] as ShotName[]) {
    const [x1, y1, x2, y2] = shots[name].bezier;
    gsap.registerEase(`cinema.${name}`, cubicBezier(x1, y1, x2, y2));
  }
  registered = true;
}

/**
 * True when an element that the server already rendered visible is on
 * screen at hydration and hydration was slow: animating it in now would
 * hide real content the visitor is already reading, so we don't.
 */
export function shouldSkipLateReveal(el: Element | null, lateAfterMs = 1500) {
  if (!el || performance.now() < lateAfterMs) return false;
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}
