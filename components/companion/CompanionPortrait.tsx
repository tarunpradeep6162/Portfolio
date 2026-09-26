/**
 * Zero-JS-cost static portrait of RC-01 (v9: Tarun's armoured digital twin,
 * rendered from the same model as the 3D companion). Used whenever the 3D
 * layer should not load or render: reduced motion, low-power mode, WebGL
 * unavailable, a canvas error, and the loading skeleton. No animation - if
 * this is on screen, it is unambiguously the "not running 3D" state, never
 * a disguised low-frame-rate version of it.
 */
export function CompanionPortrait({
  variant = "idle",
  className,
}: {
  variant?: "idle" | "error" | "sleep";
  className?: string;
}) {
  const label =
    variant === "error"
      ? "RC-01 portrait, error state"
      : variant === "sleep"
        ? "RC-01 portrait, power-saving state"
        : "RC-01, the Reliability Companion, static portrait";

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f14] ${className ?? ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed 8 KB portrait */}
      <img
        src="/rc01/portrait.webp"
        alt=""
        width={320}
        height={320}
        draggable={false}
        className="h-full w-full object-cover"
        style={variant === "sleep" ? { filter: "grayscale(0.7) brightness(0.45)" } : undefined}
      />
      {variant === "error" && <span className="absolute inset-0 bg-[#ff6847]/30 mix-blend-color" aria-hidden />}
    </div>
  );
}
