/**
 * Accessibility — derives per-skill accessibility from progress + prereq graph.
 * Pure TypeScript. No I/O, no React.
 *
 * `getAccessibleSkills()` is the canonical read model for the
 * `FocusSelector`: a skill is `accessible` when its content is ready
 * (theory / examples / exercises / feedback / evaluation all present)
 * AND every declared prerequisite has reached the accuracy threshold.
 */

import { describe, test, expect } from "vitest";
import {
  getAccessibleSkills,
  PREREQUISITE_ACCURACY_THRESHOLD,
  type AccessibleSkill,
} from "../catalog/accessibility";
import { PILOT_SKILLS } from "../catalog/pilot-skills";
import type { SkillId } from "../models/skill";
import type { PracticeAttempt, PracticeProgress } from "../progress/index";

/** Build an empty PracticeProgress with the new fields defaulted. */
function emptyProgress(): PracticeProgress {
  return {
    attempts: [],
    accuracyBySkill: {},
    trendBySkill: {},
    lastPracticedBySkill: {},
    diagnosticResult: null,
    studyPlan: null,
  };
}

/** Build a PracticeProgress with N attempts for a skill, all correct. */
function progressWithAttempts(
  skillId: SkillId,
  correctCount: number,
  totalCount: number,
  trend: "improving" | "stable" | "needs-review" = "stable"
): PracticeProgress {
  const attempts: PracticeAttempt[] = [];
  for (let i = 0; i < totalCount; i++) {
    attempts.push({
      exerciseId: `ex.test.${i}`,
      skillId,
      correct: i < correctCount,
      answeredAt: `2026-01-01T10:${String(i).padStart(2, "0")}:00Z`,
      timeMs: 5000,
      attemptIndex: 1,
    });
  }
  const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
  return {
    attempts,
    accuracyBySkill: { [skillId]: accuracy },
    trendBySkill: { [skillId]: trend },
    lastPracticedBySkill: {},
    diagnosticResult: null,
    studyPlan: null,
  };
}

describe("PREREQUISITE_ACCURACY_THRESHOLD", () => {
  test("is 0.7 to match the documented prereq mastery bar", () => {
    expect(PREREQUISITE_ACCURACY_THRESHOLD).toBe(0.7);
  });
});

