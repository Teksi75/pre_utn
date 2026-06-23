"use client";

import { Fragment } from "react";
import { BlockMath } from "./BlockMath";
import { InlineMath } from "./InlineMath";
import { parseRichTextSegments } from "./rich-text-parser";

interface RichTextProps {
  readonly text: string;
  readonly className?: string;
}

function renderTextSegment(value: string, keyPrefix: string) {
  const parts = value.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

/**
 * Renders text with math delimiters:
 * - `$...$` renders inline via KaTeX.
 * - `$$...$$` renders as display math via KaTeX.
 * - `**...**` renders bold text outside math delimiters.
 */
export function RichText({ text, className }: RichTextProps) {
  const segments = parseRichTextSegments(text);
  const children = segments.flatMap((seg, i) => {
    if (seg.kind === "math") {
      return seg.displayMode ? (
        <BlockMath key={i} tex={seg.value} />
      ) : (
        <InlineMath key={i} tex={seg.value} />
      );
    }

    return renderTextSegment(seg.value, `text-${i}`);
  });

  if (className) {
    return <span className={className}>{children}</span>;
  }

  return <>{children}</>;
}
