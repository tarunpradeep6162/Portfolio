/**
 * Centralised motion constants (spec §12: "centralize motion constants and
 * reduced-motion behaviour"). No component should hardcode a duration or
 * ease outside this file.
 *
 * v9 "motion language": every animation on the site is one of a small set
 * of *shots*, borrowed from film grammar, so motion reads as directed
 * rather than decorative:
 *
 *   push   - a slow dolly-in: long, gentle, never overshoots
 *   reveal - content emerging from a mask or out of focus
 *   cut    - a hard, fast change (route wipes, slates) - no easing tail
 *   hold   - the pause between beats; used as timeline gaps
 *   settle - a quick move that lands softly (UI feedback, magnet release)
 *
 * The same curves exist as CSS custom properties (globals.css, --ease-*)
 * and as registered GSAP eases ("cinema.push" etc., lib/motion/gsapConfig).
 */
export const shots = {
  push: { duration: 1.6, css: "cubic-bezier(0.22, 0.61, 0.36, 1)", bezier: [0.22, 0.61, 0.36, 1] },
  reveal: { duration: 1.0, css: "cubic-bezier(0.16, 1, 0.3, 1)", bezier: [0.16, 1, 0.3, 1] },
  cut: { duration: 0.42, css: "cubic-bezier(0.76, 0, 0.24, 1)", bezier: [0.76, 0, 0.24, 1] },
  settle: { duration: 0.55, css: "cubic-bezier(0.34, 1.3, 0.64, 1)", bezier: [0.34, 1.3, 0.64, 1] },
  hold: { duration: 0.35 },
} as const;

export type ShotName = Exclude<keyof typeof shots, "hold">;

export const motion = {
  heroEntranceMs: 900, // within the spec's 700-1200ms window
  sectionRevealMs: 600,
  ease: {
    // CSS custom property version (globals.css --ease-spine) - cubic-bezier() accepts this directly.
    cssSpine: shots.reveal.css,
    // Registered GSAP ease with the exact same curve (lib/motion/gsapConfig).
    gsapSpine: "cinema.reveal",
  },
  stagger: {
    hero: 0.08,
    section: 0.06,
    letters: 0.028,
  },
} as const;
