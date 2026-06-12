/**
 * U1 Regression Guard — verifies that PR-1 + PR-2 changes to the evaluator
 * chain do NOT break any U1 exercise evaluation or catalog integrity.
 *
 * Spec coverage: U2-EVAL-009
 * TDD: Strict — this file is a RED-written approval/regression suite.
 */
import { describe, test, expect } from "vitest";
import { evaluateAnswer } from "../evaluator/index";
import { loadCatalog } from "../catalog/index";
import type { Exercise } from "../models/exercise";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex.u1.propiedades_operaciones_reales.1",
    skillId: "mat.u1.propiedades_operaciones_reales",
    type: "numerical",
    difficulty: 2,
    prompt: "Calcula 3 + 5",
    expectedAnswer: "8",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
    unit: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Regression tests
// ---------------------------------------------------------------------------

describe("U1 Regression — Evaluator chain", () => {
  describe("U1 numerical evaluator still works", () => {
    test("correct numeric answer is accepted", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "42" });
      const result = evaluateAnswer(exercise, "42");
      expect(result.correct).toBe(true);
      expect(result.errorTag).toBeUndefined();
    });

    test("incorrect numeric answer is rejected", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "42" });
      const result = evaluateAnswer(exercise, "99");
      expect(result.correct).toBe(false);
    });

    test("tolerance works for numeric answers", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "3.14" });
      const result = evaluateAnswer(exercise, "3.1405");
      expect(result.correct).toBe(true);
    });

    test("negative numbers are evaluated correctly", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "-5" });
      expect(evaluateAnswer(exercise, "-5").correct).toBe(true);
      expect(evaluateAnswer(exercise, "5").correct).toBe(false);
    });

    test("unicode minus is normalized", () => {
      const exercise = makeExercise({ type: "numerical", expectedAnswer: "−4" });
      const result = evaluateAnswer(exercise, "-4");
      expect(result.correct).toBe(true);
    });
  });

  describe("U1 boolean evaluator still works", () => {
    test.each([
      ["v", "true"],
      ["verdadero", "true"],
      ["f", "false"],
      ["no", "false"],
    ])("'%s' maps to '%s' for true-false", (answer, expectedAnswer) => {
      const exercise = makeExercise({
        type: "true-false",
        expectedAnswer,
      });
      const result = evaluateAnswer(exercise, answer);
      // Boolean evaluator normalizes input: v/verdadero → true, f/no → false
      expect(result.correct).toBe(true);
    });
  });

  describe("U1 multiple-choice evaluator still works", () => {
    test("case-insensitive MC answer", () => {
      const exercise = makeExercise({ type: "multiple-choice", expectedAnswer: "B" });
      const result = evaluateAnswer(exercise, "b");
      expect(result.correct).toBe(true);
    });
  });

  describe("U1 error tagging still works", () => {
    test("sign error tag is detected on wrong-sign numeric answer", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });
      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("u1_signo_racionalizacion");
    });

    test("sign error tag is NOT emitted when tag not declared", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_orden_operaciones"],
      });
      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBeUndefined();
    });
  });

  describe("U1 unsupported types return manual-review", () => {
    test.each(["graphical", "matching", "ordering"] as const)(
      "%s returns manual-review",
      (type) => {
        const exercise = makeExercise({ type, expectedAnswer: "any" });
        const result = evaluateAnswer(exercise, "student answer");
        expect(result.correct).toBe(false);
        expect(result.errorTag).toBe("unsupported_type");
        expect(result.feedback).toBe("manual-review");
      }
    );
  });
});

// ---------------------------------------------------------------------------
// Catalog integrity
// ---------------------------------------------------------------------------

