"use client";

import { BlockMath } from "./BlockMath";
import { InlineMath } from "./InlineMath";
import { parseRichTextSegments } from "./rich-text-parser";

interface RichTextProps {
  readonly text: string;
  readonly className?: string;
}

/**
 * Renders text with math delimiters:
 * - `$...$` renders inline via KaTeX.
 * - `$$...$$` renders as display math via KaTeX.
 */
export function RichText({ text, className }: RichTextProps) {
  const segments = parseRichTextSegments(text);
  const children = segments.map((seg, i) => {
    if (seg.kind === "math") {
      return seg.displayMode ? (
        <BlockMath key={i} tex={seg.value} />
      ) : (
        <InlineMath key={i} tex={seg.value} />
      );
    }

    return <span key={i}>{seg.value}</span>;
  });

  if (className) {
    return <span className={className}>{children}</span>;
  }

  return <>{children}</>;
}
