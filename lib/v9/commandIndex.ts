import { projects } from "@/content/projects";
import type { VisitorPath } from "@/lib/v6/types";

/**
 * The Command Interface's searchable index - built entirely from real,
 * already-shipped data (site routes, content/projects.ts) plus the three
 * existing VisitorPath values. No new content model: this is a navigation
 * layer over data that already exists and is already rendered elsewhere,
 * per docs/PORTFOLIO_V9_ARCHITECTURE.md's "reused and extended" design for
 * the Command Interface / Recruiter-Engineer-Explorer pillars.
 */
export interface CommandEntry {
  id: string;
  kind: "route" | "project" | "path";
  label: string;
  hint?: string;
  href?: string;
  path?: NonNullable<VisitorPath>;
}

const ROUTES: CommandEntry[] = [
  { id: "route-home", kind: "route", label: "Home", href: "/" },
  { id: "route-work", kind: "route", label: "Work", hint: "Full project index", href: "/work" },
  { id: "route-about", kind: "route", label: "About", href: "/about" },
  { id: "route-resume", kind: "route", label: "Résumé", href: "/resume" },
  { id: "route-contact", kind: "route", label: "Contact", href: "/contact" },
];

const PATHS: CommandEntry[] = [
  {
    id: "path-recruiter",
    kind: "path",
    label: "Read as Recruiter",
    hint: "Fast, outcome-first framing",
    path: "recruiter",
  },
  {
    id: "path-engineer",
    kind: "path",
    label: "Read as Engineer",
    hint: "Full implementation detail",
    path: "engineer",
  },
  {
    id: "path-explorer",
    kind: "path",
    label: "Read as Explorer",
    hint: "A slower, guided walk",
    path: "explorer",
  },
];

/**
 * Only flagship projects get their own route (content/work/[slug] pages) -
 * lab projects are real (see docs/PORTFOLIO_V9_CONTENT_MATRIX.md) but have
 * no individual case-study page, so they are deliberately not indexed here
 * as navigable entries. Indexing a href that doesn't exist would be exactly
 * the kind of fabricated affordance this codebase's evidence-honesty
 * convention exists to prevent.
 */
const PROJECT_ROUTES: CommandEntry[] = projects
  .filter((project) => project.kind === "flagship")
  .map((project) => ({
    id: `project-${project.slug}`,
    kind: "project" as const,
    label: project.title,
    hint: project.categories.join(" · "),
    href: `/work/${project.slug}`,
  }));

export function buildCommandIndex(): CommandEntry[] {
  return [...ROUTES, ...PROJECT_ROUTES, ...PATHS];
}

function normalize(value: string): string {
  return value.toLowerCase();
}

/** Simple substring match across label + hint - no fuzzy scoring, so the
 * matched results are always literally explainable, matching the rest of
 * this codebase's preference for plain, verifiable behavior over "smart"
 * heuristics that are harder to reason about. */
export function filterCommandIndex(entries: CommandEntry[], query: string): CommandEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return entries;
  const needle = normalize(trimmed);
  return entries.filter((entry) => {
    const haystack = normalize(`${entry.label} ${entry.hint ?? ""}`);
    return haystack.includes(needle);
  });
}
