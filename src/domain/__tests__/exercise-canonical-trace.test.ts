// PR1 contract tests for the Exercise.canonicalTrace seam and the
// EvaluableExercise structural contract for the domain evaluator.
// Type-level RED = `pnpm run typecheck` failure.
import { describe, test, expect } from "vitest";
import type { ChallengeExercise } from "@/domain/catalog/challenges/types";
import { evaluateAnswer, type EvaluationResult } from "@/domain";
import type {
  EvaluableExercise,
  Exercise,
  ExerciseBaseShape,
  ExerciseCanonicalTrace,
  ExerciseSourceUse,
} from "@/domain";

const exercise: Exercise = {
  id: "ex.u1.propiedades_operaciones_reales.1",
  skillId: "mat.u1.propiedades_operaciones_reales",
  type: "numerical", difficulty: 2,
  prompt: "3 + 5", expectedAnswer: "8",
  commonErrorTags: [], pedagogicalNote: "Suma", unit: 1,
};

const challenge: ChallengeExercise = {
  id: "ex.u1.propiedades_operaciones_reales.challenge-mc",
  skillId: "mat.u1.propiedades_operaciones_reales",
  type: "multiple-choice", difficulty: 5,
  prompt: "Desafío integrador", expectedAnswer: "opcion-a",
  commonErrorTags: [], pedagogicalNote: "Integrador", unit: 1,
  options: ["opcion-a", "opcion-b", "opcion-c", "opcion-d"],
  challengeSection: true, category: "desafio", tags: ["desafio", "integrador"],
  canonicalTrace: [
    { path: "capitulo-3.ejercicio-7", section: "Polinomios — Ruffini", sourceUse: "canonical-source", pedagogicalIntent: "Integrador" },
  ],
};

const challengeNum: ChallengeExercise = {
  ...challenge,
  type: "numerical", difficulty: 4,
  prompt: "Suma desafiante", expectedAnswer: "13",
  options: undefined,
};

describe("ExerciseSourceUse is the four-value U2-compatible union", () => {
  test("accepts adapted / reinforcement / reference / alignment", () => {
    const accepted: readonly ExerciseSourceUse[] = ["adapted", "reinforcement", "reference", "alignment"];
    expect(accepted).toHaveLength(4);
  });
  test.each(["canonical-source", "calibrated-from-exam", "solution-pattern"] as const)(
    "rejects challenge-only literal %s in ExerciseSourceUse",
    (literal) => {
      // @ts-expect-error — challenge-only literal must be rejected
      const bad: ExerciseSourceUse = literal;
      void bad;
    },
  );
});

describe("Exercise base shape and optional canonicalTrace", () => {
  test("extends base; canonicalTrace optional; alignment accepted; section optional", () => {
    const withoutTrace: Exercise = { ...exercise };
    expect(withoutTrace.canonicalTrace).toBeUndefined();
    const withTrace: Exercise = {
      ...exercise,
      canonicalTrace: [{ path: "UNIDAD3.pdf", section: "3.2", sourceUse: "reference", pedagogicalIntent: "Reforzar" }],
    };
    expect(withTrace.canonicalTrace![0].sourceUse).toBe("reference");
    const asBase: ExerciseBaseShape = withoutTrace;
    expect(asBase.id).toBe(withoutTrace.id);
    // ExerciseCanonicalTrace independently: alignment literal accepted, section optional.
    const aligned: ExerciseCanonicalTrace = { path: "p", section: "s", sourceUse: "alignment", pedagogicalIntent: "i" };
    expect(aligned.sourceUse).toBe("alignment");
    const noSection: ExerciseCanonicalTrace = { path: "p", sourceUse: "reference", pedagogicalIntent: "i" };
    expect(noSection.section).toBeUndefined();
  });
});

describe("Challenge surface composition", () => {
  test("ChallengeExercise is assignable to ExerciseBaseShape but NOT to Exercise; trace literals preserved", () => {
    const asBase: ExerciseBaseShape = challenge;
    expect(asBase.id).toBe(challenge.id);
    // @ts-expect-error — ChallengeCanonicalTrace.sourceUse is not assignable to ExerciseSourceUse
    const asExercise: Exercise = challenge;
    void asExercise;
    expect(challenge.canonicalTrace[0].sourceUse).toBe("canonical-source");
    expect(challenge.tags).toEqual(["desafio", "integrador"]);
    expect(challenge.category).toBe("desafio");
    expect(challenge.challengeSection).toBe(true);
  });
});

describe("Public re-exports from @/domain barrel", () => {
  // Type-only verification: every name in the import line at the top of
  // this file resolves through @/domain. If any is missing, tsc fails.
  test("barrel re-exports EvaluableExercise / Exercise / ExerciseBaseShape / ExerciseSourceUse / ExerciseCanonicalTrace", async () => {
    const barrel = await import("@/domain");
    expect(barrel).toBeDefined();
    const accepted: readonly ExerciseSourceUse[] = ["adapted", "reinforcement", "reference", "alignment"];
    expect(accepted).toHaveLength(4);
  });
});

describe("EvaluableExercise: structural contract for the domain evaluator", () => {
  // The evaluator reads ONLY six fields. Both Exercise and ChallengeExercise
  // extend ExerciseBaseShape (which supplies those six fields), so the named
  // contract accepts either surface without making them mutually assignable.
  test("Exercise assignable to EvaluableExercise", () => {
    const c: EvaluableExercise = exercise;
    expect(c.type).toBe("numerical");
    expect(c.expectedAnswer).toBe("8");
    expect(c.prompt).toBe("3 + 5");
  });

  test("ChallengeExercise assignable to EvaluableExercise", () => {
    const c: EvaluableExercise = challenge;
    expect(c.type).toBe("multiple-choice");
    expect(c.expectedAnswer).toBe("opcion-a");
    expect(challenge.canonicalTrace[0].sourceUse).toBe("canonical-source");
  });

  test("evaluateAnswer accepts ChallengeExercise directly with no cast", () => {
    const result: EvaluationResult = evaluateAnswer(challengeNum, "13");
    expect(result.correct).toBe(true);
  });

  test("evaluateAnswer accepts Exercise directly (sanity)", () => {
    const result: EvaluationResult = evaluateAnswer(exercise, "8");
    expect(result.correct).toBe(true);
  });

  test("Object missing required field is NOT assignable to EvaluableExercise", () => {
    // tsc emits TS2345 at the literal — @ts-expect-error consumes it; the
    // expected-throw wrapper captures the runtime crash so vitest passes.
    expect(() =>
      evaluateAnswer(
        // @ts-expect-error — literal lacks the required `expectedAnswer` field of EvaluableExercise
        { type: "numerical", prompt: "x", commonErrorTags: [], skillId: "mat.u1.propiedades_operaciones_reales" },
        "x",
      ),
    ).toThrow();
  });
});
