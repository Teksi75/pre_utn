"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { DiagnosticQuestion } from "@/components/diagnostic/DiagnosticQuestion";
import { DiagnosticProgress } from "@/components/diagnostic/DiagnosticProgress";
import { ResultsDisplay } from "@/components/diagnostic/ResultsDisplay";
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
import { StudentGate } from "@/components/StudentGate";
import { useActiveStudent } from "@/hooks/useActiveStudent";

type DiagnosticPhase = "loading" | "question" | "results" | "error";

export default function DiagnosticPage() {
  const { student, createAndActivate } = useActiveStudent();
  const [phase, setPhase] = useState<DiagnosticPhase>("loading");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [estimates, setEstimates] = useState<SkillEstimate[]>([]);
  const [suggestions, setSuggestions] = useState<PracticeSuggestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [profileBlocked, setProfileBlocked] = useState(false);

  // Load catalog and select balanced set on mount
  useEffect(() => {
    if (student === null) return;

    setProfileBlocked(false);
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
  }, [student]);

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      if (student === null) {
        setProfileBlocked(true);
        return;
      }

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
        const saveResult = saveDiagnosticResult(result);
        if (!saveResult.ok && saveResult.reason === "missing-active-profile") {
          setProfileBlocked(true);
        }
      }
    },
    [exercises, currentIndex, attempts, student]
  );

  const handleRestart = useCallback(() => {
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
  }, []);

  const handleCreatePlan = useCallback((): boolean => {
    if (student === null) {
      setProfileBlocked(true);
      return false;
    }

    const result: DiagnosticResult = {
      completedAt: new Date().toISOString(),
      estimates,
      suggestions,
      version: 1,
    };
    const progress = loadProgress();
    const plan = createStudyPlan(result, progress);
    if (!plan) return false;
    const saveResult = saveStudyPlan(plan);
    if (!saveResult.ok && saveResult.reason === "missing-active-profile") {
      setProfileBlocked(true);
      return false;
    }
    return true;
  }, [estimates, suggestions, student]);

  // Gate: require active profile to take diagnostic
  if (student === null || profileBlocked) {
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

      <section className="rounded-[var(--radius-card)] p-4 md:p-6">
        <DiagnosticProgress
          currentIndex={currentIndex}
          total={exercises.length}
        />

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
      </section>
    </div>
  );
}
