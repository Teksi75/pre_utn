"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { queryBySkill } from "@/domain/catalog/index";
import type { AccessibleSkill } from "@/domain/catalog/accessibility";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
} from "@/domain/catalog/content-loaders";
import { evaluateAnswer } from "@/domain/evaluator/index";
import { generateFeedback, type FeedbackMapping } from "@/domain/feedback/index";
import { addAttempt, loadProgress, EMPTY_PROGRESS } from "@/lib/practice-progress";
import { nextPhase, type PracticePhase } from "./phases";
import {
  PRACTICE_SKILL_UNIT_MAP,
  analyzeRequestedSkill,
  buildAccessibleSkillMap,
  isContentQaModeEnabled,
  type BlockedReason,
} from "./start-skill";
import type { PracticeProgress } from "@/domain/progress/index";
import type { SkillId } from "@/domain/models/skill";
import type { ExerciseId, Exercise } from "@/domain/models/exercise";
import type { TheoryNode } from "@/domain/models/theory";
import type { WorkedExample } from "@/domain/models/worked-example";
import type { EvaluationResult } from "@/domain/evaluator/index";
import {
  createPreviousExerciseSnapshot,
  type PreviousExerciseSnapshot,
  type ExerciseDraftState,
} from "./previous-snapshot";

export { type PreviousExerciseSnapshot, type ExerciseDraftState } from "./previous-snapshot";

/** Maximum retry attempts per exercise within a single browser session. */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Resolve the next attempt index for an exercise. Increments the existing
 * counter or starts at 1 if the exercise has never been attempted yet.
 * Pure function — no side effects.
 */
export function resolveNextAttemptIndex(
  currentMap: ReadonlyMap<string, number>,
  exerciseId: string,
): number {
  return (currentMap.get(exerciseId) ?? 0) + 1;
}

/**
 * Whether the student can still retry this exercise within the current session.
 * Pure function — no side effects.
 */
export function canRetryExercise(
  attemptIndex: number,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
): boolean {
  return attemptIndex < maxAttempts;
}

/**
 * Information about a skill the user requested via `?skill=...` that
 * could not be opened for practice. Surfaced by the page as a clear,
 * actionable message instead of a silent no-op.
 */
export interface BlockedSkillInfo {
  readonly skillId: string;
  readonly reason: BlockedReason;
  /** Populated when reason === "missing-prerequisite". */
  readonly missingPrerequisite?: SkillId;
}

/**
 * Encapsulates all state and transitions for the guided practice flow.
 * The page component remains a pure renderer; this hook owns the
 * state machine, timers, and persistence side-effects.
 */
