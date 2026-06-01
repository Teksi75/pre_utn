"use client";

import { useRef, useEffect } from "react";
import katex from "katex";

interface KaTeXBlockProps {
  readonly expression: string;
  readonly displayMode?: boolean;
  readonly className?: string;
}

/**
 * Renders a single LaTeX expression into a div via KaTeX.
 * Uses ref + useEffect to render client-side only, avoiding SSR issues.
 */
export function KaTeXBlock({
  expression,
  displayMode = false,
  className,
}: KaTeXBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    katex.render(expression, containerRef.current, {
      throwOnError: false,
      displayMode,
    });
  }, [expression, displayMode]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-label={expression}
    />
  );
}
