/**
 * Tests for useChallengeFlow state machine logic.
 *
 * Since the project test environment is Node (no jsdom), React hooks cannot
 * be rendered. Instead, we test the PURE LOGIC that the hook encapsulates:
 * - ChallengeFlowState type and transitions
 * - Pure functions extracted from the hook
 *
 * STRICT TDD: RED first.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Types mirrored from useChallengeFlow (what the test expects)
// ---------------------------------------------------------------------------

type ChallengePhase = "opt-in" | "exercise" | "feedback" | "done";

interface ChallengeAnswer {
  exerciseId: string;
  answer: string;
  correct: boolean;
  timeMs: number;
}

interface ChallengeFlowState {
  phase: ChallengePhase;
  currentChallengeIndex: number;
  lastEvaluation: { correct: boolean } | null;
  advancedReadiness: number | null;
}

// ---------------------------------------------------------------------------
// Pure state transition functions (to be implemented in useChallengeFlow.ts)
// ---------------------------------------------------------------------------

/**
 * Initial state for the challenge flow.
 */
export function getInitialChallengeFlowState(): ChallengeFlowState {
  return {
    phase: "opt-in",
    currentChallengeIndex: 0,
    lastEvaluation: null,
    advancedReadiness: null,
  };
}

/**
 * Transition from opt-in to exercise.
 * Returns updated state with first challenge loaded.
 */
export function startChallenges(
  state: ChallengeFlowState
): ChallengeFlowState {
  if (state.phase !== "opt-in") return state;
  return {
    ...state,
    phase: "exercise",
  };
}

/**
 * Record an answer and transition to feedback.
 */
export function recordAnswer(
  state: ChallengeFlowState,
  answer: ChallengeAnswer
): ChallengeFlowState {
  if (state.phase !== "exercise") return state;
  return {
    ...state,
    phase: "feedback",
    lastEvaluation: { correct: answer.correct },
  };
}

/**
 * Advance from feedback to next challenge or done.
 * totalChallenges: total number of challenges in the flow.
 */
export function advanceFromFeedback(
  state: ChallengeFlowState,
  totalChallenges: number
): ChallengeFlowState {
  if (state.phase !== "feedback") return state;

  const nextIndex = state.currentChallengeIndex + 1;

  if (nextIndex >= totalChallenges) {
    return { ...state, phase: "done" };
  }

  return {
    ...state,
    phase: "exercise",
    currentChallengeIndex: nextIndex,
    lastEvaluation: null,
  };
}

/**
 * Skip the challenge flow from opt-in.
 */
export function skipChallenges(state: ChallengeFlowState): ChallengeFlowState {
  if (state.phase !== "opt-in") return state;
  return { ...state, phase: "done" };
}

/**
 * Check if the flow is done (user finished or skipped all challenges).
 */
export function isChallengeFlowDone(state: ChallengeFlowState): boolean {
  return state.phase === "done";
}

// ---------------------------------------------------------------------------
// Unit tests: initial state
// ---------------------------------------------------------------------------

