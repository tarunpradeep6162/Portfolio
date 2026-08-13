/**
 * Zero-JS-cost static portrait of RC-01, in the exact V4 Observatory
 * palette. Used whenever the 3D layer should not load or render: reduced
 * motion, low-power mode, WebGL unavailable, a canvas error, and the
 * pre-activation resting state. No animation - if this is on screen, it is
 * unambiguously the "not running 3D" state, never a disguised low-frame
 * rate version of it.
 */
export function CompanionPortrait({
  variant = "idle",
  className,
}: {
  variant?: "idle" | "error" | "sleep";
  className?: string;
}) {
  const visorColor =
    variant === "error"
      ? "#ff6847"
      : variant === "sleep"
        ? "#3a4350"
        : "#d8ff4f";

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
        <radialGradient id="rc01-bg" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#141d27" />
          <stop offset="100%" stopColor="#06090d" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="240" height="240" fill="url(#rc01-bg)" rx="16" />

      {/* tripod hover base */}
      <g stroke="#8996a3" strokeWidth="2" opacity="0.55">
        <line x1="120" y1="196" x2="78" y2="222" />
        <line x1="120" y1="196" x2="120" y2="228" />
        <line x1="120" y1="196" x2="162" y2="222" />
      </g>
      <ellipse cx="120" cy="196" rx="34" ry="7" fill="#748cff" opacity="0.22" />

      {/* torso */}
      <rect
        x="84"
        y="118"
        width="72"
        height="82"
        rx="18"
        fill="#0d1218"
        stroke="#242c35"
        strokeWidth="2"
      />
      <rect x="94" y="150" width="52" height="6" rx="3" fill={visorColor} opacity="0.85" />

      {/* arms */}
      <g stroke="#4c5560" strokeWidth="10" strokeLinecap="round">
        <path d="M84 138 L58 158" />
        <path d="M156 138 L182 158" />
      </g>
      <circle cx="58" cy="158" r="6" fill="#748cff" />
      <circle cx="182" cy="158" r="6" fill="#748cff" />

      {/* neck + head */}
      <rect x="112" y="98" width="16" height="16" fill="#0d1218" />
      <rect
        x="76"
        y="52"
        width="88"
        height="52"
        rx="22"
        fill="#0d1218"
        stroke="#242c35"
        strokeWidth="2"
      />
      <rect
        x="90"
        y="72"
        width="60"
        height="10"
        rx="5"
        fill={visorColor}
        opacity={variant === "sleep" ? 0.35 : 0.95}
      />

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
