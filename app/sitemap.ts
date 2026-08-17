import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { projects } from "@/content/projects";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/work",
    "/about",
    "/blog",
    "/resume",
    "/contact",
    "/engineering-log",
  ].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    priority: path === "" ? 1.0 : 0.8,
  }));

  const projectRoutes = projects
    .filter((p) => p.kind === "flagship")
    .map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      lastModified: new Date(),
      priority: 0.7,
    }));

  const blogPosts = await getAllPosts();
  const blogRoutes = blogPosts.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}
