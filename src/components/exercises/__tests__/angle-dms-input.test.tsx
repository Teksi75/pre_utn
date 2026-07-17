import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

/**
 * RED suite for AngleDmsInput.
 * The component MUST:
 *   - Render three numeric fields (degrees, minutes, seconds)
 *   - Enforce bounds: minutes < 60, seconds < 60
 *   - Serialize complete submissions to canonical JSON v1
 *   - Use aria-label on every field
 */

describe("AngleDmsInput component", () => {
  const componentPath = "src/components/exercises/AngleDmsInput.tsx";

  test("AngleDmsInput.tsx exists", () => {
    expect(existsSync(join(repoRoot, componentPath))).toBe(true);
  });

  test("exports an AngleDmsInput React component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+AngleDmsInput\b/);
  });

  test("is a Client Component (declared with 'use client' directive)", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/["']use client["']/);
  });

  test("declares props with onComplete callback emitting a complete v1 payload", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/onComplete\s*:\s*\(/);
    expect(comp).toMatch(/degrees/);
    expect(comp).toMatch(/minutes/);
    expect(comp).toMatch(/seconds/);
    expect(comp).toMatch(/serializeStructuredSubmissionV1|structured\.ts/);
    expect(comp).toMatch(/kind:\s*["']angle-dms["']/);
    expect(comp).toMatch(/v:\s*1/);
  });

  test("enforces bounds (minutes < 60, seconds < 60)", () => {
    const comp = source(componentPath);
    // The component guards against minutes >= 60 and seconds >= 60.
    // Accept any permutation of variable names (m, s, minutes, seconds,
    // minutos, segundos) and any of the comparison operators.
    expect(
      comp.match(/((minutes|segundos|m)\s*[<>=!]+\s*[56]?\d)/i) &&
        comp.match(/((seconds|segundos|s)\s*[<>=!]+\s*[56]?\d)/i),
    ).toBeTruthy();
  });

  test("uses aria-label on every numeric field", () => {
    const comp = source(componentPath);
    const ariaLabels = comp.match(/aria-label/g) ?? [];
    expect(ariaLabels.length).toBeGreaterThanOrEqual(3);
  });
});