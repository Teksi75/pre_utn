import type { ReactNode } from "react";
import type { VisualBase } from "@/domain/visuals/types";

interface PedagogicalVisualFigureProps {
  readonly visual: VisualBase;
  readonly viewBox: string;
  readonly children: ReactNode;
}

export function PedagogicalVisualFigure({
  visual,
  viewBox,
  children,
}: PedagogicalVisualFigureProps) {
  return (
    <figure className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50 p-3">
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={visual.ariaLabel}
        className="h-auto w-full"
      >
        <title>{visual.title}</title>
        <desc>{visual.description}</desc>
        {children}
      </svg>
      <figcaption className="mt-2 text-sm text-brand-700 leading-[var(--leading-relaxed)]">
        {visual.description}
      </figcaption>
    </figure>
  );
}
