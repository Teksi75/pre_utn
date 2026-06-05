import { AbsoluteVisual } from "./AbsoluteVisual";
import { ComplexVisual } from "./ComplexVisual";
import { IntervalsVisual } from "./IntervalsVisual";
import { IrrationalsVisual } from "./IrrationalsVisual";
import { LogsVisual } from "./LogsVisual";
import { PowersVisual } from "./PowersVisual";
import { RootsVisual } from "./RootsVisual";
import { SetsVisual } from "./SetsVisual";
import type { MathTheme, MathThemeVariant } from "./types";

export type { MathTheme, MathThemeVariant } from "./types";

export interface MathThemePlateProps {
  readonly topic: MathTheme;
  readonly variant?: MathThemeVariant;
  readonly className?: string;
  readonly opacity?: number;
}

const VARIANT_CLASSES: Record<MathThemeVariant, string> = {
  hero: "h-full w-full",
  background: "absolute inset-0 h-full w-full",
  card: "h-24 w-24",
};

const DEFAULT_OPACITY: Record<MathThemeVariant, number> = {
  hero: 0.15,
  background: 0.18,
  card: 0.12,
};

const TOPIC_COLOR_CLASSES: Record<MathTheme, string> = {
  sets: "text-slate-700",
  irrationals: "text-slate-600",
  powers: "text-blue-700",
  roots: "text-slate-700",
  intervals: "text-blue-700",
  absolute: "text-slate-700",
  logs: "text-slate-700",
  complex: "text-blue-700",
};

function renderVisual(topic: MathTheme) {
  switch (topic) {
    case "sets":
      return <SetsVisual />;
    case "irrationals":
      return <IrrationalsVisual />;
    case "powers":
      return <PowersVisual />;
    case "roots":
      return <RootsVisual />;
    case "intervals":
      return <IntervalsVisual />;
    case "absolute":
      return <AbsoluteVisual />;
    case "logs":
      return <LogsVisual />;
    case "complex":
      return <ComplexVisual />;
  }
}

export function MathThemePlate({
  topic,
  variant = "hero",
  className = "",
  opacity,
}: MathThemePlateProps) {
  const classes = [
    "app-watermark pointer-events-none select-none overflow-hidden",
    VARIANT_CLASSES[variant],
    TOPIC_COLOR_CLASSES[topic],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-hidden="true"
      className={classes}
      style={{ opacity: opacity ?? DEFAULT_OPACITY[variant] }}
    >
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox="0 0 320 112"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        {renderVisual(topic)}
      </svg>
    </div>
  );
}
