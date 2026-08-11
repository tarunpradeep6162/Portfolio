/**
 * Code-generated architectural cover art, replacing the "Needs project
 * screenshot" placeholder (spec §5: "Do not publicly render 'Needs project
 * screenshot' ... create original code-based architectural cover art using
 * SVG"). Built entirely from each project's own real `flow` string - no
 * fabricated browser screenshots, no invented metrics. Four distinct
 * compositions (one per variant) so flagship projects don't read as
 * identical cards with different labels.
 */

import { cn } from "@/lib/cn";

const ACCENT = "#ff6b45";
const PACKET = "#2f7cff";
const LINE = "#2c313a";
const INK = "#f1f0e8";
const MUTED = "#8797a5";

export type CoverArtVariant = "pipeline" | "hub-spoke" | "tiered" | "flow";

function parseSteps(flow: string): string[] {
  return flow.split("->").map((s) => s.trim());
}

/** Horizontal CI/CD-style pipeline - Project Aurora (7-step container flow). */
function PipelineArt({ steps }: { steps: string[] }) {
  const width = 1200;
  const height = 520;
  const boxH = 64;
  const fontSize = 12;
  const charWidth = fontSize * 0.64;
  const hPad = 14;
  const minBoxW = 96;
  const boxWidths = steps.map((step) => Math.max(minBoxW, step.length * charWidth + hPad * 2));
  const totalBoxW = boxWidths.reduce((a, b) => a + b, 0);
  const gap = (width - 80 - totalBoxW) / (steps.length - 1);
  const y = height / 2 - boxH / 2;

  const positions: number[] = [];
  let cursor = 40;
  boxWidths.forEach((w) => {
    positions.push(cursor);
    cursor += w + gap;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Deployment pipeline: ${steps.join(" then ")}`}>
      <rect width={width} height={height} fill="#0b1116" />
      {/* faint grid, cartography texture */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={(i + 1) * (width / 13)} y1={0} x2={(i + 1) * (width / 13)} y2={height} stroke={LINE} strokeWidth={1} opacity={0.3} />
      ))}
      <line x1={40} y1={y + boxH / 2} x2={width - 40} y2={y + boxH / 2} stroke={MUTED} strokeWidth={1.5} opacity={0.4} />
      {steps.map((step, i) => {
        const x = positions[i];
        const boxW = boxWidths[i];
        const isEdge = i === 0 || i === steps.length - 1;
        return (
          <g key={step}>
            {i > 0 && (
              <path
                d={`M ${positions[i - 1] + boxWidths[i - 1]} ${y + boxH / 2} L ${x} ${y + boxH / 2}`}
                stroke={ACCENT}
                strokeWidth={2}
                markerEnd="url(#arrow)"
              />
            )}
            <rect
              x={x}
              y={y}
              width={boxW}
              height={boxH}
              rx={2}
              fill={isEdge ? "#152029" : "#0f1620"}
              stroke={i % 2 === 0 ? ACCENT : PACKET}
              strokeWidth={1.5}
            />
            <text x={x + boxW / 2} y={y + boxH / 2 + 5} textAnchor="middle" fill={INK} fontSize={fontSize} fontFamily="var(--font-mono)">
              {step}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="arrow" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  );
}

/** Two-host orchestration relationship - Jenkins controller/agent. */
function HubSpokeArt({ steps }: { steps: string[] }) {
  const width = 1200;
  const height = 520;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Orchestration flow: ${steps.join(" then ")}`}>
      <rect width={width} height={height} fill="#0b1116" />
      {/* Controller host */}
      <rect x={140} y={120} width={280} height={180} rx={2} fill="#152029" stroke={ACCENT} strokeWidth={1.5} />
      <text x={280} y={100} textAnchor="middle" fill={ACCENT} fontSize={12} fontFamily="var(--font-mono)" letterSpacing={2}>
        CONTROLLER
      </text>
      <text x={280} y={218} textAnchor="middle" fill={INK} fontSize={16} fontFamily="var(--font-mono)">
        Jenkins (Ubuntu)
      </text>

      {/* SSH connection */}
      <line x1={420} y1={210} x2={780} y2={210} stroke={PACKET} strokeWidth={2} strokeDasharray="6 4" />
      <text x={600} y={190} textAnchor="middle" fill={PACKET} fontSize={12} fontFamily="var(--font-mono)">
        SSH
      </text>

      {/* Agent host */}
      <rect x={780} y={120} width={280} height={180} rx={2} fill="#0f1620" stroke={PACKET} strokeWidth={1.5} />
      <text x={920} y={100} textAnchor="middle" fill={PACKET} fontSize={12} fontFamily="var(--font-mono)" letterSpacing={2}>
        BUILD AGENT
      </text>
      <text x={920} y={218} textAnchor="middle" fill={INK} fontSize={16} fontFamily="var(--font-mono)">
        Linux (executor)
      </text>

      {/* Flow steps below, as the actual pipeline stages */}
      {steps.map((step, i) => {
        const x = 200 + i * 300;
        return (
          <g key={step}>
            <rect x={x} y={360} width={220} height={56} rx={2} fill="#0f1620" stroke={LINE} strokeWidth={1.5} />
            <text x={x + 110} y={393} textAnchor="middle" fill={INK} fontSize={13} fontFamily="var(--font-mono)">
              {step}
            </text>
            {i < steps.length - 1 && (
              <path d={`M ${x + 220} 388 L ${x + 300} 388`} stroke={ACCENT} strokeWidth={2} markerEnd="url(#arrow2)" />
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arrow2" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  );
}

/** Layered VPC tiers - Secure AWS Production Architecture. */
function TieredArt({ steps }: { steps: string[] }) {
  const width = 1200;
  const height = 520;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Architecture tiers: ${steps.join(" then ")}`}>
      <rect width={width} height={height} fill="#0b1116" />
      <rect x={80} y={40} width={width - 160} height={height - 80} rx={2} fill="none" stroke={LINE} strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={100} y={30} fill={MUTED} fontSize={11} fontFamily="var(--font-mono)" letterSpacing={2}>
        VPC
      </text>
      {steps.map((step, i) => {
        const y = 60 + i * 105;
        return (
          <g key={step}>
            <rect x={110} y={y} width={width - 220} height={80} rx={2} fill={i % 2 === 0 ? "#152029" : "#0f1620"} stroke={i === 0 ? ACCENT : PACKET} strokeWidth={1.5} />
            <text x={130} y={y + 28} fill={i === 0 ? ACCENT : PACKET} fontSize={11} fontFamily="var(--font-mono)" letterSpacing={1.5}>
              {`TIER ${String(i + 1).padStart(2, "0")}`}
            </text>
            <text x={130} y={y + 54} fill={INK} fontSize={16} fontFamily="var(--font-mono)">
              {step}
            </text>
            {i < steps.length - 1 && (
              <path d={`M ${width / 2} ${y + 80} L ${width / 2} ${y + 105}`} stroke={MUTED} strokeWidth={1.5} markerEnd="url(#arrow3)" />
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arrow3" markerWidth={8} markerHeight={8} refX={4} refY={6} orient="auto">
          <path d="M0,0 L4,8 L8,0 Z" fill={MUTED} />
        </marker>
      </defs>
    </svg>
  );
}

/** Compact request-flow diagram - Node.js auth + RDS. */
function FlowArt({ steps }: { steps: string[] }) {
  const width = 1200;
  const height = 520;
  const cy = height / 2;
  const fontSize = 13;
  const charWidth = fontSize * 0.62;
  const hPad = 24;
  const gap = 54;
  const boxWidths = steps.map((step) => Math.max(130, step.length * charWidth + hPad * 2));

  const positions: number[] = [];
  let cursor = 190;
  boxWidths.forEach((w) => {
    positions.push(cursor);
    cursor += w + gap;
  });
  const totalWidth = cursor - gap;
  const offset = Math.max(0, (width - totalWidth) / 2 - positions[0] + 190);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Application flow: ${steps.join(" then ")}`}>
      <rect width={width} height={height} fill="#0b1116" />
      <circle cx={offset + 100} cy={cy} r={22} fill="none" stroke={PACKET} strokeWidth={2} />
      <text x={offset + 100} y={cy + 45} textAnchor="middle" fill={PACKET} fontSize={11} fontFamily="var(--font-mono)">
        client
      </text>
      {steps.map((step, i) => {
        const x = offset + positions[i];
        const w = boxWidths[i];
        const prevEnd = i === 0 ? offset + 122 : offset + positions[i - 1] + boxWidths[i - 1];
        return (
          <g key={step}>
            <path d={`M ${prevEnd} ${cy} L ${x} ${cy}`} stroke={ACCENT} strokeWidth={2} markerEnd="url(#arrow4)" />
            <rect x={x} y={cy - 40} width={w} height={80} rx={2} fill="#152029" stroke={ACCENT} strokeWidth={1.5} />
            <text x={x + w / 2} y={cy + 5} textAnchor="middle" fill={INK} fontSize={fontSize} fontFamily="var(--font-mono)">
              {step}
            </text>
          </g>
        );
      })}
      <defs>
        <marker id="arrow4" markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={ACCENT} />
        </marker>
      </defs>
    </svg>
  );
}

export const COVER_ART_LEGEND: Record<CoverArtVariant, string> = {
  pipeline: "Orange = build/deploy stage · Blue = network/runtime stage · read left to right",
  "hub-spoke": "Orange border = controller host · Blue border = agent host · dashed line = SSH connection",
  tiered: "Orange = public-facing tier · Blue = internal tier · read top to bottom",
  flow: "Orange = application stage · Blue outline = client · read left to right",
};

export function ProjectCoverArt({
  flow,
  variant,
  bordered = true,
}: {
  flow: string;
  variant: CoverArtVariant;
  bordered?: boolean;
}) {
  const steps = parseSteps(flow);
  const Component = { pipeline: PipelineArt, "hub-spoke": HubSpokeArt, tiered: TieredArt, flow: FlowArt }[variant];
  return (
    <div className={cn("w-full overflow-hidden rounded-none", bordered && "border border-[var(--line)]")}>
      <Component steps={steps} />
    </div>
  );
}

const VARIANT_BY_SLUG: Record<string, CoverArtVariant> = {
  "project-aurora": "pipeline",
  "distributed-jenkins-controller": "hub-spoke",
  "secure-aws-production-architecture": "tiered",
  "nodejs-auth-mysql-rds": "flow",
};

export function getCoverArtVariant(slug: string): CoverArtVariant {
  return VARIANT_BY_SLUG[slug] ?? "pipeline";
}
