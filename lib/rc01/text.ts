import { resolveInternalHref } from "./routes";

export type RichSegment =
  | { type: "text"; text: string }
  | { type: "link"; label: string; href: string }
  | { type: "external"; label: string; href: string }
  | { type: "strong"; text: string }
  | { type: "code"; text: string };

export type RichBlock =
  | { type: "paragraph"; segments: RichSegment[] }
  | { type: "heading"; level: 2 | 3; segments: RichSegment[] }
  | { type: "list"; ordered: boolean; items: RichSegment[][] }
  | { type: "code"; language: string; code: string };

const LINK = /\[([^\]\n]{1,160})\]\(([^)\s]{1,300})\)/g;

/** Only plain https URLs may render as outbound links. */
function safeExternal(href: string): string | null {
  try {
    const url = new URL(href);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Inline markdown -> render-safe segments. Internal paths that exist become
 * citation chips; https URLs become outbound links (rendered with
 * rel="noopener noreferrer nofollow"); anything else (javascript:, data:,
 * unknown internal paths) degrades to its plain label. No HTML is ever
 * interpreted - every segment is rendered as text by React.
 */
export function parseRichText(input: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let last = 0;
  for (const match of input.matchAll(LINK)) {
    const [full, label, target] = match;
    const index = match.index ?? 0;
    if (index > last) segments.push(...parseInline(input.slice(last, index)));
    const internal = target.startsWith("/") ? resolveInternalHref(target) : null;
    const external = internal ? null : safeExternal(target);
    segments.push(
      internal
        ? { type: "link", label, href: internal }
        : external
          ? { type: "external", label, href: external }
          : { type: "text", text: label },
    );
    last = index + full.length;
  }
  if (last < input.length) segments.push(...parseInline(input.slice(last)));
  return segments;
}

function parseInline(text: string): RichSegment[] {
  const out: RichSegment[] = [];
  // Inline code first (its contents are literal), then bold in the rest.
  text.split(/`([^`\n]+)`/g).forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) {
      out.push({ type: "code", text: part });
      return;
    }
    part.split(/\*\*([^*\n]+)\*\*/g).forEach((piece, j) => {
      if (!piece) return;
      out.push(j % 2 === 1 ? { type: "strong", text: piece } : { type: "text", text: piece });
    });
  });
  return out;
}

/**
 * Block-level markdown: fenced code, bullet/numbered lists, paragraphs.
 * Tolerates a still-streaming answer (an unclosed fence renders as code).
 */
export function parseBlocks(input: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  const lines = input.replace(/\r/g, "").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", segments: parseRichText(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: "list", ordered: list.ordered, items: list.items.map(parseRichText) });
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^\s*```\s*([\w+#.-]*)\s*$/.exec(line);
    if (fence) {
      flushParagraph();
      flushList();
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
      blocks.push({ type: "code", language: fence[1] ?? "", code: code.join("\n") });
      continue;
    }
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: heading[1].length <= 2 ? 2 : 3, segments: parseRichText(heading[2]) });
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** Citation targets in an answer, deduplicated, in order of appearance. */
export function extractCitations(input: string): { label: string; href: string }[] {
  const seen = new Set<string>();
  const out: { label: string; href: string }[] = [];
  for (const segment of parseRichText(input)) {
    if (segment.type === "link" && !seen.has(segment.href)) {
      seen.add(segment.href);
      out.push({ label: segment.label, href: segment.href });
    }
  }
  return out;
}

/**
 * The part of a (possibly still streaming) answer that should be spoken:
 * complete code blocks are dropped, and anything after an unclosed fence is
 * held back. Prefix-stable as the answer grows, so a consumed-length cursor
 * over it is safe.
 */
export function speakablePart(answer: string): string {
  let out = "";
  let rest = answer;
  for (;;) {
    const open = rest.indexOf("```");
    if (open === -1) return out + rest;
    out += rest.slice(0, open);
    const close = rest.indexOf("```", open + 3);
    if (close === -1) return out;
    rest = rest.slice(close + 3);
    out += " ";
  }
}

/** What the voice should actually say: link labels, no markdown punctuation. */
export function toSpeech(text: string): string {
  return text
    .replace(LINK, "$1")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pulls complete sentences off the front of a growing buffer so speech can
 * start while the answer is still streaming. A sentence ends at . ! ? or a
 * newline followed by whitespace/end; abbreviations like "e.g." and
 * version numbers like "v1.0" don't split.
 */
const ABBREVIATION = /(?:\b(?:e\.g|i\.e|etc|vs|approx|incl|Mr|Mrs|Ms|Dr|St|No)|(?:^|\s)[A-Za-z])$/i;

export function takeSentences(buffer: string): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  const boundary = /([.!?])(\s+)(?=["'(\[A-Z0-9])|\n+/g;
  let start = 0;
  for (const match of buffer.matchAll(boundary)) {
    const index = match.index ?? 0;
    // "e.g. Docker" / "Dr. Smith" / "U.S. teams" are not sentence ends.
    if (match[1] === "." && ABBREVIATION.test(buffer.slice(start, index))) continue;
    const end = index + (match[1] ? 1 : 0);
    const sentence = buffer.slice(start, end).trim();
    if (sentence) sentences.push(sentence);
    start = index + match[0].length;
  }
  return { sentences, rest: buffer.slice(start) };
}
