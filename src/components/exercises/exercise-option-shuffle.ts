/**
 * Deterministic option shuffle for multiple-choice exercises.
 *
 * Pure functions — no side effects, no React dependencies.
 * Accepts an optional random source for testability.
 */

/** A function returning a number in [0, 1). */
export type ShuffleRandom = () => number;

/**
 * Simple seeded PRNG (mulberry32).
 * Produces a deterministic sequence of numbers in [0, 1) for a given seed.
 */
export function createSeededRandom(seed: number): ShuffleRandom {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle with an optional deterministic random source.
 * Returns a new array; does not mutate the input.
 *
 * @param options - The options to shuffle
 * @param random - Optional random function (defaults to Math.random)
 */
export function shuffleExerciseOptions(
  options: readonly string[],
  random: ShuffleRandom = Math.random
): readonly string[] {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
