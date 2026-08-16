import { projects } from "@/content/projects";
import { spineStages } from "@/content/spine";
import { isReady, type FlagshipProject } from "@/content/types";

export type EvidenceStatus = "verified" | "needs-input";

export interface EvidenceNode {
  id: string;
  label: string;
  status: EvidenceStatus;
  href?: string;
  detail: string;
}

export interface ProjectEvidenceChain {
  projectSlug: string;
  projectTitle: string;
  nodes: EvidenceNode[];
  spineStageLabels: string[];
}

const stageLabelById = new Map(spineStages.map((stage) => [stage.id, stage.label]));

/**
 * The V9 Evidence Graph's data layer (docs/PORTFOLIO_V9_ARCHITECTURE.md /
 * docs/PORTFOLIO_V9_IMPLEMENTATION_PLAN.md Phase 4). Built entirely from
 * content/projects.ts and content/spine.ts - no new content, no invented
 * edges. A project's repository/screenshot node is "verified" only when
 * that project's own real content field actually has a value; otherwise
 * it is "needs-input", exactly matching CONTENT_GAPS.md and never
 * silently omitted.
 *
 * Only flagship projects get a chain: lab projects have no `screenshot`
 * field at all in the content model (content/types.ts's LabProject type),
 * so a "screenshot" node for a lab project would have nothing real to
 * report - same reasoning lib/v9/commandIndex.ts already applied to
 * excluding lab projects from route search.
 */
export function buildEvidenceGraph(): ProjectEvidenceChain[] {
  const flagships = projects.filter(
    (project): project is FlagshipProject => project.kind === "flagship",
  );

  return flagships.map((project) => {
    const repoLink = project.links.find((link) => link.label === "Repository");
    const repositoryNode: EvidenceNode = repoLink
      ? {
          id: `${project.slug}-repository`,
          label: "Repository",
          status: "verified",
          href: repoLink.href,
          detail: "Real, public repository link.",
        }
      : {
          id: `${project.slug}-repository`,
          label: "Repository",
          status: "needs-input",
          detail: "No repository link supplied yet.",
        };

    const screenshotNode: EvidenceNode = isReady(project.screenshot)
      ? {
          id: `${project.slug}-screenshot`,
          label: "Screenshot",
          status: "verified",
          detail: "Real project screenshot supplied.",
        }
      : {
          id: `${project.slug}-screenshot`,
          label: "Screenshot",
          status: "needs-input",
          detail: project.screenshot.note,
        };

    return {
      projectSlug: project.slug,
      projectTitle: project.title,
      nodes: [repositoryNode, screenshotNode],
      spineStageLabels: project.spineStages.map((id) => stageLabelById.get(id) ?? id),
    };
  });
}
