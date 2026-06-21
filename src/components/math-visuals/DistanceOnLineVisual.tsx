import type { DistanceOnLineVisual } from "@/domain/visuals/types";
import { linearScale } from "@/domain/visuals/layout";
import { PedagogicalVisualFigure } from "./PedagogicalVisualFigure";
import {
  AXIS_STROKE,
  AXIS_STROKE_WIDTH,
  CLOSED_ENDPOINT_FILL,
  ENDPOINT_STROKE,
  OPEN_ENDPOINT_FILL,
  REGION_STROKE,
  REGION_STROKE_WIDTH,
  TICK_LABEL_CLASS,
  TICK_LABEL_FILL,
} from "./visual-tokens";

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
        stroke={AXIS_STROKE}
        strokeWidth={AXIS_STROKE_WIDTH}
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
                stroke={REGION_STROKE}
                strokeWidth={REGION_STROKE_WIDTH}
                strokeLinecap="round"
              />
            ) : (
              <>
                <line
                  x1={LEFT}
                  y1={AXIS_Y}
                  x2={leftX}
                  y2={AXIS_Y}
                  stroke={REGION_STROKE}
                  strokeWidth={REGION_STROKE_WIDTH}
                  strokeLinecap="round"
                />
                <line
                  x1={rightX}
                  y1={AXIS_Y}
                  x2={RIGHT}
                  y2={AXIS_Y}
                  stroke={REGION_STROKE}
                  strokeWidth={REGION_STROKE_WIDTH}
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Endpoints */}
            <circle
              cx={leftX}
              cy={AXIS_Y}
              r="7"
              fill={closed ? CLOSED_ENDPOINT_FILL : OPEN_ENDPOINT_FILL}
              stroke={ENDPOINT_STROKE}
              strokeWidth="3"
            />
            <circle
              cx={rightX}
              cy={AXIS_Y}
              r="7"
              fill={closed ? CLOSED_ENDPOINT_FILL : OPEN_ENDPOINT_FILL}
              stroke={ENDPOINT_STROKE}
              strokeWidth="3"
            />
          </g>

          {/* Labels */}
          <text
            x={leftX}
            y={AXIS_Y + 28}
            textAnchor="middle"
            fill={TICK_LABEL_FILL}
            className={TICK_LABEL_CLASS}
          >
            {leftValue}
          </text>
          <text
            x={centerX}
            y={AXIS_Y + 28}
            textAnchor="middle"
            fill={TICK_LABEL_FILL}
            className={TICK_LABEL_CLASS}
          >
            {center}
          </text>
          <text
            x={rightX}
            y={AXIS_Y + 28}
            textAnchor="middle"
            fill={TICK_LABEL_FILL}
            className={TICK_LABEL_CLASS}
          >
            {rightValue}
          </text>

          {/* Center point */}
          <circle
            cx={centerX}
            cy={AXIS_Y}
            r="4"
            fill={TICK_LABEL_FILL}
          />
        </>
      )}
    </PedagogicalVisualFigure>
  );
}
