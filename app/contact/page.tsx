import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { ContactForm } from "@/components/contact/ContactForm";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Tarun Pradeep B. Discuss your infrastructure, deployment, or recovery challenges.",
};

export default function ContactPage() {
  return (
    <section className="control-grid relative overflow-hidden bg-[var(--color-dark-navy)] py-20">
      <div
        aria-hidden
        className="absolute right-[-17rem] top-1/2 h-[48rem] w-[48rem] -translate-y-1/2 rounded-full border border-dashed border-white/10 route-orbit"
      />
      <div
        aria-hidden
        className="absolute right-[-7rem] top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-[var(--color-gold-primary)]/20"
      />
      <div
        aria-hidden
        className="absolute right-[6.5rem] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--color-gold-primary)] shadow-[0_0_30px_var(--color-gold-primary)]"
      />

      <Container className="relative">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <Eyebrow>Contact / resolved endpoint</Eyebrow>
            <h1 className="mt-7 max-w-[11ch] font-display text-[clamp(3.2rem,1.8rem+5.7vw,6rem)] font-semibold leading-[0.84] tracking-[-0.075em] text-[var(--ink)]">
              Start with the problem.
            </h1>
            <p className="mt-7 max-w-[50ch] text-lead leading-8 text-[var(--ink-muted)]">
              Describe the infrastructure, deployment, support, or recovery problem that needs a dependable path forward.
            </p>

            <dl className="mt-14 grid border-y border-[var(--line)] sm:grid-cols-3 sm:border-y-0 sm:border-t sm:border-b sm:gap-4">
              <div className="border-b border-[var(--line)] py-5 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0">
                <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Base
                </dt>
                <dd className="mt-2 text-sm text-[var(--ink)]">{site.location}</dd>
              </div>
              <div className="border-b border-[var(--line)] py-5 sm:border-b-0 sm:border-r sm:px-4">
                <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Code
                </dt>
                <dd className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                  <ExternalLink href={site.github}>GitHub</ExternalLink>
                </dd>
              </div>
              <div className="py-5 sm:pl-4">
                <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Profile
                </dt>
                <dd className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                  <ExternalLink href={site.linkedin}>LinkedIn</ExternalLink>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-[var(--surface)] p-8 rounded-xl border border-[var(--line)]">
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
