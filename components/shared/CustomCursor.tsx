"use client";

import { useState, useEffect } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      const isClickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("button") ||
        target.closest("a");

      setIsHovered(!!isClickable);
    };

    const handleMouseOut = () => {
      setIsHovered(false);
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [reducedMotion]);

  if (reducedMotion || !isVisible) {
    return null;
  }

  const size = isHovered ? 32 : 10;
  const offset = isHovered ? 16 : 5;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-50"
      style={{
        transform: `translate(${position.x - offset}px, ${position.y - offset}px)`,
        transition: "all 0.1s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        className="rounded-full border border-[var(--accent)] backdrop-blur-sm"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: isHovered
            ? `0 0 20px rgba(216, 255, 79, 0.4), inset 0 0 10px rgba(216, 255, 79, 0.2)`
            : `0 0 8px rgba(216, 255, 79, 0.1)`,
        }}
      />
    </div>
  );
}
