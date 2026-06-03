"use client";

import { ViewTransition } from "react";
import { PracticeSelectPhase } from "@/components/practice/PracticeSelectPhase";
import { PracticeTheoryPhase } from "@/components/practice/PracticeTheoryPhase";
import { PracticeExamplePhase } from "@/components/practice/PracticeExamplePhase";
import { PracticeExercisePhase } from "@/components/practice/PracticeExercisePhase";
import { PracticeFeedbackPhase } from "@/components/practice/PracticeFeedbackPhase";
import { PracticeRecoveryPhase } from "@/components/practice/PracticeRecoveryPhase";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { usePracticeFlow } from "./usePracticeFlow";
import { skillLabel } from "@/lib/skill-label";
import type { SkillId } from "@/domain/models/skill";

const TOTAL_PHASES = 4;

export default function PracticePage() {
  const flow = usePracticeFlow();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-[var(--text-2xl)] font-bold text-brand-900 mb-6">
        Práctica
      </h1>

      {flow.phase === "select" && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <div className="space-y-4">
            {flow.blockedSkill && (
              <BlockedSkillBanner
                skillId={flow.blockedSkill.skillId}
                reason={flow.blockedSkill.reason}
                missingPrerequisite={flow.blockedSkill.missingPrerequisite}
                onDismiss={flow.resetToSelect}
              />
            )}
            <PracticeSelectPhase
              selectedFocus={flow.selectedSkillId}
              onSelectFocus={flow.handleSkillSelect}
              accessibleSkills={flow.accessibleSkills}
            />
          </div>
        </ViewTransition>
      )}

      {flow.phase === "theory" && flow.theoryNode && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeTheoryPhase
            theoryNode={flow.theoryNode}
            onNext={flow.handleNextPhase}
            onBack={flow.resetToSelect}
            step={1}
            total={TOTAL_PHASES}
          />
        </ViewTransition>
      )}

      {flow.phase === "theory" && !flow.theoryNode && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
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
        </ViewTransition>
      )}

      {flow.phase === "example" && flow.currentExample && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeExamplePhase
            example={flow.currentExample}
            hasNextExample={flow.exampleIndex < flow.examples.length - 1}
            onNextExample={flow.handleNextExample}
            onBack={flow.resetToSelect}
            step={2}
            total={TOTAL_PHASES}
          />
        </ViewTransition>
      )}

      {flow.phase === "example" && !flow.currentExample && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
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
        </ViewTransition>
      )}

      {flow.phase === "exercise" && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeExercisePhase
            exercise={flow.currentExercise}
            exerciseIndex={flow.exerciseIndex}
            totalExercises={flow.exercises.length}
            isEvaluating={flow.isEvaluating}
            onSubmit={flow.handleAnswerSubmit}
            onBack={flow.resetToSelect}
          />
        </ViewTransition>
      )}

      {flow.phase === "feedback" && flow.currentExercise && flow.evaluation && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeFeedbackPhase
            exercise={flow.currentExercise}
            evaluation={flow.evaluation}
            feedback={flow.feedbackMsg}
            hasErrorTag={Boolean(flow.evaluation.errorTag)}
            hasNextExercise={flow.exerciseIndex + 1 < flow.exercises.length}
            onContinue={flow.handleContinueAfterFeedback}
            onBack={flow.resetToSelect}
          />
        </ViewTransition>
      )}

      {flow.phase === "recovery" && flow.evaluation && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeRecoveryPhase
            errorTag={flow.evaluation.errorTag}
            feedback={flow.feedbackMsg}
            feedbackMappings={flow.feedbackMappings}
            hasNextExercise={flow.exerciseIndex + 1 < flow.exercises.length}
            onContinue={flow.handleContinueAfterRecovery}
            onBack={flow.resetToSelect}
          />
        </ViewTransition>
      )}
    </div>
  );
}

interface BlockedSkillBannerProps {
  readonly skillId: string;
  readonly reason: "unknown-skill" | "no-content" | "missing-prerequisite";
  readonly missingPrerequisite?: SkillId;
  readonly onDismiss: () => void;
}

/**
 * Banner shown above the FocusSelector when a `?skill=...` URL
 * parameter targeted a skill the student cannot practice yet.
 * Surfaces WHY the skill is blocked and offers a clear way back
 * to the selector (no silent no-op, no empty state).
 */
function BlockedSkillBanner({
  skillId,
  reason,
  missingPrerequisite,
  onDismiss,
}: BlockedSkillBannerProps) {
  let message: string;
  switch (reason) {
    case "missing-prerequisite":
      message = `Para practicar ${skillLabel(skillId as SkillId)}, primero necesitás dominar ${
        missingPrerequisite ? skillLabel(missingPrerequisite) : "los prerrequisitos"
      }.`;
      break;
    case "no-content":
      message = `${skillLabel(skillId as SkillId)} aún no está disponible para práctica guiada.`;
      break;
    case "unknown-skill":
    default:
      message = `La habilidad "${skillId}" no existe o no forma parte del curso.`;
      break;
  }

  return (
    <div
      role="status"
      className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-[var(--shadow-card)]"
    >
      <p className="font-semibold mb-1">Esta habilidad todavía no se puede practicar</p>
      <p className="mb-3">{message}</p>
      {reason === "missing-prerequisite" && missingPrerequisite && (
        <p className="text-xs text-amber-800">
          Practicá {skillLabel(missingPrerequisite)} desde la lista de abajo para desbloquearla.
        </p>
      )}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-3 text-xs font-semibold text-amber-900 underline hover:no-underline min-h-[44px] inline-flex items-center"
      >
        Entendido, volver al selector
      </button>
    </div>
  );
}
