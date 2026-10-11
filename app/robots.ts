import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { AI_TRAINING_CRAWLERS } from "@/lib/security/crawlers";

/**
 * Search engines and link previews: welcome. AI-training crawlers: opted
 * out (a published preference - enforcement for verified bots is the
 * Vercel Firewall AI Bots rule; see lib/security/crawlers.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: [...AI_TRAINING_CRAWLERS], disallow: "/" },
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
