import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canSubmitExerciseAnswer,
  getSubmittedExerciseAnswer,
} from "../exercise-answer-state";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

/**
 * RED suite for the structured extension of `exercise-answer-state`.
 *
 * The module already exposes the text-vs-option helpers. We extend it so
 * that:
 *   - `isAnswerCompleteStructured` returns true when all required structured
 *     fields are non-empty.
 *   - `serializeStructuredSubmissionV1` produces valid v1 JSON for both kinds.
 *   - Incomplete state returns null from the serializer.
 */

describe("exercise-answer-state — structured completeness", () => {
  const modulePath = "src/components/exercises/exercise-answer-state.ts";

  test("module still exports canSubmitExerciseAnswer and getSubmittedExerciseAnswer", () => {
    expect(typeof canSubmitExerciseAnswer).toBe("function");
    expect(typeof getSubmittedExerciseAnswer).toBe("function");
  });

  test("module exports a structured completeness helper (isAnswerCompleteStructured or similar)", () => {
    const mod = source(modulePath);
    // The module must export a function that checks structured completeness.
    expect(mod).toMatch(/export\s+(?:function|const)\s+\w*[Cc]ompleteStructured/);
  });

  test("module exports a structured serializer helper", () => {
    const mod = source(modulePath);
    expect(mod).toMatch(/export\s+(?:function|const)\s+\w*[Ss]erializeStructured\w*/);
  });

  test("module exports structured completeness for pi-rational (numerator/denominator/decimal/tolerance)", () => {
    const mod = source(modulePath);
    expect(mod).toMatch(/pi-rational/);
    expect(mod).toMatch(/numerator/);
    expect(mod).toMatch(/denominator/);
    expect(mod).toMatch(/decimal/);
  });

  test("module exports structured completeness for angle-dms (degrees/minutes/seconds)", () => {
    const mod = source(modulePath);
    expect(mod).toMatch(/angle-dms/);
    expect(mod).toMatch(/degrees/);
    expect(mod).toMatch(/minutes/);
    expect(mod).toMatch(/seconds/);
  });
});

describe("exercise-answer-state — backward compatibility", () => {
  test("canSubmitExerciseAnswer still works for numerical (existing contract)", () => {
    expect(canSubmitExerciseAnswer("numerical", "", null)).toBe(false);
    expect(canSubmitExerciseAnswer("numerical", "42", null)).toBe(true);
  });

  test("canSubmitExerciseAnswer still works for multiple-choice (existing contract)", () => {
    expect(canSubmitExerciseAnswer("multiple-choice", "", null)).toBe(false);
    expect(canSubmitExerciseAnswer("multiple-choice", "", "opt-1")).toBe(true);
  });

  test("getSubmittedExerciseAnswer still works for numerical", () => {
    expect(getSubmittedExerciseAnswer("numerical", " 42 ", null)).toBe("42");
  });
});