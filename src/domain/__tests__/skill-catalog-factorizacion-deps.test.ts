/**
 * Skill catalog — factorizacion prerequisite test.
 * Strict TDD: RED phase first.
 *
 * Spec coverage: U2FAC-SKILL-001, U2FAC-SKILL-002
 */
import { describe, test, expect } from "vitest";
import { SKILL_DEPENDENCIES } from "../models/skill-catalog";

describe("Skill catalog — factorizacion prerequisites", () => {
  test("factorizacion includes ruffini_resto as prerequisite", () => {
    const entry = SKILL_DEPENDENCIES.find(
      (d) => d.skillId === "mat.u2.factorizacion",
    );
    expect(entry).toBeDefined();
    expect(entry!.prerequisites).toContain("mat.u2.ruffini_resto");
  });

  test("factorizacion still includes operaciones_polinomios", () => {
    const entry = SKILL_DEPENDENCIES.find(
      (d) => d.skillId === "mat.u2.factorizacion",
    );
    expect(entry!.prerequisites).toContain("mat.u2.operaciones_polinomios");
  });

  test("chain has no cycles", () => {
    // Build adjacency list and check for cycles via DFS
    const adj = new Map<string, string[]>();
    for (const dep of SKILL_DEPENDENCIES) {
      adj.set(dep.skillId, [...dep.prerequisites]);
    }

    const visited = new Set<string>();
    const inStack = new Set<string>();

    function hasCycle(node: string): boolean {
      if (inStack.has(node)) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      inStack.add(node);
      for (const prereq of adj.get(node) ?? []) {
        if (hasCycle(prereq)) return true;
      }
      inStack.delete(node);
      return false;
    }

    for (const node of adj.keys()) {
      if (hasCycle(node)) {
        throw new Error(`Cycle detected involving skill: ${node}`);
      }
    }

    // No throw = no cycles
    expect(true).toBe(true);
  });
});
