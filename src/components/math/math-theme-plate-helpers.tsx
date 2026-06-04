/**
 * Pure helpers for MathThemePlate — topic/variant mapping logic
 * extracted for direct unit testing without React rendering.
 *
 * See: openspec/changes/editorial-math-visual-direction/design.md
 */

import type { ReactNode } from "react";

export const MATH_THEME_TOPICS = [
  "sets",
  "irrationals",
  "powers",
  "roots",
  "intervals",
  "absolute",
  "logs",
  "complex",
] as const;

export type MathThemeTopic = (typeof MATH_THEME_TOPICS)[number];

export type MathThemeVariant = "hero" | "background" | "card";

/** Check whether a topic string is a recognized theme topic. */
export function isKnownTopic(topic: string): boolean {
  return (MATH_THEME_TOPICS as readonly string[]).includes(topic);
}

/** Returns Tailwind classes for the given variant. */
export function getVariantClasses(variant: MathThemeVariant): string {
  const map: Record<MathThemeVariant, string> = {
    hero: "w-full h-full",
    background: "absolute inset-0 pointer-events-none",
    card: "w-16 h-16",
  };
  return map[variant];
}

/**
 * Returns an opaque fill color for the topic's decorative SVG elements.
 * Each topic gets a distinct muted warm tone.
 */
export function topicFillColor(topic: string): string {
  const fills: Record<string, string> = {
    sets: "rgba(168, 162, 158, 0.18)",
    irrationals: "rgba(120, 113, 108, 0.15)",
    powers: "rgba(217, 119, 6, 0.12)",
    roots: "rgba(87, 83, 78, 0.15)",
    intervals: "rgba(168, 162, 158, 0.20)",
    absolute: "rgba(120, 113, 108, 0.14)",
    logs: "rgba(168, 162, 158, 0.16)",
    complex: "rgba(217, 119, 6, 0.10)",
  };
  return fills[topic] ?? "rgba(168, 162, 158, 0.15)";
}

/**
 * Returns SVG children for the given topic. Each pattern is a small
 * decorative motif — circles, lines, text elements, etc.
 */
export function topicPattern(topic: string, fill: string): ReactNode {
  switch (topic) {
    case "sets":
      return (
        <>
          <circle cx="30%" cy="35%" r="18%" fill={fill} />
          <circle cx="65%" cy="40%" r="14%" fill={fill} />
          <circle cx="48%" cy="60%" r="10%" fill={fill} />
        </>
      );

    case "irrationals":
      return (
        <>
          <text x="15%" y="40%" fontSize="2.5rem" fill={fill} fontFamily="serif" fontStyle="italic">
            √2
          </text>
          <text x="60%" y="65%" fontSize="1.8rem" fill={fill} fontFamily="serif" fontStyle="italic">
            π
          </text>
          <text x="40%" y="25%" fontSize="1.5rem" fill={fill} fontFamily="serif" fontStyle="italic">
            e
          </text>
        </>
      );

    case "powers":
      return (
        <>
          <text x="15%" y="35%" fontSize="2rem" fill={fill} fontFamily="serif">
            x
          </text>
          <text x="28%" y="25%" fontSize="1.2rem" fill={fill} fontFamily="serif">
            2
          </text>
          <text x="55%" y="60%" fontSize="2rem" fill={fill} fontFamily="serif">
            2
          </text>
          <text x="68%" y="50%" fontSize="1.2rem" fill={fill} fontFamily="serif">
            3
          </text>
        </>
      );

    case "roots":
      return (
        <>
          <text x="10%" y="45%" fontSize="2.5rem" fill={fill} fontFamily="serif">
            √
          </text>
          <line x1="30%" y1="40%" x2="80%" y2="40%" stroke={fill} strokeWidth="2" />
          <text x="40%" y="45%" fontSize="1.8rem" fill={fill} fontFamily="serif">
            x
          </text>
        </>
      );

    case "intervals":
      return (
        <>
          <line x1="10%" y1="50%" x2="90%" y2="50%" stroke={fill} strokeWidth="2.5" />
          <circle cx="10%" cy="50%" r="4%" fill={fill} />
          <circle cx="90%" cy="50%" r="4%" fill="none" stroke={fill} strokeWidth="2" />
        </>
      );

    case "absolute":
      return (
        <>
          <polyline
            points="15%,75% 40%,30% 65%,75%"
            fill="none"
            stroke={fill}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </>
      );

    case "logs":
      return (
        <>
          <text x="12%" y="40%" fontSize="2rem" fill={fill} fontFamily="serif">
            log
          </text>
          <text x="35%" y="30%" fontSize="1rem" fill={fill} fontFamily="serif">
            2
          </text>
          <text x="55%" y="55%" fontSize="1.8rem" fill={fill} fontFamily="serif">
            ln
          </text>
        </>
      );

    case "complex":
      return (
        <>
          <line x1="50%" y1="10%" x2="50%" y2="90%" stroke={fill} strokeWidth="1.5" />
          <line x1="10%" y1="50%" x2="90%" y2="50%" stroke={fill} strokeWidth="1.5" />
          <circle cx="65%" cy="35%" r="3%" fill={fill} />
        </>
      );

    default:
      return null;
  }
}
