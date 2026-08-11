import { site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { ExternalLink } from "@/components/ui/ExternalLink";

export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)] py-10 text-[var(--ink-muted)]">
      <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <p className="font-mono text-xs">
          {site.name} · {site.location}
        </p>

        <nav aria-label="Footer" className="flex items-center gap-6 font-mono text-xs">
          <ExternalLink href={site.github}>GitHub</ExternalLink>
          <ExternalLink href={site.linkedin}>LinkedIn</ExternalLink>
          <a href={`mailto:${site.email}`} className="underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent)]">
            Email
          </a>
          <a href="#main-content" className="hover:text-[var(--accent)]">
            Back to top
          </a>
        </nav>
      </Container>
    </footer>
  );
}
