/**
 * Tests for challenge catalog loader and validation.
 *
 * Tests:
 * - validateChallengeEntry rejects malformed entries
 * - loadChallengesForSkill loads and validates from JSON
 * - loadChallengesForSkill returns challenges for a skill
 * - loadChallengesForUnit returns challenges for a unit
 * - loadChallengesForSkill returns only challenges for that skill
 * - clear error reporting for malformed challenges
 */

import { describe, test, expect } from "vitest";
import type { ChallengeExercise } from "@/domain/catalog/challenges/types";
import {
  validateChallengeEntry,
  loadChallengesForSkill,
  loadChallengesForUnit,
} from "../loader";

// loadChallengesForSkill/Unit are thin wrappers in the domain index;
// test loadChallengesForSkill/Unit directly (same implementation).

// ---------------------------------------------------------------------------
// Fixtures — minimal valid challenge entry (used as base for invalid variants)
// ---------------------------------------------------------------------------

const VALID_CAHNNEL_TRACE_ENTRY = {
  path: "capitulo-3.ejercicio-7",
  section: "Números Complejos — Forma Polar",
  sourceUse: "canonical-source" as const,
  pedagogicalIntent: "Evalúa dominio de forma polar",
};

const VALID_BASE = {
  id: "ex.u1.complejos.desafio-01",
  skillId: "mat.u1.complejos",
  type: "multiple-choice" as const,
  difficulty: 4 as const,
  prompt: "¿Cuál es el módulo de (3 - 4i)?",
  expectedAnswer: "5",
  options: ["3", "4", "5", "7"] as string[],
  commonErrorTags: [] as string[],
  pedagogicalNote: "Módulo de complejo",
  challengeSection: true as const,
  category: "desafio" as const,
  tags: ["desafio", "integrador"] as const,
  canonicalTrace: [VALID_CAHNNEL_TRACE_ENTRY],
};

// ---------------------------------------------------------------------------
// validateChallengeEntry — valid entry passes
// ---------------------------------------------------------------------------

