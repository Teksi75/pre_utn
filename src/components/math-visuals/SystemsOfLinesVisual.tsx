import type { Point, SystemsOfLinesVisual } from "@/domain/visuals/types";
import type { CartesianLayout } from "./cartesian-layout";
import {
  CARTESIAN_VIEWBOX,
  clipLineToRect,
  computeCartesianLayout,
} from "./cartesian-layout";
import { formatCartesianLineEquation } from "./cartesian-equation";
import { CartesianPlot } from "./CartesianPlot";
import { PedagogicalVisualFigure } from "./PedagogicalVisualFigure";

interface SystemsOfLinesVisualProps {
  readonly visual: SystemsOfLinesVisual;
}

function lineLabel(prefix: string, line: SystemsOfLinesVisual["lines"][number]): string {
  return `${prefix}: ${formatCartesianLineEquation(line)}`;
}

export function SystemsOfLinesVisual({ visual }: SystemsOfLinesVisualProps) {
  const [line1, line2] = visual.lines;
  const layout = computeCartesianLayout(
    [line1, line2],
    visual.classification === "secant" ? { intersection: visual.intersection } : undefined
  );

  return (
    <PedagogicalVisualFigure
      visual={visual}
      viewBox={`0 0 ${CARTESIAN_VIEWBOX.width} ${CARTESIAN_VIEWBOX.height}`}
    >
      <CartesianPlot layout={layout}>
        <SystemsLineContent visual={visual} layout={layout} />
      </CartesianPlot>
    </PedagogicalVisualFigure>
  );
}

function SystemsLineContent({
  visual,
  layout,
}: {
  readonly visual: SystemsOfLinesVisual;
  readonly layout: ReturnType<typeof computeCartesianLayout>;
}) {
  const [line1, line2] = visual.lines;
  const segment1 = clipLineToRect(line1, layout);
  const segment2 = clipLineToRect(line2, layout);

  return (
    <>
      {segment1 && (
        <FiniteLine
          layout={layout}
          segment={segment1}
          stroke="var(--color-accent-600)"
        />
      )}
      {segment2 && (
        <FiniteLine
          layout={layout}
          segment={segment2}
          stroke="var(--color-accent-700)"
          strokeDasharray={
            visual.classification === "coincident" ? "6,4" : "8,4"
          }
        />
      )}

      {visual.classification === "secant" && (
        <IntersectionMarker layout={layout} intersection={visual.intersection} />
      )}

      <text
        x={CARTESIAN_VIEWBOX.width / 2}
        y={24}
        textAnchor="middle"
        fill="var(--color-brand-900)"
        className="text-[14px] font-semibold"
      >
        {lineLabel("L1", line1)} · {lineLabel("L2", line2)} · {visual.classification}
      </text>
    </>
  );
}

interface FiniteLineProps {
  readonly layout: CartesianLayout;
  readonly segment: readonly [Point, Point];
  readonly stroke: string;
  readonly strokeDasharray?: string;
}

function FiniteLine({ layout, segment, stroke, strokeDasharray }: FiniteLineProps) {
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
      stroke={stroke}
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray={strokeDasharray}
    />
  );
}

interface IntersectionMarkerProps {
  readonly layout: CartesianLayout;
  readonly intersection: Point;
}

function IntersectionMarker({ layout, intersection }: IntersectionMarkerProps) {
  const cx = layout.xToPx(intersection.x);
  const cy = layout.yToPx(intersection.y);

  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r="5"
        fill="var(--color-brand-900)"
      />
      <text
        x={cx + 12}
        y={cy - 12}
        fill="var(--color-brand-900)"
        className="text-[12px] font-semibold"
      >
        ({intersection.x}, {intersection.y})
      </text>
    </g>
  );
}
