"use client";

import { KaTeXBlock } from "./KaTeXBlock";
import { parseRichTextSegments } from "./rich-text-parser";

interface RichTextProps {
  readonly text: string;
  readonly className?: string;
}

/**
 * Renders text with inline math delimited by `$...$`.
 * Plain text segments are rendered as-is; math segments via KaTeXBlock.
 */
export function RichText({ text, className }: RichTextProps) {
  const segments = parseRichTextSegments(text);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.kind === "math" ? (
          <KaTeXBlock key={i} expression={seg.value} />
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </span>
  );
}
