import { projects } from "@/content/projects";
import type { FlagshipProject, SpineStageId } from "@/content/types";

export type EvidenceStatus = "verified" | "explained" | "missing";

export interface EvidenceRecord {
  id: string;
  projectSlug: string;
  projectTitle: string;
  stageId?: SpineStageId;
  claim: string;
  status: EvidenceStatus;
  sourceLabel?: string;
  sourceUrl?: string;
  limitation?: string;
}

/**
 * The Proof Ledger's records, derived entirely from existing project
 * content (content/projects.ts) - no second content database, per spec
 * Section 10.7's explicit instruction. This is the same three-way split
 * ProofMode.tsx already implements per-project, reshaped into a flat,
 * filterable list so it can be viewed across every project at once and
 * filtered by System Trace's selectedStageId.
 *
 * Mapping decision (recorded in docs/OPERATIONAL_TWIN_V7_ARCHITECTURE.md):
 * - real links / real tools-and-services -> "verified" (named, checkable facts)
 * - implementation decisions / challenge-and-resolution / disclosure notes
 *   (e.g. Secure AWS's learning-implementation label) -> "explained" (true
 *   and real, but needs context to not be misread)
 * - an empty links array / a not-ready screenshot -> "missing", using the
 *   project's own existing honest wording, never hidden
 */
export function computeEvidenceRecords(): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];

  for (const project of projects) {
    if (project.kind !== "flagship") {
      // Lab projects: only their links field carries a verified/missing
      // signal today - everything else about them is a one-line summary,
      // not enough structured content to split three ways honestly.
      if (project.links.status === "ready" && project.links.value.length > 0) {
        for (const link of project.links.value) {
          records.push({
            id: `${project.slug}-link-${link.href}`,
            projectSlug: project.slug,
            projectTitle: project.title,
            claim: link.label,
            status: "verified",
            sourceLabel: link.label,
            sourceUrl: link.href,
          });
        }
      } else {
        records.push({
          id: `${project.slug}-links-missing`,
          projectSlug: project.slug,
          projectTitle: project.title,
          claim: "Public repository or live link",
          status: "missing",
          limitation:
            project.links.status === "needs-input" ? project.links.note : "No link supplied yet.",
        });
      }
      continue;
    }

    const flagship: FlagshipProject = project;
    const primaryStage = flagship.spineStages[0];

    for (const tool of flagship.toolsAndServices) {
      records.push({
        id: `${flagship.slug}-tool-${tool}`,
        projectSlug: flagship.slug,
        projectTitle: flagship.title,
        stageId: primaryStage,
        claim: tool,
        status: "verified",
      });
    }

    if (flagship.links.length > 0) {
      for (const link of flagship.links) {
        records.push({
          id: `${flagship.slug}-link-${link.href}`,
          projectSlug: flagship.slug,
          projectTitle: flagship.title,
          claim: link.label,
          status: "verified",
          sourceLabel: link.label,
          sourceUrl: link.href,
        });
      }
    } else {
      records.push({
        id: `${flagship.slug}-links-missing`,
        projectSlug: flagship.slug,
        projectTitle: flagship.title,
        claim: "Public repository or live link",
        status: "missing",
        limitation: "No public repository or live link is available for this project.",
      });
    }

    if (flagship.screenshot.status !== "ready") {
      records.push({
        id: `${flagship.slug}-screenshot-missing`,
        projectSlug: flagship.slug,
        projectTitle: flagship.title,
        claim: "Real product screenshot",
        status: "missing",
        limitation:
          flagship.screenshot.status === "needs-input"
            ? flagship.screenshot.note
            : "No real product screenshot supplied - the cover art shown is generated from this project's own architecture data, not a screenshot.",
      });
    }

    for (const decision of flagship.implementationDecisions) {
      records.push({
        id: `${flagship.slug}-decision-${decision.slice(0, 40)}`,
        projectSlug: flagship.slug,
        projectTitle: flagship.title,
        claim: decision,
        status: "explained",
      });
    }

    if (flagship.labelNote) {
      records.push({
        id: `${flagship.slug}-disclosure`,
        projectSlug: flagship.slug,
        projectTitle: flagship.title,
        claim: flagship.labelNote,
        status: "explained",
      });
    }
  }

  return records;
}
