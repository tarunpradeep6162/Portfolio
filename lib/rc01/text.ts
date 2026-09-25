import { resolveInternalHref } from "./routes";

export type RichSegment =
  | { type: "text"; text: string }
  | { type: "link"; label: string; href: string }
  | { type: "strong"; text: string };

const LINK = /\[([^\]\n]{1,120})\]\(([^)\s]{1,200})\)/g;

/**
 * Turns a model answer into render-safe segments. Markdown links become
 * citation chips only when they resolve to a real internal page; anything
 * else (external URLs, javascript:, unknown paths) degrades to its plain
 * label - so the model can't smuggle a link to somewhere we don't control.
 * No HTML is ever interpreted.
 */
export function parseRichText(input: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let last = 0;
  for (const match of input.matchAll(LINK)) {
    const [full, label, target] = match;
    const index = match.index ?? 0;
    if (index > last) segments.push(...parseStrong(input.slice(last, index)));
    const href = resolveInternalHref(target);
    segments.push(href ? { type: "link", label, href } : { type: "text", text: label });
    last = index + full.length;
  }
  if (last < input.length) segments.push(...parseStrong(input.slice(last)));
  return segments;
}

function parseStrong(text: string): RichSegment[] {
  const out: RichSegment[] = [];
  const parts = text.split(/\*\*([^*\n]+)\*\*/g);
  parts.forEach((part, i) => {
    if (!part) return;
    out.push(i % 2 === 1 ? { type: "strong", text: part } : { type: "text", text: part });
  });
  return out;
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

/** What the voice should actually say: link labels, no markdown punctuation. */
export function toSpeech(text: string): string {
  return text
    .replace(LINK, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pulls complete sentences off the front of a growing buffer so speech can
 * start while the answer is still streaming. A sentence ends at . ! ? or a
 * newline followed by whitespace/end; abbreviations like "e.g." and
 * version numbers like "v1.0" don't split because they aren't followed by
 * whitespace and an uppercase/quote/end.
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
    start = (match.index ?? 0) + match[0].length;
  }
  return { sentences, rest: buffer.slice(start) };
}
