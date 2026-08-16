"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/command/CommandPalette";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { cn } from "@/lib/cn";

const links = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Résumé" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 h-[4.5rem] border-b border-white/10 bg-[var(--color-control-black)]/92 backdrop-blur-xl">
      <Container className="flex h-full items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-3 text-[var(--color-cloud-linen)]"
        >
          <span className="flex h-9 w-9 items-center justify-center border border-white/15 font-display text-sm font-bold transition-colors group-hover:border-[var(--color-signal-lime)] group-hover:text-[var(--color-signal-lime)]">
            TP
          </span>
          <span className="hidden sm:block">
            <span className="block font-display text-[11px] font-bold uppercase tracking-[0.13em]">
              Tarun Pradeep
            </span>
            <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--color-telemetry-steel)]">
              Cloud systems
            </span>
          </span>
          <span className="sr-only">Tarun Pradeep B - home</span>
        </Link>

        <nav aria-label="Primary" className="hidden sm:block">
          <ul className="flex items-center gap-7 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-cloud-linen)] lg:gap-10">
            {links.map((link, index) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(`${link.href}/`));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2 py-3 transition-[color,text-shadow] hover:text-[var(--color-signal-lime)] hover:drop-shadow-[0_0_8px_rgba(216,255,79,0.4)]",
                      active
                        ? "text-[var(--color-signal-lime)]"
                        : "text-[var(--color-cloud-linen)]",
                    )}
                  >
                    {active && (
                      <span className="absolute bottom-0 left-0 h-0.5 bg-[var(--color-signal-lime)] animate-pulse" style={{animation: "underline-slide 0.6s ease-out forwards, underline-fade 0.8s ease-out forwards"}}></span>
                    )}
                    <span
                      aria-hidden
                      className={cn(
                        "text-[8px]",
                        active
                          ? "text-[var(--color-signal-lime)]"
                          : "text-[var(--color-telemetry-steel)]",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center border border-white/15 transition-[color,border-color] hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun size={18} aria-hidden />
            ) : (
              <Moon size={18} aria-hidden />
            )}
          </button>
          <CommandPalette />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
