import type { ReactNode } from "react";
import type { CartesianLayout } from "./cartesian-layout";
import { gridStepForRange } from "./cartesian-layout";

interface CartesianPlotProps {
  readonly layout: CartesianLayout;
  readonly children: ReactNode;
}

/**
 * Shared SVG content for Cartesian visuals: adaptive grid, optional axes,
 * and a square-ish plot area. Consumers supply the data-specific marks via
 * `children` and can use the bound `layout.xToPx` / `layout.yToPx` helpers.
 */
export function CartesianPlot({ layout, children }: CartesianPlotProps) {
  const xStep = gridStepForRange(layout.xMin, layout.xMax);
  const yStep = gridStepForRange(layout.yMin, layout.yMax);

  const verticalGrid: ReactNode[] = [];
  for (let x = Math.ceil(layout.xMin / xStep) * xStep; x <= layout.xMax; x += xStep) {
    const px = layout.xToPx(x);
    verticalGrid.push(
      <line
        key={`x${x}`}
        x1={px}
        y1={layout.top}
        x2={px}
        y2={layout.bottom}
        stroke="var(--color-brand-200)"
        strokeWidth="1"
        opacity="0.6"
      />
    );
  }

  const horizontalGrid: ReactNode[] = [];
  for (let y = Math.ceil(layout.yMin / yStep) * yStep; y <= layout.yMax; y += yStep) {
    const py = layout.yToPx(y);
    horizontalGrid.push(
      <line
        key={`y${y}`}
        x1={layout.left}
        y1={py}
        x2={layout.right}
        y2={py}
        stroke="var(--color-brand-200)"
        strokeWidth="1"
        opacity="0.6"
      />
    );
  }

  const showXAxis = layout.yMin <= 0 && layout.yMax >= 0;
  const showYAxis = layout.xMin <= 0 && layout.xMax >= 0;

  return (
    <>
      {verticalGrid}
      {horizontalGrid}
      {showXAxis && (
        <line
          x1={layout.left}
          y1={layout.yToPx(0)}
          x2={layout.right}
          y2={layout.yToPx(0)}
          stroke="var(--color-brand-500)"
          strokeWidth="2"
        />
      )}
      {showYAxis && (
        <line
          x1={layout.xToPx(0)}
          y1={layout.top}
          x2={layout.xToPx(0)}
          y2={layout.bottom}
          stroke="var(--color-brand-500)"
          strokeWidth="2"
        />
      )}
      {children}
    </>
  );
}
