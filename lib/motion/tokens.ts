/**
 * Centralised motion constants (spec §12: "centralize motion constants and
 * reduced-motion behaviour"). No component should hardcode a duration or
 * ease outside this file.
 */
export const motion = {
  heroEntranceMs: 900, // within the spec's 700-1200ms window
  ease: {
    // CSS custom property version (globals.css --ease-spine) - cubic-bezier() accepts this directly.
    cssSpine: "cubic-bezier(0.16, 1, 0.3, 1)",
    // GSAP equivalent: GSAP takes named eases/functions, not a raw bezier array.
    // power3.out is the closest built-in match to the same "fast start, gentle settle" curve.
    gsapSpine: "power3.out",
  },
  stagger: {
    hero: 0.08,
  },
} as const;
