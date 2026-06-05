"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { DiagnosticQuestion } from "@/components/diagnostic/DiagnosticQuestion";
import { ResultsDisplay } from "@/components/diagnostic/ResultsDisplay";
import { MathThemePlate } from "@/components/math-visuals/MathThemePlate";
import { mathThemeForSkill } from "@/components/math-visuals/topic-map";
import { Card } from "@/components/ui/Card";
import {
  selectBalancedSet,
  estimateSkills,
  suggestPractice,
  createStudyPlan,
} from "@/domain/diagnostic/index";
import { loadCatalog } from "@/domain/catalog/index";
import { evaluateAnswer } from "@/domain/evaluator/index";
import {
  saveDiagnosticResult,
  saveStudyPlan,
} from "@/lib/diagnostic-storage";
import { loadProgress } from "@/lib/practice-progress";
import type { Exercise } from "@/domain/models/exercise";
import type {
  Attempt,
  SkillEstimate,
  PracticeSuggestion,
  DiagnosticResult,
} from "@/domain/diagnostic/index";

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

        // Persist the diagnostic snapshot so the home page can build a
        // study plan from it on the next visit.
        const result: DiagnosticResult = {
          completedAt: new Date().toISOString(),
          estimates: est,
          suggestions: sug,
          version: 1,
        };
        saveDiagnosticResult(result);
      }
    },
    [exercises, currentIndex, attempts]
  );

  if (phase === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-brand-900)]">
            Diagnóstico
          </h1>
        </div>
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-3 border-[var(--color-brand-300)] border-t-[var(--color-brand-700)] rounded-full animate-spin mb-4" />
          <p className="text-[var(--color-brand-500)] text-sm">
            Preparando diagnóstico...
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-brand-900)]">
            Diagnóstico
          </h1>
          <Link
            href="/"
            className="text-sm text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-[var(--color-brand-100)] transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Volver al inicio
          </Link>
        </div>
        <div role="alert">
          <Card variant="accent" className="p-4 text-sm text-amber-800">
            {errorMessage}
          </Card>
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

    const handleCreatePlan = (): boolean => {
      const result: DiagnosticResult = {
        completedAt: new Date().toISOString(),
        estimates,
        suggestions,
        version: 1,
      };
      const progress = loadProgress();
      const plan = createStudyPlan(result, progress);
      if (!plan) return false;
      saveStudyPlan(plan);
      return true;
    };

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-brand-900)]">
            Diagnóstico
          </h1>
          <Link
            href="/"
            className="text-sm text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-[var(--color-brand-100)] transition-colors focus-visible:shadow-[var(--ring-focus)]"
          >
            ← Inicio
          </Link>
        </div>
        <ResultsDisplay
          estimates={estimates}
          suggestions={suggestions}
          onRestart={handleRestart}
          onCreatePlan={handleCreatePlan}
        />
      </div>
    );
  }

  // phase === "question"
  const currentExercise = exercises[currentIndex];
  const progressPercent = exercises.length > 0
    ? Math.round(((currentIndex) / exercises.length) * 100)
    : 0;
  const themeTopic = currentExercise
    ? mathThemeForSkill(currentExercise.skillId)
    : "sets";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[var(--text-2xl)] font-bold text-[var(--color-brand-900)]">
          Diagnóstico
        </h1>
        <Link
          href="/"
          className="text-sm text-[var(--color-brand-700)] hover:text-[var(--color-brand-900)] font-medium min-h-[44px] inline-flex items-center px-3 py-2 rounded-[var(--radius-button)] hover:bg-[var(--color-brand-100)] transition-colors focus-visible:shadow-[var(--ring-focus)]"
        >
          ← Inicio
        </Link>
      </div>

      <section className="relative isolate overflow-hidden rounded-[var(--radius-card)] p-4 md:p-6">
        <MathThemePlate
          topic={themeTopic}
          variant="hero"
          opacity={0.2}
          className="absolute -inset-x-24 -top-28 z-0 h-[42rem] w-[calc(100%+12rem)] max-w-none"
        />

        <div className="relative z-10">
          {/* Fine progress bar */}
          <div className="mb-6" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso: ${currentIndex + 1} de ${exercises.length}`}>
            <div className="flex items-center justify-between text-xs text-[var(--color-brand-500)] mb-1.5">
              <span>Pregunta {currentIndex + 1} de {exercises.length}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-brand-200)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-accent-500)] transition-[width] duration-[var(--duration-normal)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
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
              <div className="text-center py-8 text-[var(--color-brand-500)]">
                No hay ejercicios disponibles.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
