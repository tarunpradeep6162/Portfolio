import { site } from "@/content/site";

const CREDITS: [string, string][] = [
  ["Written, directed & engineered by", site.name],
  ["Starring", "RC-01, the Reliability Companion"],
  ["Digital double", "Procedural armour · three.js"],
  ["3D stage & film grade", "react-three-fiber · custom GLSL"],
  ["Motion", "GSAP · ScrollTrigger · Lenis"],
  ["Sound design", "Synthesized live · Web Audio API"],
  ["Typography", "Syne · Manrope · IBM Plex Mono"],
  ["Framework", "Next.js · React"],
  ["Filmed on location", site.location],
  ["Distributed by", "Vercel"],
];

/**
 * Phase 20 - end credits. A slow credit roll in a masked window at the
 * foot of every page; static (and fully readable) for reduced motion.
 * The list is real: it names the actual stack the site is built with.
 */
export function EndCredits() {
  return (
    <div data-anim-scope className="end-credits relative mt-2 overflow-hidden border-y border-white/10" aria-label="End credits">
      <div className="end-credits-roll py-6">
        {CREDITS.map(([role, name]) => (
          <p key={role} className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-4 py-1.5">
            <span className="text-right font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--color-telemetry-steel)]">
              {role}
            </span>
            <span aria-hidden className="h-px w-6 bg-white/15" />
            <span className="font-display text-sm font-semibold tracking-[-0.01em] text-[var(--color-cloud-linen)]">{name}</span>
          </p>
        ))}
        <p className="mt-6 text-center font-mono text-[8px] uppercase tracking-[0.3em] text-[var(--color-signal-lime)]">
          No systems were harmed in the making of this portfolio
        </p>
      </div>
    </div>
  );
}
