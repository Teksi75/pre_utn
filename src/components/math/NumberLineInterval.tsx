import type { ReactNode } from "react";
import { formatInterval, isValidInterval, type IntervalModel } from "@/domain/intervals/index";

interface NumberLineIntervalProps {
  readonly interval: IntervalModel;
  readonly title?: string;
  readonly description?: ReactNode;
}

const SVG_WIDTH = 520;
const SVG_HEIGHT = 128;
const LINE_START = 52;
const LINE_END = 468;
const AXIS_Y = 66;
const TICK_TOP = 58;
const TICK_BOTTOM = 74;

function formatTick(value: number): string {
  return String(value).replace("-", "−");
}

function finiteValues(interval: IntervalModel): number[] {
  return [interval.left, interval.right]
    .filter((endpoint) => endpoint.kind === "finite")
    .map((endpoint) => endpoint.value);
}

function rangeFor(interval: IntervalModel): { min: number; max: number } {
  const values = finiteValues(interval);
  if (values.length === 0) return { min: -4, max: 4 };

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  return {
    min: Math.min(minValue - 2, -1),
    max: Math.max(maxValue + 2, 1),
  };
}

function ticksBetween(min: number, max: number): number[] {
  const start = Math.ceil(min);
  const end = Math.floor(max);
  const ticks: number[] = [];
  for (let value = start; value <= end; value++) {
    ticks.push(value);
  }
  return ticks;
}

export function NumberLineInterval({
  interval,
  title,
  description,
}: NumberLineIntervalProps) {
  const formatted = formatInterval(interval);
  const valid = isValidInterval(interval);
  const { min, max } = rangeFor(interval);
  const toX = (value: number) =>
    LINE_START + ((value - min) / (max - min)) * (LINE_END - LINE_START);

  const leftX = interval.left.kind === "finite" ? toX(interval.left.value) : LINE_START;
  const rightX = interval.right.kind === "finite" ? toX(interval.right.value) : LINE_END;
  const showLeftArrow = interval.left.kind === "negativeInfinity";
  const showRightArrow = interval.right.kind === "positiveInfinity";

  return (
    <figure className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50 p-4">
      {(title || description) && (
        <figcaption className="mb-3">
          {title && (
            <p className="text-sm font-semibold text-brand-900">{title}</p>
          )}
          {description && (
            <div className="mt-1 text-xs leading-[var(--leading-relaxed)] text-brand-600">
              {description}
            </div>
          )}
        </figcaption>
      )}

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        role="img"
        aria-label={`Representación en recta numérica del intervalo ${formatted}`}
        className="h-auto w-full"
      >
        <defs>
          <marker
            id="interval-arrow"
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

        <line
          x1={LINE_START}
          y1={AXIS_Y}
          x2={LINE_END}
          y2={AXIS_Y}
          stroke="var(--color-brand-400)"
          strokeWidth="2"
        />

        {ticksBetween(min, max).map((tick) => {
          const x = toX(tick);
          return (
            <g key={tick}>
              <line
                x1={x}
                y1={TICK_TOP}
                x2={x}
                y2={TICK_BOTTOM}
                stroke="var(--color-brand-300)"
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={96}
                textAnchor="middle"
                fill="var(--color-brand-600)"
                className="text-[11px]"
              >
                {formatTick(tick)}
              </text>
            </g>
          );
        })}

        {valid && (
          <line
            x1={leftX}
            y1={AXIS_Y}
            x2={rightX}
            y2={AXIS_Y}
            stroke="var(--color-accent-600)"
            strokeWidth="6"
            strokeLinecap="round"
            markerStart={showLeftArrow ? "url(#interval-arrow)" : undefined}
            markerEnd={showRightArrow ? "url(#interval-arrow)" : undefined}
          />
        )}

        {interval.left.kind === "finite" && (
          <circle
            cx={leftX}
            cy={AXIS_Y}
            r="7"
              fill={interval.left.closed ? "var(--color-accent-600)" : "#ffffff"}
              stroke="var(--color-accent-600)"
            strokeWidth="3"
          />
        )}

        {interval.right.kind === "finite" && (
          <circle
            cx={rightX}
            cy={AXIS_Y}
            r="7"
              fill={interval.right.closed ? "var(--color-accent-600)" : "#ffffff"}
              stroke="var(--color-accent-600)"
            strokeWidth="3"
          />
        )}

        <text
          x={SVG_WIDTH / 2}
          y={24}
          textAnchor="middle"
          fill="var(--color-brand-900)"
          className="text-[15px] font-semibold"
        >
          {formatted}
        </text>
      </svg>
    </figure>
  );
}
