import { describe, expect, it } from "vitest";
import {
  canSubmitExerciseAnswer,
  getSubmittedExerciseAnswer,
} from "../exercise-answer-state";

describe("exercise answer state", () => {
  it("does not allow submitting an empty multiple-choice answer", () => {
    expect(canSubmitExerciseAnswer("multiple-choice", "", null)).toBe(false);
  });

  it("allows submitting a selected multiple-choice option", () => {
    expect(
      canSubmitExerciseAnswer("multiple-choice", "", "[−1, ∞)")
    ).toBe(true);
  });

  it("submits the exact selected multiple-choice option", () => {
    expect(
      getSubmittedExerciseAnswer("multiple-choice", "", "[−1, ∞)")
    ).toBe("[−1, ∞)");
  });

  it("keeps text inputs trimmed", () => {
    expect(getSubmittedExerciseAnswer("symbolic", "  x > 3  ", null)).toBe(
      "x > 3"
    );
  });
});
