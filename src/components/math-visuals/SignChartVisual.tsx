import type { SignChartVisual } from "@/domain/visuals/types";
import { linearScale } from "@/domain/visuals/layout";
import { PedagogicalVisualFigure } from "./PedagogicalVisualFigure";

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
        stroke="var(--color-brand-400)"
        strokeWidth="2"
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
              stroke="var(--color-brand-400)"
              strokeWidth="1.5"
            />
            <text
              x={x}
              y={AXIS_Y + 26}
              textAnchor="middle"
              fill="var(--color-brand-600)"
              className="text-[12px]"
            >
              {p}
            </text>
            {zeroSet.has(p) && !isExcluded && (
              <circle
                cx={x}
                cy={AXIS_Y}
                r="5"
                fill="var(--color-accent-600)"
              />
            )}
            {zeroSet.has(p) && isExcluded && (
              // Excluded root: open circle (strict inequality boundary).
              <circle
                cx={x}
                cy={AXIS_Y}
                r="5"
                fill="#ffffff"
                stroke="var(--color-accent-600)"
                strokeWidth="2"
              />
            )}
            {isExcluded && !zeroSet.has(p) && (
              // Undefined/asymptote point: open circle with cross.
              <>
                <circle
                  cx={x}
                  cy={AXIS_Y}
                  r="5"
                  fill="#ffffff"
                  stroke="var(--color-accent-600)"
                  strokeWidth="2"
                />
                <path
                  d={`M${x - 3} ${AXIS_Y - 3} L${x + 3} ${AXIS_Y + 3} M${x + 3} ${AXIS_Y - 3} L${x - 3} ${AXIS_Y + 3}`}
                  stroke="var(--color-accent-600)"
                  strokeWidth="1.5"
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
        fill="var(--color-brand-900)"
        className="text-[15px] font-semibold"
      >
        {visual.expression}
      </text>
    </PedagogicalVisualFigure>
  );
}