describe("getAccessibleSkills — shape", () => {
  test("returns one entry per PILOT_SKILL, in the catalog order", () => {
    const result = getAccessibleSkills(emptyProgress());
    expect(result).toHaveLength(PILOT_SKILLS.length);
    expect(result.map((s) => s.skillId)).toEqual(
      PILOT_SKILLS.map((p) => p.skillId)
    );
  });

  test("every entry has the AccessibleSkill fields populated", () => {
    const result: readonly AccessibleSkill[] =
      getAccessibleSkills(emptyProgress());
    for (const entry of result) {
      expect(typeof entry.skillId).toBe("string");
      expect(typeof entry.name).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
      expect(typeof entry.accessible).toBe("boolean");
      expect(Array.isArray(entry.missingPrerequisites)).toBe(true);
      expect(
        ["not-started", "learning", "practicing", "review", "mastered"]
      ).toContain(entry.masteryLevel);
      expect(entry.accuracy).toBeGreaterThanOrEqual(0);
      expect(entry.accuracy).toBeLessThanOrEqual(1);
      expect(typeof entry.contentReady).toBe("boolean");
    }
  });

  test("returns a fresh array (does not alias module-level state)", () => {
    const a = getAccessibleSkills(emptyProgress());
    const b = getAccessibleSkills(emptyProgress());
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe("getAccessibleSkills — accessibility rules", () => {
  test("skill with no prerequisites is always accessible when content is ready", () => {
    const result = getAccessibleSkills(emptyProgress());
    const conjuntos = result.find((s) => s.skillId === "mat.u1.conjuntos_numericos");
    expect(conjuntos).toBeDefined();
    expect(conjuntos?.accessible).toBe(true);
    expect(conjuntos?.missingPrerequisites).toEqual([]);
    expect(conjuntos?.contentReady).toBe(true);
  });

  test("intervalos (no prerequisites) is accessible with empty progress", () => {
    const result = getAccessibleSkills(emptyProgress());
    const intervalos = result.find((s) => s.skillId === "mat.u1.intervalos");
    expect(intervalos?.accessible).toBe(true);
    expect(intervalos?.missingPrerequisites).toEqual([]);
  });

  test("reales_operaciones is NOT accessible when conjuntos_numericos prereq has no progress", () => {
    const result = getAccessibleSkills(emptyProgress());
    const reales = result.find((s) => s.skillId === "mat.u1.propiedades_operaciones_reales");
    expect(reales?.accessible).toBe(false);
    expect(reales?.missingPrerequisites).toContain("mat.u1.conjuntos_numericos");
  });

  test("potencias_raices is NOT accessible when its reales_operaciones prereq is unmet", () => {
    const result = getAccessibleSkills(emptyProgress());
    const potencias = result.find((s) => s.skillId === "mat.u1.potencias_raices");
    expect(potencias?.accessible).toBe(false);
    expect(potencias?.missingPrerequisites).toContain("mat.u1.propiedades_operaciones_reales");
  });

  test("reales_operaciones is NOT accessible when prereq accuracy is only 0.5 (partial)", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.5 },
    };
    const result = getAccessibleSkills(progress);
    const reales = result.find((s) => s.skillId === "mat.u1.propiedades_operaciones_reales");
    expect(reales?.accessible).toBe(false);
    expect(reales?.missingPrerequisites).toContain("mat.u1.conjuntos_numericos");
  });

  test("reales_operaciones is NOT accessible when prereq accuracy is just below threshold (0.69)", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.69 },
    };
    const result = getAccessibleSkills(progress);
    const reales = result.find((s) => s.skillId === "mat.u1.propiedades_operaciones_reales");
    expect(reales?.accessible).toBe(false);
  });

  test("reales_operaciones IS accessible when prereq accuracy is exactly at threshold (0.7)", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.7 },
    };
    const result = getAccessibleSkills(progress);
    const reales = result.find((s) => s.skillId === "mat.u1.propiedades_operaciones_reales");
    expect(reales?.accessible).toBe(true);
    expect(reales?.missingPrerequisites).toEqual([]);
  });

  test("potencias_raices IS accessible when its prereq chain is fully mastered", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: {
        "mat.u1.conjuntos_numericos": 0.9,
        "mat.u1.propiedades_operaciones_reales": 0.85,
      },
    };
    const result = getAccessibleSkills(progress);
    const potencias = result.find((s) => s.skillId === "mat.u1.potencias_raices");
    expect(potencias?.accessible).toBe(true);
    expect(potencias?.missingPrerequisites).toEqual([]);
  });

  test("all skills are accessible when the full prereq chain is mastered", () => {
    const progress: PracticeProgress = {
      ...emptyProgress(),
      accuracyBySkill: {
        "mat.u1.conjuntos_numericos": 0.9,
        "mat.u1.propiedades_operaciones_reales": 0.85,
        "mat.u1.potencias_raices": 0.85,
        "mat.u1.intervalos": 0.85,
        "mat.u1.valor_absoluto": 0.85,
        "mat.u1.logaritmos": 0.85,
        "mat.u2.polinomios_basico": 0.85,
        "mat.u2.operaciones_polinomios": 0.85,
        "mat.u2.ruffini_resto": 0.85,
        "mat.u2.factorizacion": 0.85,
        "mat.u2.gauss": 0.85,
        "mat.u2.mcm_mcd_polinomios": 0.85,
      },
    };
    // Skills without content (like mat.u1.complejos, which is pilot-registered
    // but not yet content-ready in PR 1) are excluded from this check.
    const notYetReady: Set<string> = new Set(["mat.u1.complejos"]);
    const result = getAccessibleSkills(progress);
    for (const skill of result) {
      if (notYetReady.has(skill.skillId)) continue;
      expect(skill.accessible).toBe(true);
    }
  });

  test("only skills without prerequisites are accessible with empty progress", () => {
    const result = getAccessibleSkills(emptyProgress());
    const accessibleIds = result.filter((s) => s.accessible).map((s) => s.skillId);
    expect(accessibleIds).toContain("mat.u1.conjuntos_numericos");
    expect(accessibleIds).toContain("mat.u1.intervalos");
    expect(accessibleIds).not.toContain("mat.u1.propiedades_operaciones_reales");
    expect(accessibleIds).not.toContain("mat.u1.potencias_raices");
    expect(accessibleIds).not.toContain("mat.u1.racionalizacion");
  });
});

describe("getAccessibleSkills — mastery level propagation", () => {
  test("skill with 5+ correct attempts and 1.0 accuracy reports 'mastered'", () => {
    const progress = progressWithAttempts(
      "mat.u1.conjuntos_numericos",
      5,
      5,
      "stable"
    );
    const result = getAccessibleSkills(progress);
    const conjuntos = result.find((s) => s.skillId === "mat.u1.conjuntos_numericos");
    expect(conjuntos?.masteryLevel).toBe("mastered");
    expect(conjuntos?.accuracy).toBe(1.0);
  });

  test("skill with 0 attempts reports 'not-started' and accuracy 0", () => {
    const result = getAccessibleSkills(emptyProgress());
    const potencias = result.find((s) => s.skillId === "mat.u1.potencias_raices");
    expect(potencias?.masteryLevel).toBe("not-started");
    expect(potencias?.accuracy).toBe(0);
  });
});

describe("getAccessibleSkills — backward compatibility", () => {
  test("does not mutate the input progress object", () => {
    const progress = progressWithAttempts(
      "mat.u1.conjuntos_numericos",
      5,
      5
    );
    const snapshot = JSON.stringify(progress);
    getAccessibleSkills(progress);
    expect(JSON.stringify(progress)).toBe(snapshot);
  });

  test("works with progress missing the WU 5 fields (legacy localStorage)", () => {
    // Legacy shape: no lastPracticedBySkill, no diagnosticResult, no studyPlan.
    // loadProgress() fills these in for us, but getAccessibleSkills should
    // also tolerate them being absent if a caller forgets.
    const legacy = {
      attempts: [] as readonly PracticeAttempt[],
      accuracyBySkill: {} as Record<string, number>,
      trendBySkill: {} as Record<string, "improving" | "stable" | "needs-review">,
    } as unknown as PracticeProgress;
    const result = getAccessibleSkills(legacy);
    expect(result).toHaveLength(PILOT_SKILLS.length);
  });
});
