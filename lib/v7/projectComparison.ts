import { spineStages } from "@/content/spine";
import type { FlagshipProject } from "@/content/types";
import { classifyTopology } from "./topologyClassifier";
import { parseFlowNodes } from "@/lib/v6/flowParser";

export interface ComparisonRow {
  dimension: string;
  left: string;
  right: string;
}

const SECURITY_KEYWORDS = ["iam", "security group", "least-privilege", "least privilege", "encrypt", "vpc", "auth"];
const OBSERVABILITY_KEYWORDS = ["cloudwatch", "monitor", "log", "alarm", "sns", "metric"];

function matchingSentences(project: FlagshipProject, keywords: string[]): string {
  const haystack = [...project.implementationDecisions, ...project.toolsAndServices];
  const matches = haystack.filter((text) =>
    keywords.some((keyword) => text.toLowerCase().includes(keyword)),
  );
  return matches.length > 0 ? matches.join("; ") : "Not documented for this project.";
}

/**
 * Every dimension below is derived from fields that already exist on
 * FlagshipProject - spec Section 10.8's "use only existing verified
 * content." Security-controls/observability rows are keyword matches
 * against the project's own real toolsAndServices/implementationDecisions
 * text, not a separate hand-authored assessment; when nothing matches,
 * the row says so honestly instead of leaving a blank cell or inventing
 * a summary.
 */
export function compareProjects(a: FlagshipProject, b: FlagshipProject): ComparisonRow[] {
  const stageLabel = (id: string) => spineStages.find((s) => s.id === id)?.label ?? id;

  const topologyFor = (project: FlagshipProject) =>
    classifyTopology(parseFlowNodes(project.flow)).kind;

  const evidenceFor = (project: FlagshipProject) => {
    const parts: string[] = [];
    parts.push(project.links.length > 0 ? `${project.links.length} verified link(s)` : "No verified link");
    parts.push(project.screenshot.status === "ready" ? "Real screenshot" : "No real screenshot");
    return parts.join("; ");
  };

  const limitationsFor = (project: FlagshipProject) =>
    project.labelNote ?? "None recorded.";

  return [
    {
      dimension: "Categories",
      left: a.categories.join(", "),
      right: b.categories.join(", "),
    },
    {
      dimension: "Demonstrated Reliability Spine stages",
      left: a.spineStages.map(stageLabel).join(" → "),
      right: b.spineStages.map(stageLabel).join(" → "),
    },
    {
      dimension: "Architecture shape",
      left: topologyFor(a),
      right: topologyFor(b),
    },
    {
      dimension: "Tools & services",
      left: a.toolsAndServices.join(", "),
      right: b.toolsAndServices.join(", "),
    },
    {
      dimension: "Security-related decisions",
      left: matchingSentences(a, SECURITY_KEYWORDS),
      right: matchingSentences(b, SECURITY_KEYWORDS),
    },
    {
      dimension: "Observability",
      left: matchingSentences(a, OBSERVABILITY_KEYWORDS),
      right: matchingSentences(b, OBSERVABILITY_KEYWORDS),
    },
    {
      dimension: "Evidence available",
      left: evidenceFor(a),
      right: evidenceFor(b),
    },
    {
      dimension: "Known limitations",
      left: limitationsFor(a),
      right: limitationsFor(b),
    },
  ];
}
