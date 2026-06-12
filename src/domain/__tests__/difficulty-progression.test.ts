/**
 * Tests for per-skill difficulty progression validation.
 * RED phase — references validateDifficultyProgression that does not exist yet.
 */

import { describe, test, expect } from "vitest";
import { validateDifficultyProgression } from "../catalog/content-loaders";
import type { Exercise, Difficulty, ExerciseId } from "../models/exercise";
import type { SkillId } from "../models/skill";

/** Helper to build a minimal exercise stub for testing. */
function makeExercise(
  id: string,
  skillId: string,
  difficulty: number
): Exercise {
  return {
    id: id as Exercise["id"],
    skillId: skillId as SkillId,
    type: "numerical",
    difficulty: difficulty as Difficulty,
    prompt: "Test",
    expectedAnswer: "42",
    commonErrorTags: [],
    pedagogicalNote: "Note",
  };
}

describe("validateDifficultyProgression", () => {
  test("skill with increasing difficulty passes", () => {
    const exercises = [
      makeExercise("ex.u1.a.1", "mat.u1.a", 1),
      makeExercise("ex.u1.a.2", "mat.u1.a", 2),
      makeExercise("ex.u1.a.3", "mat.u1.a", 3),
      makeExercise("ex.u1.a.4", "mat.u1.a", 4),
    ];
    const result = validateDifficultyProgression(exercises);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test("skill with non-monotonic difficulty fails", () => {
    const exercises = [
      makeExercise("ex.u1.a.1", "mat.u1.a", 1),
      makeExercise("ex.u1.a.2", "mat.u1.a", 3),
      makeExercise("ex.u1.a.3", "mat.u1.a", 2),
      makeExercise("ex.u1.a.4", "mat.u1.a", 4),
    ];
    const result = validateDifficultyProgression(exercises);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].skillId).toBe("mat.u1.a");
  });

  test("single-exercise skill passes trivially", () => {
    const exercises = [makeExercise("ex.u1.a.1", "mat.u1.a", 3)];
    const result = validateDifficultyProgression(exercises);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test("equal-difficulty exercises are allowed (non-decreasing)", () => {
    const exercises = [
      makeExercise("ex.u1.a.2", "mat.u1.a", 2),
      makeExercise("ex.u1.a.2", "mat.u1.a", 2),
      makeExercise("ex.u1.a.3", "mat.u1.a", 3),
    ];
    const result = validateDifficultyProgression(exercises);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test("numeric suffix ordering: .2 before .10 (not lexicographic)", () => {
    // With lexicographic sort: ".10" < ".2" → order is .1, .10, .2, .3
    //   .1(diff=1) → .10(diff=2) → .2(diff=1) → violation at .2 < .10
    // With numeric sort: .1, .2, .3, .10
    //   .1(diff=1) → .2(diff=1) → .3(diff=2) → .10(diff=2) → valid
    const exercises = [
      makeExercise("ex.u1.a.1", "mat.u1.a", 1),
      makeExercise("ex.u1.a.2", "mat.u1.a", 1),
      makeExercise("ex.u1.a.3", "mat.u1.a", 2),
      makeExercise("ex.u1.a.10", "mat.u1.a", 2),
    ];
    const result = validateDifficultyProgression(exercises);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  test("numeric suffix ordering detects real regression with multi-digit IDs", () => {
    // .10(diff=3) should come AFTER .2(diff=2), not before.
    // If sorted numerically: .1(1) → .2(2) → .10(1) → violation at .10 < .2
    const exercises = [
      makeExercise("ex.u1.a.1", "mat.u1.a", 1),
      makeExercise("ex.u1.a.2", "mat.u1.a", 2),
      makeExercise("ex.u1.a.10", "mat.u1.a", 1),
    ];
    const result = validateDifficultyProgression(exercises);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].skillId).toBe("mat.u1.a");
  });

  test("exercises provided out of order are sorted by numeric ID before checking", () => {
    // Input order is shuffled; numeric sort should still detect monotonic sequence
    const exercises = [
      makeExercise("ex.u1.a.3", "mat.u1.a", 3),
      makeExercise("ex.u1.a.1", "mat.u1.a", 1),
      makeExercise("ex.u1.a.2", "mat.u1.a", 2),
    ];
    const result = validateDifficultyProgression(exercises);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });
});
