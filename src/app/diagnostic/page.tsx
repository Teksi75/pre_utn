"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { DiagnosticQuestion } from "@/components/diagnostic/DiagnosticQuestion";
import { ResultsDisplay } from "@/components/diagnostic/ResultsDisplay";
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Diagnóstico</h1>
        <div className="text-center py-8 text-gray-500">
          Preparando diagnóstico...
        </div>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Diagnóstico</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          {errorMessage}
        </div>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Volver al inicio
          </Link>
        </div>
      </main>
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <ResultsDisplay estimates={estimates} suggestions={suggestions} onRestart={handleRestart} />
      </main>
    );
  }

  // phase === "question"
  const currentExercise = exercises[currentIndex];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Diagnóstico</h1>
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Inicio
        </Link>
      </div>

      {currentExercise ? (
        <DiagnosticQuestion
          exercise={currentExercise}
          questionNumber={currentIndex + 1}
          totalQuestions={exercises.length}
          onSubmit={handleAnswerSubmit}
          disabled={isEvaluating}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay ejercicios disponibles.
        </div>
      )}
    </main>
  );
}
