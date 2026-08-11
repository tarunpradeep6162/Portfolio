import { spineStages } from "@/content/spine";

const nodes = [
  { x: 118, y: 520, tx: 58, ty: 554 },
  { x: 178, y: 390, tx: 72, ty: 382 },
  { x: 278, y: 302, tx: 204, ty: 270 },
  { x: 386, y: 154, tx: 326, ty: 110 },
  { x: 514, y: 226, tx: 542, ty: 206 },
  { x: 588, y: 350, tx: 612, ty: 356 },
  { x: 544, y: 500, tx: 570, ty: 538 },
  { x: 384, y: 574, tx: 324, ty: 626 },
] as const;

const route = nodes
  .map((node, index) => `${index === 0 ? "M" : "L"} ${node.x} ${node.y}`)
  .join(" ");

/**
 * An always-visible, zero-JavaScript alternative to the faint V3 WebGL layer.
 * Every label is sourced from the real Reliability Spine. Motion is cosmetic,
 * CSS-only, and collapses under prefers-reduced-motion.
 */
export function InfrastructureObservatory() {
  return (
    <figure
      aria-hidden
      className="relative mx-auto aspect-square w-full max-w-[42rem] overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_50%,#121f2c_0%,#080d12_52%,#06090d_74%)] shadow-[0_0_0_1px_rgba(216,255,79,0.03),0_50px_120px_rgba(0,0,0,0.45)]"
    >
      <div className="absolute inset-[8%] rounded-full border border-white/[0.05]" />
      <div className="absolute inset-[19%] rounded-full border border-dashed border-white/10 observatory-orbit" />
      <div className="absolute inset-[31%] rounded-full border border-white/[0.07] observatory-orbit-reverse" />

      <svg
        viewBox="0 0 700 700"
        className="absolute inset-0 h-full w-full"
        focusable="false"
      >
        <defs>
          <radialGradient id="coreGlow">
            <stop offset="0" stopColor="#d8ff4f" stopOpacity="0.22" />
            <stop offset="1" stopColor="#d8ff4f" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <g opacity="0.24" stroke="#8996a3" strokeWidth="1">
          <line x1="350" y1="36" x2="350" y2="664" />
          <line x1="36" y1="350" x2="664" y2="350" />
          <circle
            cx="350"
            cy="350"
            r="286"
            fill="none"
            strokeDasharray="2 12"
          />
          <circle cx="350" cy="350" r="214" fill="none" />
        </g>

        <circle cx="350" cy="350" r="150" fill="url(#coreGlow)" />
        <path
          d={route}
          fill="none"
          stroke="#d8ff4f"
          strokeOpacity="0.16"
          strokeWidth="12"
          filter="url(#softGlow)"
        />
        <path
          d={route}
          fill="none"
          stroke="#d8ff4f"
          strokeWidth="2"
          className="observatory-trace"
        />

        <g>
          <circle
            cx="350"
            cy="350"
            r="84"
            fill="#0a1118"
            stroke="#d8ff4f"
            strokeOpacity="0.55"
          />
          <circle
            cx="350"
            cy="350"
            r="69"
            fill="none"
            stroke="#748cff"
            strokeOpacity="0.32"
            strokeDasharray="4 7"
            className="observatory-orbit"
          />
          <text
            x="350"
            y="336"
            textAnchor="middle"
            fill="#8996a3"
            fontFamily="var(--font-mono)"
            fontSize="10"
            letterSpacing="3"
          >
            RELIABILITY
          </text>
          <text
            x="350"
            y="365"
            textAnchor="middle"
            fill="#f8f8f3"
            fontFamily="var(--font-display)"
            fontWeight="700"
            fontSize="22"
          >
            CORE
          </text>
          <text
            x="350"
            y="385"
            textAnchor="middle"
            fill="#d8ff4f"
            fontFamily="var(--font-mono)"
            fontSize="8"
            letterSpacing="2"
          >
            08 STAGES / VERIFIED PATH
          </text>
        </g>

        {nodes.map((node, index) => {
          const stage = spineStages[index];
          const anchor =
            node.tx > node.x ? "start" : node.tx < node.x ? "end" : "middle";
          return (
            <g key={stage.id}>
              <line
                x1="350"
                y1="350"
                x2={node.x}
                y2={node.y}
                stroke="#8996a3"
                strokeOpacity="0.12"
              />
              <circle
                cx={node.x}
                cy={node.y}
                r="16"
                fill="#d8ff4f"
                fillOpacity="0.08"
                className="observatory-pulse"
                style={{ animationDelay: `${index * 180}ms` }}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r="6"
                fill={
                  index % 3 === 0
                    ? "#ff6847"
                    : index % 2 === 0
                      ? "#748cff"
                      : "#d8ff4f"
                }
              />
              <text
                x={node.tx}
                y={node.ty}
                textAnchor={anchor}
                fill="#8996a3"
                fontFamily="var(--font-mono)"
                fontSize="9"
                letterSpacing="1.8"
              >
                {String(index + 1).padStart(2, "0")} /{" "}
                {stage.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        <g
          fill="#8996a3"
          fontFamily="var(--font-mono)"
          fontSize="8"
          letterSpacing="1.7"
        >
          <text x="88" y="112">
            REGION / CHENNAI
          </text>
          <text x="88" y="128">
            MODE / INFRASTRUCTURE
          </text>
          <text x="612" y="598" textAnchor="end">
            AWS · AZURE · LINUX
          </text>
          <text x="612" y="614" textAnchor="end">
            DOCKER · JENKINS
          </text>
        </g>
      </svg>

      <div className="absolute left-[9%] top-1/2 flex -translate-y-1/2 -rotate-90 items-center gap-3 font-mono text-[8px] uppercase tracking-[0.28em] text-white/35">
        <span className="h-px w-10 bg-[var(--color-signal-lime)]" /> Live system
        map
      </div>
    </figure>
  );
}
