/**
 * Tests for validatePracticeBank — bank-level validation for practice exercises.
 *
 * Validates category coverage, minimum counts per category, and feedback
 * presence for exercises in a skill's practice bank.
 */

import { describe, test, expect } from "vitest";
import { validatePracticeBank } from "../catalog/content-loaders";
import type { Exercise } from "../models/exercise";
import type { FeedbackMapping } from "../feedback/index";

describe("validatePracticeBank", () => {
  const SKILL_ID = "mat.u1.conjuntos_numericos";

  /** Helper to build a minimal exercise with category. */
  function makeExercise(
    id: string,
    category: string,
    difficulty: number,
    errorTags: readonly string[] = []
  ): Exercise {
    return {
      id: `ex.u1.conjuntos_numericos.${id}` as Exercise["id"],
      skillId: SKILL_ID,
      type: "multiple-choice",
      difficulty: difficulty as Exercise["difficulty"],
      prompt: "Test prompt",
      expectedAnswer: "A",
      options: ["A", "B"],
      commonErrorTags: errorTags,
      pedagogicalNote: "Note",
      category,
      tags: [],
    };
  }

  /** Helper to build a feedback mapping. */
  function makeFeedback(errorTag: string): FeedbackMapping {
    return {
      errorTag,
      type: "conceptual",
      message: `Feedback for ${errorTag}`,
      recoveryTarget: "theory-conjuntos-numericos",
    };
  }

  describe("missing category field", () => {
    test("returns diagnostic for exercise without category", () => {
      const exercises: Exercise[] = [
        {
          id: "ex.u1.conjuntos_numericos.1" as Exercise["id"],
          skillId: SKILL_ID,
          type: "multiple-choice",
          difficulty: 1,
          prompt: "Test",
          expectedAnswer: "A",
          options: ["A", "B"],
          commonErrorTags: [],
          pedagogicalNote: "Note",
          // no category field
        },
      ];

      const diagnostics = validatePracticeBank(SKILL_ID, exercises);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(
        diagnostics.some((d) => d.includes("category") || d.includes("missing"))
      ).toBe(true);
    });
  });

  describe("category below minimum", () => {
    test("returns diagnostic when pertenencia is below its minimum count of 8", () => {
      // Only 1 pertenencia exercise — minimum is 8
      const exercises: Exercise[] = [
        makeExercise("cn-per-01", "pertenencia", 1),
      ];

      const diagnostics = validatePracticeBank(SKILL_ID, exercises);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(
        diagnostics.some(
          (d) => d.includes("pertenencia")
        )
      ).toBe(true);
    });
  });

  describe("complete bank", () => {
    test("returns no diagnostics for a bank that meets every category minimum", () => {
      // Build a bank that satisfies all minimums from the practice-coverage delta:
      // pertenencia ≥8, clasificacion ≥12, racionales ≥8, decimales ≥6, mapa ≥4, errores ≥6
      const exercises: Exercise[] = [
        // pertenencia (8)
        ...Array.from({ length: 8 }, (_, i) =>
          makeExercise(`cn-per-${String(i + 1).padStart(2, "0")}`, "pertenencia", (i % 5) + 1)
        ),
        // clasificacion (12)
        ...Array.from({ length: 12 }, (_, i) =>
          makeExercise(`cn-cla-${String(i + 1).padStart(2, "0")}`, "clasificacion", (i % 5) + 1)
        ),
        // racionales-vs-irracionales (8)
        ...Array.from({ length: 8 }, (_, i) =>
          makeExercise(`cn-rvi-${String(i + 1).padStart(2, "0")}`, "racionales-vs-irracionales", (i % 5) + 1)
        ),
        // decimales (6)
        ...Array.from({ length: 6 }, (_, i) =>
          makeExercise(`cn-dec-${String(i + 1).padStart(2, "0")}`, "decimales", (i % 5) + 1)
        ),
        // mapa (4)
        ...Array.from({ length: 4 }, (_, i) =>
          makeExercise(`cn-map-${String(i + 1).padStart(2, "0")}`, "mapa", (i % 5) + 1)
        ),
        // errores-comunes (6)
        ...Array.from({ length: 6 }, (_, i) =>
          makeExercise(`cn-err-${String(i + 1).padStart(2, "0")}`, "errores-comunes", (i % 5) + 1)
        ),
      ];

      const diagnostics = validatePracticeBank(SKILL_ID, exercises);
      expect(diagnostics).toEqual([]);
    });
  });

  describe("feedback coverage", () => {
    test("returns no diagnostics when all exercises with error tags have feedback", () => {
      const exercises: Exercise[] = [
        makeExercise("cn-per-01", "pertenencia", 1, ["u1_pertenencia_vs_inclusion"]),
        makeExercise("cn-per-02", "pertenencia", 1, ["u1_confunde_natural_entero"]),
      ];
      const feedback: FeedbackMapping[] = [
        makeFeedback("u1_pertenencia_vs_inclusion"),
        makeFeedback("u1_confunde_natural_entero"),
      ];

      const diagnostics = validatePracticeBank(SKILL_ID, exercises, feedback);
      // May have category diagnostics, but no feedback-related ones
      const feedbackDiagnostics = diagnostics.filter((d) => d.includes("feedback"));
      expect(feedbackDiagnostics).toEqual([]);
    });

    test("returns diagnostic when an exercise references an error tag without feedback", () => {
      const exercises: Exercise[] = [
        makeExercise("cn-per-01", "pertenencia", 1, ["u1_pertenencia_vs_inclusion"]),
        makeExercise("cn-per-02", "pertenencia", 1, ["u1_missing_tag"]),
      ];
      const feedback: FeedbackMapping[] = [
        makeFeedback("u1_pertenencia_vs_inclusion"),
        // u1_missing_tag has no feedback
      ];

      const diagnostics = validatePracticeBank(SKILL_ID, exercises, feedback);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(
        diagnostics.some((d) => d.includes("feedback") || d.includes("u1_missing_tag"))
      ).toBe(true);
    });

    test("removing a pertenencia exercise reintroduces a category diagnostic", () => {
      // 7 pertenencia (below minimum of 8)
      const exercises: Exercise[] = [
        ...Array.from({ length: 7 }, (_, i) =>
          makeExercise(`cn-per-${String(i + 1).padStart(2, "0")}`, "pertenencia", (i % 5) + 1)
        ),
        ...Array.from({ length: 12 }, (_, i) =>
          makeExercise(`cn-cla-${String(i + 1).padStart(2, "0")}`, "clasificacion", (i % 5) + 1)
        ),
        ...Array.from({ length: 8 }, (_, i) =>
          makeExercise(`cn-rvi-${String(i + 1).padStart(2, "0")}`, "racionales-vs-irracionales", (i % 5) + 1)
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          makeExercise(`cn-dec-${String(i + 1).padStart(2, "0")}`, "decimales", (i % 5) + 1)
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          makeExercise(`cn-map-${String(i + 1).padStart(2, "0")}`, "mapa", (i % 5) + 1)
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          makeExercise(`cn-err-${String(i + 1).padStart(2, "0")}`, "errores-comunes", (i % 5) + 1)
        ),
      ];

      const diagnostics = validatePracticeBank(SKILL_ID, exercises);
      expect(diagnostics.length).toBeGreaterThan(0);
      expect(diagnostics.some((d) => d.includes("pertenencia"))).toBe(true);
    });
  });
});
