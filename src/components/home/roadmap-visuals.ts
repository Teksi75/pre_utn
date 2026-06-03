/**
 * Roadmap visuals — pure mapping from `MasteryLevel` (+ a "is next" flag) to
 * the CSS classes and labels that the SkillRoadmap component renders.
 *
 * Kept as a pure function so it can be unit-tested without React. The
 * component itself is a thin JSX wrapper.
 *
 * Color tokens reuse the project palette defined in `src/app/globals.css`
 * (`--color-brand-*`, `--color-accent-*`).
 */

import type { MasteryLevel } from "../../domain/progress/index";

/**
 * The four roadmap visual states shown on the home page.
 *   - "completed"   → mastered (green)
 *   - "in-progress" → practicing, learning, or review (amber/red)
 *   - "next"        → the next step the user should take (brand)
 *   - "blocked"     → not started yet (gray)
 */
export type RoadmapVisualState =
  | "completed"
  | "in-progress"
  | "next"
  | "blocked";

export interface RoadmapVisuals {
  readonly visualState: RoadmapVisualState;
  /** Tailwind classes for the colored dot. */
  readonly dotClass: string;
  /** Short caption shown next to the dot (e.g. "Completado"). */
  readonly labelText: string;
  /** Accessible description for screen readers. */
  readonly ariaLabel: string;
}

/**
 * Compute the visual state, color, and labels for a single roadmap dot.
 * `isNext === true` always wins — even a mastered skill stays "completed"
 * visually, but the next recommended step is always marked as such.
 *
 * @param masteryLevel - The student's current mastery for the skill
 * @param isNext - Whether this skill is the user's next recommended step
 * @returns Visual state + classes + labels for the dot
 */
export function getRoadmapVisuals(
  masteryLevel: MasteryLevel,
  isNext: boolean
): RoadmapVisuals {
  if (isNext) {
    return {
      visualState: "next",
      dotClass:
        "bg-[var(--color-brand-700)] ring-4 ring-[var(--color-brand-200)]",
      labelText: "Próximo paso",
      ariaLabel: "Próximo paso recomendado",
    };
  }

  switch (masteryLevel) {
    case "mastered":
      return {
        visualState: "completed",
        dotClass: "bg-green-600",
        labelText: "Completado",
        ariaLabel: "Habilidad completada",
      };
    case "review":
      return {
        visualState: "in-progress",
        dotClass: "bg-red-500",
        labelText: "Necesita repaso",
        ariaLabel: "Habilidad que necesita repaso",
      };
    case "practicing":
      return {
        visualState: "in-progress",
        dotClass: "bg-amber-500",
        labelText: "En práctica",
        ariaLabel: "Habilidad en práctica",
      };
    case "learning":
      return {
        visualState: "in-progress",
        dotClass: "bg-amber-300",
        labelText: "Aprendiendo",
        ariaLabel: "Habilidad en aprendizaje",
      };
    case "not-started":
    default:
      return {
        visualState: "blocked",
        dotClass: "bg-[var(--color-brand-300)]",
        labelText: "Pendiente",
        ariaLabel: "Habilidad pendiente",
      };
  }
}
