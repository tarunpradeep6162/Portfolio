import { site, hero, about, resumeFile } from "@/content/site";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { certifications } from "@/content/certifications";
import { skillDomains } from "@/content/skills";
import { spineStages } from "@/content/spine";
import { projects } from "@/content/projects";
import { blogPosts } from "@/content/blog";
import { isReady } from "@/content/types";

/**
 * Serialises the portfolio's typed content into one plain-text knowledge
 * base for RC-01's system prompt. Two properties matter:
 *
 * 1. Grounding. Every section is tagged with the page it comes from
 *    (`source: /path`), so answers can cite a real page. Fields still marked
 *    "needs-input" are stated as *unknown*, never omitted silently - the
 *    model can then say "not published yet" instead of guessing.
 *
 * 2. Determinism. Output depends only on the content modules - no dates,
 *    random ids or unordered iteration - so the prompt is byte-identical
 *    across requests and the prompt cache actually hits.
 */
export function buildKnowledgeBase(): string {
  const out: string[] = [];
  const section = (title: string, source: string) => out.push(`\n## ${title} (source: ${source})`);

  section("Profile", "/about");
  out.push(
    `Name: ${site.name}`,
    `Headline: ${hero.eyebrow}`,
    `Positioning: ${hero.primaryLine}`,
    `Summary: ${hero.supportingCopy}`,
    `Location: ${site.location}`,
    `Narrative: ${about.narrative}`,
    `Philosophy: ${about.philosophy}`,
  );

  section("Contact", "/contact");
  out.push(
    `Email: ${site.email}`,
    `GitHub: ${site.github}`,
    `LinkedIn: ${site.linkedin}`,
    isReady(resumeFile)
      ? `Résumé PDF: available at ${resumeFile.value.href}`
      : `Résumé PDF: NOT PUBLISHED YET. ${resumeFile.note}`,
  );

  section("Experience", "/resume");
  for (const role of experience) {
    out.push(`- ${role.role} at ${role.org} (${role.dates}${role.location ? `, ${role.location}` : ""})`);
    if (isReady(role.achievements)) {
      for (const item of role.achievements.value) out.push(`  - ${item}`);
    } else {
      out.push(`  - Achievements: NOT PUBLISHED YET. ${role.achievements.note}`);
    }
  }

  section("Education", "/resume");
  for (const entry of education) {
    out.push(`- ${entry.credential}, ${entry.institution} (${entry.date})`);
  }

  section("Certifications", "/resume");
  for (const cert of certifications) {
    const details = [
      cert.completed ? `completed ${cert.completed}` : null,
      isReady(cert.credentialId) ? `credential ID ${cert.credentialId.value}` : "credential ID not published",
      isReady(cert.issuerLink) ? `verify at ${cert.issuerLink.value}` : "no public verification link yet",
    ].filter(Boolean);
    out.push(`- ${cert.name} (${details.join("; ")})`);
  }

  section("Skills, grouped by domain of work actually performed (no proficiency scores exist)", "/about");
  for (const domain of skillDomains) {
    out.push(`- ${domain.domain}: ${domain.items.join(", ")}`);
  }

  section("The Reliability Spine: the 8-stage path every system follows, commit to recovery", "/#spine");
  spineStages.forEach((stage, index) => {
    out.push(`${index + 1}. ${stage.label} [stage id: ${stage.id}]: ${stage.description}`);
  });

  for (const project of projects) {
    if (project.kind !== "flagship") continue;
    section(`Flagship case study: ${project.title}`, `/work/${project.slug}`);
    out.push(
      `Categories: ${project.categories.join(", ")}`,
      `Spine stages covered: ${project.spineStages.join(", ")}`,
      `Summary: ${project.summary}`,
      `Context: ${project.context}`,
      `Tarun's responsibility: ${project.responsibility}`,
      `Architecture flow: ${project.flow}`,
      `Engineering decisions:`,
      ...project.implementationDecisions.map((decision) => `  - ${decision}`),
      `Tools and services: ${project.toolsAndServices.join(", ")}`,
      `Hardest problem and resolution: ${project.challengeAndResolution}`,
      `Outcome: ${project.outcome}`,
      project.links.length
        ? `Links: ${project.links.map((link) => `${link.label} <${link.href}>`).join("; ")}`
        : `Links: none published`,
      isReady(project.screenshot) ? `Screenshot: available` : `Screenshot: not published yet`,
    );
    if (project.labelNote) out.push(`Note: ${project.labelNote}`);
  }

  section("Engineering lab projects (smaller builds, listed on the work index)", "/work");
  for (const project of projects) {
    if (project.kind !== "lab") continue;
    const links = isReady(project.links)
      ? project.links.value.map((link) => `${link.label} <${link.href}>`).join("; ")
      : "repository link not published yet";
    out.push(
      `- ${project.title} [${project.categories.join(", ")}]: ${project.summary} Tools: ${project.toolsAndServices.join(", ")}. Links: ${links}`,
    );
  }

  section(
    "Blog articles (general engineering explainers written for the site - topics Tarun writes about, not claims of specific production work)",
    "/blog",
  );
  for (const post of blogPosts) {
    out.push(`- "${post.title}" <source: /blog/${post.slug}>: ${post.description} Tags: ${post.tags.join(", ")}`);
  }

  return out.join("\n").trim();
}
