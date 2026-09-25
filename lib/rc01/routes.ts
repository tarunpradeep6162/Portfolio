import { projects } from "@/content/projects";
import { blogPosts } from "@/content/blog";

/**
 * The closed set of internal paths RC-01 may cite or navigate to. Built from
 * the same content modules the pages render from, so a path exists here if
 * and only if a real page exists for it - the model can never send a visitor
 * to an invented URL, and a citation link can never point off-site.
 */
export interface SiteRoute {
  path: string;
  label: string;
}

const staticRoutes: SiteRoute[] = [
  { path: "/", label: "Home" },
  { path: "/work", label: "Work index" },
  { path: "/about", label: "About" },
  { path: "/resume", label: "Résumé" },
  { path: "/contact", label: "Contact" },
  { path: "/blog", label: "Blog" },
];

export const siteRoutes: SiteRoute[] = [
  ...staticRoutes,
  ...projects
    .filter((project) => project.kind === "flagship")
    .map((project) => ({ path: `/work/${project.slug}`, label: project.title })),
  ...blogPosts.map((post) => ({ path: `/blog/${post.slug}`, label: post.title })),
];

export const sitePaths: readonly string[] = siteRoutes.map((route) => route.path);

/** Sections on the home page RC-01 can scroll to (ids already in the markup). */
export const homeSections = ["work", "spine", "contact"] as const;
export type HomeSection = (typeof homeSections)[number];

/**
 * Accepts "/work/x" or "/#spine" style references and returns the canonical
 * internal href, or null for anything not in the allowlist (external URLs,
 * protocol-relative URLs, unknown paths, javascript: etc.).
 */
export function resolveInternalHref(raw: string): string | null {
  const href = raw.trim();
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const [path, hash] = href.split("#", 2);
  const normalised = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (!sitePaths.includes(normalised)) return null;
  if (hash === undefined) return normalised;
  if (normalised === "/" && (homeSections as readonly string[]).includes(hash)) {
    return `/#${hash}`;
  }
  return normalised;
}
