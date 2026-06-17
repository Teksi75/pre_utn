/**
 * Tests for ChallengeOptInBlock component.
 *
 * Since the project test environment is Node (no jsdom), React components
 * cannot be rendered. We verify component STRUCTURE via source-code assertions.
 *
 * STRICT TDD: RED first — verify expected API and structure before implementation.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();

function source(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("ChallengeOptInBlock", () => {
  const componentPath = "src/components/practice/challenges/ChallengeOptInBlock.tsx";

  test("exports a ChallengeOptInBlock function component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+ChallengeOptInBlock\b/);
  });

  test("accepts challengeCount, onStart, and onSkip props", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/challengeCount\s*:\s*number/);
    expect(comp).toMatch(/onStart\s*:\s*\(\s*\)\s*=>\s*void/);
    expect(comp).toMatch(/onSkip\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  test("does NOT render block when challengeCount is 0 (early return guard)", () => {
    const comp = source(componentPath);
    // Guard: if challengeCount <= 0, return null
    expect(comp).toMatch(/if\s*\(\s*challengeCount\s*<=\s*0\s*\)\s*return\s+null/);
  });

  test("shows the completion copy 'Terminaste la práctica base'", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Terminaste la práctica base/);
  });

  test("shows the challenge count dynamically using challengeCount prop", () => {
    const comp = source(componentPath);
    // Should interpolate challengeCount in the rendered text
    expect(comp).toMatch(/challengeCount/);
  });

  test("shows purpose copy about optional and not affecting base progress", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/opcionales.*no afectan.*avance|Son opcionales/);
  });

  test("renders 'Intentar desafíos' button that calls onStart", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Intentar desafíos/);
    expect(comp).toMatch(/onStart/);
  });

  test("renders 'Finalizar por ahora' button that calls onSkip", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Finalizar por ahora/);
    expect(comp).toMatch(/onSkip/);
  });

  test("does not import from base practice-progress module", () => {
    const comp = source(componentPath);
    // Challenge flow must NOT couple to base practice progress
    expect(comp).not.toMatch(/from\s+["']@\/lib\/practice-progress["']/);
    expect(comp).not.toMatch(/from\s+["']@\/app\/practice\/usePracticeFlow["']/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  test("uses app-glass-surface for card styling", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/app-glass-surface/);
  });
});
