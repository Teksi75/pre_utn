"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { DiagnosticQuestion } from "@/components/diagnostic/DiagnosticQuestion";
import { ResultsDisplay } from "@/components/diagnostic/ResultsDisplay";
import { Card } from "@/components/ui/Card";
import {
  selectBalancedSet,
  estimateSkills,
  suggestPractice,
} from "@/domain/diagnostic/index";
import { loadCatalog } from "@/domain/catalog/index";
import { evaluateAnswer } from "@/domain/evaluator/index";
import type { Exercise } from "@/domain/models/exercise";
import type { Attempt, SkillEstimate, PracticeSuggestion } from "@/domain/diagnostic/index";

type DiagnosticPhase = "loading" | "question" | "results" | "error";

export default function DiagnosticPage() {
  const [phase, setPhase] = useState<DiagnosticPhase>("loading");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [estimates, setEstimates] = useState<SkillEstimate[]>([]);
  const [suggestions, setSuggestions] = useState<PracticeSuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Load catalog and select balanced set on mount
  useEffect(() => {
    const catalog = loadCatalog();
    const selection = selectBalancedSet(catalog);

    if (!selection.ok) {
      setErrorMessage(
        `Cobertura insuficiente. Unidades faltantes: ${selection.missingCoverage.join(", ")}`
      );
      setPhase("error");
      return;
    }

    if (selection.exercises.length === 0) {
      setErrorMessage("No hay ejercicios disponibles para el diagnóstico.");
      setPhase("error");
      return;
    }

    setExercises([...selection.exercises]);
    setCurrentIndex(0);
    setPhase("question");
  }, []);

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      const exercise = exercises[currentIndex];
      if (!exercise) return;

      setIsEvaluating(true);
      const result = evaluateAnswer(exercise, answer);

      const attempt: Attempt = {
        exerciseId: exercise.id,
        skillId: exercise.skillId,
        correct: result.correct,
        errorTag: result.errorTag,
      };

      const nextAttempts = [...attempts, attempt];
      setAttempts(nextAttempts);

      const nextIndex = currentIndex + 1;
      if (nextIndex < exercises.length) {
        setCurrentIndex(nextIndex);
        setIsEvaluating(false);
      } else {
        const est = estimateSkills(nextAttempts);
        const sug = suggestPractice(est);
        setEstimates(est);
        setSuggestions(sug);
        setIsEvaluating(false);
        setPhase("results");
      }
    },
    [exercises, currentIndex, attempts]
  );

  if (phase === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-[var(--text-2xl)] font-bold text-brand-900 mb-6">
          Diagnóstico
        </h1>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-3 border-brand-300 border-t-brand-700 rounded-full animate-spin mb-4" />
          <p className="text-brand-500 text-sm">Preparando diagnóstico...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-[var(--text-2xl)] font-bold text-brand-900 mb-6">
          Diagnóstico
        </h1>
        <div role="alert">
          <Card variant="accent" className="p-4 text-sm text-amber-800">
            {errorMessage}
          </Card>
        </div>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const handleRestart = () => {
      setAttempts([]);
      setEstimates([]);
      setSuggestions([]);
      setCurrentIndex(0);
      setIsEvaluating(false);
      const catalog = loadCatalog();
      const selection = selectBalancedSet(catalog);
      if (selection.ok && selection.exercises.length > 0) {
        setExercises([...selection.exercises]);
        setPhase("question");
      } else {
        setPhase("error");
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ResultsDisplay estimates={estimates} suggestions={suggestions} onRestart={handleRestart} />
      </div>
    );
  }

  // phase === "question"
  const currentExercise = exercises[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[var(--text-2xl)] font-bold text-brand-900">
          Diagnóstico
        </h1>
        <Link
          href="/"
          className="text-sm text-brand-700 hover:text-brand-900 font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-brand-100 transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          ← Inicio
        </Link>
      </div>

      <div aria-live="polite" aria-atomic="false">
        {currentExercise ? (
          <DiagnosticQuestion
            exercise={currentExercise}
            questionNumber={currentIndex + 1}
            totalQuestions={exercises.length}
            onSubmit={handleAnswerSubmit}
            disabled={isEvaluating}
          />
        ) : (
          <div className="text-center py-8 text-brand-500">
            No hay ejercicios disponibles.
          </div>
        )}
      </div>
    </div>
  );
}
