import { MATH_THEMES, type MathTheme, type MathThemeVariant } from "../math-visuals/types";

export const MATH_THEME_TOPICS = MATH_THEMES;
export type MathThemeTopic = MathTheme;
export type { MathThemeVariant };

export function isKnownTopic(topic: string): topic is MathTheme {
  return (MATH_THEME_TOPICS as readonly string[]).includes(topic);
}

export function getVariantClasses(variant: MathThemeVariant): string {
  const map: Record<MathThemeVariant, string> = {
    hero: "h-full w-full",
    background: "absolute inset-0 h-full w-full pointer-events-none",
    card: "h-24 w-24",
  };
  return map[variant];
}

export function topicFillColor(topic: string): string {
  const fills: Record<MathTheme, string> = {
    sets: "currentColor",
    irrationals: "currentColor",
    powers: "currentColor",
    roots: "currentColor",
    intervals: "currentColor",
    absolute: "currentColor",
    logs: "currentColor",
    complex: "currentColor",
  };
  return isKnownTopic(topic) ? fills[topic] : "currentColor";
}

export function topicPattern(topic: string, fill: string): string | null {
  if (!isKnownTopic(topic)) return null;
  return fill;
}
