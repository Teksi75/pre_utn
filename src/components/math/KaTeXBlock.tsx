"use client";

import { useRef, useEffect } from "react";
import katex from "katex";

interface KaTeXBlockProps {
  readonly expression: string;
  readonly displayMode?: boolean;
  readonly className?: string;
}

export function getKaTeXContainerTag(displayMode: boolean): "div" | "span" {
  return displayMode ? "div" : "span";
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
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    katex.render(expression, containerRef.current, {
      throwOnError: false,
      displayMode,
    });
  }, [expression, displayMode]);

  if (getKaTeXContainerTag(displayMode) === "div") {
    return (
      <div
        ref={(node) => {
          containerRef.current = node;
        }}
        className={className}
        aria-label={expression}
      />
    );
  }

  return (
    <span
      ref={(node) => {
        containerRef.current = node;
      }}
      className={className}
      aria-label={expression}
    />
  );
}
