import type { Field } from "./types";

export const site = {
  name: "Tarun Pradeep B",
  title: "Tarun Pradeep B | Cloud Engineer & DevOps Professional",
  description:
    "Cloud Engineer and DevOps professional in Chennai building reliable AWS, Azure, Linux, Docker, Jenkins, CI/CD, networking, and infrastructure solutions.",
  // Placeholder until a real deployment domain exists; updated at deploy time (spec §21).
  url: "https://tarunpradeep.dev",
  location: "Chennai, Tamil Nadu, India",
  email: "tarunpradeep2003@gmail.com",
  github: "https://github.com/tarunpradeep6162",
  linkedin: "https://www.linkedin.com/in/tarun-pradeep-b-/",
} as const;

export const hero = {
  eyebrow: "Cloud Engineer · DevOps · Chennai",
  primaryLine: "I engineer reliable paths from commit to cloud.",
  supportingCopy:
    "I'm Tarun Pradeep, a Cloud Engineer focused on infrastructure, automation, secure delivery, and operational reliability across AWS, Azure, Linux, Docker, and Jenkins.",
  primaryCta: { label: "Explore the systems", href: "/work" },
  secondaryCta: { label: "View résumé", href: "/resume" },
} as const;

export const about = {
  narrative:
    "I build and support the systems behind dependable digital services. My path began in systems engineering and IT operations, where I learned to diagnose hardware, networks, access controls, Windows infrastructure, and production issues under pressure. I now apply that operational foundation to cloud infrastructure and DevOps - designing AWS environments, containerising applications, building CI/CD workflows, managing Linux systems, and turning manual deployments into repeatable processes.",
  // Same closing line as the narrative above, split out as its own field so
  // it can be set at pull-quote scale on the About page instead of ending
  // the paragraph at body size - not a new fact, just a presentational split.
  philosophy:
    "I care about reliability, security, clear documentation, and understanding why a system works, not merely getting it to run once.",
} as const;

export const resumeFile: Field<{ href: string }> = {
  status: "needs-input",
  note: "No resume PDF has been supplied yet, and the only version referenced elsewhere lists an outdated employer timeline. Request the current résumé by email in the meantime.",
};
