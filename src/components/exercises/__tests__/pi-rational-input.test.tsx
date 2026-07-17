import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();
function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

/**
 * RED suite for PiRationalInput. The component renders three numeric
 * fields (numerator, denominator, decimal) — NOT tolerance, which is
 * content-side configuration. Tests use source-grep assertions
 * (matching ExerciseAnswerInput.test.ts) because vitest runs in node
 * without a DOM here.
 */
describe("PiRationalInput component", () => {
  const componentPath = "src/components/exercises/PiRationalInput.tsx";

  test("PiRationalInput.tsx exists", () => {
    expect(existsSync(join(repoRoot, componentPath))).toBe(true);
  });

  test("exports a PiRationalInput React component with 'use client'", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
    expect(comp).toMatch(/export\s+(?:function|const)\s+PiRationalInput\b/);
  });

  test("declares props with onComplete callback emitting a complete v1 payload", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/onComplete\s*:\s*\(/);
    expect(comp).toMatch(/numerator/);
    expect(comp).toMatch(/denominator/);
    expect(comp).toMatch(/decimal/);
    expect(comp).toMatch(/serializeStructuredSubmissionV1|structured\.ts/);
    expect(comp).toMatch(/kind:\s*["']pi-rational["']/);
    expect(comp).toMatch(/v:\s*1/);
  });

  test("does NOT expose a student-facing tolerance input", () => {
    // Tolerance is content-side config (answerSpec). The canonical v1
    // submission envelope does not include it and grading uses the spec.
    const comp = source(componentPath);
    expect(comp).not.toMatch(/pi-rational-tolerance|Tolerancia|!tolerance/);
  });

  test("validates denominator > 0", () => {
    const comp = source(componentPath);
    expect(
      comp.match(/<=\s*0|===\s*0|<\s*1/) &&
        comp.match(/denominador|denominator/i),
    ).toBeTruthy();
  });

  test("uses aria-label on every numeric field (≥3)", () => {
    const comp = source(componentPath);
    const ariaLabels = comp.match(/aria-label/g) ?? [];
    expect(ariaLabels.length).toBeGreaterThanOrEqual(3);
  });
});
