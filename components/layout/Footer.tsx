import Link from "next/link";
import { site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { ExternalLink } from "@/components/ui/ExternalLink";
import { NewsletterSignup } from "@/components/shared/NewsletterSignup";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--color-control-black)] py-12 text-[var(--color-telemetry-steel)]">
      <Container className="mb-12">
        <NewsletterSignup />
      </Container>
      <Container className="grid grid-cols-1 gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-[var(--color-cloud-linen)]">
            {site.name}
          </p>
          <p className="mt-2 max-w-md text-xs leading-5">
            Cloud engineering, DevOps, and systems work documented from first
            commit through recovery.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-5 font-mono text-[10px] uppercase tracking-[0.12em]"
        >
          <ExternalLink href={site.github}>GitHub</ExternalLink>
          <ExternalLink href={site.linkedin}>LinkedIn</ExternalLink>
          <a
            href={`mailto:${site.email}`}
            className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]"
          >
            Email
          </a>
          <Link
            href="/engineering-log"
            className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]"
          >
            How this site is built
          </Link>
          <a
            href="#main-content"
            className="hover:text-[var(--color-signal-lime)]"
          >
            Back to top
          </a>
        </nav>
      </Container>
      <Container className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[0.18em]">
        <span>{site.location}</span>
        <span>Infrastructure atlas / v4</span>
      </Container>
    </footer>
  );
}
