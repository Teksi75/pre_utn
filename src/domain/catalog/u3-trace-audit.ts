import type { Exercise, ExerciseId } from "../models/exercise";
import { UNIT_3_SKILLS } from "../models/skill-catalog";

const U3_SKILL_IDS = new Set<string>(UNIT_3_SKILLS);

export interface U3TraceAuditViolation {
  readonly exerciseId: ExerciseId;
  readonly sourceUse: "alignment";
}

/** Report U3 traces that use the generally valid but U3-disallowed alignment literal. */
export function auditU3TraceSourceUse(
  exercises: readonly Exercise[]
): readonly U3TraceAuditViolation[] {
  const violations: U3TraceAuditViolation[] = [];
  for (const exercise of exercises) {
    if (!U3_SKILL_IDS.has(exercise.skillId)) continue;
    for (const trace of exercise.canonicalTrace ?? []) {
      if (trace.sourceUse === "alignment") {
        violations.push({ exerciseId: exercise.id, sourceUse: "alignment" });
      }
    }
  }
  return violations;
}
