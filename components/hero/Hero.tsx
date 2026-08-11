import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { HeroCopyReveal } from "./HeroCopyReveal";
import { HeroSpineLoader } from "./HeroSpineLoader";
import { HeroSpineFallback } from "./HeroSpineFallback";
import { hero, site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-20 sm:pt-28">
      {/* Ambient WebGL topology behind the whole hero; HeroSpineFallback below is the
          always-in-DOM accessible baseline, not gated on the canvas mounting. */}
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
            className="mt-4 max-w-3xl font-display text-hero font-semibold leading-[1.05] text-[var(--ink)]"
          >
            {hero.primaryLine}
          </h1>
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

          <div data-reveal className="mt-20 border-t border-[var(--line)] pt-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Commit &rarr; Recover
            </p>
            <HeroSpineFallback />
          </div>
        </HeroCopyReveal>
      </Container>
    </section>
  );
}
