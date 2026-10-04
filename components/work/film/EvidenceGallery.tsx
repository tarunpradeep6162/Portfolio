/**
 * Real screenshots and diagrams from a project's own evidence report.
 * Each image opens full size in a new tab. Images were cropped before
 * publishing so no URLs, IPs, account IDs or secrets are visible.
 */
export function EvidenceGallery({ items }: { items: { src: string; alt: string; caption: string }[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <figure key={item.src} className="group" data-hover-light>
          <a
            href={item.src}
            target="_blank"
            rel="noopener"
            className="block overflow-hidden border border-[var(--line)] bg-[var(--color-control-black)]"
            aria-label={`Open full size: ${item.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              decoding="async"
              className="aspect-[16/10] w-full bg-[var(--color-control-black)] object-contain p-2 transition-transform duration-500 ease-[var(--ease-spine)] group-hover:scale-[1.02]"
            />
          </a>
          <figcaption className="mt-2.5 font-mono text-[9px] uppercase leading-5 tracking-[0.1em] text-[var(--ink-muted)]">
            {item.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