export function usePracticeFlow() {
  const [phase, setPhase] = useState<PracticePhase>("select");
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [theoryNode, setTheoryNode] = useState<TheoryNode | null>(null);
  const [currentExample, setCurrentExample] = useState<WorkedExample | null>(null);
  const [examples, setExamples] = useState<WorkedExample[]>([]);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [feedbackMappings, setFeedbackMappings] = useState<
    readonly FeedbackMapping[]
  >([]);
  const [previousSnapshot, setPreviousSnapshot] =
    useState<PreviousExerciseSnapshot | null>(null);
  const [isViewingPreviousExercise, setIsViewingPreviousExercise] =
    useState(false);
  const [currentAnswerDraft, setCurrentAnswerDraft] =
    useState<ExerciseDraftState>({ answer: "", selectedOption: null });
  const [profileBlocked, setProfileBlocked] = useState(false);
  const evaluateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSkillConsumedRef = useRef(false);

  // Progress is initialized to EMPTY_PROGRESS so the SSR pre-render
  // and the client's first hydration render produce identical markup.
  // We read localStorage inside a useEffect (browser-only) and update
  // the state, which triggers a re-render with the real data.
  const [progress, setProgress] = useState<PracticeProgress>(EMPTY_PROGRESS);
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // ---------------------------------------------------------------
  // Retry state — session-scoped, resets on page refresh
  // ---------------------------------------------------------------

  /**
   * Tracks the current attempt index per exercise within this browser
   * session. 1 = first try, 2 = first retry, etc. Resets on page
   * refresh (React state, not persisted to localStorage).
   */
  const [attemptIndexByExerciseId, setAttemptIndexByExerciseId] = useState<
    Map<ExerciseId, number>
  >(new Map());

  /**
   * Monotonic timestamp captured at answer-submit time via
   * `performance.now()`. Used to compute elapsed time when the
   * evaluation completes (async via setTimeout).
   */
  const exerciseStartTimeRef = useRef<number | null>(null);

  // Accessibility model for the select phase. Derived from `progress`
  // so the FocusSelector reflects the latest accuracy after a practice
  // attempt (and avoids reading localStorage during render).
  const accessibleSkills: ReadonlyMap<SkillId, AccessibleSkill> = useMemo(
    () => buildAccessibleSkillMap(progress),
    [progress]
  );

  // Detected blocked-skill message from `?skill=...`. The page renders
  // this above the FocusSelector so the student understands why the
  // requested skill did not open.
  const [blockedSkill, setBlockedSkill] = useState<BlockedSkillInfo | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (evaluateTimeoutRef.current !== null) {
        clearTimeout(evaluateTimeoutRef.current);
      }
    };
  }, []);

  const resetToSelect = useCallback(() => {
    setPhase("select");
    setSelectedSkillId(null);
    setCurrentExercise(null);
    setEvaluation(null);
    setFeedbackMsg("");
    setExerciseIndex(0);
    setExercises([]);
    setTheoryNode(null);
    setCurrentExample(null);
    setExamples([]);
    setExampleIndex(0);
    setFeedbackMappings([]);
    setBlockedSkill(null);
    setPreviousSnapshot(null);
    setIsViewingPreviousExercise(false);
    setCurrentAnswerDraft({ answer: "", selectedOption: null });
    // Reset retry state — new practice session, fresh attempt counters
    setAttemptIndexByExerciseId(new Map());
    exerciseStartTimeRef.current = null;
  }, []);

  const handleSkillSelect = useCallback((skillId: SkillId) => {
    setSelectedSkillId(skillId);
    setBlockedSkill(null);
    setPreviousSnapshot(null);
    setIsViewingPreviousExercise(false);
    setCurrentAnswerDraft({ answer: "", selectedOption: null });
    // Reset retry state for the new skill
    setAttemptIndexByExerciseId(new Map());
    exerciseStartTimeRef.current = null;
    const skillExercises = queryBySkill(skillId);
    setExercises(skillExercises);
    setExerciseIndex(0);
    setCurrentExercise(skillExercises[0] ?? null);

    // Load content for this skill
    const unitKey = PRACTICE_SKILL_UNIT_MAP[skillId];
    if (unitKey) {
      const theory = loadTheoryContent(unitKey).find((t) => t.skillId === skillId) ?? null;
      setTheoryNode(theory);
      const skillExamples = loadExampleContent(unitKey).filter((e) => e.skillId === skillId);
      setExamples(skillExamples);
      setCurrentExample(skillExamples[0] ?? null);
      setExampleIndex(0);
      setFeedbackMappings(loadFeedbackContent(unitKey));
    }

    setPhase("theory");
  }, []);

  useEffect(() => {
    if (initialSkillConsumedRef.current || selectedSkillId !== null) return;
    // Skip until progress is loaded — otherwise we'd analyze against
    // EMPTY_PROGRESS and wrongly block skills whose prereqs are
    // mastered in the student's saved data.
    if (progress === EMPTY_PROGRESS) return;

    const requestedSkill = new URLSearchParams(window.location.search).get("skill");
    if (!requestedSkill) return;

    const analysis = analyzeRequestedSkill(requestedSkill, progress, {
      qaContentModeEnabled: isContentQaModeEnabled(),
    });
    if (analysis.kind === "ready") {
      initialSkillConsumedRef.current = true;
      handleSkillSelect(analysis.skillId);
      return;
    }

    if (analysis.kind === "blocked") {
      initialSkillConsumedRef.current = true;
      setBlockedSkill({
        skillId: analysis.skillId,
        reason: analysis.reason,
        missingPrerequisite: analysis.missingPrerequisite,
      });
      return;
    }
  }, [handleSkillSelect, selectedSkillId, progress]);

  const handleNextPhase = useCallback(() => {
    const lastExercise = exerciseIndex >= exercises.length - 1;
    const errorTag = evaluation?.errorTag ?? null;
    const next = nextPhase(phase, errorTag, lastExercise);
    setPhase(next);
  }, [phase, evaluation, exerciseIndex, exercises.length]);

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      if (!currentExercise) return;
      setIsEvaluating(true);

      if (evaluateTimeoutRef.current !== null) {
        clearTimeout(evaluateTimeoutRef.current);
      }
      evaluateTimeoutRef.current = setTimeout(() => {
        evaluateTimeoutRef.current = null;
        const result = evaluateAnswer(currentExercise, answer);
        setEvaluation(result);

        // Generate feedback using domain engine
        const fb = generateFeedback(result.correct, result.errorTag, feedbackMappings);
        setFeedbackMsg(fb.message);

        // Capture a session-scoped read-only snapshot of THIS submission
        // before the answer string is discarded and the phase advances.
        setPreviousSnapshot(
          createPreviousExerciseSnapshot(
            currentExercise,
            answer,
            result,
            fb.message,
          ),
        );

        // Compute elapsed time from the monotonic start timestamp
        const elapsedMs =
          exerciseStartTimeRef.current !== null
            ? performance.now() - exerciseStartTimeRef.current
            : 0;

        // Compute attempt index: increment the per-exercise counter
        const nextIdx = resolveNextAttemptIndex(
          attemptIndexByExerciseId,
          currentExercise.id,
        );

          // Persist attempt and refresh progress so the FocusSelector
        // re-derives the accessibility map with the new accuracy.
        if (selectedSkillId) {
          const result2 = addAttempt({
            exerciseId: currentExercise.id,
            skillId: selectedSkillId,
            correct: result.correct,
            errorTag: result.errorTag,
            answeredAt: new Date().toISOString(),
            difficulty: currentExercise.difficulty,
            timeMs: elapsedMs,
            attemptIndex: nextIdx,
          });
          // If no active profile, addAttempt returns blocked result.
          // Signal the UI to show the identification gate.
          if (result2.ok) {
            setProgress(result2.value);
            setProfileBlocked(false);
          } else {
            setProfileBlocked(true);
          }
        }

        // Update the attempt index map for this exercise
        setAttemptIndexByExerciseId((prev) => {
          const next = new Map(prev);
          next.set(currentExercise.id, nextIdx);
          return next;
        });

        setIsEvaluating(false);
        setPhase("feedback");
      }, 300);
    },
    [currentExercise, feedbackMappings, selectedSkillId, attemptIndexByExerciseId]
  );

  const handleNextExercise = useCallback(() => {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < exercises.length) {
      setExerciseIndex(nextIndex);
      setCurrentExercise(exercises[nextIndex]);
      setEvaluation(null);
      setFeedbackMsg("");
      setPhase("exercise");
      // Clear draft for the new exercise
      setCurrentAnswerDraft({ answer: "", selectedOption: null });
      // Start the solving timer when the exercise is shown
      exerciseStartTimeRef.current = performance.now();
    } else {
      resetToSelect();
    }
  }, [exerciseIndex, exercises, resetToSelect]);

  const viewPreviousExercise = useCallback(() => {
    setIsViewingPreviousExercise(true);
  }, []);

  const returnToCurrentExercise = useCallback(() => {
    setIsViewingPreviousExercise(false);
  }, []);

  const handleContinueAfterFeedback = useCallback(() => {
    if (evaluation?.errorTag) {
      setPhase("recovery");
      return;
    }
    handleNextExercise();
  }, [evaluation, handleNextExercise]);

  const handleContinueAfterRecovery = useCallback(() => {
    handleNextExercise();
  }, [handleNextExercise]);

  const handleNextExample = useCallback(() => {
    const nextIdx = exampleIndex + 1;
    if (nextIdx < examples.length) {
      setExampleIndex(nextIdx);
      setCurrentExample(examples[nextIdx]);
    } else {
      setPhase("exercise");
      exerciseStartTimeRef.current = performance.now();
    }
  }, [exampleIndex, examples]);

  // ---------------------------------------------------------------
  // Retry handler — returns to exercise phase with same exercise
  // ---------------------------------------------------------------

  /**
   * Retry the current exercise. Resets evaluation, feedback, and answer
   * draft, then transitions back to the exercise phase with the same
   * currentExercise. The attemptIndex counter is NOT incremented here —
   * it increments in handleAnswerSubmit when the student submits again.
   */
  const handleRetryExercise = useCallback(() => {
    setEvaluation(null);
    setFeedbackMsg("");
    setCurrentAnswerDraft({ answer: "", selectedOption: null });
    setPhase("exercise");
    // Reset the timer for the new attempt
    exerciseStartTimeRef.current = performance.now();
  }, []);

  return {
    phase,
    selectedSkillId,
    currentExercise,
    exerciseIndex,
    exercises,
    evaluation,
    feedbackMsg,
    isEvaluating,
    theoryNode,
    currentExample,
    examples,
    exampleIndex,
    feedbackMappings,
    accessibleSkills,
    blockedSkill,
    previousSnapshot,
    isViewingPreviousExercise,
    currentAnswerDraft,
    setCurrentAnswerDraft,
    attemptIndexByExerciseId,
    profileBlocked,
    resetProfileBlocked: () => setProfileBlocked(false),
    resetToSelect,
    handleSkillSelect,
    handleNextPhase,
    handleAnswerSubmit,
    handleNextExample,
    handleRetryExercise,
    handleContinueAfterFeedback,
    handleContinueAfterRecovery,
    viewPreviousExercise,
    returnToCurrentExercise,
  };
}
