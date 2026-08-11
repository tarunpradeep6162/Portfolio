"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Dedicated Client Component wrapper for the ssr:false dynamic import
 * (approved correction #2 - Next.js App Router rejects `ssr:false` inside a
 * Server Component's own `dynamic()` call, so that call has to live here
 * instead of in Hero.tsx). Gates on prefers-reduced-motion before even
 * requesting the WebGL bundle: reduced-motion users never pay for the
 * download. The canvas is purely decorative (aria-hidden) - the accessible,
 * described version of this content is the Reliability Spine walkthrough
 * further down the page, so nothing is lost when this renders null.
 */
const HeroSpineCanvas = dynamic(() => import("./HeroSpineCanvas"), { ssr: false });

export function HeroSpineLoader() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return <HeroSpineCanvas />;
}
