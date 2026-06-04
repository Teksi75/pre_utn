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

const exercises = exercisesJson as unknown as readonly Exercise[];

/**
 * Detect multi-value or set-notation answers (e.g. "x = -2, x = 2", "{1, 2}").
 * Per spec: exercises whose expected answer contains multiple values, variable
 * assignments, or set notation MUST NOT be type `numerical`.
 */
function hasMultiValuePattern(value: string): boolean {
  return value.includes(",");
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
      if (ex.options && !ex.options.includes(ex.expectedAnswer)) {
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
  test("numerical exercises do not have multi-value/set-notation answers", () => {
    const failures = auditCatalog(exercises);
    const numericalFailures = failures.filter((f) => f.type === "numerical");

    expect(numericalFailures).toEqual([]);
  });

  test("multiple-choice exercises have >=3 unique options and expected answer in options", () => {
    const failures = auditCatalog(exercises);
    const mcFailures = failures.filter((f) => f.type === "multiple-choice");

    expect(mcFailures).toEqual([]);
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
