/**
 * Serialises structured data for a <script type="application/ld+json">.
 * JSON.stringify alone would let a "</script>" inside any string end the
 * element early; escaping "<" (and the U+2028/U+2029 line separators JSON
 * allows but older JavaScript parsers did not) keeps the payload inert.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
}
