import { cn } from "@/lib/cn";

const LIME = "#d8ff4f";
const BLUE = "#748cff";
const CORAL = "#ff6847";
const INK = "#f8f8f3";
const MUTED = "#8996a3";
const LINE = "#26303a";
const BG = "#080d12";

export type CoverArtVariant = "pipeline" | "hub-spoke" | "tiered" | "flow";

function parseSteps(flow: string): string[] {
  return flow.split("->").map((step) => step.trim());
}

function ArtGrid() {
  return (
    <g stroke={LINE} strokeWidth="1" opacity="0.5">
      {Array.from({ length: 12 }).map((_, index) => (
        <line
          key={`v-${index}`}
          x1={index * 100}
          y1="0"
          x2={index * 100}
          y2="700"
        />
      ))}
      {Array.from({ length: 7 }).map((_, index) => (
        <line
          key={`h-${index}`}
          x1="0"
          y1={index * 100}
          x2="1200"
          y2={index * 100}
        />
      ))}
    </g>
  );
}

function ArtChrome({ code, title }: { code: string; title: string }) {
  return (
    <g fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2">
      <text x="48" y="48" fill={LIME}>
        {code}
      </text>
      <text x="1152" y="48" textAnchor="end" fill={MUTED}>
        {title}
      </text>
      <text x="48" y="660" fill={MUTED}>
        INFRASTRUCTURE ATLAS / VERIFIED FLOW
      </text>
      <text x="1152" y="660" textAnchor="end" fill={MUTED}>
        TARUN PRADEEP / V4
      </text>
    </g>
  );
}

