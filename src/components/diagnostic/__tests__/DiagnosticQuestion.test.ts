import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("DiagnosticQuestion", () => {
  const componentPath =
    "src/components/diagnostic/DiagnosticQuestion.tsx";

  test("exports a DiagnosticQuestion component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(
      /export\s+(?:function|const)\s+DiagnosticQuestion\b/,
    );
  });

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("accepts the contract props: exercise, questionNumber, totalQuestions, onSubmit, disabled", () => {
    const comp = source(componentPath);
    expect(comp).toContain("exercise");
    expect(comp).toContain("questionNumber");
    expect(comp).toContain("totalQuestions");
    expect(comp).toContain("onSubmit");
    expect(comp).toContain("disabled");
  });

  test("does NOT render the duplicate 'Pregunta X de N' pill (C3)", () => {
    // The primary counter lives in DiagnosticProgress now. The
    // DiagnosticQuestion card must not echo it.
    const comp = source(componentPath);
    expect(comp).not.toMatch(/Pregunta\s+\{questionNumber\}/);
    expect(comp).not.toMatch(/Pregunta\s+\{/);
  });

  test("still renders ExerciseCard and ExerciseAnswerInput", () => {
    const comp = source(componentPath);
    expect(comp).toContain("ExerciseCard");
    expect(comp).toContain("ExerciseAnswerInput");
    expect(comp).toMatch(/<ExerciseCard\b/);
    expect(comp).toMatch(/<ExerciseAnswerInput\b/);
  });

  test("uses the app-glass-surface surface for the question card (token, not raw palette)", () => {
    const comp = source(componentPath);
    expect(comp).toContain("app-glass-surface");
    expect(comp).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });
});
