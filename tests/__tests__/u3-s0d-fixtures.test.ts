/**
 * S0d — Four immutable compatibility fixtures parsed through the
 * real production persistence deserializers.
 *
 * Each fixture is a frozen pre-change snapshot. The test file
 * inlines a 42-row LITERAL contract — independent of the fixture
 * file so a regression in both surfaces only when they diverge from
 * the canonical snapshot.
 */

import { describe, test, expect } from "vitest";
import { validateChallengeEntry } from "@/lib/challenges/loader";
import { parseProgress } from "@/lib/practice-progress";
import { parseAdvancedProgress } from "@/lib/advanced-practice-progress";

import { FROZEN_U3_EXERCISE_BASELINE } from "../fixtures/compatibility/u3-exercise-baseline";
import { FROZEN_U3_CHALLENGE_BASELINE } from "../fixtures/compatibility/u3-challenge-baseline";
import { FROZEN_U3_PRACTICE_PROGRESS_BASELINE } from "../fixtures/compatibility/u3-practice-progress-baseline";
import { FROZEN_U3_ADVANCED_PROGRESS_BASELINE } from "../fixtures/compatibility/u3-advanced-progress-baseline";

// 42 pre-change IDs, authored independently of the fixture file.
const LITERAL_U3_EXERCISES = [
  { id: "ex.u3.ecuaciones_lineales.1", skillId: "mat.u3.ecuaciones_lineales", difficulty: 1 },
  { id: "ex.u3.ecuaciones_cuadraticas.1", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 2 },
  { id: "ex.u3.inecuaciones_lineales.1", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.recta.1", skillId: "mat.u3.recta", difficulty: 2 },
  { id: "ex.u3.sistemas.1", skillId: "mat.u3.sistemas", difficulty: 3 },
  { id: "ex.u3.traduccion_lenguaje_verbal.2", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 1 },
  { id: "ex.u3.traduccion_lenguaje_verbal.3", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 2 },
  { id: "ex.u3.traduccion_lenguaje_verbal.4", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 2 },
  { id: "ex.u3.traduccion_lenguaje_verbal.5", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 3 },
  { id: "ex.u3.traduccion_lenguaje_verbal.6", skillId: "mat.u3.traduccion_lenguaje_verbal", difficulty: 3 },
  { id: "ex.u3.ecuaciones_lineales.2", skillId: "mat.u3.ecuaciones_lineales", difficulty: 1 },
  { id: "ex.u3.ecuaciones_lineales.3", skillId: "mat.u3.ecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.ecuaciones_lineales.4", skillId: "mat.u3.ecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.ecuaciones_lineales.5", skillId: "mat.u3.ecuaciones_lineales", difficulty: 1 },
  { id: "ex.u3.ecuaciones_cuadraticas.2", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 1 },
  { id: "ex.u3.ecuaciones_cuadraticas.3", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 3 },
  { id: "ex.u3.ecuaciones_cuadraticas.4", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 2 },
  { id: "ex.u3.ecuaciones_cuadraticas.5", skillId: "mat.u3.ecuaciones_cuadraticas", difficulty: 3 },
  { id: "ex.u3.inecuaciones_lineales.2", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.inecuaciones_lineales.3", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.inecuaciones_lineales.4", skillId: "mat.u3.inecuaciones_lineales", difficulty: 3 },
  { id: "ex.u3.inecuaciones_lineales.5", skillId: "mat.u3.inecuaciones_lineales", difficulty: 2 },
  { id: "ex.u3.inecuaciones_valor_absoluto.2", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 2 },
  { id: "ex.u3.inecuaciones_valor_absoluto.3", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 2 },
  { id: "ex.u3.inecuaciones_valor_absoluto.4", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 3 },
  { id: "ex.u3.inecuaciones_valor_absoluto.5", skillId: "mat.u3.inecuaciones_valor_absoluto", difficulty: 3 },
  { id: "ex.u3.recta.2", skillId: "mat.u3.recta", difficulty: 2 },
  { id: "ex.u3.recta.3", skillId: "mat.u3.recta", difficulty: 2 },
  { id: "ex.u3.recta.4", skillId: "mat.u3.recta", difficulty: 1 },
  { id: "ex.u3.recta.5", skillId: "mat.u3.recta", difficulty: 3 },
  { id: "ex.u3.sistemas.2", skillId: "mat.u3.sistemas", difficulty: 2 },
  { id: "ex.u3.sistemas.3", skillId: "mat.u3.sistemas", difficulty: 3 },
  { id: "ex.u3.sistemas.4", skillId: "mat.u3.sistemas", difficulty: 3 },
  { id: "ex.u3.sistemas.5", skillId: "mat.u3.sistemas", difficulty: 4 },
  { id: "ex.u3.exponenciales.2", skillId: "mat.u3.exponenciales", difficulty: 1 },
  { id: "ex.u3.exponenciales.3", skillId: "mat.u3.exponenciales", difficulty: 3 },
  { id: "ex.u3.exponenciales.4", skillId: "mat.u3.exponenciales", difficulty: 1 },
  { id: "ex.u3.exponenciales.5", skillId: "mat.u3.exponenciales", difficulty: 3 },
  { id: "ex.u3.logaritmicas.2", skillId: "mat.u3.logaritmicas", difficulty: 1 },
  { id: "ex.u3.logaritmicas.3", skillId: "mat.u3.logaritmicas", difficulty: 2 },
  { id: "ex.u3.logaritmicas.4", skillId: "mat.u3.logaritmicas", difficulty: 2 },
  { id: "ex.u3.logaritmicas.5", skillId: "mat.u3.logaritmicas", difficulty: 1 },
] as const;

describe("S0d — frozen U3 exercise baseline (catalog snapshot)", () => {
  test("exactly 42 pre-change IDs across 9 in-scope U3 skills (literal contract)", () => {
    expect(FROZEN_U3_EXERCISE_BASELINE).toHaveLength(42);
    for (const row of FROZEN_U3_EXERCISE_BASELINE) {
      expect(Object.keys(row).sort()).toEqual(["difficulty", "id", "skillId"]);
    }
    expect(FROZEN_U3_EXERCISE_BASELINE).toEqual(LITERAL_U3_EXERCISES);
  });
});

describe("S0d — frozen U3 challenge baseline parses via `validateChallengeEntry`", () => {
  test("2 desafios + each parses end-to-end with literal field values", () => {
    expect(FROZEN_U3_CHALLENGE_BASELINE).toHaveLength(2);
    expect(FROZEN_U3_CHALLENGE_BASELINE.map((c) => c.id).sort()).toEqual([
      "ex.u3.traduccion_lenguaje_verbal.desafio-01",
      "ex.u3.traduccion_lenguaje_verbal.desafio-02",
    ]);
    for (const [suffix, diff] of [["desafio-01", 5], ["desafio-02", 4]] as const) {
      const desafio = FROZEN_U3_CHALLENGE_BASELINE.find(
        (c) => c.id === `ex.u3.traduccion_lenguaje_verbal.${suffix}`
      )!;
      expect(desafio.skillId).toBe("mat.u3.traduccion_lenguaje_verbal");
      expect(desafio.difficulty).toBe(diff);
      expect(desafio.type).toBe("multiple-choice");
      expect(desafio.canonicalTrace[0].sourceUse).toBe("canonical-source");
      expect(desafio.canonicalTrace[0].path).toBe(
        "material_canonico/Matemática/UNIDAD3_matemática.pdf"
      );
      const parsed = validateChallengeEntry({
        ...desafio,
        challengeSection: true,
        category: "desafio",
        tags: ["desafio", "integrador"],
        options: ["A", "B"],
        expectedAnswer: "A",
        commonErrorTags: [],
        pedagogicalNote: "frozen",
        prompt: "frozen",
      });
      expect(parsed.id).toBe(desafio.id);
      expect(parsed.difficulty).toBe(desafio.difficulty);
      expect(parsed.canonicalTrace[0].sourceUse).toBe("canonical-source");
    }
  });
});

describe("S0d — frozen U3 practice progress baseline parses via `parseProgress`", () => {
  test("envelope + active-student slice round-trip with literal values", () => {
    expect(FROZEN_U3_PRACTICE_PROGRESS_BASELINE.activeStudentId).toBe(
      "u3-baseline-student-1"
    );
    expect(Object.keys(FROZEN_U3_PRACTICE_PROGRESS_BASELINE.students)).toEqual([
      "u3-baseline-student-1",
    ]);
    const slice =
      FROZEN_U3_PRACTICE_PROGRESS_BASELINE.students[
        FROZEN_U3_PRACTICE_PROGRESS_BASELINE.activeStudentId!
      ]!;
    const parsed = parseProgress(slice);
    expect(parsed).not.toBeNull();
    expect(parsed!.attempts).toHaveLength(1);
    const [a] = parsed!.attempts;
    expect(a.exerciseId).toBe("ex.u3.traduccion_lenguaje_verbal.2");
    expect(a.skillId).toBe("mat.u3.traduccion_lenguaje_verbal");
    expect(a.correct).toBe(true);
    expect(a.answeredAt).toBe("2026-06-13T10:00:00.000Z");
    expect(a.timeMs).toBe(4200);
    expect(a.attemptIndex).toBe(1);
    expect(a.studentId).toBe("u3-baseline-student-1");
    expect(slice.accuracyBySkill).toEqual({ "mat.u3.traduccion_lenguaje_verbal": 1.0 });
    expect(slice.trendBySkill).toEqual({ "mat.u3.traduccion_lenguaje_verbal": "stable" });
    expect(slice.lastPracticedBySkill).toEqual({ "mat.u3.traduccion_lenguaje_verbal": "2026-06-13T10:00:00.000Z" });
    expect(slice.diagnosticResult).toBeNull();
    expect(slice.studyPlan).toBeNull();
  });
});

describe("S0d — frozen U3 advanced progress baseline parses via `parseAdvancedProgress`", () => {
  test("envelope + ChallengeAttempt + readinessBySkill round-trip with literal values", () => {
    expect(FROZEN_U3_ADVANCED_PROGRESS_BASELINE.challengeAttempts).toHaveLength(1);
    expect(Object.keys(FROZEN_U3_ADVANCED_PROGRESS_BASELINE.readinessBySkill).sort()).toEqual([
      "mat.u3.ecuaciones_lineales",
      "mat.u3.logaritmicas",
      "mat.u3.traduccion_lenguaje_verbal",
    ]);
    expect(FROZEN_U3_ADVANCED_PROGRESS_BASELINE.readinessBySkill["mat.u3.traduccion_lenguaje_verbal"]).toBe(100);
    expect(FROZEN_U3_ADVANCED_PROGRESS_BASELINE.readinessBySkill["mat.u3.ecuaciones_lineales"]).toBeNull();
    const parsed = parseAdvancedProgress(FROZEN_U3_ADVANCED_PROGRESS_BASELINE);
    expect(parsed).not.toBeNull();
    const [a] = parsed!.challengeAttempts;
    // The frozen baseline carries a stamped `studentId`, but the parsed
    // envelope admits legacy anonymous records (no `studentId`). Narrow
    // with a runtime check so the type system agrees with the test.
    if (!("studentId" in a)) {
      throw new Error("frozen baseline should carry a stamped studentId");
    }
    expect(a.studentId).toBe("u3-baseline-student-1");
    expect(a.exerciseId).toBe("ex.u3.traduccion_lenguaje_verbal.desafio-01");
    expect(a.skillId).toBe("mat.u3.traduccion_lenguaje_verbal");
    expect(a.correct).toBe(true);
    expect(a.answeredAt).toBe("2026-06-13T10:05:00.000Z");
    expect(a.timeMs).toBe(12000);
    expect(a.attemptIndex).toBe(1);
    expect(Object.keys(a).sort()).toEqual([
      "answeredAt",
      "attemptIndex",
      "correct",
      "exerciseId",
      "skillId",
      "studentId",
      "timeMs",
    ]);
  });
});