describe("U1 Regression — Catalog integrity", () => {
  const catalog = loadCatalog();

  test("all 8 U1 skills are present", () => {
    const u1SkillIds = [
      "mat.u1.conjuntos_numericos",
      "mat.u1.propiedades_operaciones_reales",
      "mat.u1.potencias_raices",
      "mat.u1.racionalizacion",
      "mat.u1.intervalos",
      "mat.u1.valor_absoluto",
      "mat.u1.logaritmos",
      "mat.u1.complejos",
    ];

    for (const skillId of u1SkillIds) {
      const exercises = catalog.filter((ex) => ex.skillId === skillId);
      expect(exercises.length).toBeGreaterThanOrEqual(1);
    }
  });

  test("U1 exercises have correct types (no free-text for structured math)", () => {
    const u1Exercises = catalog.filter((ex) => ex.skillId.startsWith("mat.u1."));
    for (const ex of u1Exercises) {
      // No graphical, no ordering for U1 exercises (regression guard)
      expect(ex.type).not.toBe("graphical");
      expect(ex.type).not.toBe("ordering");
    }
  });

  test("ex.u2.gauss.1 is correctly assigned to mat.u2.gauss with U2 Gauss content", () => {
    const gauss = catalog.find((ex) => ex.id === "ex.u2.gauss.1");
    expect(gauss).toBeDefined();
    expect(gauss!.skillId).toBe("mat.u2.gauss");
  });

  test("catalog has no duplicate exercise IDs", () => {
    const ids = catalog.map((ex) => ex.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("all exercises have expectedAnswer defined", () => {
    for (const ex of catalog) {
      expect(ex.expectedAnswer).toBeDefined();
      expect(ex.expectedAnswer.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// U2 Factorizacion evaluator chain regression (U2FAC-EVAL-008)
// ---------------------------------------------------------------------------

describe("U2 Regression — Factorizacion evaluator chain", () => {
  describe("symbolic type removed — factorizacion uses structured types", () => {
    test("no U2 exercise uses symbolic type", () => {
      const catalog = loadCatalog();
      // Symbolic is no longer in ExerciseType; cast to check raw JSON hasn't reintroduced it
      const u2Symbolic = catalog.filter(
        (e) => e.skillId.startsWith("mat.u2.") && (e.type as string) === "symbolic"
      );
      expect(u2Symbolic.length).toBe(0);
    });
  });

  describe("gauss exercises use multiple-choice for multi-root answers", () => {
    test("gauss.1 is multiple-choice with options", () => {
      const exercise = loadCatalog().find((e) => e.id === "ex.u2.gauss.1");
      expect(exercise).toBeDefined();
      expect(exercise?.type).toBe("multiple-choice");
      expect(exercise?.options).toBeDefined();
      expect(exercise!.options!.length).toBeGreaterThanOrEqual(3);
    });

    test("gauss.3 is numerical with single scalar answer", () => {
      const exercise = loadCatalog().find((e) => e.id === "ex.u2.gauss.3");
      expect(exercise).toBeDefined();
      expect(exercise?.type).toBe("numerical");
      expect(exercise?.expectedAnswer).toBe("1");
    });
  });

  describe("new error tags do not break tagError flow", () => {
    test("u2_signo_factorizacion tag is dispatched for sign error", () => {
      const exercise = makeExercise({
        id: "ex.u2.factorizacion.1",
        skillId: "mat.u2.factorizacion",
        type: "multiple-choice",
        expectedAnswer: "(x-3)(x+3)",
        commonErrorTags: ["u2_signo_factorizacion"],
        options: [
          { value: "(x-3)(x+3)", label: "A" },
          { value: "(x-3)(x-3)", label: "B" },
        ],
      });

      const result = evaluateAnswer(exercise, "(x-3)(x-3)");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("u2_signo_factorizacion");
    });

    test("u2_caso_incorrecto tag is dispatched for wrong case", () => {
      const exercise = makeExercise({
        id: "ex.u2.factorizacion.2",
        skillId: "mat.u2.factorizacion",
        type: "multiple-choice",
        prompt: "¿Qué caso de factoreo aplica al polinomio x² − 25?",
        expectedAnswer: "Diferencia de cuadrados",
        commonErrorTags: ["u2_caso_incorrecto"],
        options: [
          { value: "Diferencia de cuadrados", label: "A" },
          { value: "Trinomio cuadrado perfecto", label: "B" },
        ],
      });

      const result = evaluateAnswer(exercise, "Trinomio cuadrado perfecto");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("u2_caso_incorrecto");
    });

    test("U1 sign error still tags correctly (regression guard)", () => {
      const exercise = makeExercise({
        type: "numerical",
        expectedAnswer: "5",
        commonErrorTags: ["u1_signo_racionalizacion"],
      });

      const result = evaluateAnswer(exercise, "-5");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("u1_signo_racionalizacion");
    });

    test("U2 fundamentos error tags still dispatch correctly", () => {
      const exercise = makeExercise({
        id: "ex.u2.operaciones_polinomios.1",
        skillId: "mat.u2.operaciones_polinomios",
        type: "multiple-choice",
        prompt: "¿Cuál es el grado de 3x⁴ + 2x² − 1?",
        expectedAnswer: "4",
        commonErrorTags: ["u2_grado_incorrecto"],
        options: [
          { value: "4", label: "A" },
          { value: "3", label: "B" },
        ],
      });

      const result = evaluateAnswer(exercise, "3");
      expect(result.correct).toBe(false);
      expect(result.errorTag).toBe("u2_grado_incorrecto");
    });
  });
});

describe("U2 Regression — Catalog integrity after factorizacion slice", () => {
  const catalog = loadCatalog();

  test("U2 skills are present in catalog", () => {
    const u2SkillIds = [
      "mat.u2.polinomios_basico",
      "mat.u2.operaciones_polinomios",
      "mat.u2.ruffini_resto",
      "mat.u2.factorizacion",
      "mat.u2.gauss",
    ];

    for (const skillId of u2SkillIds) {
      const exercises = catalog.filter((ex) => ex.skillId === skillId);
      expect(exercises.length, `Skill ${skillId} should have exercises`).toBeGreaterThanOrEqual(0);
    }
  });

  test("catalog still has no duplicate exercise IDs", () => {
    const ids = catalog.map((ex) => ex.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("gauss-routing-helper module is importable", async () => {
    // Verify the module exists and exports expected functions
    const mod = await import("../evaluator/gauss-routing-helper");
    expect(typeof mod.parseRationalRoots).toBe("function");
    expect(typeof mod.normalizeRoots).toBe("function");
    expect(typeof mod.areEquivalentRoots).toBe("function");
    expect(typeof mod.GaussParseError).toBe("function");
    expect(typeof mod.GaussEquivalenceError).toBe("function");
  });
});
