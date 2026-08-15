import { spineStages } from "./spine";
import { projects } from "./projects";
import { skillDomains } from "./skills";
import { site } from "./site";
import { isReady } from "./types";
import type { SpineStageId, ProjectCategory } from "./types";
import { automationStages } from "./v7/automation";

/**
 * Every word RC-01 can speak or caption is generated here from the same
 * typed content the rest of the site renders from - never authored as
 * free-standing copy. If a fact is a Field<> "needs-input" elsewhere, the
 * companion states that honestly instead of inventing a value.
 */

export interface CompanionScript {
  id: string;
  title: string;
  lines: string[];
}

const flagships = projects.filter((project) => project.kind === "flagship");
const labProjects = projects.filter((project) => project.kind === "lab");

export const scripts: Record<string, CompanionScript> = {
  welcome: {
    id: "welcome",
    title: "Welcome",
    lines: [
      "Welcome to Tarun Pradeep's infrastructure observatory.",
      "I'm RC-01, an interactive systems guide built into this portfolio.",
      "I can walk through the Reliability Spine, the project systems, real skill domains, or how to get in touch. You can also skip me and browse normally at any time.",
    ],
  },
  spine: {
    id: "spine",
    title: "The Reliability Spine",
    lines: [
      `The Reliability Spine is the real eight-stage path every one of Tarun's systems follows, from commit to recovery.`,
      ...spineStages.map(
        (stage, index) =>
          `Stage ${index + 1}, ${stage.label}: ${stage.description}`,
      ),
      "Each flagship project below maps to specific stages in this spine — it's how the case studies are organized, not decoration.",
    ],
  },
  projects: {
    id: "projects",
    title: "Flagship systems",
    lines: [
      `There are ${flagships.length} flagship systems documented in detail, plus ${labProjects.length} smaller engineering-lab builds.`,
      ...flagships.map((project) => `${project.title}. ${project.summary}`),
    ],
  },
  skills: {
    id: "skills",
    title: "Capability matrix",
    lines: [
      `Skills are grouped into ${skillDomains.length} engineering domains, by work actually performed — no percentage bars or invented proficiency scores.`,
      ...skillDomains.map(
        (domain) =>
          `${domain.domain}: ${domain.items.slice(0, 5).join(", ")}${domain.items.length > 5 ? ", and more" : ""}.`,
      ),
    ],
  },
  contact: {
    id: "contact",
    title: "Contact",
    lines: [
      `Tarun is based in ${site.location}.`,
      `The fastest path is email, at ${site.email}.`,
      `GitHub and LinkedIn profiles are also linked from the header and the contact page.`,
    ],
  },
  recruiterBrief: {
    id: "recruiterBrief",
    title: "Recruiter summary",
    lines: [
      "For a fast overview: Tarun is a Cloud Engineer working across AWS, Azure, Linux, Docker, and Jenkins.",
      `${flagships.length} flagship systems and ${labProjects.length} lab projects are documented with real tools and outcomes — nothing here is a template placeholder.`,
      "The résumé page has the full operating history, and the contact page has verified ways to reach him directly.",
    ],
  },
  pipeline: {
    id: "pipeline",
    title: "Automation Fabric",
    lines: [
      `This site ships through a real pipeline, ${automationStages.length} stages from Change to Rollback readiness.`,
      ...automationStages.map(
        (stage) => `${stage.stage}, run by ${stage.tool}: ${stage.evidence.status === "verified" ? "verified" : "pending — not yet run for this version"}.`,
      ),
      "Every stage's real status is in the Proof Ledger section below, with evidence links where they exist.",
    ],
  },
};

/**
 * One short script per real Reliability Spine stage, so the Reliability
 * Spine Tour can highlight and narrate one stage at a time instead of
 * flashing all eight together (v5.1 - "synchronise tour steps with
 * individual Reliability Spine stages").
 */
export const spineStageScripts: Record<SpineStageId, CompanionScript> = Object.fromEntries(
  spineStages.map((stage, index) => [
    stage.id,
    {
      id: `spine:${stage.id}`,
      title: `Stage ${index + 1} — ${stage.label}`,
      lines: [`Stage ${index + 1}, ${stage.label}: ${stage.description}`],
    },
  ]),
) as Record<SpineStageId, CompanionScript>;

/**
 * Category → accent color mapping for RC-01's visor during a project
 * briefing (v5.1 - "project briefings must use project-specific accent
 * states"). Falls back to the standard lime status color for categories
 * without a dedicated accent.
 */
