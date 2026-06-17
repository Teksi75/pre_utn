/**
 * Tests for ChallengeFeedback component.
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

describe("ChallengeFeedback", () => {
  const componentPath = "src/components/practice/challenges/ChallengeFeedback.tsx";

  test("exports a ChallengeFeedback function component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+ChallengeFeedback\b/);
  });

  test("accepts exerciseId, evaluation, and pedagogicalNote props", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/exerciseId\s*:\s*string/);
    expect(comp).toMatch(/evaluation\s*:\s*EvaluationResult/);
    expect(comp).toMatch(/pedagogicalNote\s*:\s*string/);
  });

  test("shows '¡Correcto!' for correct answers", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/¡Correcto!|Correcto/);
  });

  test("shows 'Incorrecto' for incorrect answers", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Incorrecto/);
  });

  test("shows pedagogical note (key for challenge value)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/pedagogicalNote/);
  });

  test("imports EvaluationResult from evaluator", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/from\s+["']@\/domain\/evaluator\/index["']/);
  });

  test("shows error tag description when errorTag is present", () => {
    const comp = source(componentPath);
    // Should handle errorTag from evaluation
    expect(comp).toMatch(/errorTag/);
  });

  test("accepts onContinue callback prop", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/onContinue\??\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  test("does not import base practice-progress", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/from\s+["']@\/lib\/practice-progress["']/);
  });
});
