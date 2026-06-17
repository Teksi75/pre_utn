/**
 * Tests for ChallengeExerciseCard component.
 *
 * Since the project test environment is Node (no jsdom), React components
 * cannot be rendered. We verify component STRUCTURE via source-code assertions.
 *
 * STRICT TDD: RED first.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("ChallengeExerciseCard", () => {
  const componentPath = "src/components/practice/challenges/ChallengeExerciseCard.tsx";

  test("exports a ChallengeExerciseCard function component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+ChallengeExerciseCard\b/);
  });

  test("accepts exercise, currentNumber, and totalCount props", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/exercise\s*:\s*ChallengeExercise/);
    expect(comp).toMatch(/currentNumber\s*:\s*number/);
    expect(comp).toMatch(/totalCount\s*:\s*number/);
  });

  test("shows 'Desafío N de M' counter using currentNumber and totalCount", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Desafío.*currentNumber.*de.*totalCount|Desafío \d+ de \d+/);
  });

  test("imports ChallengeExercise type from challenges catalog", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/from\s+["']@\/domain\/catalog\/challenges\/types["']/);
  });

  test("imports ExerciseAnswerInput for rendering exercise inputs", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/ExerciseAnswerInput/);
  });

  test("shows 'Desafío' badge or label", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Desafío/);
  });

  test("shows exercise type badge via getExerciseTypeLabel", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/getExerciseTypeLabel/);
  });

  test("reuses ExerciseCard pattern for challenge prompt rendering", () => {
    const comp = source(componentPath);
    // Should render the prompt from the exercise
    expect(comp).toMatch(/exercise\.prompt|prompt/);
  });

  test("renders the answer input form with onSubmit callback", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/onSubmit.*answer/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  test("does not import base addAttempt or practice-progress", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/from\s+["']@\/lib\/practice-progress["']/);
  });
});
