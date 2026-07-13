import { describe, expect, test } from "vitest";
import type { ChallengeExercise, ChallengeSourceUse } from "../catalog/challenges/types";
import {
  auditU3TraceSourceUse,
  parseOptionalCanonicalTrace,
  type U3TraceAuditViolation,
} from "../catalog";
import { applyExerciseDefaults } from "../catalog/content-loaders";
import type { Exercise, ExerciseSourceUse } from "../models/exercise";

const trace = (sourceUse: string = "reference") => ({
  path: "UNIDAD3_matemática.pdf",
  section: "3.2",
  sourceUse,
  pedagogicalIntent: "Reinforce the canonical method",
});

const rawExercise = (canonicalTrace?: unknown): Record<string, unknown> => ({
  id: "ex.u3.ecuaciones_cuadraticas.trace-1",
  skillId: "mat.u3.ecuaciones_cuadraticas",
  type: "numerical",
  difficulty: 2,
  prompt: "Solve",
  expectedAnswer: "2",
  commonErrorTags: [],
  pedagogicalNote: "Check the method",
  ...(canonicalTrace === undefined ? {} : { canonicalTrace }),
});

const exerciseWith = (sourceUse: ExerciseSourceUse): Exercise =>
  applyExerciseDefaults(rawExercise(trace(sourceUse)));

describe("optional exercise canonical trace parser", () => {
  test("normalizes all four absence expressions to null", () => {
    for (const raw of [undefined, null, [], {}]) {
      expect(parseOptionalCanonicalTrace(raw, "ex.u3.trace")).toBeNull();
    }
  });

  test("normalizes one object to one entry and preserves a valid section", () => {
    expect(parseOptionalCanonicalTrace(trace(), "ex.u3.trace")).toEqual([trace()]);
  });

  test("preserves non-empty array input order", () => {
    const first = trace("adapted");
    const second = { ...trace("reinforcement"), path: "other.pdf" };
    expect(parseOptionalCanonicalTrace([first, second], "ex.u3.trace")).toEqual([first, second]);
  });

  test("accepts exactly the four general sourceUse literals", () => {
    const accepted: readonly ExerciseSourceUse[] = ["adapted", "reinforcement", "reference", "alignment"];
    for (const sourceUse of accepted) {
      expect(parseOptionalCanonicalTrace(trace(sourceUse), "ex.u3.trace")?.[0].sourceUse).toBe(sourceUse);
    }
  });

  test("identifies malformed primitive input", () => {
    for (const raw of [42, "trace", true]) {
      expect(() => parseOptionalCanonicalTrace(raw, "ex.u3.trace")).toThrow(/canonicalTrace.*expected.*object/i);
    }
  });

  test("identifies absent or empty path", () => {
    for (const path of [undefined, ""]) {
      expect(() => parseOptionalCanonicalTrace({ ...trace(), path }, "ex.u3.trace")).toThrow(/path.*ex\.u3\.trace/i);
    }
  });

  test("identifies absent or empty pedagogicalIntent", () => {
    for (const pedagogicalIntent of [undefined, ""]) {
      expect(() => parseOptionalCanonicalTrace({ ...trace(), pedagogicalIntent }, "ex.u3.trace")).toThrow(/pedagogicalIntent.*ex\.u3\.trace/i);
    }
  });

  test("names an unknown sourceUse literal", () => {
    expect(() => parseOptionalCanonicalTrace(trace("invented"), "ex.u3.trace")).toThrow(/sourceUse.*invented/i);
  });

  test("names every challenge-only sourceUse literal", () => {
    for (const sourceUse of ["canonical-source", "calibrated-from-exam", "solution-pattern"]) {
      expect(() => parseOptionalCanonicalTrace(trace(sourceUse), "ex.u3.trace")).toThrow(new RegExp(`sourceUse.*${sourceUse}`, "i"));
    }
  });
});

describe("exercise defaulting integration", () => {
  test("attaches only a valid parsed array", () => {
    expect(applyExerciseDefaults(rawExercise(trace("adapted"))).canonicalTrace).toEqual([trace("adapted")]);
  });

  test("omits canonicalTrace for legacy U1/U2 shapes and explicit absences", () => {
    const legacyByUnit = [
      { ...rawExercise(), id: "ex.u1.conjuntos_numericos.legacy", skillId: "mat.u1.conjuntos_numericos" },
      { ...rawExercise(), id: "ex.u2.factorizacion.legacy", skillId: "mat.u2.factorizacion" },
    ];
    for (const raw of [...legacyByUnit, rawExercise(null), rawExercise([]), rawExercise({})]) {
      expect(Object.hasOwn(applyExerciseDefaults(raw), "canonicalTrace")).toBe(false);
    }
  });
});

describe("U3-only sourceUse audit", () => {
  test("reports U3 alignment deterministically without mutation", () => {
    const exercise = Object.freeze(exerciseWith("alignment"));
    const expected: readonly U3TraceAuditViolation[] = [{ exerciseId: exercise.id, sourceUse: "alignment" }];
    expect(auditU3TraceSourceUse([exercise])).toEqual(expected);
    expect(auditU3TraceSourceUse([exercise])).toEqual(expected);
    expect(exercise.canonicalTrace?.[0].sourceUse).toBe("alignment");
  });

  test("does not inspect U2 and accepts the three allowed U3 literals", () => {
    const u2 = { ...exerciseWith("alignment"), skillId: "mat.u2.factorizacion" } satisfies Exercise;
    Object.defineProperty(u2, "canonicalTrace", { get: () => { throw new Error("U2 trace inspected"); } });
    const allowed = (["adapted", "reinforcement", "reference"] as const).map(exerciseWith);
    expect(auditU3TraceSourceUse([u2, ...allowed])).toEqual([]);
  });
});

test("the independent challenge trace contract remains unchanged", () => {
  const sourceUse: ChallengeSourceUse = "canonical-source";
  const challenge: ChallengeExercise = {
    ...exerciseWith("adapted"),
    difficulty: 5,
    challengeSection: true,
    category: "desafio",
    tags: ["desafio", "integrador"],
    canonicalTrace: [{ path: "UNIDAD3_matemática.pdf", section: "Challenge 1", sourceUse, pedagogicalIntent: "Reinforce the canonical method" }],
  };
  expect(challenge.canonicalTrace[0].sourceUse).toBe("canonical-source");
});
