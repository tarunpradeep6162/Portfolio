"use client";

import { useState } from "react";

function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * This hook is only ever mounted client-side (CompanionExperience is
 * loaded via next/dynamic with ssr:false), so a lazy useState initializer
 * is a safe one-time browser check rather than an effect-driven
 * synchronization that would trigger an extra render.
 */
export function useWebGLSupport(): boolean {
  const [supported] = useState(detectWebGL);
  return supported;
}
