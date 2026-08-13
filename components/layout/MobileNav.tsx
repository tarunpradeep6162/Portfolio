"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/resume", label: "Résumé" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center border border-white/15 text-[var(--color-cloud-linen)] transition-colors hover:border-[var(--color-signal-lime)] hover:text-[var(--color-signal-lime)]"
      >
        {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
      </button>

      {open && (
        <nav
          id="mobile-nav-panel"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full min-h-[calc(100svh-4.5rem)] border-t border-white/10 bg-[var(--color-control-black)] px-4 py-8"
        >
          <p className="mb-8 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-telemetry-steel)]">
            Navigate the system
          </p>
          <ul className="flex flex-col">
            {links.map((link, index) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(`${link.href}/`));
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-16 items-center justify-between border-b border-white/10 font-display text-2xl font-semibold",
                      active
                        ? "text-[var(--color-signal-lime)]"
                        : "text-[var(--color-cloud-linen)]",
                    )}
                  >
                    <span>{link.label}</span>
                    <span
                      aria-hidden
                      className="font-mono text-[10px] text-[var(--color-signal-lime)]"
                    >
                      0{index + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-10 max-w-[28ch] text-sm leading-6 text-[var(--color-telemetry-steel)]">
            Reliable infrastructure, automation, secure delivery, and
            operational recovery.
          </p>
        </nav>
      )}
    </div>
  );
}
