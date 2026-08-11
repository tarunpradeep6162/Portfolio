import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { NeedsInput } from "@/components/shared/NeedsInput";
import { Button } from "@/components/ui/Button";
import { resumeFile, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Résumé",
  description: "Download or request Tarun Pradeep B's current résumé.",
};

export default function ResumePage() {
  return (
    <Section field="manual" className="pt-16">
      <Eyebrow>Résumé</Eyebrow>
      <h1 className="mt-3 max-w-3xl font-display text-display font-semibold text-[var(--ink)]">
        Résumé
      </h1>

      {resumeFile.status === "ready" ? (
        <div className="mt-8">
          <Button href={resumeFile.value.href}>Download résumé (PDF)</Button>
        </div>
      ) : (
        <div className="mt-8 flex max-w-[60ch] flex-col gap-6">
          <NeedsInput note={resumeFile.note} />
          <p className="text-[var(--ink-muted)]">
            In the meantime, request the current résumé directly and it will be sent by email.
          </p>
          <div>
            <Button href={`mailto:${site.email}?subject=Résumé request`}>Request résumé by email</Button>
          </div>
        </div>
      )}
    </Section>
  );
}
