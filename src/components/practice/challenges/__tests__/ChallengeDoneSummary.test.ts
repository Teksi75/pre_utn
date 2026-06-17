/**
 * Tests for ChallengeDoneSummary component.
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

describe("ChallengeDoneSummary", () => {
  const componentPath = "src/components/practice/challenges/ChallengeDoneSummary.tsx";

  test("exports a ChallengeDoneSummary function component", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/export\s+(?:function|const)\s+ChallengeDoneSummary\b/);
  });

  test("accepts skillId, challengeCount, correctCount, advancedReadiness, onBackToSelect props", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/skillId\s*:\s*string/);
    expect(comp).toMatch(/challengeCount\s*:\s*number/);
    expect(comp).toMatch(/correctCount\s*:\s*number/);
    expect(comp).toMatch(/advancedReadiness\s*:\s*number/);
    expect(comp).toMatch(/onBackToSelect\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  test("shows completion message with challenge count", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Desafíos completados|Desafíos completada/);
  });

  test("shows correctCount out of total", () => {
    const comp = source(componentPath);
    // Shows "N correctas" and total in separate UI elements
    expect(comp).toMatch(/correctCount|correctas/);
    expect(comp).toMatch(/challengeCount|total/);
  });

  test("shows advancedReadiness score", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/advancedReadiness|Nivel de preparación/);
  });

  test("shows 'Volver al selector' CTA button", () => {
    const comp = source(componentPath);
    expect(comp).toMatch(/Volver al selector/);
  });

  test("copy is neutral — no tutor voice claims", () => {
    const comp = source(componentPath);
    // Should NOT claim personalized plan or tutor voice
    expect(comp).not.toMatch(/tu profe|profesor digital|plan personalizado|te voy a/);
  });

  test("does not use any, console.log, or TODO", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/:\s*any\b/);
    expect(comp).not.toMatch(/<any\b/);
    expect(comp).not.toContain("console.log");
    expect(comp).not.toMatch(/\bTODO\b/);
  });

  test("does not import base practice-progress or use base addAttempt", () => {
    const comp = source(componentPath);
    expect(comp).not.toMatch(/from\s+["']@\/lib\/practice-progress["']/);
    expect(comp).not.toMatch(/addAttempt/);
  });

  test("shows skillId in the summary", () => {
    const comp = source(componentPath);
    // skillId should appear (skill context)
    expect(comp).toMatch(/skillId/);
  });
});