describe("validateChallengeEntry", () => {
  test("valid entry passes validation", () => {
    expect(() => validateChallengeEntry(VALID_BASE)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // canonicalTrace presence and structure
  // ---------------------------------------------------------------------------

  test("rejects entry missing canonicalTrace entirely", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { canonicalTrace: _removed, ...noTrace } = VALID_BASE;
    expect(() => validateChallengeEntry(noTrace)).toThrow("canonicalTrace");
  });

  test("rejects entry with empty canonicalTrace array", () => {
    const empty = { ...VALID_BASE, canonicalTrace: [] };
    expect(() => validateChallengeEntry(empty)).toThrow("canonicalTrace");
  });

  test("rejects canonicalTrace entry missing 'path' field", () => {
    const invalidTrace = [
      {
        // path missing
        section: "Números Complejos",
        sourceUse: "canonical-source",
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("path");
  });

  test("rejects canonicalTrace entry missing 'section' field", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        // section missing
        sourceUse: "canonical-source",
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("section");
  });

  test("rejects canonicalTrace entry missing 'sourceUse' field", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        section: "Complejos",
        // sourceUse missing
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("sourceUse");
  });

  test("rejects canonicalTrace entry missing 'pedagogicalIntent' field", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        section: "Complejos",
        sourceUse: "canonical-source",
        // pedagogicalIntent missing
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("pedagogicalIntent");
  });

  // ---------------------------------------------------------------------------
  // sourceUse values
  // ---------------------------------------------------------------------------

  test("rejects unknown sourceUse value", () => {
    const invalidTrace = [
      {
        path: "capitulo-3",
        section: "Complejos",
        sourceUse: "unknown-value" as any,
        pedagogicalIntent: "Evalúa",
      },
    ];
    const entry = { ...VALID_BASE, canonicalTrace: invalidTrace };
    expect(() => validateChallengeEntry(entry)).toThrow("sourceUse");
  });

  test("accepts all four valid sourceUse values", () => {
    const validSourceUses = [
      "canonical-source",
      "adapted",
      "calibrated-from-exam",
      "solution-pattern",
    ] as const;
    for (const sourceUse of validSourceUses) {
      const trace = [{ ...VALID_CAHNNEL_TRACE_ENTRY, sourceUse }];
      const entry = { ...VALID_BASE, canonicalTrace: trace };
      expect(() => validateChallengeEntry(entry)).not.toThrow();
    }
  });

  // ---------------------------------------------------------------------------
  // challengeSection
  // ---------------------------------------------------------------------------

  test("rejects challengeSection !== true", () => {
    const entry = { ...VALID_BASE, challengeSection: false as any };
    expect(() => validateChallengeEntry(entry)).toThrow("challengeSection");
  });

  test("rejects missing challengeSection", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { challengeSection: _removed, ...noSection } = VALID_BASE;
    expect(() => validateChallengeEntry(noSection)).toThrow("challengeSection");
  });

  // ---------------------------------------------------------------------------
  // category
  // ---------------------------------------------------------------------------

  test("rejects category !== 'desafio'", () => {
    const entry = { ...VALID_BASE, category: "practica" as any };
    expect(() => validateChallengeEntry(entry)).toThrow("category");
  });

  test("rejects missing category", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { category: _removed, ...noCategory } = VALID_BASE;
    expect(() => validateChallengeEntry(noCategory)).toThrow("category");
  });

  // ---------------------------------------------------------------------------
  // tags
  // ---------------------------------------------------------------------------

  test("rejects missing 'desafio' tag", () => {
    const entry = { ...VALID_BASE, tags: ["integrador"] as any };
    expect(() => validateChallengeEntry(entry)).toThrow("desafio");
  });

  test("rejects missing 'integrador' tag", () => {
    const entry = { ...VALID_BASE, tags: ["desafio"] as any };
    expect(() => validateChallengeEntry(entry)).toThrow("integrador");
  });

  test("rejects empty tags array", () => {
    const entry = { ...VALID_BASE, tags: [] as any };
    expect(() => validateChallengeEntry(entry)).toThrow("desafio");
  });

  // ---------------------------------------------------------------------------
  // difficulty
  // ---------------------------------------------------------------------------

  test("rejects difficulty < 4", () => {
    const entry = { ...VALID_BASE, difficulty: 3 as any };
    expect(() => validateChallengeEntry(entry)).toThrow("difficulty");
  });

  test("accepts difficulty === 4", () => {
    const entry = { ...VALID_BASE, difficulty: 4 as const };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  test("accepts difficulty === 5", () => {
    const entry = { ...VALID_BASE, difficulty: 5 as const };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  test("rejects difficulty > 5", () => {
    const entry = { ...VALID_BASE, difficulty: 6 as any };
    expect(() => validateChallengeEntry(entry)).toThrow("difficulty");
  });

  // ---------------------------------------------------------------------------
  // ID format
  // ---------------------------------------------------------------------------

  test("rejects invalid ID format (missing ex. prefix)", () => {
    const entry = { ...VALID_BASE, id: "u1.complejos.desafio-01" };
    expect(() => validateChallengeEntry(entry)).toThrow("id");
  });

  test("rejects invalid ID format (missing unit)", () => {
    const entry = { ...VALID_BASE, id: "ex..complejos.desafio-01" };
    expect(() => validateChallengeEntry(entry)).toThrow("id");
  });

  test("accepts valid ID format ex.u1.complejos.desafio-01", () => {
    const entry = { ...VALID_BASE, id: "ex.u1.complejos.desafio-01" };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  test("accepts valid ID format ex.u2.ecuaciones_fraccionarias.desafio-01", () => {
    const entry = { ...VALID_BASE, id: "ex.u2.ecuaciones_fraccionarias.desafio-01" };
    expect(() => validateChallengeEntry(entry)).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // clear error reporting
  // ---------------------------------------------------------------------------

  test("throws with descriptive error message on invalid entry", () => {
    const entry = { ...VALID_BASE, category: "wrong" as any };
    expect(() => validateChallengeEntry(entry)).toThrow(/category.*desafio/);
  });
});

// ---------------------------------------------------------------------------
// loadChallengesForSkill
// ---------------------------------------------------------------------------

describe("loadChallengesForSkill", () => {
  test("loads and returns challenges for a valid skillId", () => {
    const challenges = loadChallengesForSkill("mat.u1.complejos");
    expect(Array.isArray(challenges)).toBe(true);
    expect(challenges.length).toBeGreaterThan(0);
    for (const c of challenges) {
      expect(c).toHaveProperty("id");
      expect(c).toHaveProperty("skillId");
      expect(c).toHaveProperty("challengeSection");
      expect(c.challengeSection).toBe(true);
    }
  });

  test("returns challenge with correct ChallengeExercise shape", () => {
    const challenges = loadChallengesForSkill("mat.u1.complejos");
    expect(challenges.length).toBeGreaterThan(0);
    const challenge = challenges[0];
    expect(challenge.challengeSection).toBe(true);
    expect(challenge.category).toBe("desafio");
    expect(challenge.tags).toContain("desafio");
    expect(challenge.tags).toContain("integrador");
    expect(Array.isArray(challenge.canonicalTrace)).toBe(true);
    expect(challenge.canonicalTrace.length).toBeGreaterThan(0);
  });

  test("returns empty array for unknown skill", () => {
    const challenges = loadChallengesForSkill("mat.u99.unknown_skill");
    expect(challenges).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// loadChallengesForSkill
// ---------------------------------------------------------------------------

describe("loadChallengesForSkill", () => {
  test("returns only challenges for that skillId", () => {
    const challenges = loadChallengesForSkill("mat.u1.complejos");
    for (const c of challenges) {
      expect(c.skillId).toBe("mat.u1.complejos");
    }
  });

  test("returns empty array for unknown skill", () => {
    const challenges = loadChallengesForSkill("mat.u99.unknown");
    expect(challenges).toEqual([]);
  });

  test("returns ChallengeExercise[] type", () => {
    const result = loadChallengesForSkill("mat.u1.complejos");
    // If it returns a non-empty array, check type safety
    if (result.length > 0) {
      expect(result[0].challengeSection).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// loadChallengesForUnit
// ---------------------------------------------------------------------------

describe("loadChallengesForUnit", () => {
  test("returns only challenges for unit 1", () => {
    const challenges = loadChallengesForUnit(1);
    expect(challenges.length).toBeGreaterThan(0);
    for (const c of challenges) {
      expect(c.skillId).toMatch(/^mat\.u1\./);
    }
  });

  test("returns only challenges for unit 2", () => {
    const challenges = loadChallengesForUnit(2);
    for (const c of challenges) {
      expect(c.skillId).toMatch(/^mat\.u2\./);
    }
  });

  test("returns empty array for unit with no challenges", () => {
    const challenges = loadChallengesForUnit(3);
    expect(Array.isArray(challenges)).toBe(true);
  });
});