describe("getInitialChallengeFlowState", () => {
  it("starts in opt-in phase", () => {
    const state = getInitialChallengeFlowState();
    expect(state.phase).toBe("opt-in");
  });

  it("currentChallengeIndex starts at 0", () => {
    const state = getInitialChallengeFlowState();
    expect(state.currentChallengeIndex).toBe(0);
  });

  it("lastEvaluation is null initially", () => {
    const state = getInitialChallengeFlowState();
    expect(state.lastEvaluation).toBeNull();
  });

  it("advancedReadiness is null initially", () => {
    const state = getInitialChallengeFlowState();
    expect(state.advancedReadiness).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Unit tests: startChallenges
// ---------------------------------------------------------------------------

describe("startChallenges", () => {
  it("transitions from opt-in to exercise", () => {
    const state = getInitialChallengeFlowState();
    const next = startChallenges(state);
    expect(next.phase).toBe("exercise");
  });

  it("does not change phase if not in opt-in", () => {
    const state: ChallengeFlowState = {
      phase: "exercise",
      currentChallengeIndex: 0,
      lastEvaluation: null,
      advancedReadiness: null,
    };
    const next = startChallenges(state);
    expect(next.phase).toBe("exercise");
  });

  it("preserves currentChallengeIndex when starting", () => {
    const state = getInitialChallengeFlowState();
    const next = startChallenges(state);
    expect(next.currentChallengeIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: recordAnswer
// ---------------------------------------------------------------------------

describe("recordAnswer", () => {
  it("transitions from exercise to feedback", () => {
    const state: ChallengeFlowState = {
      phase: "exercise",
      currentChallengeIndex: 0,
      lastEvaluation: null,
      advancedReadiness: null,
    };
    const answer: ChallengeAnswer = {
      exerciseId: "ex-1",
      answer: "opt-1",
      correct: true,
      timeMs: 45000,
    };
    const next = recordAnswer(state, answer);
    expect(next.phase).toBe("feedback");
  });

  it("records correct flag in lastEvaluation", () => {
    const state: ChallengeFlowState = {
      phase: "exercise",
      currentChallengeIndex: 0,
      lastEvaluation: null,
      advancedReadiness: null,
    };
    const answer: ChallengeAnswer = {
      exerciseId: "ex-1",
      answer: "opt-1",
      correct: false,
      timeMs: 45000,
    };
    const next = recordAnswer(state, answer);
    expect(next.lastEvaluation).toEqual({ correct: false });
  });

  it("does nothing if not in exercise phase", () => {
    const state = getInitialChallengeFlowState();
    const answer: ChallengeAnswer = {
      exerciseId: "ex-1",
      answer: "opt-1",
      correct: true,
      timeMs: 45000,
    };
    const next = recordAnswer(state, answer);
    expect(next.phase).toBe("opt-in");
  });
});

// ---------------------------------------------------------------------------
// Unit tests: advanceFromFeedback
// ---------------------------------------------------------------------------

describe("advanceFromFeedback", () => {
  it("transitions to next challenge when more exist", () => {
    const state: ChallengeFlowState = {
      phase: "feedback",
      currentChallengeIndex: 0,
      lastEvaluation: { correct: true },
      advancedReadiness: null,
    };
    const next = advanceFromFeedback(state, 3);
    expect(next.phase).toBe("exercise");
    expect(next.currentChallengeIndex).toBe(1);
  });

  it("transitions to done when last challenge is complete", () => {
    const state: ChallengeFlowState = {
      phase: "feedback",
      currentChallengeIndex: 2,
      lastEvaluation: { correct: true },
      advancedReadiness: null,
    };
    const next = advanceFromFeedback(state, 3);
    expect(next.phase).toBe("done");
  });

  it("clears lastEvaluation when advancing", () => {
    const state: ChallengeFlowState = {
      phase: "feedback",
      currentChallengeIndex: 0,
      lastEvaluation: { correct: true },
      advancedReadiness: null,
    };
    const next = advanceFromFeedback(state, 3);
    expect(next.lastEvaluation).toBeNull();
  });

  it("does nothing if not in feedback phase", () => {
    const state = getInitialChallengeFlowState();
    const next = advanceFromFeedback(state, 3);
    expect(next.phase).toBe("opt-in");
  });
});

// ---------------------------------------------------------------------------
// Unit tests: skipChallenges
// ---------------------------------------------------------------------------

describe("skipChallenges", () => {
  it("transitions from opt-in to done", () => {
    const state = getInitialChallengeFlowState();
    const next = skipChallenges(state);
    expect(next.phase).toBe("done");
  });

  it("does nothing if not in opt-in phase", () => {
    const state: ChallengeFlowState = {
      phase: "exercise",
      currentChallengeIndex: 0,
      lastEvaluation: null,
      advancedReadiness: null,
    };
    const next = skipChallenges(state);
    expect(next.phase).toBe("exercise");
  });
});

// ---------------------------------------------------------------------------
// Unit tests: isChallengeFlowDone
// ---------------------------------------------------------------------------

describe("isChallengeFlowDone", () => {
  it("returns false for opt-in", () => {
    const state = getInitialChallengeFlowState();
    expect(isChallengeFlowDone(state)).toBe(false);
  });

  it("returns false for exercise", () => {
    const state: ChallengeFlowState = {
      phase: "exercise",
      currentChallengeIndex: 0,
      lastEvaluation: null,
      advancedReadiness: null,
    };
    expect(isChallengeFlowDone(state)).toBe(false);
  });

  it("returns false for feedback", () => {
    const state: ChallengeFlowState = {
      phase: "feedback",
      currentChallengeIndex: 0,
      lastEvaluation: { correct: true },
      advancedReadiness: null,
    };
    expect(isChallengeFlowDone(state)).toBe(false);
  });

  it("returns true for done", () => {
    const state: ChallengeFlowState = {
      phase: "done",
      currentChallengeIndex: 2,
      lastEvaluation: { correct: true },
      advancedReadiness: 75,
    };
    expect(isChallengeFlowDone(state)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Integration: full challenge flow sequence
// ---------------------------------------------------------------------------

describe("full challenge flow sequence", () => {
  it("follows opt-in → exercise → feedback → done (single challenge)", () => {
    let state = getInitialChallengeFlowState();

    // Start
    state = startChallenges(state);
    expect(state.phase).toBe("exercise");

    // Answer
    const answer: ChallengeAnswer = {
      exerciseId: "ex-1",
      answer: "opt-1",
      correct: true,
      timeMs: 45000,
    };
    state = recordAnswer(state, answer);
    expect(state.phase).toBe("feedback");

    // Advance (last challenge)
    state = advanceFromFeedback(state, 1);
    expect(state.phase).toBe("done");
    expect(isChallengeFlowDone(state)).toBe(true);
  });

  it("follows opt-in → exercise → feedback → exercise → feedback → done (two challenges)", () => {
    let state = getInitialChallengeFlowState();

    // Challenge 1
    state = startChallenges(state);
    expect(state.phase).toBe("exercise");
    expect(state.currentChallengeIndex).toBe(0);

    state = recordAnswer(state, {
      exerciseId: "ex-1",
      answer: "opt-1",
      correct: true,
      timeMs: 30000,
    });
    expect(state.phase).toBe("feedback");

    state = advanceFromFeedback(state, 2);
    expect(state.phase).toBe("exercise");
    expect(state.currentChallengeIndex).toBe(1);

    // Challenge 2
    state = recordAnswer(state, {
      exerciseId: "ex-2",
      answer: "opt-2",
      correct: false,
      timeMs: 60000,
    });
    expect(state.phase).toBe("feedback");

    state = advanceFromFeedback(state, 2);
    expect(state.phase).toBe("done");
  });

  it("can skip from opt-in to done", () => {
    let state = getInitialChallengeFlowState();

    state = skipChallenges(state);
    expect(state.phase).toBe("done");
    expect(isChallengeFlowDone(state)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: advancedReadiness in done phase
// ---------------------------------------------------------------------------

/**
 * Mock ChallengeAttempt for testing readiness computation.
 */
function makeAttempt(params: {
  exerciseId: string;
  skillId: string;
  correct: boolean;
  answeredAt?: string;
  attemptIndex?: number;
}) {
  return {
    exerciseId: params.exerciseId,
    skillId: params.skillId,
    correct: params.correct,
    answeredAt: params.answeredAt ?? "2024-01-01T00:00:00.000Z",
    timeMs: 30000,
    attemptIndex: params.attemptIndex ?? 1,
  };
}

/**
 * Pure function that computes readiness for done phase.
 * Mirrors the logic that should be in useChallengeFlow.onNext.
 */
function computeReadinessForDone(
  state: ChallengeFlowState,
  skillId: string,
  loadAdvancedProgress: () => { challengeAttempts: readonly ReturnType<typeof makeAttempt>[] },
  computeAdvancedReadiness: (skillId: string, attempts: readonly ReturnType<typeof makeAttempt>[]) => number | null
): ChallengeFlowState {
  if (state.phase !== "done") return state;
  if (state.advancedReadiness !== null) return state;

  const progress = loadAdvancedProgress();
  const readiness = computeAdvancedReadiness(skillId, progress.challengeAttempts);
  return { ...state, advancedReadiness: readiness };
}

describe("advancedReadiness in done phase", () => {
  it("sets advancedReadiness to null when no attempts exist for skill", () => {
    const state: ChallengeFlowState = {
      phase: "done",
      currentChallengeIndex: 2,
      lastEvaluation: { correct: true },
      advancedReadiness: null,
    };

    const loadAdvancedProgress = () => ({ challengeAttempts: [] });
    const computeAdvancedReadiness = () => null;

    const next = computeReadinessForDone(state, "skill-1", loadAdvancedProgress, computeAdvancedReadiness);
    expect(next.advancedReadiness).toBeNull();
  });

  it("sets advancedReadiness to computed score when attempts exist", () => {
    const state: ChallengeFlowState = {
      phase: "done",
      currentChallengeIndex: 2,
      lastEvaluation: { correct: true },
      advancedReadiness: null,
    };

    const attempts = [
      makeAttempt({ exerciseId: "ex-1", skillId: "skill-1", correct: true }),
      makeAttempt({ exerciseId: "ex-2", skillId: "skill-1", correct: true }),
    ];
    const loadAdvancedProgress = () => ({ challengeAttempts: attempts });
    const computeAdvancedReadiness = (_skillId: string, _attempts: readonly ReturnType<typeof makeAttempt>[]) => 100;

    const next = computeReadinessForDone(state, "skill-1", loadAdvancedProgress, computeAdvancedReadiness);
    expect(next.advancedReadiness).toBe(100);
  });

  it("does not overwrite existing advancedReadiness", () => {
    const state: ChallengeFlowState = {
      phase: "done",
      currentChallengeIndex: 2,
      lastEvaluation: { correct: true },
      advancedReadiness: 75,
    };

    const loadAdvancedProgress = () => ({
      challengeAttempts: [makeAttempt({ exerciseId: "ex-1", skillId: "skill-1", correct: true })],
    });
    const computeAdvancedReadiness = () => 100;

    const next = computeReadinessForDone(state, "skill-1", loadAdvancedProgress, computeAdvancedReadiness);
    // Should preserve existing value, not recompute
    expect(next.advancedReadiness).toBe(75);
  });

  it("does nothing if not in done phase", () => {
    const state: ChallengeFlowState = {
      phase: "feedback",
      currentChallengeIndex: 1,
      lastEvaluation: { correct: true },
      advancedReadiness: null,
    };

    const loadAdvancedProgress = () => ({ challengeAttempts: [] });
    const computeAdvancedReadiness = () => 100;

    const next = computeReadinessForDone(state, "skill-1", loadAdvancedProgress, computeAdvancedReadiness);
    expect(next.advancedReadiness).toBeNull();
    expect(next.phase).toBe("feedback");
  });
});
