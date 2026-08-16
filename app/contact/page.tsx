import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { CopyEmailButton } from "@/components/contact/CopyEmailButton";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Tarun Pradeep B by email, GitHub, or LinkedIn.",
};

export default function ContactPage() {
  return (
    <section className="section-glow control-grid relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden bg-[var(--color-control-black)] py-20">
      <div
        aria-hidden
        className="absolute right-[-17rem] top-1/2 h-[48rem] w-[48rem] -translate-y-1/2 rounded-full border border-dashed border-white/10 route-orbit"
      />
      <div
        aria-hidden
        className="absolute right-[-7rem] top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full border border-[var(--color-signal-lime)]/20"
      />
      <div
        aria-hidden
        className="absolute right-[6.5rem] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--color-signal-lime)] shadow-[0_0_30px_var(--color-signal-lime)]"
      />

      <Container className="relative">
        <Eyebrow>Contact / resolved endpoint</Eyebrow>
        <h1 className="mt-7 max-w-[11ch] font-display text-[clamp(3.2rem,1.8rem+5.7vw,8.5rem)] font-semibold leading-[0.84] tracking-[-0.075em] text-[var(--ink)]">
          Start with the problem.
        </h1>
        <p className="mt-7 max-w-[50ch] text-lead leading-8 text-[var(--ink-muted)]">
          The fastest route is email. Describe the infrastructure, deployment,
          support, or recovery problem that needs a dependable path forward.
        </p>

        <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button href={`mailto:${site.email}`}>Email Tarun</Button>
          <CopyEmailButton email={site.email} />
        </div>

        <dl className="mt-14 grid max-w-3xl border-y border-[var(--line)] sm:grid-cols-3">
          <div className="border-b border-[var(--line)] py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0">
            <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Base
            </dt>
            <dd className="mt-2 text-sm text-[var(--ink)]">{site.location}</dd>
          </div>
          <div className="border-b border-[var(--line)] py-5 sm:border-b-0 sm:border-r sm:px-5">
            <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Code
            </dt>
            <dd className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em]">
              <ExternalLink href={site.github}>GitHub</ExternalLink>
            </dd>
          </div>
          <div className="py-5 sm:pl-5">
            <dt className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
              Profile
            </dt>
            <dd className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em]">
              <ExternalLink href={site.linkedin}>LinkedIn</ExternalLink>
            </dd>
          </div>
        </dl>
      </Container>
    </section>
  );
}
