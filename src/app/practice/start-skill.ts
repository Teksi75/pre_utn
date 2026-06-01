import { isSkillReady } from "../../domain/catalog/readiness";
import type { SkillId } from "../../domain/models/skill";

/**
 * OpenSpec: `unit-1-pedagogical-slice`, Phase 13.
 * TDD coverage: `src/app/practice/__tests__/start-skill.test.ts`.
 */
export const PRACTICE_SKILL_UNIT_MAP: Readonly<Record<string, string>> = {
  "mat.u1.reales_operaciones": "unit-1",
  "mat.u1.intervalos": "unit-1",
};

export function resolveInitialPracticeSkill(
  skillParam: string | null
): SkillId | null {
  if (!skillParam) return null;

  if (!PRACTICE_SKILL_UNIT_MAP[skillParam]) return null;

  const readiness = isSkillReady(skillParam);
  if (!readiness.ready) return null;

  return skillParam as SkillId;
}
