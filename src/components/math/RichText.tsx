"use client";

import { Fragment } from "react";
import { BlockMath } from "./BlockMath";
import { InlineMath } from "./InlineMath";
import { parseRichTextSegments } from "./rich-text-parser";

interface RichTextProps {
  readonly text: string;
  readonly className?: string;
}

interface BoldState {
  active: boolean;
}

function renderTextSegment(value: string, keyPrefix: string, boldState: BoldState) {
  const parts = value.split(/(\*\*)/g).filter((part) => part.length > 0);

  return parts.flatMap((part, index) => {
    if (part === "**") {
      boldState.active = !boldState.active;
      return [];
    }

    const key = `${keyPrefix}-${index}`;
    if (boldState.active) {
      return [<strong key={key}>{part}</strong>];
    }

    return [<Fragment key={key}>{part}</Fragment>];
  });
}

/**
 * Renders text with math delimiters:
 * - `$...$` renders inline via KaTeX.
 * - `$$...$$` renders as display math via KaTeX.
 * - `**...**` renders bold text, including when the bold span contains math.
 */
export function RichText({ text, className }: RichTextProps) {
  const segments = parseRichTextSegments(text);
  const boldState: BoldState = { active: false };

  const children = segments.flatMap((seg, i) => {
    if (seg.kind === "math") {
      const key = `math-${i}`;
      const math = seg.displayMode ? (
        <BlockMath tex={seg.value} />
      ) : (
        <InlineMath tex={seg.value} />
      );

      if (boldState.active) {
        return [<strong key={key}>{math}</strong>];
      }

      return [<Fragment key={key}>{math}</Fragment>];
    }

    return renderTextSegment(seg.value, `text-${i}`, boldState);
  });

  if (className) {
    return <span className={className}>{children}</span>;
  }

  return <>{children}</>;
}