export const PROJECT_ACCENT_BY_CATEGORY: Partial<Record<ProjectCategory, string>> = {
  Cloud: "#748cff",
  DevOps: "#d8ff4f",
  Systems: "#ff6847",
  "Creative Engineering": "#748cff",
};

export function accentForProjectSlug(slug: string): string | null {
  const project = flagships.find((item) => item.slug === slug);
  if (!project) return null;
  return PROJECT_ACCENT_BY_CATEGORY[project.categories[0]] ?? null;
}

export function projectBriefing(slug: string): CompanionScript | null {
  const project = flagships.find((item) => item.slug === slug);
  if (!project) return null;
  const lines = [
    `${project.title}.`,
    project.summary,
    `Flow: ${project.flow}.`,
    `Tools and services: ${project.toolsAndServices.join(", ")}.`,
  ];
  if (isReady(project.screenshot)) {
    lines.push("A real screenshot is available for this system.");
  }
  return { id: `project:${slug}`, title: project.title, lines };
}

export type CompanionTourId =
  | "recruiter"
  | "engineering"
  | "project"
  | "spine"
  | "contact";

export interface TourStep {
  scriptId: string;
  /** In-page anchor to scroll to on the home page, if present there. */
  anchor?: string;
  /**
   * The specific Reliability Spine stage this step is about, if any -
   * drives which single stage the Observatory/spine list highlights and
   * which direction RC-01's "pointing" gesture corresponds to.
   */
  stageId?: SpineStageId;
  /** Route to offer navigating to after this step (confirmed, never automatic). */
  suggestedRoute?: { href: string; label: string };
}

export interface CompanionTour {
  id: CompanionTourId;
  label: string;
  description: string;
  steps: TourStep[];
}

export const tours: CompanionTour[] = [
  {
    id: "recruiter",
    label: "Recruiter Tour",
    description: "A fast, factual overview for hiring and screening.",
    steps: [
      { scriptId: "welcome" },
      { scriptId: "recruiterBrief" },
      { scriptId: "skills", anchor: "work" },
      {
        scriptId: "contact",
        suggestedRoute: { href: "/resume", label: "Open the résumé" },
      },
    ],
  },
  {
    id: "engineering",
    label: "Engineering Tour",
    description: "The Reliability Spine and the technical decisions behind it.",
    steps: [
      { scriptId: "welcome" },
      { scriptId: "spine", anchor: "spine" },
      {
        scriptId: "projects",
        anchor: "work",
        suggestedRoute: { href: "/work", label: "Open the full work index" },
      },
    ],
  },
  {
    id: "project",
    label: "Project Tour",
    description: "Walk through each flagship system one at a time.",
    steps: [
      { scriptId: "welcome" },
      ...flagships.map((project) => ({
        scriptId: `project:${project.slug}`,
        suggestedRoute: {
          href: `/work/${project.slug}`,
          label: `Open ${project.title}`,
        },
      })),
    ],
  },
  {
    id: "spine",
    label: "Reliability Spine Tour",
    description: "The eight-stage delivery protocol, one stage at a time.",
    steps: spineStages.map((stage) => ({
      scriptId: `spine:${stage.id}`,
      anchor: "spine",
      stageId: stage.id,
    })),
  },
  {
    id: "contact",
    label: "Contact Tarun",
    description: "Verified ways to reach Tarun directly.",
    steps: [
      { scriptId: "contact" },
      {
        scriptId: "contact",
        suggestedRoute: { href: "/contact", label: "Open the contact page" },
      },
    ],
  },
];

/** Precomputed so the tour builder above can reference project scripts by id. */
for (const project of flagships) {
  const briefing = projectBriefing(project.slug);
  if (briefing) scripts[briefing.id] = briefing;
}
for (const stage of spineStages) {
  scripts[`spine:${stage.id}`] = spineStageScripts[stage.id];
}

export const consoleCommands = [
  "help",
  "projects",
  "spine",
  "skills",
  "resume",
  "contact",
  "mute",
  "stop",
  "atlas",
  "proof",
  "recruiter",
  "engineer",
  "explorer",
  // V7 additions: unlike the commands above (which only narrate), these
  // dispatch into the shared experience reducer - a real, observable
  // effect on Atlas/the Operational Twin/System Trace/Proof Ledger, not
  // simulated console text. See CompanionExperience.tsx's
  // handleConsoleCommand for exactly what each one dispatches.
  "twin",
  "reset",
  "pipeline",
] as const;

export type ConsoleCommand = (typeof consoleCommands)[number];

export const consoleHelpText =
  `Available commands: ${consoleCommands.join(", ")}. ` +
  "Unrecognized input is not answered freely — RC-01 only runs this documented set.";
