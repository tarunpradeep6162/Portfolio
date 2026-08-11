import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { HeroCopyReveal } from "./HeroCopyReveal";
import { HeroSpineLoader } from "./HeroSpineLoader";
import { hero, site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-16 pt-28">
      {/* Ambient WebGL topology, decorative only (aria-hidden): the accessible,
          described version of this same information is the Reliability Spine
          walkthrough further down the page, not a duplicate copy in here. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <HeroSpineLoader />
      </div>

      <Container className="relative">
        <HeroCopyReveal>
          <p data-reveal className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            {hero.eyebrow}
          </p>
          <h1
            data-reveal
            className="mt-6 font-display text-name font-bold uppercase leading-[0.84] tracking-tight text-[var(--ink)]"
          >
            Tarun
            <br />
            Pradeep
          </h1>
          <p data-reveal className="mt-8 max-w-2xl font-display text-hero font-semibold leading-[1.1] text-[var(--ink)]">
            {hero.primaryLine}
          </p>
          <p data-reveal className="mt-6 max-w-[60ch] text-lead text-[var(--ink-muted)]">
            {hero.supportingCopy}
          </p>

          <div data-reveal className="mt-8 flex flex-wrap items-center gap-4">
            <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div data-reveal className="mt-8 flex gap-6 font-mono text-xs text-[var(--ink-muted)]">
            <ExternalLink href={site.github}>GitHub</ExternalLink>
            <ExternalLink href={site.linkedin}>LinkedIn</ExternalLink>
          </div>
        </HeroCopyReveal>
      </Container>
    </section>
  );
}
