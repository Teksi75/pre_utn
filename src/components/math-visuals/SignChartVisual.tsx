import type { SignChartVisual } from "@/domain/visuals/types";
import { linearScale } from "@/domain/visuals/layout";
import { PedagogicalVisualFigure } from "./PedagogicalVisualFigure";
import {
  AXIS_STROKE,
  AXIS_STROKE_WIDTH,
  CLOSED_ENDPOINT_FILL,
  ENDPOINT_RADIUS,
  ENDPOINT_STROKE,
  NOTATION_CLASS,
  NOTATION_FILL,
  OPEN_ENDPOINT_FILL,
  TICK_LABEL_CLASS,
  TICK_LABEL_FILL,
  TICK_STROKE,
  TICK_STROKE_WIDTH,
} from "./visual-tokens";

interface SignChartVisualProps {
  readonly visual: SignChartVisual;
}

const WIDTH = 520;
const HEIGHT = 160;
const AXIS_Y = 100;
const LEFT = 40;
const RIGHT = 480;

function chartDomain(visual: SignChartVisual): [number, number] {
  if (visual.criticalPoints.length === 0) return [-5, 5];
  const min = visual.criticalPoints[0];
  const max = visual.criticalPoints[visual.criticalPoints.length - 1];
  const pad = Math.max(1, (max - min) * 0.3);
  return [min - pad, max + pad];
}

export function SignChartVisual({ visual }: SignChartVisualProps) {
  const [d0, d1] = chartDomain(visual);
  const domainIsFinite = Number.isFinite(d1 - d0);
  const scale = linearScale([d0, d1], [LEFT, RIGHT]);
  const zeroSet = new Set(visual.zeros);
  const excludedSet = new Set(visual.excludedPoints);

  return (
    <PedagogicalVisualFigure
      visual={visual}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      {/* Axis */}
      <line
        x1={LEFT}
        y1={AXIS_Y}
        x2={RIGHT}
        y2={AXIS_Y}
        stroke={AXIS_STROKE}
        strokeWidth={AXIS_STROKE_WIDTH}
      />

      {/* Critical points */}
      {domainIsFinite && visual.criticalPoints.map((p) => {
        const x = scale.valueToPx(p);
        const isExcluded = excludedSet.has(p);
        return (
          <g key={p}>
            <line
              x1={x}
              y1={AXIS_Y - 8}
              x2={x}
              y2={AXIS_Y + 8}
              stroke={TICK_STROKE}
              strokeWidth={TICK_STROKE_WIDTH}
            />
            <text
              x={x}
              y={AXIS_Y + 26}
              textAnchor="middle"
              fill={TICK_LABEL_FILL}
              className={TICK_LABEL_CLASS}
            >
              {p}
            </text>
            {zeroSet.has(p) && !isExcluded && (
              <circle
                cx={x}
                cy={AXIS_Y}
                r={ENDPOINT_RADIUS}
                fill={CLOSED_ENDPOINT_FILL}
              />
            )}
            {zeroSet.has(p) && isExcluded && (
              // Excluded root: open circle (strict inequality boundary).
              <circle
                cx={x}
                cy={AXIS_Y}
                r={ENDPOINT_RADIUS}
                fill={OPEN_ENDPOINT_FILL}
                stroke={ENDPOINT_STROKE}
                strokeWidth="2"
              />
            )}
            {isExcluded && !zeroSet.has(p) && (
              // Undefined/asymptote point: open circle with cross.
              <>
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r={ENDPOINT_RADIUS}
                  fill={OPEN_ENDPOINT_FILL}
                  stroke={ENDPOINT_STROKE}
                  strokeWidth="2"
                />
                <path
                  d={`M${x - 3} ${AXIS_Y - 3} L${x + 3} ${AXIS_Y + 3} M${x + 3} ${AXIS_Y - 3} L${x - 3} ${AXIS_Y + 3}`}
                  stroke={ENDPOINT_STROKE}
                  strokeWidth={TICK_STROKE_WIDTH}
                />
              </>
            )}
          </g>
        );
      })}

      {/* Sign zones */}
      {domainIsFinite && visual.signZones.map((zone, i) => {
        const lowerPx = zone.lowerBound === null ? LEFT : scale.valueToPx(zone.lowerBound);
        const upperPx = zone.upperBound === null ? RIGHT : scale.valueToPx(zone.upperBound);
        const x = (lowerPx + upperPx) / 2;
        return (
          <text
            key={i}
            x={x}
            y={AXIS_Y - 32}
            textAnchor="middle"
            fill="var(--color-brand-900)"
            className="text-[18px] font-semibold"
          >
            {zone.sign}
          </text>
        );
      })}

      {/* Expression label */}
      <text
        x={WIDTH / 2}
        y={24}
        textAnchor="middle"
        fill={NOTATION_FILL}
        className={NOTATION_CLASS}
      >
        {visual.expression}
      </text>
    </PedagogicalVisualFigure>
  );
}
