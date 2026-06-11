/**
 * Catalog Answer Contract Audit — TDD
 *
 * Validates that every exercise in the catalog has a type-answer shape
 * consistent with its declared type. Exercises whose expected answer
 * contains multiple values, variable assignments, or set notation MUST
 * NOT pass validation under type `numerical`.
 */

import { describe, test, expect } from "vitest";
import exercisesJson from "../../../content/matematica/exercises.json";
import type { Exercise, ExerciseType } from "../models/exercise";
import { getExerciseOptionValue } from "../models/exercise";
import { isFiniteNumericAnswer } from "../utils/numeric";

const exercises = exercisesJson as unknown as readonly Exercise[];

const MIGRATED_SYMBOLIC_IDS: readonly string[] = [
  "ex.u2.operaciones_polinomios.1",
  "ex.u3.inecuaciones_lineales.1",
  "ex.u3.recta.1",
  "ex.u3.sistemas.1",
  "ex.u4.thales.1",
  "ex.u5.identidades.1",
  "ex.u5.ecuaciones_trigonometricas.1",
  "ex.u6.dominio_imagen.1",
  "ex.u6.funcion_afin.1",
  "ex.u6.funcion_cuadratica.1",
];

function getLiveSymbolicIds(catalog: readonly Exercise[]): string[] {
  return catalog.filter((exercise) => exercise.type === "symbolic").map((exercise) => exercise.id);
}

/**
 * Detect multi-value or set-notation answers (e.g. "x = -2, x = 2", "{1, 2}").
 * Per spec: exercises whose expected answer contains multiple values, variable
 * assignments, or set notation MUST NOT be type `numerical`.
 */
function hasMultiValuePattern(value: string): boolean {
  const numericTokenCount =
    value.match(/[-−]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/g)?.length ?? 0;

  return (
    value.includes(",") ||
    value.includes(";") ||
    value.includes("{") ||
    value.includes("}") ||
    value.includes("=") ||
    numericTokenCount > 1
  );
}

/**
 * Catalog audit: returns list of exercises with type-answer shape mismatches.
 */
function auditCatalog(
  catalog: readonly Exercise[]
): readonly { id: string; type: ExerciseType; expectedAnswer: string; reason: string }[] {
  const failures: { id: string; type: ExerciseType; expectedAnswer: string; reason: string }[] = [];

  for (const ex of catalog) {
    if (ex.type === "numerical" && hasMultiValuePattern(ex.expectedAnswer)) {
      failures.push({
        id: ex.id,
        type: ex.type,
        expectedAnswer: ex.expectedAnswer,
        reason: `numerical expected answer contains multi-value/set notation: "${ex.expectedAnswer}"`,
      });
    } else if (ex.type === "numerical" && !isFiniteNumericAnswer(ex.expectedAnswer)) {
      failures.push({
        id: ex.id,
        type: ex.type,
        expectedAnswer: ex.expectedAnswer,
        reason: `numerical expected answer is not evaluator-compatible finite numeric: "${ex.expectedAnswer}"`,
      });
    }

    if (ex.type === "multiple-choice") {
      if (!ex.options || ex.options.length < 3) {
        failures.push({
          id: ex.id,
          type: ex.type,
          expectedAnswer: ex.expectedAnswer,
          reason: `multiple-choice has fewer than 3 options (got ${ex.options?.length ?? 0})`,
        });
      }
      if (ex.options && new Set(ex.options.map(getExerciseOptionValue)).size !== ex.options.length) {
        failures.push({
          id: ex.id,
          type: ex.type,
          expectedAnswer: ex.expectedAnswer,
          reason: `multiple-choice contains duplicate options: ${JSON.stringify(ex.options)}`,
        });
      }
      if (ex.options && !ex.options.map(getExerciseOptionValue).includes(ex.expectedAnswer)) {
        failures.push({
          id: ex.id,
          type: ex.type,
          expectedAnswer: ex.expectedAnswer,
          reason: `multiple-choice expected answer "${ex.expectedAnswer}" not found in options`,
        });
      }
    }
  }

  return failures;
}

describe("Catalog answer-contract audit", () => {
  test("audit helper treats scientific notation as a single scalar token", () => {
    expect(hasMultiValuePattern("1e3")).toBe(false);
    expect(hasMultiValuePattern("-1e-3")).toBe(false);
  });

  test("audit helper still flags obvious multi-value numerical forms", () => {
    expect(hasMultiValuePattern("0° 180°")).toBe(true);
    expect(hasMultiValuePattern("1, 2")).toBe(true);
    expect(hasMultiValuePattern("x = 2")).toBe(true);
  });

  test("live catalog contains no symbolic exercises outside U2 after migration", () => {
    // U2 symbolic exercises are legitimate: polynomial-evaluator handles them.
    // Symbolic exercises in other units (U1, U3+) are still unsupported.
    const symbolicIds = getLiveSymbolicIds(exercises).filter((id) => !id.startsWith("ex.u2."));
    expect(symbolicIds).toEqual([]);
  });

  test("known migration targets now use supported structured types", () => {
    const migratedTargets = exercises.filter((exercise) => MIGRATED_SYMBOLIC_IDS.includes(exercise.id));

    expect(migratedTargets).toHaveLength(MIGRATED_SYMBOLIC_IDS.length);
    for (const exercise of migratedTargets) {
      expect(["multiple-choice", "numerical", "true-false"]).toContain(exercise.type);
    }
  });

  test("numerical exercises do not have multi-value/set-notation answers", () => {
    const failures = auditCatalog(exercises);
    const numericalFailures = failures.filter((f) => f.type === "numerical");

    expect(numericalFailures).toEqual([]);
  });

  test("live numerical expected answers are evaluator-compatible finite numerics", () => {
    const failures = auditCatalog(exercises).filter(
      (failure) =>
        failure.type === "numerical" &&
        failure.reason.includes("evaluator-compatible finite numeric")
    );

    expect(failures).toEqual([]);
  });

  test("multiple-choice exercises have >=3 unique options and expected answer in options", () => {
    const failures = auditCatalog(exercises);
    const mcFailures = failures.filter((f) => f.type === "multiple-choice");

    expect(mcFailures).toEqual([]);
  });

  test("migrated symbolic multiple-choice exercises keep unique pedagogical options", () => {
    const migratedMultipleChoice = exercises.filter(
      (exercise) => MIGRATED_SYMBOLIC_IDS.includes(exercise.id) && exercise.type === "multiple-choice"
    );

    expect(migratedMultipleChoice.length).toBeGreaterThan(0);

    for (const exercise of migratedMultipleChoice) {
      expect(exercise.options).toBeDefined();
      if (!exercise.options) {
        throw new Error(`Migrated multiple-choice exercise ${exercise.id} has no options`);
      }

      const optionValues = exercise.options.map(getExerciseOptionValue);
      expect(new Set(optionValues).size).toBe(optionValues.length);
    }
  });

  test("known mismatch exercises pass audit after correction", () => {
    const knownIds = [
      "ex.u6.ceros_positividad_negatividad.1",
      "ex.u3.ecuaciones_cuadraticas.1",
      "ex.u2.gauss.1",
    ];

    const failures = auditCatalog(exercises);
    const knownFailures = failures.filter((f) => knownIds.includes(f.id));

    expect(knownFailures).toEqual([]);
  });
});
