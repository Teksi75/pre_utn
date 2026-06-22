/**
 * Challenge flow state machine — manages the internal challenge mini-flow.
 *
 * States:
 * - opt-in: user sees ChallengeOptInBlock, chooses start or skip
 * - exercise: user sees ChallengeExerciseCard, answers the challenge
 * - feedback: user sees ChallengeFeedback with pedagogical note
 * - done: user sees ChallengeDoneSummary
 *
 * This hook does NOT import from base practice-progress.
 * It uses only addChallengeAttempt from advanced-practice-progress.
 *
 * Dependency injection: addChallengeAttempt and computeAdvancedReadiness
 * are passed as arguments so the hook remains testable without localStorage.
 */

import { useState, useCallback } from "react";
import type { ChallengeExercise } from "@/domain/catalog/challenges/types";
import type { ChallengeAttemptInput, ChallengeAttempt } from "@/lib/advanced-practice-progress";
import type { SkillId } from "@/domain/models/skill";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChallengePhase = "opt-in" | "exercise" | "feedback" | "done";

export interface ChallengeAnswer {
  exerciseId: string;
  answer: string;
  correct: boolean;
  timeMs: number;
}

export interface ChallengeFlowOptions {
  /** The list of challenge exercises for this flow */
  challenges: readonly ChallengeExercise[];
  /** The skill being practiced */
  skillId: SkillId;
  /** Record a challenge attempt to the advanced store */
  addChallengeAttempt: (
    attempt: ChallengeAttemptInput
  ) => { ok: true; value: unknown } | { ok: false; reason: string };
  /** Load advanced progress from the store */
  loadAdvancedProgress: () => {
    challengeAttempts: readonly ChallengeAttempt[];
  };
  /** Compute advanced readiness score for a skill */
  computeAdvancedReadiness: (
    skillId: SkillId,
    attempts: readonly ChallengeAttempt[]
  ) => number | null;
  /** Called when the flow completes (finished or skipped) */
  onDone?: () => void;
}

// ---------------------------------------------------------------------------
// Pure transition functions (extracted for testability)
// ---------------------------------------------------------------------------

/**
 * Initial state for the challenge flow.
 */
export function getInitialChallengeFlowState() {
  return {
    phase: "opt-in" as ChallengePhase,
    currentChallengeIndex: 0,
    lastEvaluation: null as { correct: boolean } | null,
    advancedReadiness: null as number | null,
    correctCount: 0,
  };
}

/**
 * Transition from opt-in to exercise.
 */
export function startChallenges(state: ReturnType<typeof getInitialChallengeFlowState>) {
  if (state.phase !== "opt-in") return state;
  return { ...state, phase: "exercise" as ChallengePhase };
}

/**
 * Record an answer and transition to feedback.
 * Also increments correctCount if the answer was correct.
 */
export function recordAnswer(
  state: ReturnType<typeof getInitialChallengeFlowState>,
  answer: ChallengeAnswer
) {
  if (state.phase !== "exercise") return state;
  return {
    ...state,
    phase: "feedback" as ChallengePhase,
    lastEvaluation: { correct: answer.correct },
    correctCount: answer.correct ? state.correctCount + 1 : state.correctCount,
  };
}

/**
 * Advance from feedback to next challenge or done.
 */
export function advanceFromFeedback(
  state: ReturnType<typeof getInitialChallengeFlowState>,
  totalChallenges: number
) {
  if (state.phase !== "feedback") return state;

  const nextIndex = state.currentChallengeIndex + 1;

  if (nextIndex >= totalChallenges) {
    return { ...state, phase: "done" as ChallengePhase };
  }

  return {
    ...state,
    phase: "exercise" as ChallengePhase,
    currentChallengeIndex: nextIndex,
    lastEvaluation: null,
  };
}

/**
 * Skip the challenge flow from opt-in.
 */
export function skipChallenges(state: ReturnType<typeof getInitialChallengeFlowState>) {
  if (state.phase !== "opt-in") return state;
  return { ...state, phase: "done" as ChallengePhase };
}

// ---------------------------------------------------------------------------
// useChallengeFlow hook
// ---------------------------------------------------------------------------

export interface ChallengeFlowState {
  readonly phase: ChallengePhase;
  readonly currentChallenge: ChallengeExercise | null;
  readonly currentChallengeNumber: number;
  readonly totalChallenges: number;
  readonly lastEvaluation: { correct: boolean } | null;
  readonly advancedReadiness: number | null;
  readonly correctCount: number;
}

export function useChallengeFlow({
  challenges,
  skillId,
  addChallengeAttempt,
  loadAdvancedProgress,
  computeAdvancedReadiness,
  onDone,
}: ChallengeFlowOptions) {
  const [state, setState] = useState(getInitialChallengeFlowState);

  const totalChallenges = challenges.length;

  /** Start the challenge flow — opt-in → exercise */
  const onStart = useCallback(() => {
    setState((prev) => startChallenges(prev));
  }, []);

  /** Skip the challenge flow — opt-in → done */
  const onSkip = useCallback(() => {
    setState((prev) => {
      const next = skipChallenges(prev);
      onDone?.();
      return next;
    });
  }, [onDone]);

  /** Submit an answer — exercise → feedback */
  const onAnswer = useCallback(
    (answer: ChallengeAnswer) => {
      // Record attempt to advanced store — adapter stamps studentId
      const attempt: ChallengeAttemptInput = {
        exerciseId: answer.exerciseId,
        skillId,
        correct: answer.correct,
        answeredAt: new Date().toISOString(),
        timeMs: answer.timeMs,
        attemptIndex: 1,
      };
      addChallengeAttempt(attempt);

      setState((prev) => recordAnswer(prev, answer));
    },
    [skillId, addChallengeAttempt]
  );

  /** Advance from feedback — feedback → next exercise or done */
  const onNext = useCallback(() => {
    setState((prev) => {
      const next = advanceFromFeedback(prev, totalChallenges);

      // Compute advanced readiness when entering done phase
      if (next.phase === "done" && next.advancedReadiness === null) {
        const progress = loadAdvancedProgress();
        const readiness = computeAdvancedReadiness(skillId, progress.challengeAttempts);
        return { ...next, advancedReadiness: readiness };
      }

      return next;
    });
  }, [totalChallenges, skillId, loadAdvancedProgress, computeAdvancedReadiness]);

  /** Go back from feedback to exercise (retry current challenge) */
  const onBack = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "feedback") return prev;
      return {
        ...prev,
        phase: "exercise",
        lastEvaluation: null,
      };
    });
  }, []);

  const currentChallenge =
    state.phase === "exercise" || state.phase === "feedback"
      ? challenges[state.currentChallengeIndex] ?? null
      : null;

  const currentChallengeNumber = state.currentChallengeIndex + 1;

  return {
    state,
    currentChallenge,
    currentChallengeNumber,
    totalChallenges,
    onStart,
    onSkip,
    onAnswer,
    onNext,
    onBack,
  };
}
