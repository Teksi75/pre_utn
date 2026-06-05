export const MATH_THEMES = [
  "sets",
  "irrationals",
  "powers",
  "roots",
  "intervals",
  "absolute",
  "logs",
  "complex",
] as const;

export type MathTheme = (typeof MATH_THEMES)[number];
export type MathThemeVariant = "hero" | "background" | "card";

export interface MathThemeVisualProps {
  readonly className?: string;
}
