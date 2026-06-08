import { describe, expect, it } from "vitest";
import {
  canSubmitExerciseAnswer,
  getSubmittedExerciseAnswer,
} from "../exercise-answer-state";
import {
  shuffleExerciseOptions,
  createSeededRandom,
  getOptionValue,
} from "../exercise-option-shuffle";

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

  it("shuffled option submission returns value, not display index", () => {
    const OPTIONS = ["x = -2, x = 2", "x = -2", "x = 2", "x = 4"];
    const correctAnswer = "x = -2, x = 2";

    // Shuffle with a seed — deterministic order
    const shuffled = shuffleExerciseOptions(OPTIONS, createSeededRandom(42));

    // Simulate: user selects the correct answer from the shuffled display
    const selectedFromShuffled = shuffled.find((o) => getOptionValue(o) === correctAnswer);
    expect(selectedFromShuffled).toBeDefined();

    // The submitted answer is the VALUE, not a positional index
    const submitted = getSubmittedExerciseAnswer(
      "multiple-choice",
      "",
      getOptionValue(selectedFromShuffled!)
    );
    expect(submitted).toBe(correctAnswer);
  });

  it("deterministic shuffle with same seed produces stable order for memoization", () => {
    const OPTIONS = ["A", "B", "C", "D"];
    const seed = 77;

    const first = shuffleExerciseOptions(OPTIONS, createSeededRandom(seed));
    const second = shuffleExerciseOptions(OPTIONS, createSeededRandom(seed));

    // Same seed → same order (stable for memoization key)
    expect(first).toEqual(second);
  });

  it("submitted answer matches expected answer regardless of shuffle position", () => {
    const OPTIONS = ["wrong1", "correct", "wrong2", "wrong3"];
    const expectedAnswer = "correct";
    const shuffled = shuffleExerciseOptions(OPTIONS, createSeededRandom(5));

    // Find the correct answer in the shuffled list
    const correctOption = shuffled.find((o) => getOptionValue(o) === expectedAnswer);
    expect(correctOption).toBeDefined();

    // Selecting by VALUE (not index) gives correct submission
    const submitted = getSubmittedExerciseAnswer(
      "multiple-choice",
      "",
      getOptionValue(correctOption!)
    );
    expect(submitted).toBe(expectedAnswer);
  });
});
