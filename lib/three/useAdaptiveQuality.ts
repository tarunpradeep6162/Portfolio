"use client";

import { useEffect, useState } from "react";

/**
 * Caps device pixel ratio and tracks tab/canvas visibility so the render
 * loop can pause when offscreen or hidden (spec §16 performance budget).
 */
export function useAdaptiveQuality() {
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function handleVisibility() {
      setVisible(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return { dpr, setDpr, visible };
}
