import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Section field="manual" className="pt-16">
      <Eyebrow>404</Eyebrow>
      <h1 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
        This route doesn&rsquo;t exist.
      </h1>
      <p className="mt-4 max-w-[50ch] text-[var(--ink-muted)]">
        The page you&rsquo;re looking for was moved, renamed, or never existed.
      </p>
      <div className="mt-8">
        <Button href="/">Back to home</Button>
      </div>
    </Section>
  );
}
