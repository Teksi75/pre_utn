/**
 * RED phase — test that applyExerciseDefaults adds explicit unit metadata.
 *
 * The unit field should be derived from skillId regex during defaulting,
 * so every exercise carries its unit number explicitly.
 */

import { describe, test, expect } from "vitest";
import { applyExerciseDefaults } from "../catalog/content-loaders";

describe("exercise unit metadata", () => {
  test("applyExerciseDefaults derives unit from skillId (u1)", () => {
    const raw = {
      id: "ex.u1.test_skill.1",
      skillId: "mat.u1.test_skill",
      type: "numerical",
      difficulty: 1,
      prompt: "Test prompt",
      expectedAnswer: "42",
      pedagogicalNote: "Test note",
    };
    const result = applyExerciseDefaults(raw);
    expect(result.unit).toBe(1);
  });

  test("applyExerciseDefaults derives unit from skillId (u2)", () => {
    const raw = {
      id: "ex.u2.polinomios_basico.1",
      skillId: "mat.u2.polinomios_basico",
      type: "multiple-choice",
      difficulty: 1,
      prompt: "Test",
      expectedAnswer: "5x",
      options: ["5x", "6x"],
      pedagogicalNote: "Test",
    };
    const result = applyExerciseDefaults(raw);
    expect(result.unit).toBe(2);
  });

  test("applyExerciseDefaults derives unit from skillId (u3)", () => {
    const raw = {
      id: "ex.u3.ecuaciones_lineales.1",
      skillId: "mat.u3.ecuaciones_lineales",
      type: "numerical",
      difficulty: 1,
      prompt: "Test",
      expectedAnswer: "2",
      pedagogicalNote: "Test",
    };
    const result = applyExerciseDefaults(raw);
    expect(result.unit).toBe(3);
  });

  test("applyExerciseDefaults derives unit 6 for u6 skillId", () => {
    const raw = {
      id: "ex.u6.funcion_concepto.1",
      skillId: "mat.u6.funcion_concepto",
      type: "true-false",
      difficulty: 1,
      prompt: "Test",
      expectedAnswer: "true",
      pedagogicalNote: "Test",
    };
    const result = applyExerciseDefaults(raw);
    expect(result.unit).toBe(6);
  });
});
