import { cn } from "@/lib/cn";
import { Container } from "./Container";

/**
 * Section owns the "control" vs "manual" field switch (spec §4, §4.11: one
 * theme per page, sections don't randomly invert) and standard vertical
 * rhythm. Pass `field` only at the exact point the narrative should shift
 * from dark control-plane to light field-manual register - most sections
 * should omit it and inherit whatever the page has already set.
 */
export function Section({
  id,
  field,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  field?: "control" | "manual";
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-field={field}
      className={cn("py-16 sm:py-24", field && "bg-[var(--surface)] text-[var(--ink)]", className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
