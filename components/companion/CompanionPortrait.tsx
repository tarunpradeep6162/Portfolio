import { useId } from "react";

/**
 * Zero-JS-cost static portrait of RC-01 (v8: Tarun's robot double - black
 * chrome, lime light strips, his hologram face on the glass screen). Used
 * whenever the 3D layer should not load or render: reduced motion,
 * low-power mode, WebGL unavailable, a canvas error, and the loading
 * skeleton. No animation - if this is on screen, it is unambiguously the
 * "not running 3D" state, never a disguised low-frame-rate version of it.
 */
export function CompanionPortrait({
  variant = "idle",
  className,
}: {
  variant?: "idle" | "error" | "sleep";
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const glow = variant === "error" ? "#ff6847" : variant === "sleep" ? "#56622a" : "#d8ff4f";
  const faceOpacity = variant === "sleep" ? 0.25 : variant === "error" ? 0.55 : 1;

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={
        variant === "error"
          ? "RC-01 portrait, error state"
          : variant === "sleep"
            ? "RC-01 portrait, power-saving state"
            : "RC-01, the Reliability Companion, static portrait"
      }
      className={className}
    >
      <defs>
        <radialGradient id={`${id}-bg`} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#141d27" />
          <stop offset="100%" stopColor="#06090d" />
        </radialGradient>
        <linearGradient id={`${id}-chrome`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a515c" />
          <stop offset="45%" stopColor="#1c2026" />
          <stop offset="100%" stopColor="#0b0d10" />
        </linearGradient>
        <clipPath id={`${id}-face`}>
          <ellipse cx="120" cy="66" rx="31" ry="24" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="240" height="240" fill={`url(#${id}-bg)`} rx="16" />

      {/* hover glow + thruster */}
      <ellipse cx="120" cy="214" rx="30" ry="6" fill="#d8ff4f" opacity="0.12" />
      <path d="M112 172 L128 172 L120 196 Z" fill="#d8ff4f" opacity="0.35" />

      {/* floating arms */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <rect
            x={side < 0 ? 66 : 162}
            y="112"
            width="12"
            height="40"
            rx="6"
            fill={`url(#${id}-chrome)`}
            transform={`rotate(${side * -8} ${side < 0 ? 72 : 168} 112)`}
          />
          <line
            x1={side < 0 ? 72 : 168}
            y1="120"
            x2={side < 0 ? 71 : 169}
            y2="142"
            stroke={glow}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      ))}

      {/* egg torso with light strips */}
      <ellipse cx="120" cy="136" rx="34" ry="38" fill={`url(#${id}-chrome)`} stroke="#2a3038" />
      <ellipse cx="120" cy="104" rx="20" ry="3" fill="none" stroke={glow} strokeWidth="1.4" opacity="0.8" />
      <path d="M104 118 L113 127 M136 118 L127 127" stroke={glow} strokeWidth="2" strokeLinecap="round" />
      <circle cx="120" cy="132" r="5" fill="none" stroke={glow} strokeWidth="1.6" />
      <path d="M88 150 Q120 158 152 150" fill="none" stroke={glow} strokeWidth="1.4" opacity="0.8" />

      {/* neck + helmet */}
      <rect x="113" y="92" width="14" height="10" fill="#0b0d10" />
      <ellipse cx="120" cy="64" rx="44" ry="34" fill={`url(#${id}-chrome)`} stroke="#2a3038" />
      {[-1, 1].map((side) => (
        <circle key={side} cx={120 + side * 45} cy="64" r="7" fill="#121519" stroke={glow} strokeWidth="1.4" />
      ))}
      <line x1="126" y1="31" x2="129" y2="18" stroke="#0b0d10" strokeWidth="2" />
      <circle cx="129.5" cy="16" r="3" fill={glow} />

      {/* glass screen + hologram portrait */}
      <ellipse cx="120" cy="66" rx="33" ry="25" fill="#05080c" />
      <image
        href="/rc01/face-holo.webp"
        x="89"
        y="42"
        width="62"
        height="48"
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${id}-face)`}
        opacity={faceOpacity}
      />
      {variant === "error" && (
        <ellipse cx="120" cy="66" rx="31" ry="24" fill="#ff6847" opacity="0.28" />
      )}

      <text
        x="120"
        y="232"
        textAnchor="middle"
        fontFamily="var(--font-mono, monospace)"
        fontSize="9"
        letterSpacing="2"
        fill="#8996a3"
      >
        RC-01
      </text>
    </svg>
  );
}
