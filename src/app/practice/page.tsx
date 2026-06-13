"use client";

import { useEffect } from "react";
import { ViewTransition } from "react";
import { PracticeSelectPhase } from "@/components/practice/PracticeSelectPhase";
import { PracticeTheoryPhase } from "@/components/practice/PracticeTheoryPhase";
import { PracticeExamplePhase } from "@/components/practice/PracticeExamplePhase";
import { PracticeExercisePhase } from "@/components/practice/PracticeExercisePhase";
import { PracticeFeedbackPhase } from "@/components/practice/PracticeFeedbackPhase";
import { PracticeRecoveryPhase } from "@/components/practice/PracticeRecoveryPhase";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { usePracticeFlow, canRetryExercise } from "./usePracticeFlow";
import { skillLabel } from "@/lib/skill-label";
import type { SkillId } from "@/domain/models/skill";
import { StudentGate } from "@/components/StudentGate";
import { useActiveStudent } from "@/hooks/useActiveStudent";

const TOTAL_PHASES = 4;

export default function PracticePage() {
  const flow = usePracticeFlow();
  const { student, createAndActivate } = useActiveStudent();
  const { profileBlocked, resetProfileBlocked } = flow;

  // Auto-unblock when a profile becomes active
  useEffect(() => {
    if (student !== null && profileBlocked) {
      resetProfileBlocked();
    }
  }, [student, profileBlocked, resetProfileBlocked]);

  // Gate: no active profile OR attempt was blocked → show identification card
  if (flow.profileBlocked || student === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-[var(--text-2xl)] font-bold text-brand-900 mb-6">
          Práctica
        </h1>
        <div className="flex items-center justify-center min-h-[50vh]">
          <StudentGate
            onSubmitProfile={(name) => {
              createAndActivate(name);
            }}
            externalError={null}
          />
        </div>
      </div>
    );
  }

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
            skillId={flow.selectedSkillId ?? undefined}
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
            skillId={flow.selectedSkillId ?? undefined}
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
            skillId={flow.selectedSkillId ?? undefined}
            exerciseIndex={flow.exerciseIndex}
            totalExercises={flow.exercises.length}
            isEvaluating={flow.isEvaluating}
            onSubmit={flow.handleAnswerSubmit}
            onBack={flow.resetToSelect}
            previousSnapshot={flow.previousSnapshot}
            isViewingPreviousExercise={flow.isViewingPreviousExercise}
            onViewPrevious={flow.viewPreviousExercise}
            onReturnToCurrent={flow.returnToCurrentExercise}
            draftAnswer={flow.currentAnswerDraft.answer}
            draftSelectedOption={flow.currentAnswerDraft.selectedOption}
            onDraftChange={(answer, selectedOption) =>
              flow.setCurrentAnswerDraft({ answer, selectedOption })
            }
          />
        </ViewTransition>
      )}

      {flow.phase === "feedback" && flow.currentExercise && flow.evaluation && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeFeedbackPhase
            exercise={flow.currentExercise}
            skillId={flow.selectedSkillId ?? undefined}
            evaluation={flow.evaluation}
            feedback={flow.feedbackMsg}
            hasErrorTag={Boolean(flow.evaluation.errorTag)}
            hasNextExercise={flow.exerciseIndex + 1 < flow.exercises.length}
            onContinue={flow.handleContinueAfterFeedback}
            onBack={flow.resetToSelect}
            previousSnapshot={flow.previousSnapshot}
            isViewingPreviousExercise={flow.isViewingPreviousExercise}
            onViewPrevious={flow.viewPreviousExercise}
            onReturnToCurrent={flow.returnToCurrentExercise}
            onRetry={flow.handleRetryExercise}
            attemptIndex={
              flow.currentExercise
                ? (flow.attemptIndexByExerciseId.get(
                    flow.currentExercise.id,
                  ) ?? 1)
                : 1
            }
            canRetry={
              flow.currentExercise
                ? canRetryExercise(
                    flow.attemptIndexByExerciseId.get(
                      flow.currentExercise.id,
                    ) ?? 1,
                  )
                : true
            }
          />
        </ViewTransition>
      )}

      {flow.phase === "recovery" && flow.evaluation && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeRecoveryPhase
            errorTag={flow.evaluation.errorTag}
            skillId={flow.selectedSkillId ?? undefined}
            feedback={flow.feedbackMsg}
            feedbackMappings={flow.feedbackMappings}
            hasNextExercise={flow.exerciseIndex + 1 < flow.exercises.length}
            onContinue={flow.handleContinueAfterRecovery}
            onBack={flow.resetToSelect}
          />
        </ViewTransition>
      )}

      {flow.phase === "complete" && (
        <ViewTransition enter="slide-up" exit="slide-down" default="none">
          <PracticeCompletePhase
            skillId={flow.selectedSkillId ?? undefined}
            totalExercises={flow.exercises.length}
            onBackToSelector={flow.resetToSelect}
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

interface PracticeCompletePhaseProps {
  readonly skillId: string | undefined;
  readonly totalExercises: number;
  readonly onBackToSelector: () => void;
}

/**
 * Completion screen shown when the student finishes all exercises.
 * Provides clear next steps: review, practice another skill, or go home.
 */
function PracticeCompletePhase({
  skillId,
  totalExercises,
  onBackToSelector,
}: PracticeCompletePhaseProps) {
  const skillName = skillId ? skillLabel(skillId as SkillId) : "esta habilidad";

  return (
    <div className="space-y-6 text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-2">
        <h2 className="text-[var(--text-xl)] font-bold text-brand-900">
          ¡Completaste la práctica!
        </h2>
        <p className="text-sm text-brand-600">
          Resolviste los {totalExercises} ejercicios de <strong>{skillName}</strong>.
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50 p-4 text-left space-y-3">
        <p className="text-sm font-semibold text-brand-800">¿Qué podés hacer ahora?</p>
        <ul className="text-sm text-brand-700 space-y-2">
          <li>• <strong>Repasar la teoría</strong> si sentiste que algo no quedó claro</li>
          <li>• <strong>Practicar otra habilidad</strong> para seguir avanzando</li>
          <li>• <strong>Volver al inicio</strong> y revisar tu progreso general</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button variant="primary" onClick={onBackToSelector} className="w-full">
          Elegir otra habilidad
        </Button>
        <a
          href="/"
          className="min-h-[44px] inline-flex items-center justify-center rounded-[var(--radius-button)] border border-brand-300 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:border-brand-400 hover:bg-brand-50 focus-visible:shadow-[var(--ring-focus)]"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
