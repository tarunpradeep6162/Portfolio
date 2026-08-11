"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

/**
 * Dedicated Client Component wrapper for the ssr:false dynamic import
 * (approved correction #2 - Next.js App Router rejects `ssr:false` inside a
 * Server Component's own `dynamic()` call, so that call has to live here
 * instead of in Hero.tsx). Gates on prefers-reduced-motion before even
 * requesting the WebGL bundle: reduced-motion users never pay for the
 * download, and HeroSpineFallback (rendered by the caller, always in the
 * DOM) is their entire experience of this content - not degraded, just the
 * baseline.
 */
const HeroSpineCanvas = dynamic(() => import("./HeroSpineCanvas"), { ssr: false });

export function HeroSpineLoader() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return <HeroSpineCanvas />;
}
