/**
 * Tests for content-loader backward-compat defaults.
 *
 * Ensures that exercises loaded from JSON without optional metadata fields
 * (category, tags) receive sensible defaults.
 */

import { describe, test, expect } from "vitest";
import { applyExerciseDefaults } from "../catalog/content-loaders";
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
