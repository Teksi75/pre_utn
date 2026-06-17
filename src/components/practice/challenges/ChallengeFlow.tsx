"use client";

import { useState, useCallback } from "react";
import { ChallengeOptInBlock } from "./ChallengeOptInBlock";
import { ChallengeExerciseCard } from "./ChallengeExerciseCard";
import { ChallengeFeedback } from "./ChallengeFeedback";
import { ChallengeDoneSummary } from "./ChallengeDoneSummary";
import { useChallengeFlow } from "./useChallengeFlow";
import { addChallengeAttempt, loadAdvancedProgress, computeAdvancedReadiness } from "@/lib/advanced-practice-progress";
import { evaluateAnswer } from "@/domain/evaluator/index";
import type { SkillId } from "@/domain/models/skill";
import type { ChallengeExercise } from "@/domain/catalog/challenges/types";

interface ChallengeFlowProps {
  /** The challenge exercises to render */
  challenges: readonly ChallengeExercise[];
  /** The skill being practiced */
  skillId: SkillId;
  /** Called when the flow completes (finished or skipped) */
  onDone: () => void;
}

/**
 * Orchestrates the complete challenge mini-flow:
 * opt-in → exercise → feedback → next exercise → done
 *
 * Uses the advanced store (pre-utn.advanced-practice.v1) for persistence.
 * Does NOT call base addAttempt() or modify base practice progress.
 *
 * Renders the appropriate sub-component based on the current flow phase.
 */
export function ChallengeFlow({ challenges, skillId, onDone }: ChallengeFlowProps) {
  const { state, currentChallenge, currentChallengeNumber, totalChallenges, onStart, onSkip, onAnswer, onNext, onBack } =
    useChallengeFlow({
      challenges,
      skillId,
      addChallengeAttempt,
      loadAdvancedProgress,
      computeAdvancedReadiness,
      onDone,
    });

  // Local state for tracking correct answers within this flow session
  const [correctCount, setCorrectCount] = useState(0);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!currentChallenge) return;

      // Evaluate using domain evaluator (handles normalization, tolerance, error tags)
      const evaluation = evaluateAnswer(currentChallenge, answer);

      if (evaluation.correct) {
        setCorrectCount((c) => c + 1);
      }

      onAnswer({
        exerciseId: currentChallenge.id,
        answer,
        correct: evaluation.correct,
        timeMs: 0, // Time tracking not implemented in this PR
      });
    },
    [currentChallenge, onAnswer]
  );

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  const isLastChallenge = currentChallengeNumber === totalChallenges;
  const continueLabel = isLastChallenge ? "Ver resultado" : "Siguiente desafío";

  return (
    <div className="space-y-4">
      {/* Phase: opt-in */}
      {state.phase === "opt-in" && (
        <ChallengeOptInBlock
          challengeCount={totalChallenges}
          onStart={onStart}
          onSkip={onSkip}
        />
      )}

      {/* Phase: exercise */}
      {state.phase === "exercise" && currentChallenge && (
        <ChallengeExerciseCard
          exercise={currentChallenge}
          currentNumber={currentChallengeNumber}
          totalCount={totalChallenges}
          onSubmit={handleAnswer}
        />
      )}

      {/* Phase: feedback */}
      {state.phase === "feedback" && currentChallenge && (
        <>
          <ChallengeFeedback
            exerciseId={currentChallenge.id}
            evaluation={state.lastEvaluation ?? { correct: false }}
            pedagogicalNote={currentChallenge.pedagogicalNote}
            onContinue={handleNext}
            continueLabel={continueLabel}
          />
        </>
      )}

      {/* Phase: done */}
      {state.phase === "done" && (
        <ChallengeDoneSummary
          skillId={skillId}
          challengeCount={totalChallenges}
          correctCount={correctCount}
          advancedReadiness={state.advancedReadiness}
          onBackToSelect={onDone}
        />
      )}
    </div>
  );
}
