export type RichTextSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string };

const MATH_DELIMITER = /\$([^$]+)\$/g;

/**
 * Splits text on `$...$` delimiters into text and math segments.
 * Unclosed delimiters and empty delimiters remain plain text.
 */
export function parseRichTextSegments(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MATH_DELIMITER)) {
    const matchStart = match.index!;
    // Push preceding plain text
    if (matchStart > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, matchStart) });
    }
    segments.push({ kind: "math", value: match[1] });
    lastIndex = matchStart + match[0].length;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
