import Link from "next/link";
import { cn } from "@/lib/cn";

type ButtonBaseProps = {
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
};

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-[transform,background-color,border-color,color] duration-300 ease-[var(--ease-spine)] whitespace-nowrap active:translate-y-px";

const variants = {
  primary:
    "border border-[var(--accent)] bg-[var(--accent)] text-[var(--color-control-black)] hover:-translate-y-0.5 hover:bg-transparent hover:text-[var(--accent)]",
  secondary:
    "border border-[var(--line)] text-[var(--ink)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:text-[var(--accent)]",
};

export function Button({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: ButtonBaseProps & {
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  const classes = cn(base, variants[variant], className);

  if (isExternal) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
