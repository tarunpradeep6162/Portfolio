import { ReliabilitySpine } from "@/components/spine/ReliabilitySpine";

/**
 * The accessible, always-rendered baseline for the hero's spine visual
 * (spec §4, §6, §15). This is not a "no-JS fallback" - it's the actual
 * content, present for screen-reader users, reduced-motion users, and
 * small/constrained viewports regardless of whether the WebGL canvas ever
 * mounts on top of it.
 */
export function HeroSpineFallback() {
  return (
    <div className="mt-6">
      <ReliabilitySpine />
    </div>
  );
}
