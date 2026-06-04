import { describe, expect, it } from "vitest";
import {
  shuffleExerciseOptions,
  createSeededRandom,
} from "./exercise-option-shuffle";

describe("createSeededRandom", () => {
  it("produces identical sequences for the same seed", () => {
    const rngA = createSeededRandom(42);
    const rngB = createSeededRandom(42);
    const seqA = Array.from({ length: 10 }, () => rngA());
    const seqB = Array.from({ length: 10 }, () => rngB());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const rngA = createSeededRandom(1);
    const rngB = createSeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => rngA());
    const seqB = Array.from({ length: 10 }, () => rngB());
    expect(seqA).not.toEqual(seqB);
  });

  it("returns values in [0, 1)", () => {
    const rng = createSeededRandom(99);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffleExerciseOptions", () => {
  const OPTIONS = ["A", "B", "C", "D"] as const;

  it("returns the same elements (no loss, no duplication)", () => {
    const rng = createSeededRandom(7);
    const shuffled = shuffleExerciseOptions(OPTIONS, rng);
    expect([...shuffled].sort()).toEqual([...OPTIONS].sort());
  });

  it("produces deterministic output with a fixed seed", () => {
    const rng1 = createSeededRandom(10);
    const rng2 = createSeededRandom(10);
    const first = shuffleExerciseOptions(OPTIONS, rng1);
    const second = shuffleExerciseOptions(OPTIONS, rng2);
    expect(first).toEqual(second);
  });

  it("produces a different order with a different seed (deterministic, zero flake)", () => {
    // Assert against known expected outputs for specific seeds.
    // This is fully deterministic — no probabilistic false-negative risk.
    const options6 = ["A", "B", "C", "D", "E", "F"] as const;

    const orderA = shuffleExerciseOptions(options6, createSeededRandom(1));
    const orderB = shuffleExerciseOptions(options6, createSeededRandom(99));

    // Known expected outputs (computed from mulberry32 + Fisher-Yates)
    expect(orderA).toEqual(["E", "B", "F", "C", "A", "D"]);
    expect(orderB).toEqual(["F", "A", "D", "C", "E", "B"]);

    // And they are different from each other
    expect(orderA).not.toEqual(orderB);
  });

  it("returns empty array for empty input", () => {
    const result = shuffleExerciseOptions([], createSeededRandom(1));
    expect(result).toEqual([]);
  });

  it("returns the single element unchanged for single-option input", () => {
    const result = shuffleExerciseOptions(["only"], createSeededRandom(1));
    expect(result).toEqual(["only"]);
  });

  it("does not mutate the original array", () => {
    const original = ["X", "Y", "Z"];
    const copy = [...original];
    shuffleExerciseOptions(original, createSeededRandom(5));
    expect(original).toEqual(copy);
  });

  it("works with Math.random as default (no random arg)", () => {
    const result = shuffleExerciseOptions(["A", "B", "C"]);
    expect([...result].sort()).toEqual(["A", "B", "C"]);
  });
});