function PipelineArt({ steps }: { steps: string[] }) {
  const points = steps.map((_, index) => ({
    x: 92 + index * 165,
    y: index % 2 === 0 ? 238 : 410,
  }));
  const route = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 1200 700"
      className="h-full w-full"
      role="img"
      aria-label={`Deployment pipeline: ${steps.join(" then ")}`}
    >
      <rect width="1200" height="700" fill={BG} />
      <ArtGrid />
      <ArtChrome code="ARCH / 01" title="CONTAINER DELIVERY" />
      <text
        x="600"
        y="382"
        textAnchor="middle"
        fill={INK}
        opacity="0.025"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize="270"
      >
        SHIP
      </text>
      <path
        d={route}
        fill="none"
        stroke={CORAL}
        strokeOpacity="0.18"
        strokeWidth="18"
      />
      <path
        d={route}
        fill="none"
        stroke={CORAL}
        strokeWidth="3"
        className="cover-flow"
      />
      {points.map((point, index) => (
        <g key={`${steps[index]}-${index}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r="27"
            fill={BG}
            stroke={index % 2 === 0 ? CORAL : BLUE}
            strokeWidth="2"
          />
          <circle
            cx={point.x}
            cy={point.y}
            r="6"
            fill={
              index === points.length - 1
                ? LIME
                : index % 2 === 0
                  ? CORAL
                  : BLUE
            }
          />
          <text
            x={point.x}
            y={point.y + (index % 2 === 0 ? -46 : 54)}
            textAnchor="middle"
            fill={INK}
            fontFamily="var(--font-mono)"
            fontSize="12"
          >
            {steps[index]}
          </text>
          <text
            x={point.x}
            y={point.y + 4}
            textAnchor="middle"
            fill={MUTED}
            fontFamily="var(--font-mono)"
            fontSize="9"
          >
            {String(index + 1).padStart(2, "0")}
          </text>
        </g>
      ))}
    </svg>
  );
}

function HubSpokeArt({ steps }: { steps: string[] }) {
  return (
    <svg
      viewBox="0 0 1200 700"
      className="h-full w-full"
      role="img"
      aria-label={`Orchestration flow: ${steps.join(" then ")}`}
    >
      <rect width="1200" height="700" fill={BG} />
      <ArtGrid />
      <ArtChrome code="ARCH / 02" title="DISTRIBUTED EXECUTION" />
      <circle
        cx="600"
        cy="338"
        r="238"
        fill="none"
        stroke={BLUE}
        strokeOpacity="0.16"
        strokeDasharray="3 12"
      />
      <circle
        cx="600"
        cy="338"
        r="168"
        fill="none"
        stroke={CORAL}
        strokeOpacity="0.12"
      />

      <g>
        <rect
          x="112"
          y="180"
          width="330"
          height="285"
          fill="#0d151d"
          stroke={CORAL}
          strokeWidth="2"
        />
        <text
          x="140"
          y="218"
          fill={CORAL}
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="2"
        >
          CONTROLLER / 01
        </text>
        <text
          x="140"
          y="336"
          fill={INK}
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="32"
        >
          Jenkins
        </text>
        <text
          x="140"
          y="368"
          fill={MUTED}
          fontFamily="var(--font-mono)"
          fontSize="12"
        >
          Ubuntu / orchestration
        </text>
      </g>
      <g>
        <rect
          x="758"
          y="180"
          width="330"
          height="285"
          fill="#0d151d"
          stroke={BLUE}
          strokeWidth="2"
        />
        <text
          x="786"
          y="218"
          fill={BLUE}
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="2"
        >
          BUILD AGENT / 02
        </text>
        <text
          x="786"
          y="336"
          fill={INK}
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="32"
        >
          Linux
        </text>
        <text
          x="786"
          y="368"
          fill={MUTED}
          fontFamily="var(--font-mono)"
          fontSize="12"
        >
          SSH / execution
        </text>
      </g>

      <path
        d="M442 322 C 520 280, 680 280, 758 322"
        fill="none"
        stroke={LIME}
        strokeWidth="3"
        className="cover-flow"
      />
      <text
        x="600"
        y="276"
        textAnchor="middle"
        fill={LIME}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="2"
      >
        SECURE SSH CHANNEL
      </text>

      {steps.map((step, index) => (
        <g key={step}>
          <rect
            x={300 + index * 210}
            y="520"
            width="180"
            height="54"
            fill="#101821"
            stroke={index === 1 ? LIME : LINE}
          />
          <text
            x={390 + index * 210}
            y="553"
            textAnchor="middle"
            fill={INK}
            fontFamily="var(--font-mono)"
            fontSize="11"
          >
            {step}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TieredArt({ steps }: { steps: string[] }) {
  const colors = [CORAL, BLUE, BLUE, LIME];
  return (
    <svg
      viewBox="0 0 1200 700"
      className="h-full w-full"
      role="img"
      aria-label={`Architecture tiers: ${steps.join(" then ")}`}
    >
      <rect width="1200" height="700" fill={BG} />
      <ArtGrid />
      <ArtChrome code="ARCH / 03" title="PRODUCTION CONTROL PLANE" />
      <text
        x="94"
        y="350"
        fill={INK}
        opacity="0.035"
        fontFamily="var(--font-display)"
        fontWeight="800"
        fontSize="230"
      >
        VPC
      </text>
      <path
        d="M440 126 L1080 126 L1012 574 L372 574 Z"
        fill="#0d151d"
        stroke={LINE}
        strokeWidth="2"
      />
      {steps.map((step, index) => {
        const y = 170 + index * 96;
        const inset = index * 32;
        return (
          <g key={step}>
            <path
              d={`M ${472 + inset} ${y} L ${1028 - inset} ${y} L ${1016 - inset} ${y + 62} L ${460 + inset} ${y + 62} Z`}
              fill="#111b25"
              stroke={colors[index]}
              strokeWidth="2"
            />
            <text
              x={492 + inset}
              y={y + 25}
              fill={colors[index]}
              fontFamily="var(--font-mono)"
              fontSize="9"
              letterSpacing="2"
            >
              TIER {String(index + 1).padStart(2, "0")}
            </text>
            <text
              x={492 + inset}
              y={y + 48}
              fill={INK}
              fontFamily="var(--font-display)"
              fontWeight="600"
              fontSize="17"
            >
              {step}
            </text>
          </g>
        );
      })}
      <g
        fill={MUTED}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="1.5"
      >
        <text x="96" y="476">
          PUBLIC ENTRY
        </text>
        <text x="96" y="500">
          PRIVATE COMPUTE
        </text>
        <text x="96" y="524">
          OBSERVABILITY
        </text>
        <text x="96" y="548">
          RECOVERY
        </text>
      </g>
    </svg>
  );
}

function FlowArt({ steps }: { steps: string[] }) {
  const positions = [
    { x: 600, y: 146 },
    { x: 890, y: 344 },
    { x: 600, y: 542 },
    { x: 310, y: 344 },
  ];
  const route = `${positions.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} Z`;

  return (
    <svg
      viewBox="0 0 1200 700"
      className="h-full w-full"
      role="img"
      aria-label={`Application flow: ${steps.join(" then ")}`}
    >
      <rect width="1200" height="700" fill={BG} />
      <ArtGrid />
      <ArtChrome code="ARCH / 04" title="APPLICATION RUNTIME" />
      <circle
        cx="600"
        cy="344"
        r="246"
        fill="none"
        stroke={LINE}
        strokeWidth="2"
      />
      <circle
        cx="600"
        cy="344"
        r="154"
        fill="#0d151d"
        stroke={BLUE}
        strokeOpacity="0.45"
        strokeDasharray="5 9"
      />
      <path
        d={route}
        fill="none"
        stroke={CORAL}
        strokeOpacity="0.2"
        strokeWidth="20"
      />
      <path
        d={route}
        fill="none"
        stroke={CORAL}
        strokeWidth="3"
        className="cover-flow"
      />
      <text
        x="600"
        y="331"
        textAnchor="middle"
        fill={MUTED}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="2"
      >
        AUTHENTICATION
      </text>
      <text
        x="600"
        y="365"
        textAnchor="middle"
        fill={INK}
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="28"
      >
        REQUEST LOOP
      </text>
      {steps.map((step, index) => {
        const point = positions[index] ?? positions[positions.length - 1];
        return (
          <g key={`${step}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="52"
              fill="#101821"
              stroke={
                index === steps.length - 1
                  ? LIME
                  : index % 2 === 0
                    ? CORAL
                    : BLUE
              }
              strokeWidth="2"
            />
            <text
              x={point.x}
              y={point.y - 7}
              textAnchor="middle"
              fill={MUTED}
              fontFamily="var(--font-mono)"
              fontSize="8"
            >
              0{index + 1}
            </text>
            <text
              x={point.x}
              y={point.y + 14}
              textAnchor="middle"
              fill={INK}
              fontFamily="var(--font-mono)"
              fontSize="10"
            >
              {step}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export const COVER_ART_LEGEND: Record<CoverArtVariant, string> = {
  pipeline:
    "Coral traces the build and deployment route; blue marks runtime/network stages; read the numbered path from left to right.",
  "hub-spoke":
    "The coral controller orchestrates work over the lime SSH channel; the blue agent performs execution.",
  tiered:
    "The nested control plane reads top to bottom from public entry through internal services and recovery.",
  flow: "The request loop moves clockwise through the application's verified deployment stages.",
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
  const Component = {
    pipeline: PipelineArt,
    "hub-spoke": HubSpokeArt,
    tiered: TieredArt,
    flow: FlowArt,
  }[variant];

  return (
    <div
      className={cn(
        "project-card-art aspect-[12/7] w-full overflow-hidden bg-[var(--color-dark-navy)] transition-transform duration-700 ease-[var(--ease-spine)]",
        bordered && "border border-[var(--line)]",
      )}
    >
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
