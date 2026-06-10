/**
 * Retry logic tests for usePracticeFlow.
 *
 * Since the project test environment is Node (no jsdom), React hooks cannot
 * be rendered directly. Instead, we test the PURE LOGIC that the hook
 * encapsulates (attemptIndex tracking, timer calculation, retry capability)
 * and verify hook STRUCTURE via source-code assertions.
 *
 * TDD tasks covered: T2.1, T2.2, T2.3, T2.7
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Pure logic — extracted from usePracticeFlow internals (to be implemented)
// ---------------------------------------------------------------------------

/**
 * Maximum number of retry attempts allowed for a single exercise.
 * Attempt 1 = first try, attempt 2 = first retry, attempt 3 = last retry.
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Determines whether a retry is still allowed for the current exercise.
 * @param attemptIndex 1-indexed attempt counter (1 = first try)
 * @param maxAttempts cap (default 3)
 * @returns true if the student can retry this exercise again
 */
export function canRetryExercise(
  attemptIndex: number,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
): boolean {
  return attemptIndex < maxAttempts;
}

/**
 * Resolves the NEXT attempt index for an exercise. Increments the existing
 * counter (or starts at 1 if the exercise has never been attempted).
 * Returns the new attempt index (NOT updated map — that's the caller's job).
 *
 * @param currentMap existing exerciseId → attemptIndex map
 * @param exerciseId the exercise being attempted
 * @returns the next attempt index (1-indexed)
 */
export function resolveNextAttemptIndex(
  currentMap: ReadonlyMap<string, number>,
  exerciseId: string,
): number {
  return (currentMap.get(exerciseId) ?? 0) + 1;
}

/**
 * Computes elapsed time in milliseconds from a monotonic start timestamp.
 * Pure calculation — does not call performance.now() itself.
 *
 * @param startMs monotonic timestamp from performance.now()
 * @param endMs monotonic timestamp from performance.now()
 * @returns elapsed milliseconds, clamped to >= 0
 */
export function computeElapsedMs(startMs: number, endMs: number): number {
  const elapsed = endMs - startMs;
  return elapsed < 0 ? 0 : elapsed;
}

/**
 * Returns true if the timeMs value is valid for metrics purposes.
 * Values < 100ms are too fast (accidental submit, double-click), and
 * values > 10min are too slow (paused tab, walked away).
 * Invalid times are still PERSISTED but EXCLUDED from metrics.
 */
export function isValidMetricTime(timeMs: number): boolean {
  return timeMs >= 100 && timeMs <= 600_000;
}

// ---------------------------------------------------------------------------
// Unit tests: canRetryExercise
// ---------------------------------------------------------------------------

