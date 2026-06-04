/**
 * MathThemePlate — decorative SVG component with topic-specific patterns.
 *
 * Renders lightweight, aria-hidden SVG patterns for visual identity.
 * Topics: sets, irrationals, powers, roots, intervals, absolute, logs, complex.
 * Variants: hero (full width/height), background (absolute coverage), card (compact).
 *
 * See: openspec/changes/editorial-math-visual-direction/design.md
 */

import {
  isKnownTopic,
  getVariantClasses,
  topicFillColor,
  topicPattern,
} from "./math-theme-plate-helpers";
import type { MathThemeTopic, MathThemeVariant } from "./math-theme-plate-helpers";

export type { MathThemeTopic, MathThemeVariant };

export interface MathThemePlateProps {
  readonly topic: MathThemeTopic | (string & {});
  readonly variant?: MathThemeVariant;
  readonly className?: string;
}

/**
 * Decorative SVG plate that renders a topic-specific mathematical pattern.
 * The component is purely visual — always aria-hidden, no interaction.
 */
export function MathThemePlate({
  topic,
  variant = "hero",
  className = "",
}: MathThemePlateProps) {
  if (!isKnownTopic(topic)) {
    return <div aria-hidden="true" className={className || undefined} />;
  }

  const fill = topicFillColor(topic);
  const variantClasses = getVariantClasses(variant);

  const classes = [
    "flex items-center justify-center overflow-hidden",
    variantClasses,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div aria-hidden="true" className={classes}>
      <svg
        aria-hidden="true"
        viewBox="0 0 120 80"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        {topicPattern(topic, fill)}
      </svg>
    </div>
  );
}
