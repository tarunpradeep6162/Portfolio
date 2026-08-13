"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Read-only IntersectionObserver over a fixed set of section ids that
 * already exist in the V4 home page markup (#work, #spine, #contact) - it
 * never mutates those sections, only watches them, so it can't regress the
 * verified V4 output. `onChange` fires from inside the observer callback
 * (a real browser event), not from a React effect body, so companions of
 * this hook can react to section changes without an extra watcher effect.
 */
export function useActiveSection(
  ids: string[],
  enabled: boolean,
  onChange?: (id: string) => void,
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible || visible.target.id === lastIdRef.current) return;
        lastIdRef.current = visible.target.id;
        setActiveId(visible.target.id);
        onChange?.(visible.target.id);
      },
      { threshold: [0.3, 0.6] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is an event callback, intentionally not a re-trigger dependency
  }, [ids, enabled]);

  return activeId;
}
