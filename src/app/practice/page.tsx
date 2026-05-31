"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FocusSelector } from "@/components/practice/FocusSelector";
import { ExerciseCard } from "@/components/practice/ExerciseCard";
import { AnswerForm } from "@/components/practice/AnswerForm";
import { FeedbackDisplay } from "@/components/practice/FeedbackDisplay";
import { queryBySkill } from "@/domain/catalog/index";
import { evaluateAnswer } from "@/domain/evaluator/index";
import type { SkillId } from "@/domain/models/skill";
import type { Exercise } from "@/domain/models/exercise";
import type { EvaluationResult } from "@/domain/evaluator/index";

type PracticePhase = "select" | "exercise" | "feedback";

export default function PracticePage() {
  const [phase, setPhase] = useState<PracticePhase>("select");
  const [selectedSkillId, setSelectedSkillId] = useState<SkillId | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const evaluateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setExerciseIndex(0);
    setExercises([]);
  }, []);

  const handleSkillSelect = useCallback((skillId: SkillId) => {
    setSelectedSkillId(skillId);
    const skillExercises = queryBySkill(skillId);
    setExercises(skillExercises);
    setExerciseIndex(0);
    setCurrentExercise(skillExercises[0] ?? null);
    setPhase("exercise");
  }, []);

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
        setIsEvaluating(false);
        setPhase("feedback");
      }, 300);
    },
    [currentExercise]
  );

  const handleNextExercise = useCallback(() => {
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < exercises.length) {
      setExerciseIndex(nextIndex);
      setCurrentExercise(exercises[nextIndex]);
      setEvaluation(null);
      setPhase("exercise");
    } else {
      resetToSelect();
    }
  }, [exerciseIndex, exercises, resetToSelect]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Práctica</h1>

      {phase === "select" && (
        <FocusSelector
          onSkillSelect={handleSkillSelect}
          selectedSkillId={selectedSkillId ?? undefined}
        />
      )}

      {phase === "exercise" && (
        <div className="space-y-4">
          <button
            onClick={resetToSelect}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Volver a selección
          </button>

          {currentExercise ? (
            <>
              <div className="text-xs text-gray-500">
                Ejercicio {exerciseIndex + 1} de {exercises.length}
              </div>
              <ExerciseCard exercise={currentExercise} />
              <AnswerForm
                onSubmit={handleAnswerSubmit}
                disabled={isEvaluating}
              />
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay ejercicios disponibles para esta habilidad.
            </div>
          )}
        </div>
      )}

      {phase === "feedback" && currentExercise && evaluation && (
        <div className="space-y-4">
          <button
            onClick={resetToSelect}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Volver a selección
          </button>

          <ExerciseCard exercise={currentExercise} />

          <FeedbackDisplay
            correct={evaluation.correct}
            errorTag={evaluation.errorTag}
            feedback={evaluation.feedback}
          />

          <button
            onClick={handleNextExercise}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
          >
            {exerciseIndex + 1 < exercises.length
              ? "Siguiente ejercicio"
              : "Volver a selección"}
          </button>
        </div>
      )}
    </main>
  );
}
