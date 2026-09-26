import Link from "next/link";
import { parseBlocks, type RichBlock, type RichSegment } from "@/lib/rc01/text";

export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

const plain = (segments: RichSegment[]) =>
  segments.map((s) => (s.type === "link" || s.type === "external" ? s.label : s.text)).join("");

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

/**
 * Article markdown -> blocks, dropping a leading H1 that repeats the page
 * title (the posts were authored with their title as the first line).
 */
export function articleBlocks(content: string, title: string): RichBlock[] {
  const blocks = parseBlocks(content.trim());
  const first = blocks[0];
  if (first?.type === "heading" && plain(first.segments).trim() === title.trim()) blocks.shift();
  return blocks;
}

export function tableOfContents(blocks: RichBlock[]): TocEntry[] {
  return blocks
    .filter((b): b is Extract<RichBlock, { type: "heading" }> => b.type === "heading")
    .map((b) => ({ id: slugify(plain(b.segments)), text: plain(b.segments), level: b.level }));
}

function Inline({ segments }: { segments: RichSegment[] }) {
  return (
    <>
      {segments.map((s, i) => {
        switch (s.type) {
          case "link":
            return (
              <Link key={i} href={s.href} className="text-[var(--accent-secondary)] underline decoration-1 underline-offset-4 hover:text-[var(--accent)]">
                {s.label}
              </Link>
            );
          case "external":
            return (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-secondary)] underline decoration-1 underline-offset-4 hover:text-[var(--accent)]">
                {s.label}
              </a>
            );
          case "strong":
            return (
              <strong key={i} className="font-semibold text-[var(--ink)]">
                {s.text}
              </strong>
            );
          case "code":
            return (
              <code key={i} className="rounded-sm bg-[var(--ink)]/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] text-[var(--ink)]">
                {s.text}
              </code>
            );
          default:
            return <span key={i}>{s.text}</span>;
        }
      })}
    </>
  );
}

/** Renders a post in the site's editorial typography. Server component; no HTML is ever injected. */
export function ArticleBody({ blocks }: { blocks: RichBlock[] }) {
  return (
    <div className="space-y-6 text-[1.05rem] leading-8 text-[var(--ink-muted)]">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const text = plain(block.segments);
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag
              key={index}
              id={slugify(text)}
              className={
                block.level === 2
                  ? "scroll-mt-28 pt-8 font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--ink)]"
                  : "scroll-mt-28 pt-2 font-display text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]"
              }
            >
              {text}
            </Tag>
          );
        }
        if (block.type === "code") {
          return (
            <figure key={index} className="overflow-hidden border border-white/10 bg-[var(--color-control-black)]">
              <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-telemetry-steel)]">
                <span>{block.language || "code"}</span>
                <span aria-hidden className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signal-lime)]" />
                </span>
              </figcaption>
              <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-[var(--color-cloud-linen)]">
                <code>{block.code}</code>
              </pre>
            </figure>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={index} className={block.ordered ? "list-decimal space-y-2 pl-6" : "space-y-2"}>
              {block.items.map((item, i) => (
                <li key={i} className={block.ordered ? "pl-1" : "grid grid-cols-[1.25rem_1fr]"}>
                  {!block.ordered && <span aria-hidden className="mt-3 h-px w-2.5 bg-[var(--accent-secondary)]" />}
                  <span>
                    <Inline segments={item} />
                  </span>
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={index}>
            <Inline segments={block.segments} />
          </p>
        );
      })}
    </div>
  );
}
