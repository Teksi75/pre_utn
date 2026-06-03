"use client";

import { PracticeSelectPhase } from "@/components/practice/PracticeSelectPhase";
import { PracticeTheoryPhase } from "@/components/practice/PracticeTheoryPhase";
import { PracticeExamplePhase } from "@/components/practice/PracticeExamplePhase";
import { PracticeExercisePhase } from "@/components/practice/PracticeExercisePhase";
import { PracticeFeedbackPhase } from "@/components/practice/PracticeFeedbackPhase";
import { PracticeRecoveryPhase } from "@/components/practice/PracticeRecoveryPhase";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { usePracticeFlow } from "./usePracticeFlow";

const TOTAL_PHASES = 4;

export default function PracticePage() {
  const flow = usePracticeFlow();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-[var(--text-2xl)] font-bold text-brand-900 mb-6">
        Práctica
      </h1>

      {flow.phase === "select" && (
        <PracticeSelectPhase
          selectedFocus={flow.selectedSkillId}
          onSelectFocus={flow.handleSkillSelect}
        />
      )}

      {flow.phase === "theory" && flow.theoryNode && (
        <PracticeTheoryPhase
          theoryNode={flow.theoryNode}
          onNext={flow.handleNextPhase}
          onBack={flow.resetToSelect}
          step={1}
          total={TOTAL_PHASES}
        />
      )}

      {flow.phase === "theory" && !flow.theoryNode && (
        <div className="space-y-4">
          <BackButton onClick={flow.resetToSelect} />
          <div className="text-center py-8 text-brand-500">
            No hay teoría disponible para esta habilidad.
          </div>
          <Button
            variant="secondary"
            onClick={flow.handleNextPhase}
            className="w-full"
          >
            Continuar al ejemplo →
          </Button>
        </div>
      )}

      {flow.phase === "example" && flow.currentExample && (
        <PracticeExamplePhase
          example={flow.currentExample}
          hasNextExample={flow.exampleIndex < flow.examples.length - 1}
          onNextExample={flow.handleNextExample}
          onBack={flow.resetToSelect}
          step={2}
          total={TOTAL_PHASES}
        />
      )}

      {flow.phase === "example" && !flow.currentExample && (
        <div className="space-y-4">
          <BackButton onClick={flow.resetToSelect} />
          <div className="text-center py-8 text-brand-500">
            No hay ejemplos disponibles para esta habilidad.
          </div>
          <Button
            variant="secondary"
            onClick={flow.handleNextPhase}
            className="w-full"
          >
            Ir a ejercicios →
          </Button>
        </div>
      )}

      {flow.phase === "exercise" && (
        <PracticeExercisePhase
          exercise={flow.currentExercise}
          exerciseIndex={flow.exerciseIndex}
          totalExercises={flow.exercises.length}
          isEvaluating={flow.isEvaluating}
          onSubmit={flow.handleAnswerSubmit}
          onBack={flow.resetToSelect}
        />
      )}

      {flow.phase === "feedback" && flow.currentExercise && flow.evaluation && (
        <PracticeFeedbackPhase
          exercise={flow.currentExercise}
          evaluation={flow.evaluation}
          feedback={flow.feedbackMsg}
          hasErrorTag={Boolean(flow.evaluation.errorTag)}
          hasNextExercise={flow.exerciseIndex + 1 < flow.exercises.length}
          onContinue={flow.handleContinueAfterFeedback}
          onBack={flow.resetToSelect}
        />
      )}

      {flow.phase === "recovery" && flow.evaluation && (
        <PracticeRecoveryPhase
          errorTag={flow.evaluation.errorTag}
          feedback={flow.feedbackMsg}
          feedbackMappings={flow.feedbackMappings}
          hasNextExercise={flow.exerciseIndex + 1 < flow.exercises.length}
          onContinue={flow.handleContinueAfterRecovery}
          onBack={flow.resetToSelect}
        />
      )}
    </div>
  );
}
