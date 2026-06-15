"use client";

import katex from "katex";

interface KaTeXBlockProps {
  readonly expression: string;
  readonly displayMode?: boolean;
  readonly className?: string;
}

export function getKaTeXContainerTag(displayMode: boolean): "div" | "span" {
  return displayMode ? "div" : "span";
}

export function renderKaTeXToHtml(
  expression: string,
  displayMode: boolean = false
): string {
  return katex.renderToString(expression, {
    throwOnError: false,
    displayMode,
    trust: false,
  });
}

/**
 * Renders a single LaTeX expression with KaTeX.
 *
 * Rendering happens during React render instead of useEffect so math is present
 * in the first paint and does not flash as an empty span before hydration.
 */
export function KaTeXBlock({
  expression,
  displayMode = false,
  className,
}: KaTeXBlockProps) {
  const html = renderKaTeXToHtml(expression, displayMode);

  if (getKaTeXContainerTag(displayMode) === "div") {
    return (
      <div
        className={className}
        aria-label={expression}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={className}
      aria-label={expression}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
