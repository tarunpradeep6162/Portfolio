import { describe, it, expect } from "vitest";
import { buildCommandIndex, filterCommandIndex } from "@/lib/v9/commandIndex";
import { projects } from "@/content/projects";

describe("commandIndex", () => {
  it("indexes exactly the 5 real routes", () => {
    const index = buildCommandIndex();
    const routeHrefs = index.filter((e) => e.kind === "route").map((e) => e.href);
    expect(routeHrefs.sort()).toEqual(["/", "/about", "/contact", "/resume", "/work"].sort());
  });

  it("indexes only flagship projects, never lab projects (no case-study page exists for labs)", () => {
    const index = buildCommandIndex();
    const projectEntries = index.filter((e) => e.kind === "project");
    const flagshipSlugs = projects.filter((p) => p.kind === "flagship").map((p) => p.slug);
    expect(projectEntries).toHaveLength(flagshipSlugs.length);
    for (const entry of projectEntries) {
      expect(entry.href).toMatch(/^\/work\//);
      const slug = entry.href!.replace("/work/", "");
      expect(flagshipSlugs).toContain(slug);
    }
  });

  it("indexes exactly the 3 existing VisitorPath values, matching lib/v6/types.ts", () => {
    const index = buildCommandIndex();
    const paths = index.filter((e) => e.kind === "path").map((e) => e.path);
    expect(paths.sort()).toEqual(["engineer", "explorer", "recruiter"].sort());
  });

  it("every entry has a real, navigable href or a real dispatchable path - never both missing", () => {
    const index = buildCommandIndex();
    for (const entry of index) {
      expect(entry.href || entry.path).toBeTruthy();
    }
  });

  it("filterCommandIndex returns everything for an empty query", () => {
    const index = buildCommandIndex();
    expect(filterCommandIndex(index, "")).toHaveLength(index.length);
    expect(filterCommandIndex(index, "   ")).toHaveLength(index.length);
  });

  it("filterCommandIndex matches case-insensitively on label", () => {
    const index = buildCommandIndex();
    const results = filterCommandIndex(index, "AURORA");
    expect(results.some((e) => e.label.includes("Aurora"))).toBe(true);
  });

  it("filterCommandIndex matches on hint text (e.g. category)", () => {
    const index = buildCommandIndex();
    const results = filterCommandIndex(index, "cloud");
    expect(results.length).toBeGreaterThan(0);
  });

  it("filterCommandIndex returns nothing for a query matching no entry", () => {
    const index = buildCommandIndex();
    expect(filterCommandIndex(index, "zzz-no-such-thing-zzz")).toHaveLength(0);
  });

  it("filterCommandIndex matches recruiter/engineer/explorer commands by label", () => {
    const index = buildCommandIndex();
    expect(filterCommandIndex(index, "recruiter").some((e) => e.path === "recruiter")).toBe(true);
    expect(filterCommandIndex(index, "engineer").some((e) => e.path === "engineer")).toBe(true);
    expect(filterCommandIndex(index, "explorer").some((e) => e.path === "explorer")).toBe(true);
  });
});
