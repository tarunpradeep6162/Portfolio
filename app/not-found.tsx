import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { UnresolvedEndpoint } from "@/components/shared/UnresolvedEndpoint";

export default function NotFound() {
  return (
    <Section field="manual" className="pt-16">
      <Eyebrow>404</Eyebrow>
      <h1 className="mt-3 max-w-2xl font-display text-display font-semibold text-[var(--ink)]">
        This route doesn&rsquo;t resolve.
      </h1>
      <p className="mt-4 max-w-[50ch] text-[var(--ink-muted)]">
        Every real route on this site resolves to a page. This one didn&rsquo;t &mdash; it was moved,
        renamed, or never existed.
      </p>
      <UnresolvedEndpoint />
      <div className="mt-10">
        <Button href="/">Back to home</Button>
      </div>
    </Section>
  );
}
