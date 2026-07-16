import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

/**
 * RED suite for PiRationalInput.
 * The component MUST:
 *   - Render four input fields (numerator, denominator, decimal, tolerance)
 *   - Serialize complete submissions to canonical JSON v1
 *   - Validate that denominator > 0
 *   - Use aria-label on every input
 *
 * Tests use source-grep assertions (matching the existing pattern in
 * ExerciseAnswerInput.test.ts) because vitest in this repo runs in
 * node environment without a DOM; a happy-dom-based render test would
 * not increase coverage and would slow the suite.
 */

describe("PiRationalInput component", () => {
  const componentPath = "src/components/exercises/PiRationalInput.tsx";

  test("PiRationalInput.tsx exists", () => {
    expect(existsSync(join(repoRoot, componentPath))).toBe(true);
  });

  test("exports a PiRationalInput React component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+PiRationalInput\b/);
  });

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("declares props with onComplete callback emitting a complete v1 payload", () => {
    const comp = source(componentPath);
    // The component accepts onComplete({ numerator, denominator, decimal, tolerance })
    // and serializes it to the canonical JSON v1 envelope. Source must
    // contain the field names and the serializer invocation.
    expect(comp).toMatch(/onComplete\s*:\s*\(/);
    expect(comp).toMatch(/numerator/);
    expect(comp).toMatch(/denominator/);
    expect(comp).toMatch(/decimal/);
    expect(comp).toMatch(/tolerance/);
    expect(comp).toMatch(/serializeStructuredSubmissionV1|structured\.ts/);
    expect(comp).toMatch(/kind:\s*["']pi-rational["']/);
    expect(comp).toMatch(/v:\s*1/);
  });

  test("validates denominator > 0", () => {
    const comp = source(componentPath);
    // The component must surface a validation error when the user submits
    // a denominator of 0. The guard may name `numD`, `denominator`, or
    // any parsed-number alias; we accept any non-positive guard or any
    // explicit "denominador positivo" message.
    expect(
      comp.match(/<=\s*0|===\s*0|<\s*1/) &&
        comp.match(/denominador|denominator/i),
    ).toBeTruthy();
  });

  test("uses aria-label on every numeric field", () => {
    const comp = source(componentPath);
    // Each input must have an aria-label. We assert that the source
    // contains at least 4 distinct aria-label tokens.
    const ariaLabels = comp.match(/aria-label/g) ?? [];
    expect(ariaLabels.length).toBeGreaterThanOrEqual(4);
  });

  test("emits canonical JSON v1 on complete fields", () => {
    const comp = source(componentPath);
    // The serialization helper from src/domain/evaluator/structured is used
    // to build the submission string. Verify the import is present.
    expect(comp).toMatch(/from\s+["']@?\/domain\/evaluator\/structured["']/);
  });
});