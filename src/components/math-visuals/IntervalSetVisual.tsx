import type { IntervalSetVisual } from "@/domain/visuals/types";
import { computeIntervalSetLayout } from "@/domain/visuals/layout";
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
  REGION_STROKE,
  REGION_STROKE_WIDTH,
  TICK_LABEL_CLASS,
  TICK_LABEL_FILL,
  TICK_SIZE,
  TICK_STROKE,
  TICK_STROKE_WIDTH,
} from "./visual-tokens";

interface IntervalSetVisualProps {
  readonly visual: IntervalSetVisual;
}

export function IntervalSetVisual({ visual }: IntervalSetVisualProps) {
  const layout = computeIntervalSetLayout(visual);
  const { viewBox, axis, ticks, arrows, segments } = layout;

  return (
    <PedagogicalVisualFigure
      visual={visual}
      viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
    >
      {/* Shared axis */}
      <line
        x1={axis.x1}
        y1={axis.y}
        x2={axis.x2}
        y2={axis.y}
        stroke={AXIS_STROKE}
        strokeWidth={AXIS_STROKE_WIDTH}
      />

      {/* Infinity arrows */}
      {arrows.map((arrow, i) => (
        <path
          key={`arrow-${i}`}
          data-interval-side={arrow.side}
          d={
            arrow.side === "left"
              ? `M${arrow.x} ${arrow.y} L${arrow.x + 8} ${arrow.y - 4} M${arrow.x} ${arrow.y} L${arrow.x + 8} ${arrow.y + 4}`
              : `M${arrow.x} ${arrow.y} L${arrow.x - 8} ${arrow.y - 4} M${arrow.x} ${arrow.y} L${arrow.x - 8} ${arrow.y + 4}`
          }
          stroke={AXIS_STROKE}
          strokeWidth={AXIS_STROKE_WIDTH}
          fill="none"
        />
      ))}

      {/* Accepted regions */}
      {segments.map((segment, i) => {
        const x1 = segment.lowerInfinite ? axis.x1 : segment.lowerX;
        const x2 = segment.upperInfinite ? axis.x2 : segment.upperX;
        return (
          <g key={`region-${i}`} data-interval-region={`${i}`}>
            <line
              data-hatching="true"
              x1={x1}
              y1={axis.y}
              x2={x2}
              y2={axis.y}
              stroke={REGION_STROKE}
              strokeWidth={REGION_STROKE_WIDTH}
              strokeLinecap="butt"
            />
          </g>
        );
      })}

      {/* Endpoints */}
      {segments.map((segment, i) => (
        <g key={`endpoints-${i}`}>
          {!segment.lowerInfinite && (
            <circle
              data-endpoint="lower"
              cx={segment.lowerX}
              cy={axis.y}
              r={ENDPOINT_RADIUS}
              fill={
                segment.lowerInclusion === "closed"
                  ? CLOSED_ENDPOINT_FILL
                  : OPEN_ENDPOINT_FILL
              }
              stroke={ENDPOINT_STROKE}
              strokeWidth="2"
            />
          )}
          {!segment.upperInfinite && (
            <circle
              data-endpoint="upper"
              cx={segment.upperX}
              cy={axis.y}
              r={ENDPOINT_RADIUS}
              fill={
                segment.upperInclusion === "closed"
                  ? CLOSED_ENDPOINT_FILL
                  : OPEN_ENDPOINT_FILL
              }
              stroke={ENDPOINT_STROKE}
              strokeWidth="2"
            />
          )}
        </g>
      ))}

      {/* Tick marks and labels */}
      {ticks.map((tick) => (
        <g key={`tick-${tick.value}`}>
          <line
            x1={tick.x}
            y1={axis.y - TICK_SIZE}
            x2={tick.x}
            y2={axis.y + TICK_SIZE}
            stroke={TICK_STROKE}
            strokeWidth={TICK_STROKE_WIDTH}
          />
          <text
            x={tick.x}
            y={axis.y + 24}
            textAnchor="middle"
            fill={TICK_LABEL_FILL}
            className={TICK_LABEL_CLASS}
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* Union notation */}
      <text
        x={viewBox.width / 2}
        y={24}
        textAnchor="middle"
        fill={NOTATION_FILL}
        className={NOTATION_CLASS}
      >
        {visual.notation}
      </text>

      {/* Optional set-builder label */}
      {visual.setBuilderLabel ? (
        <text
          x={viewBox.width / 2}
          y={viewBox.height - 8}
          textAnchor="middle"
          fill="var(--color-brand-600)"
          className="text-[12px]"
        >
          {visual.setBuilderLabel}
        </text>
      ) : null}
    </PedagogicalVisualFigure>
  );
}
