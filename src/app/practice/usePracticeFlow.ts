"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { queryBySkill } from "@/domain/catalog/index";
import {
  loadTheoryContent,
  loadExampleContent,
  loadFeedbackContent,
} from "@/domain/catalog/content-loaders";
import { evaluateAnswer } from "@/domain/evaluator/index";
import { generateFeedback, type FeedbackMapping } from "@/domain/feedback/index";
import { addAttempt } from "@/lib/practice-progress";
import { nextPhase, type PracticePhase } from "./phases";
import {
  PRACTICE_SKILL_UNIT_MAP,
  resolveInitialPracticeSkill,
} from "./start-skill";
import type { SkillId } from "@/domain/models/skill";
import type { Exercise } from "@/domain/models/exercise";
import type { TheoryNode } from "@/domain/models/theory";
import type { WorkedExample } from "@/domain/models/worked-example";
import type { EvaluationResult } from "@/domain/evaluator/index";

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
  const evaluateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSkillConsumedRef = useRef(false);

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
  }, []);

  const handleSkillSelect = useCallback((skillId: SkillId) => {
    setSelectedSkillId(skillId);
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

    const requestedSkill = new URLSearchParams(window.location.search).get("skill");
    const initialSkill = resolveInitialPracticeSkill(requestedSkill);
    if (!initialSkill) return;

    initialSkillConsumedRef.current = true;
    handleSkillSelect(initialSkill);
  }, [handleSkillSelect, selectedSkillId]);

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

        // Persist attempt
        if (selectedSkillId) {
          addAttempt({
            exerciseId: currentExercise.id,
            skillId: selectedSkillId,
            correct: result.correct,
            errorTag: result.errorTag,
            answeredAt: new Date().toISOString(),
            difficulty: currentExercise.difficulty,
          });
        }

        setIsEvaluating(false);
        setPhase("feedback");
      }, 300);
    },
    [currentExercise, feedbackMappings, selectedSkillId]
  );

  const handleNextExercise = useCallback(() => {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < exercises.length) {
      setExerciseIndex(nextIndex);
      setCurrentExercise(exercises[nextIndex]);
      setEvaluation(null);
      setFeedbackMsg("");
      setPhase("exercise");
    } else {
      resetToSelect();
    }
  }, [exerciseIndex, exercises, resetToSelect]);

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
    }
  }, [exampleIndex, examples]);

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
    resetToSelect,
    handleSkillSelect,
    handleNextPhase,
    handleAnswerSubmit,
    handleNextExample,
    handleContinueAfterFeedback,
    handleContinueAfterRecovery,
  };
}
