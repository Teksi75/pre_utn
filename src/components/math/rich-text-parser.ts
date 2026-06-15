export type RichTextSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; displayMode: boolean };

function pushText(segments: RichTextSegment[], value: string): void {
  if (value.length === 0) return;

  const previous = segments[segments.length - 1];
  if (previous?.kind === "text") {
    segments[segments.length - 1] = {
      kind: "text",
      value: previous.value + value,
    };
    return;
  }

  segments.push({ kind: "text", value });
}

/**
 * Splits text on math delimiters into text and math segments.
 *
 * Supported delimiters:
 * - `$...$` for inline math
 * - `$$...$$` for display math
 *
 * Unclosed delimiters and empty delimiters remain plain text.
 */
export function parseRichTextSegments(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  let index = 0;

  while (index < text.length) {
    const delimiterStart = text.indexOf("$", index);

    if (delimiterStart === -1) {
      pushText(segments, text.slice(index));
      break;
    }

    if (delimiterStart > index) {
      pushText(segments, text.slice(index, delimiterStart));
    }

    const displayMode = text.startsWith("$$", delimiterStart);
    const delimiter = displayMode ? "$$" : "$";
    const delimiterLength = delimiter.length;
    const contentStart = delimiterStart + delimiterLength;
    const delimiterEnd = text.indexOf(delimiter, contentStart);

    if (delimiterEnd === -1) {
      pushText(segments, text.slice(delimiterStart));
      break;
    }

    const value = text.slice(contentStart, delimiterEnd);
    if (value.length === 0) {
      pushText(segments, text.slice(delimiterStart, delimiterEnd + delimiterLength));
      index = delimiterEnd + delimiterLength;
      continue;
    }

    segments.push({ kind: "math", value, displayMode });
    index = delimiterEnd + delimiterLength;
  }

  return segments;
}
