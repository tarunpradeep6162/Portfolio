"use client";

import { usePathname } from "next/navigation";

export function UnresolvedEndpoint() {
  const pathname = usePathname() || "/";

  return (
    <div
      role="img"
      aria-label={`Request flow: request received, path ${pathname} unresolved, no matching route`}
      className="relative aspect-square w-full max-w-[38rem] justify-self-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle,#111d2a_0%,#080d12_58%,#06090d_72%)]"
    >
      <div
        aria-hidden
        className="absolute inset-[12%] rounded-full border border-dashed border-white/10 route-orbit"
      />
      <div
        aria-hidden
        className="absolute inset-[29%] rounded-full border border-white/10"
      />
      <svg
        viewBox="0 0 600 600"
        className="absolute inset-0 h-full w-full"
        focusable="false"
      >
        <path
          d="M88 300 H 224"
          stroke="#d8ff4f"
          strokeWidth="2"
          className="cover-flow"
        />
        <path
          d="M376 300 H 512"
          stroke="#ff6847"
          strokeWidth="2"
          strokeDasharray="5 10"
        />
        <circle cx="78" cy="300" r="12" fill="#d8ff4f" />
        <circle
          cx="300"
          cy="300"
          r="76"
          fill="#0d151d"
          stroke="#748cff"
          strokeWidth="2"
        />
        <circle
          cx="522"
          cy="300"
          r="18"
          fill="none"
          stroke="#ff6847"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M512 290 L532 310 M532 290 L512 310"
          stroke="#ff6847"
          strokeWidth="2"
        />
        <text
          x="78"
          y="340"
          textAnchor="middle"
          fill="#8996a3"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.5"
        >
          REQUEST
        </text>
        <text
          x="300"
          y="288"
          textAnchor="middle"
          fill="#8996a3"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.5"
        >
          ROUTER
        </text>
        <text
          x="300"
          y="319"
          textAnchor="middle"
          fill="#f8f8f3"
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="25"
        >
          404
        </text>
        <text
          x="522"
          y="340"
          textAnchor="middle"
          fill="#ff6847"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.5"
        >
          UNRESOLVED
        </text>
      </svg>
      <p className="absolute inset-x-[16%] bottom-[12%] truncate border-t border-white/10 pt-4 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--color-slate-gray)]">
        {pathname}
      </p>
    </div>
  );
}
