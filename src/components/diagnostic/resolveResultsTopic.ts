import type { MathTheme } from "../math-visuals/types";
import { mathThemeForSkill } from "../math-visuals/topic-map";
import type { SkillEstimate } from "../../domain/diagnostic/index";

const FALLBACK_TOPIC: MathTheme = "sets";

/**
 * Pick the MathTheme for the diagnostic results watermark by selecting the
 * skill with the lowest accuracy (the weakest estimated skill). Falls back
 * to "sets" when no estimates are available or when the weakest skill ID
 * does not map to a known topic (mathThemeForSkill's internal fallback).
 *
 * @param estimates - The skill estimates produced by the diagnostic engine.
 * @returns The MathTheme to render in the watermark layer.
 */
export function resolveResultsTopic(
  estimates: readonly SkillEstimate[]
): MathTheme {
  if (estimates.length === 0) return FALLBACK_TOPIC;
  const weakest = estimates.reduce(
    (min, est) => (est.accuracy < min.accuracy ? est : min),
    estimates[0]
  );
  return mathThemeForSkill(weakest.skillId);
}
