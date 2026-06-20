import type { CartesianLineVisual, Point } from "@/domain/visuals/types";
import type { CartesianLayout } from "./cartesian-layout";
import {
  CARTESIAN_VIEWBOX,
  clipLineToRect,
  computeCartesianLayout,
} from "./cartesian-layout";
import { formatCartesianLineEquation } from "./cartesian-equation";
import { CartesianPlot } from "./CartesianPlot";
import { PedagogicalVisualFigure } from "./PedagogicalVisualFigure";

interface CartesianLineVisualProps {
  readonly visual: CartesianLineVisual;
}

export function CartesianLineVisual({ visual }: CartesianLineVisualProps) {
  const layout = computeCartesianLayout([visual]);

  return (
    <PedagogicalVisualFigure
      visual={visual}
      viewBox={`0 0 ${CARTESIAN_VIEWBOX.width} ${CARTESIAN_VIEWBOX.height}`}
    >
      <CartesianPlot layout={layout}>
        <CartesianLineContent visual={visual} layout={layout} />
      </CartesianPlot>
    </PedagogicalVisualFigure>
  );
}

function CartesianLineContent({
  visual,
  layout,
}: {
  readonly visual: CartesianLineVisual;
  readonly layout: ReturnType<typeof computeCartesianLayout>;
}) {
  const segment = clipLineToRect(visual, layout);

  return (
    <>
      {segment && (
        <FiniteLine layout={layout} segment={segment} />
      )}

      {visual.form === "two-point" &&
        visual.points.map((p, i) => {
          const cx = layout.xToPx(p.x);
          const cy = layout.yToPx(p.y);
          if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r="5"
                fill="var(--color-accent-600)"
              />
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                fill="var(--color-brand-900)"
                className="text-[11px]"
              >
                P{i + 1}
              </text>
            </g>
          );
        })}

      <text
        x={CARTESIAN_VIEWBOX.width / 2}
        y={24}
        textAnchor="middle"
        fill="var(--color-brand-900)"
        className="text-[15px] font-semibold"
      >
        {formatCartesianLineEquation(visual)}
      </text>
    </>
  );
}

interface FiniteLineProps {
  readonly layout: CartesianLayout;
  readonly segment: readonly [Point, Point];
}

function FiniteLine({ layout, segment }: FiniteLineProps) {
  const x1 = layout.xToPx(segment[0].x);
  const y1 = layout.yToPx(segment[0].y);
  const x2 = layout.xToPx(segment[1].x);
  const y2 = layout.yToPx(segment[1].y);

  if (![x1, y1, x2, y2].every(Number.isFinite)) return null;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--color-accent-600)"
      strokeWidth="3"
      strokeLinecap="round"
    />
  );
}
