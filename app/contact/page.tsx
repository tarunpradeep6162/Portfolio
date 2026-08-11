import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import { site, resumeFile } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Tarun Pradeep B by email, GitHub, or LinkedIn.",
};

export default function ContactPage() {
  return (
    <Section field="manual" className="pt-16">
      <Eyebrow>Contact</Eyebrow>
      <h1 className="mt-3 max-w-3xl font-display text-display font-semibold text-[var(--ink)]">
        Let&rsquo;s talk about a system that needs building.
      </h1>
      <p className="mt-4 max-w-[60ch] text-[var(--ink-muted)]">
        The fastest way to reach me is email. GitHub and LinkedIn are open for a closer look at the work.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Button href={`mailto:${site.email}`}>Email Tarun</Button>
        <CopyEmailButton email={site.email} />
      </div>

      <ul className="mt-10 flex flex-wrap gap-8 font-mono text-sm">
        <li>
          <ExternalLink href={site.github}>GitHub</ExternalLink>
        </li>
        <li>
          <ExternalLink href={site.linkedin}>LinkedIn</ExternalLink>
        </li>
        {resumeFile.status === "ready" && (
          <li>
            <a href="/resume" className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
              Résumé
            </a>
          </li>
        )}
      </ul>
    </Section>
  );
}
