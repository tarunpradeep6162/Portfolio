import { LOGO_COMPACT, LOGO_FULL } from "@/lib/brand/logo";

/**
 * The monogram as inline SVG (no request, inherits text colour). Use
 * `variant="compact"` below ~56 px tall; the full hairline cut above that.
 */
export function Logo({
  variant = "full",
  className,
  title,
}: {
  variant?: "full" | "compact";
  className?: string;
  /** Accessible name; omit when the logo sits next to visible text. */
  title?: string;
}) {
  const art = variant === "compact" ? LOGO_COMPACT : LOGO_FULL;
  return (
    <svg
      viewBox={art.viewBox}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={art.d} />
    </svg>
  );
}
