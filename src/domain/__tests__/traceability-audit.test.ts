/**
 * Tests for traceability audit — flags exercises with relatedTheoryIds/relatedExampleIds
 * but missing canonicalTrace.
 * RED phase — references auditTraceability that does not exist yet.
 */

import { describe, test, expect } from "vitest";
import { auditTraceability } from "../catalog/content-loaders";
import type { Exercise, Difficulty, ExerciseId } from "../models/exercise";
import type { SkillId } from "../models/skill";

/** Helper to build a minimal exercise stub with optional extra fields. */
function makeExercise(
  id: string,
  skillId: string,
  extras: Record<string, unknown> = {}
): Exercise {
  const base = {
    id: id as Exercise["id"],
    skillId: skillId as SkillId,
    type: "numerical" as const,
    difficulty: 1 as Difficulty,
    prompt: "Test",
    expectedAnswer: "42",
    commonErrorTags: [] as readonly string[],
    pedagogicalNote: "Note",
  };
  return { ...base, ...extras } as Exercise;
}

describe("auditTraceability", () => {
  test("exercise with relatedTheoryIds but no canonicalTrace is flagged", () => {
    const exercises = [
      makeExercise("ex.u1.a.1", "mat.u1.a", {
        relatedTheoryIds: ["theory-conjuntos-numericos"],
        relatedExampleIds: [],
      }),
    ];
    const warnings = auditTraceability(exercises);
    expect(warnings.length).toBe(1);
    expect(warnings[0].exerciseId).toBe("ex.u1.a.1");
    expect(warnings[0].missingFields).toContain("canonicalTrace");
  });

  test("exercise with relatedExampleIds but no canonicalTrace is flagged", () => {
    const exercises = [
      makeExercise("ex.u1.a.1", "mat.u1.a", {
        relatedTheoryIds: [],
        relatedExampleIds: ["example-conjuntos-numericos-1"],
      }),
    ];
    const warnings = auditTraceability(exercises);
    expect(warnings.length).toBe(1);
    expect(warnings[0].exerciseId).toBe("ex.u1.a.1");
  });

  test("exercise without theory/example links passes", () => {
    const exercises = [makeExercise("ex.u1.a.1", "mat.u1.a")];
    const warnings = auditTraceability(exercises);
    expect(warnings.length).toBe(0);
  });

  test("exercise with canonicalTrace passes even with relatedTheoryIds", () => {
    const exercises = [
      makeExercise("ex.u1.a.1", "mat.u1.a", {
        relatedTheoryIds: ["theory-conjuntos-numericos"],
        relatedExampleIds: [],
        canonicalTrace: [
          {
            path: "content/matematica/theory/unit-1.json",
            sourceUse: "reference",
            pedagogicalIntent: "Foundational concept",
          },
        ],
      }),
    ];
    const warnings = auditTraceability(exercises);
    expect(warnings.length).toBe(0);
  });
});
