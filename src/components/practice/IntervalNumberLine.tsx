"use client";

import type { IntervalRepresentation } from "@/domain/intervals/representation";
import { formatIntervalRepresentation } from "@/domain/intervals/representation";
import { computeIntervalSvgLayout } from "@/domain/intervals/svg-layout";

interface IntervalNumberLineProps {
  readonly interval: IntervalRepresentation;
  readonly className?: string;
  readonly ariaLabel?: string;
}

const SVG_WIDTH = 520;
const SVG_HEIGHT = 128;
const AXIS_Y = 66;

/**
 * Renders an interval on a number line using SVG.
 * Supports bounded segments, rays with arrows, open/closed endpoints,
 * and infinity labels. Accessible with aria labels.
 */
export function IntervalNumberLine({
  interval,
  className,
  ariaLabel,
}: IntervalNumberLineProps) {
  const layout = computeIntervalSvgLayout(interval);
  const formatted = formatIntervalRepresentation(interval);
  const finalAriaLabel = ariaLabel ?? layout.ariaLabel;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={finalAriaLabel}
        className="h-auto w-full"
      >
        {/* Arrow marker definition */}
        <defs>
          <marker
            id={`interval-arrow-${interval.id}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-accent-600)" />
          </marker>
        </defs>

        {/* Axis line */}
        <line
          x1={52}
          y1={AXIS_Y}
          x2={468}
          y2={AXIS_Y}
          stroke="var(--color-brand-400)"
          strokeWidth="2"
        />

        {/* Tick marks */}
        {layout.ticks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={tick.x}
              y1={58}
              x2={tick.x}
              y2={74}
              stroke="var(--color-brand-300)"
              strokeWidth="1.5"
            />
            <text
              x={tick.x}
              y={96}
              textAnchor="middle"
              fill="var(--color-brand-600)"
              className="text-[11px]"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Segment line with optional arrows */}
        <line
          x1={layout.segmentStartX}
          y1={AXIS_Y}
          x2={layout.segmentEndX}
          y2={AXIS_Y}
          stroke="var(--color-accent-600)"
          strokeWidth="6"
          strokeLinecap="round"
          markerStart={layout.showLeftArrow ? `url(#interval-arrow-${interval.id})` : undefined}
          markerEnd={layout.showRightArrow ? `url(#interval-arrow-${interval.id})` : undefined}
        />

        {/* Left endpoint circle */}
        {layout.leftEndpoint.kind === "finite" && (
          <circle
            cx={layout.leftEndpoint.x}
            cy={AXIS_Y}
            r="7"
            fill={layout.leftEndpoint.closed ? "var(--color-accent-600)" : "#ffffff"}
            stroke="var(--color-accent-600)"
            strokeWidth="3"
          />
        )}

        {/* Right endpoint circle */}
        {layout.rightEndpoint.kind === "finite" && (
          <circle
            cx={layout.rightEndpoint.x}
            cy={AXIS_Y}
            r="7"
            fill={layout.rightEndpoint.closed ? "var(--color-accent-600)" : "#ffffff"}
            stroke="var(--color-accent-600)"
            strokeWidth="3"
          />
        )}

        {/* Notation label */}
        <text
          x={SVG_WIDTH / 2}
          y={24}
          textAnchor="middle"
          fill="var(--color-brand-900)"
          className="text-[15px] font-semibold"
        >
          {formatted}
        </text>

        {/* Textual fallback for non-visual contexts */}
        <title>{finalAriaLabel}</title>
      </svg>
    </div>
  );
}
