import { ArrowDownRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { HeroCopyReveal } from "./HeroCopyReveal";
import { InfrastructureObservatory } from "./InfrastructureObservatory";
import { ParallaxLayers } from "./ParallaxLayers";
import { OperationalTwinHost } from "@/components/v7/OperationalTwinHost";
import { hero, site } from "@/content/site";

export function Hero() {
  return (
    <section className="control-grid relative overflow-hidden border-b border-[var(--line)] bg-[var(--color-control-black)]">
      <ParallaxLayers />

      <Container className="relative grid grid-cols-1 min-h-[calc(100svh-4.5rem)] items-center gap-12 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)] lg:gap-8 lg:py-16">
        <HeroCopyReveal>
          <div className="relative z-10 max-w-[46rem]">
            <p
              data-reveal
              className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] sm:text-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-40 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
              </span>
              {hero.eyebrow}
            </p>

            <h1
              data-reveal
              className="mt-7 font-display text-name font-bold uppercase leading-[0.78] tracking-[-0.075em] gradient-text"
            >
              Tarun
              <br />
              <span>Pradeep</span>
            </h1>

            <p
              data-reveal
              className="mt-8 max-w-xl font-display text-[clamp(1.6rem,1.1rem+1.7vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--ink)]"
            >
              {hero.primaryLine}
            </p>
            <p
              data-reveal
              className="mt-5 max-w-[58ch] text-[0.98rem] leading-7 text-[var(--ink-muted)] sm:text-base"
            >
              {hero.supportingCopy}
            </p>

            <div data-reveal className="mt-8 flex flex-wrap items-center gap-3">
              <Button href={hero.primaryCta.href}>
                {hero.primaryCta.label} <ArrowDownRight size={16} aria-hidden />
              </Button>
              <Button href={hero.secondaryCta.href} variant="secondary">
                {hero.secondaryCta.label}
              </Button>
            </div>

            <div data-reveal>
              <OperationalTwinHost />
            </div>

            <div
              data-reveal
              className="mt-7 flex gap-6 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]"
            >
              <ExternalLink href={site.github}>GitHub</ExternalLink>
              <ExternalLink href={site.linkedin}>LinkedIn</ExternalLink>
            </div>
          </div>
        </HeroCopyReveal>

        <div className="relative -mx-10 -mb-20 -mt-6 min-w-0 sm:-mx-4 lg:m-0">
          <InfrastructureObservatory />
        </div>
      </Container>

      <div className="border-t border-[var(--line)] bg-black/15">
        <Container className="grid divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["Role", "Cloud Engineer"],
            ["Focus", "Secure delivery · Reliability"],
            ["Base", site.location],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-5 py-4 sm:block sm:px-6 sm:first:pl-0"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                {value}
              </p>
            </div>
          ))}
        </Container>
      </div>
    </section>
  );
}