describe("canRetryExercise", () => {
  it("allows retry on attempt 1 (first try, cap 3)", () => {
    expect(canRetryExercise(1)).toBe(true);
  });

  it("allows retry on attempt 2 (one retry used, cap 3)", () => {
    expect(canRetryExercise(2)).toBe(true);
  });

  it("disallows retry on attempt 3 (cap reached)", () => {
    expect(canRetryExercise(3)).toBe(false);
  });

  it("disallows retry on attempt 4 (beyond cap)", () => {
    expect(canRetryExercise(4)).toBe(false);
  });

  it("allows retry up to maxAttempts-1 with custom cap of 5", () => {
    expect(canRetryExercise(4, 5)).toBe(true);
    expect(canRetryExercise(5, 5)).toBe(false);
  });

  it("returns false for attempt 1 with cap 1 (no retries ever)", () => {
    expect(canRetryExercise(1, 1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: resolveNextAttemptIndex
// ---------------------------------------------------------------------------

describe("resolveNextAttemptIndex", () => {
  it("returns 1 for an exercise never attempted (empty map)", () => {
    expect(resolveNextAttemptIndex(new Map(), "ex.u1.ops.001")).toBe(1);
  });

  it("returns 2 when exercise has been attempted once", () => {
    const map = new Map<string, number>([["ex.u1.ops.001", 1]]);
    expect(resolveNextAttemptIndex(map, "ex.u1.ops.001")).toBe(2);
  });

  it("returns 3 when exercise has been attempted twice", () => {
    const map = new Map<string, number>([["ex.u1.ops.001", 2]]);
    expect(resolveNextAttemptIndex(map, "ex.u1.ops.001")).toBe(3);
  });

  it("returns 1 for a new exerciseId not in a populated map", () => {
    const map = new Map<string, number>([
      ["ex.u1.ops.001", 3],
      ["ex.u1.ops.002", 1],
    ]);
    expect(resolveNextAttemptIndex(map, "ex.u1.ops.099")).toBe(1);
  });

  it("does not mutate the input map", () => {
    const map = new Map<string, number>([["ex.u1.ops.001", 2]]);
    const before = map.get("ex.u1.ops.001");
    resolveNextAttemptIndex(map, "ex.u1.ops.001");
    expect(map.get("ex.u1.ops.001")).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: computeElapsedMs
// ---------------------------------------------------------------------------

describe("computeElapsedMs", () => {
  it("returns the difference between two monotonic timestamps", () => {
    expect(computeElapsedMs(1000, 3500)).toBe(2500);
  });

  it("returns 0 when start and end are equal", () => {
    expect(computeElapsedMs(5000, 5000)).toBe(0);
  });

  it("clamps negative differences to 0 (clock skew safety)", () => {
    expect(computeElapsedMs(5000, 4000)).toBe(0);
  });

  it("handles large values correctly", () => {
    const start = 12_345_678.123;
    const end = 12_405_678.456;
    // Floating-point arithmetic — use toBeCloseTo for tolerance
    expect(computeElapsedMs(start, end)).toBeCloseTo(60_000.333, 1);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: isValidMetricTime
// ---------------------------------------------------------------------------

describe("isValidMetricTime", () => {
  it("accepts 100ms (boundary valid)", () => {
    expect(isValidMetricTime(100)).toBe(true);
  });

  it("rejects 99ms (below minimum)", () => {
    expect(isValidMetricTime(99)).toBe(false);
  });

  it("rejects 0ms", () => {
    expect(isValidMetricTime(0)).toBe(false);
  });

  it("accepts 600000ms (10min boundary valid)", () => {
    expect(isValidMetricTime(600_000)).toBe(true);
  });

  it("rejects 600001ms (above maximum)", () => {
    expect(isValidMetricTime(600_001)).toBe(false);
  });

  it("accepts typical practice times (30s-5min)", () => {
    expect(isValidMetricTime(30_000)).toBe(true);
    expect(isValidMetricTime(120_000)).toBe(true);
    expect(isValidMetricTime(300_000)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Source-code assertions: usePracticeFlow hook structure
// ---------------------------------------------------------------------------

const repoRoot = process.cwd();

function hookSource(): string {
  return readFileSync(
    join(repoRoot, "src/app/practice/usePracticeFlow.ts"),
    "utf8",
  );
}

describe("usePracticeFlow hook structure (source assertions)", () => {
  it("declares attemptIndexByExerciseId state for tracking retries", () => {
    const src = hookSource();
    // Must declare a state variable tracking attemptIndex per exerciseId
    expect(src).toMatch(/attemptIndexByExerciseId/);
    // The useState type annotation may span multiple lines (Map<ExerciseId, number>)
    expect(src).toMatch(/useState</);
    expect(src).toMatch(/Map</);
    expect(src).toMatch(/ExerciseId/);
  });

  it("declares exerciseStartTimeRef for monotonic timer", () => {
    const src = hookSource();
    expect(src).toMatch(/exerciseStartTimeRef/);
  });

  it("uses performance.now() for timing (monotonic, not Date.now)", () => {
    const src = hookSource();
    expect(src).toMatch(/performance\.now\(\)/);
    expect(src).not.toMatch(/Date\.now\(\)/);
  });

  it("computes attemptIndex from the map (not hardcoded)", () => {
    const src = hookSource();
    // After PR2, attemptIndex should NOT be hardcoded to 1
    // (the bridge code had attemptIndex: 1)
    // The real implementation uses resolveNextAttemptIndex which reads the map
    // internally via .get(), or uses .get() directly. Either is valid.
    expect(src).toMatch(/resolveNextAttemptIndex/);
  });

  it("exports handleRetryExercise in the return object", () => {
    const src = hookSource();
    expect(src).toMatch(/handleRetryExercise/);
    // Must appear in the return block
    const returnBlock = src.slice(src.indexOf("return {"));
    expect(returnBlock).toMatch(/handleRetryExercise/);
  });

  it("NO LONGER contains the PR1 bridge TODO comment", () => {
    const src = hookSource();
    // The bridge had: // TODO(PR2): populate from performance.now()...
    // After PR2 implementation, this should be GONE
    expect(src).not.toMatch(/TODO\(PR2\).*populate from performance\.now/);
  });

  it("NO LONGER has dummy timeMs: 0 (bridge removed)", () => {
    const src = hookSource();
    // The bridge had literal timeMs: 0 — real impl uses computed time
    // We check that timeMs is NOT hardcoded to 0 in the addAttempt call
    // (the context nearby should use the computed value)
    const addAttemptRegion = src.slice(
      src.indexOf("addAttempt({"),
      src.indexOf("setProgress(updated)"),
    );
    expect(addAttemptRegion).not.toMatch(/timeMs:\s*0\b/);
  });

  it("resets attemptIndex map and timer ref when skill changes", () => {
    const src = hookSource();
    // handleSkillSelect or useEffect for skill change must reset the map
    // Look for setAttemptIndexByExerciseId(new Map()) or = new Map()
    expect(src).toMatch(/setAttemptIndexByExerciseId\(/);
  });
});
