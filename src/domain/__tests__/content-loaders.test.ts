/**
 * Tests for content-loader backward-compat defaults.
 *
 * Ensures that exercises loaded from JSON without optional metadata fields
 * (category, tags) receive sensible defaults.
 */

import { describe, test, expect } from "vitest";
import {
  applyExerciseDefaults,
  loadExercisesForSkill,
  loadSkillBank,
  validatePracticeBank,
} from "../catalog/content-loaders";
import { loadFeedbackContent } from "../catalog/content-loaders";
import type { Exercise } from "../models/exercise";

describe("applyExerciseDefaults", () => {
  const baseRaw: Record<string, unknown> = {
    id: "ex.u1.conjuntos_numericos.1",
    skillId: "mat.u1.conjuntos_numericos",
    type: "multiple-choice",
    difficulty: 1,
    prompt: "Test prompt",
    expectedAnswer: "A",
    options: ["A", "B", "C", "D"],
    commonErrorTags: [],
    pedagogicalNote: "Note",
  };

  test("exercise without category and tags receives defaults", () => {
    const result = applyExerciseDefaults(baseRaw);
    expect(result.category).toBe("clasificacion");
    expect(result.tags).toEqual([]);
  });

  test("exercise with existing category preserves it", () => {
    const raw = { ...baseRaw, category: "pertenencia" };
    const result = applyExerciseDefaults(raw);
    expect(result.category).toBe("pertenencia");
  });

  test("exercise with existing tags preserves them", () => {
    const raw = { ...baseRaw, tags: ["tag1", "tag2"] };
    const result = applyExerciseDefaults(raw);
    expect(result.tags).toEqual(["tag1", "tag2"]);
  });

  test("exercise with both category and tags preserves both", () => {
    const raw = { ...baseRaw, category: "decimales", tags: ["decimal_finito"] };
    const result = applyExerciseDefaults(raw);
    expect(result.category).toBe("decimales");
    expect(result.tags).toEqual(["decimal_finito"]);
  });
});

describe("loadSkillBank — wiring bank validator into catalog load path", () => {
  const SKILL_ID = "mat.u1.conjuntos_numericos";

  test("returns { exercises, diagnostics } shape for the skill", () => {
    const result = loadSkillBank(SKILL_ID);
    expect(result).toHaveProperty("exercises");
    expect(result).toHaveProperty("diagnostics");
    expect(Array.isArray(result.exercises)).toBe(true);
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  test("exercises match the legacy loadExercisesForSkill output (backward compat)", () => {
    const legacy = loadExercisesForSkill(SKILL_ID);
    const banked = loadSkillBank(SKILL_ID);
    expect(banked.exercises.length).toBe(legacy.length);
    expect(banked.exercises.map((e) => e.id)).toEqual(legacy.map((e) => e.id));
  });

  test("diagnostics match a direct validatePracticeBank call with the same inputs", () => {
    // Triangulation: the wiring must surface the same diagnostics as calling
    // the validator directly. This is the contract that the new entry point
    // guarantees — exact content changes as the bank grows, but the wiring
    // contract is preserved.
    const exercises = loadExercisesForSkill(SKILL_ID);
    const feedback = loadFeedbackContent("unit-1");
    const directDiagnostics = validatePracticeBank(SKILL_ID, exercises, feedback);
    const banked = loadSkillBank(SKILL_ID);
    expect(banked.diagnostics).toEqual(directDiagnostics);
  });
});
