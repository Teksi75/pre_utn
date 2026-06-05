"use client";

import type { ReactNode } from "react";
import { MathThemePlate } from "./MathThemePlate";
import type { MathTheme, MathThemeVariant } from "./types";
import { mathThemeForSkill } from "./topic-map";

export interface MathWatermarkProps {
  readonly topic?: MathTheme;
  readonly skillId?: string;
  readonly variant?: MathThemeVariant;
  readonly opacity?: number;
  readonly className?: string;
  readonly children?: ReactNode;
}

const DEFAULT_OPACITY: Record<MathThemeVariant, number> = {
  hero: 0.15,
  background: 0.18,
  card: 0.12,
};

const DEFAULT_VARIANT: MathThemeVariant = "background";
const FALLBACK_TOPIC: MathTheme = "sets";

export function MathWatermark({
  topic,
  skillId,
  variant = DEFAULT_VARIANT,
  opacity,
  className,
  children,
}: MathWatermarkProps) {
  const resolvedTopic: MathTheme = skillId
    ? mathThemeForSkill(skillId)
    : (topic ?? FALLBACK_TOPIC);

  const resolvedOpacity = opacity ?? DEFAULT_OPACITY[variant];

  const containerClasses = [
    "relative isolate overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      <MathThemePlate
        topic={resolvedTopic}
        variant={variant}
        opacity={resolvedOpacity}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
