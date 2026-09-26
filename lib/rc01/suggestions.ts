import { projects } from "@/content/projects";
import { blogPosts } from "@/content/blog";
import type { Audience } from "./actions";

/**
 * Context-aware starter questions. Pure and deterministic so they render
 * instantly (no model call) and can be unit-tested; they change with the
 * page, the home-page section in view, the audience, and whether the
 * visitor has been reading long enough that a deeper prompt makes sense.
 */
export function suggestionsFor({
  path,
  section,
  audience,
  dwellSeconds,
}: {
  path: string;
  section: string | null;
  audience: Audience | null;
  dwellSeconds: number;
}): string[] {
  const project = /^\/work\/([\w-]+)$/.exec(path);
  if (project) {
    const match = projects.find((item) => item.slug === project[1]);
    if (match) {
      return dwellSeconds >= 25
        ? [
            `Why was ${match.title} built this way?`,
            "What was the hardest problem here?",
            "Show me a related case study",
          ]
        : [
            `Explain ${match.title} in 30 seconds`,
            "Which tools did Tarun use here?",
            "What was his exact responsibility?",
          ];
    }
  }

  const post = /^\/blog\/([\w-]+)$/.exec(path);
  if (post && blogPosts.some((item) => item.slug === post[1])) {
    return ["Which of Tarun's projects relate to this topic?", "Summarise this article", "What else has he written?"];
  }

  if (path === "/" && section === "spine") {
    return [
      "Explain the Reliability Spine in plain English",
      "Which project covers the recover stage?",
      "Walk me through the build stage",
    ];
  }

  if (path === "/contact") {
    return ["What's the fastest way to reach Tarun?", "Copy his email for me", "Where is he based?"];
  }

  switch (audience) {
    case "recruiter":
      return [
        "Summarise Tarun's experience in 30 seconds",
        "What cloud platforms has he worked with?",
        "Which certifications does he hold?",
      ];
    case "engineer":
      return [
        "Walk me through the Jenkins controller architecture",
        "How does he approach recovery and rollback?",
        "What does his CI/CD pipeline look like?",
      ];
    default:
      return [
        "Who is Tarun, in one line?",
        "Show me his strongest project",
        "Explain Kubernetes like I'm five",
      ];
  }
}
