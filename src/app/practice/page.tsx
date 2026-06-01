"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FocusSelector } from "@/components/practice/FocusSelector";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { AnswerForm } from "@/components/practice/AnswerForm";
import { FeedbackDisplay } from "@/components/practice/FeedbackDisplay";
import { TheoryCard } from "@/components/practice/TheoryCard";
import { WorkedExampleCard } from "@/components/practice/WorkedExampleCard";
import { queryBySkill } from "@/domain/catalog/index";
import { loadTheoryContent, loadExampleContent, loadFeedbackContent } from "@/domain/catalog/content-loaders";
import { evaluateAnswer } from "@/domain/evaluator/index";
import { generateFeedback, type FeedbackMapping } from "@/domain/feedback/index";
import { addAttempt } from "@/lib/practice-progress";
import { nextPhase, type PracticePhase } from "./phases";
import { PRACTICE_SKILL_UNIT_MAP, resolveInitialPracticeSkill } from "./start-skill";
import type { SkillId } from "@/domain/models/skill";
import type { Exercise } from "@/domain/models/exercise";
import type { TheoryNode } from "@/domain/models/theory";
import type { WorkedExample } from "@/domain/models/worked-example";
import type { EvaluationResult } from "@/domain/evaluator/index";

export default function PracticePage() {
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
  const [feedbackMappings, setFeedbackMappings] = useState<readonly FeedbackMapping[]>([]);
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

  const handleNextExample = useCallback(() => {
    const nextIdx = exampleIndex + 1;
    if (nextIdx < examples.length) {
      setExampleIndex(nextIdx);
      setCurrentExample(examples[nextIdx]);
    } else {
      setPhase("exercise");
    }
  }, [exampleIndex, examples]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-[var(--text-2xl)] font-bold text-brand-900 mb-6">
        Práctica
      </h1>

      {/* ─── Select Phase ─── */}
      {phase === "select" && (
        <FocusSelector
          onSkillSelect={handleSkillSelect}
          selectedSkillId={selectedSkillId ?? undefined}
        />
      )}

      {/* ─── Theory Phase ─── */}
      {phase === "theory" && theoryNode && (
        <div className="space-y-4" aria-live="polite" aria-atomic="false">
          <button
            onClick={resetToSelect}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a selección
          </button>

          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
            Paso 1 de 4 — Teoría
          </div>

          <TheoryCard node={theoryNode} />

          <button
            onClick={handleNextPhase}
            className="w-full bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            Ver ejemplo resuelto →
          </button>
        </div>
      )}

      {phase === "theory" && !theoryNode && (
        <div className="space-y-4">
          <button
            onClick={resetToSelect}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a selección
          </button>
          <div className="text-center py-8 text-brand-500">
            No hay teoría disponible para esta habilidad.
          </div>
          <button
            onClick={handleNextPhase}
            className="w-full bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            Continuar al ejemplo →
          </button>
        </div>
      )}

      {/* ─── Example Phase ─── */}
      {phase === "example" && currentExample && (
        <div className="space-y-4" aria-live="polite" aria-atomic="false">
          <button
            onClick={resetToSelect}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a selección
          </button>

          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
            Paso 2 de 4 — Ejemplo resuelto
          </div>

          <WorkedExampleCard example={currentExample} />

          <button
            onClick={handleNextExample}
            className="w-full bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            {exampleIndex < (examples.length - 1)
              ? "Ver siguiente ejemplo →"
              : "Ir a ejercicios →"}
          </button>
        </div>
      )}

      {phase === "example" && !currentExample && (
        <div className="space-y-4">
          <button
            onClick={resetToSelect}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a selección
          </button>
          <div className="text-center py-8 text-brand-500">
            No hay ejemplos disponibles para esta habilidad.
          </div>
          <button
            onClick={handleNextPhase}
            className="w-full bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            Ir a ejercicios →
          </button>
        </div>
      )}

      {/* ─── Exercise Phase ─── */}
      {phase === "exercise" && (
        <div className="space-y-4" aria-live="polite" aria-atomic="false">
          <button
            onClick={resetToSelect}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a selección
          </button>

          {currentExercise ? (
            <>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
                Ejercicio {exerciseIndex + 1} de {exercises.length}
              </div>
              <ExerciseCard exercise={currentExercise} />
              <AnswerForm
                onSubmit={handleAnswerSubmit}
                disabled={isEvaluating}
                exercise={currentExercise}
              />
            </>
          ) : (
            <div className="text-center py-8 text-brand-500">
              No hay ejercicios disponibles para esta habilidad.
            </div>
          )}
        </div>
      )}

      {/* ─── Feedback Phase ─── */}
      {phase === "feedback" && currentExercise && evaluation && (
        <div className="space-y-4" aria-live="polite" aria-atomic="false">
          <button
            onClick={resetToSelect}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a selección
          </button>

          <ExerciseCard exercise={currentExercise} />

          <FeedbackDisplay
            correct={evaluation.correct}
            errorTag={evaluation.errorTag}
            feedback={feedbackMsg}
          />

          <button
            onClick={handleNextPhase}
            className="w-full bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            {evaluation.errorTag
              ? "Ver guía de recuperación →"
              : exerciseIndex + 1 < exercises.length
                ? "Siguiente ejercicio"
                : "Volver a selección"}
          </button>
        </div>
      )}

      {/* ─── Recovery Phase ─── */}
      {phase === "recovery" && evaluation && (
        <div className="space-y-4" aria-live="polite" aria-atomic="false">
          <button
            onClick={resetToSelect}
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver a selección
          </button>

          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
            Guía de recuperación
          </div>

          <div className="rounded-[var(--radius-card)] p-4 bg-amber-50 border border-amber-200">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Revisá el material antes de continuar
            </p>
            <p className="text-sm text-amber-700 leading-[var(--leading-relaxed)]">
              Tu respuesta tiene un error detectado. Te recomendamos revisar la
              teoría y el ejemplo resuelto antes de intentar otro ejercicio.
            </p>
          </div>

          <FeedbackDisplay
            correct={false}
            errorTag={evaluation.errorTag}
            feedback={feedbackMsg}
          />

          {/* Show recovery target if available */}
          {(() => {
            const mapping = feedbackMappings.find(
              (m) => m.errorTag === evaluation.errorTag
            );
            if (!mapping?.recoveryTarget) return null;

            return (
              <div className="rounded-[var(--radius-card)] p-4 bg-white border border-brand-200">
                <p className="text-xs font-medium text-brand-500 mb-1">
                  Revisá este contenido:
                </p>
                <p className="text-sm text-brand-700 font-medium">
                  {mapping.recoveryTarget}
                </p>
              </div>
            );
          })()}

          <button
            onClick={handleNextPhase}
            className="w-full bg-brand-100 text-brand-700 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-200 min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
          >
            {exerciseIndex + 1 < exercises.length
              ? "Intentar otro ejercicio"
              : "Volver a selección"}
          </button>
        </div>
      )}
    </div>
  );
}
