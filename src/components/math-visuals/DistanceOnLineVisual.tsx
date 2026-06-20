import type { DistanceOnLineVisual } from "@/domain/visuals/types";
import { linearScale } from "@/domain/visuals/layout";
import { PedagogicalVisualFigure } from "./PedagogicalVisualFigure";

interface DistanceOnLineVisualProps {
  readonly visual: DistanceOnLineVisual;
}

const WIDTH = 520;
const HEIGHT = 144;
const AXIS_Y = 84;
const LEFT = 40;
const RIGHT = 480;

export function DistanceOnLineVisual({ visual }: DistanceOnLineVisualProps) {
  const { center, distance, inequality } = visual;
  const leftValue = center - distance;
  const rightValue = center + distance;
  const spanIsFinite = Number.isFinite(rightValue - leftValue);
  const geometryIsFinite =
    spanIsFinite &&
    Number.isFinite(leftValue) &&
    Number.isFinite(rightValue) &&
    Number.isFinite(center);

  const domain: [number, number] = [leftValue - 2, rightValue + 2];
  const scale = linearScale(domain, [LEFT, RIGHT]);

  const leftX = scale.valueToPx(leftValue);
  const rightX = scale.valueToPx(rightValue);
  const centerX = scale.valueToPx(center);

  const closed = inequality === "le" || inequality === "ge";
  const inside = inequality === "lt" || inequality === "le";

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

      {geometryIsFinite && (
        <>
          <g
            data-region={inside ? "inside" : "outside"}
            data-endpoints={closed ? "closed" : "open"}
          >
            {/* Accepted region */}
            {inside ? (
              <line
                x1={leftX}
                y1={AXIS_Y}
                x2={rightX}
                y2={AXIS_Y}
                stroke="var(--color-accent-600)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            ) : (
              <>
                <line
                  x1={LEFT}
                  y1={AXIS_Y}
                  x2={leftX}
                  y2={AXIS_Y}
                  stroke="var(--color-accent-600)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <line
                  x1={rightX}
                  y1={AXIS_Y}
                  x2={RIGHT}
                  y2={AXIS_Y}
                  stroke="var(--color-accent-600)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Endpoints */}
            <circle
              cx={leftX}
              cy={AXIS_Y}
              r="7"
              fill={closed ? "var(--color-accent-600)" : "#ffffff"}
              stroke="var(--color-accent-600)"
              strokeWidth="3"
            />
            <circle
              cx={rightX}
              cy={AXIS_Y}
              r="7"
              fill={closed ? "var(--color-accent-600)" : "#ffffff"}
              stroke="var(--color-accent-600)"
              strokeWidth="3"
            />
          </g>

          {/* Labels */}
          <text
            x={leftX}
            y={AXIS_Y + 28}
            textAnchor="middle"
            fill="var(--color-brand-600)"
            className="text-[12px]"
          >
            {leftValue}
          </text>
          <text
            x={centerX}
            y={AXIS_Y + 28}
            textAnchor="middle"
            fill="var(--color-brand-600)"
            className="text-[12px]"
          >
            {center}
          </text>
          <text
            x={rightX}
            y={AXIS_Y + 28}
            textAnchor="middle"
            fill="var(--color-brand-600)"
            className="text-[12px]"
          >
            {rightValue}
          </text>

          {/* Center point */}
          <circle
            cx={centerX}
            cy={AXIS_Y}
            r="4"
            fill="var(--color-brand-600)"
          />
        </>
      )}
    </PedagogicalVisualFigure>
  );
}
