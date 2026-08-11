import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { MobileNav } from "@/components/layout/MobileNav";

const links = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Résumé" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="relative z-40 h-16 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <Container className="flex h-full items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-[var(--ink)]">
          TP
          <span className="sr-only">Tarun Pradeep B - home</span>
        </Link>

        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-8 font-mono text-sm text-[var(--ink)]">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-[var(--accent)]">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}
