import { describe, expect, it } from "vitest";
import { createPreviousExerciseSnapshot } from "../previous-snapshot";
import type { Exercise } from "@/domain/models/exercise";
import type { EvaluationResult } from "@/domain/evaluator/index";

type PartialWithSkill = Partial<Exercise> & { skillId?: Exercise["skillId"] };

function makeExercise(overrides: PartialWithSkill = {}): Exercise {
  return {
    id: "ex.u1.testing.001",
    skillId: "mat.u1.operaciones",
    type: "numerical",
    difficulty: 1,
    prompt: "¿Cuánto es 6 × 7?",
    expectedAnswer: "42",
    commonErrorTags: [],
    pedagogicalNote: "",
    ...overrides,
  };
}

function makeEvaluation(overrides: Partial<EvaluationResult> = {}): EvaluationResult {
  return {
    correct: true,
    ...overrides,
  };
}

describe("createPreviousExerciseSnapshot", () => {
  it("captures the exercise, submitted answer, evaluation result, and feedback", () => {
    const exercise = makeExercise({ id: "ex.u1.ops.001" });
    const evaluation = makeEvaluation({
      correct: false,
      errorTag: "u1_sign_error",
    });
    const feedback = "Revisá el signo del resultado.";

    const snapshot = createPreviousExerciseSnapshot(
      exercise,
      "24",
      evaluation,
      feedback,
    );

    expect(snapshot.exercise).toBe(exercise);
    expect(snapshot.submittedAnswer).toBe("24");
    expect(snapshot.evaluation).toBe(evaluation);
    expect(snapshot.feedback).toBe(feedback);
  });

  it("preserves the exact submitted answer string (including whitespace)", () => {
    const exercise = makeExercise({ type: "symbolic" });
    const evaluation = makeEvaluation();

    const snapshot = createPreviousExerciseSnapshot(
      exercise,
      "  x + 1  ",
      evaluation,
      "Correcto.",
    );

    expect(snapshot.submittedAnswer).toBe("  x + 1  ");
  });

  it("preserves an empty feedback string", () => {
    const exercise = makeExercise();
    const evaluation = makeEvaluation();

    const snapshot = createPreviousExerciseSnapshot(
      exercise,
      "0",
      evaluation,
      "",
    );

    expect(snapshot.feedback).toBe("");
  });
});
