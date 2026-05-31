"use client";

import { useState, useRef, useEffect } from "react";
import type { Exercise } from "@/domain/models/exercise";

interface DiagnosticQuestionProps {
  readonly exercise: Exercise;
  readonly questionNumber: number;
  readonly totalQuestions: number;
  readonly onSubmit: (answer: string) => void;
  readonly disabled: boolean;
}

/**
 * Shows exercise prompt + answer input for diagnostic.
 * Pattern mirrors practice AnswerForm but includes question counter.
 */
export function DiagnosticQuestion({
  exercise,
  questionNumber,
  totalQuestions,
  onSubmit,
  disabled,
}: DiagnosticQuestionProps) {
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, questionNumber]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = answer.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setAnswer("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
        Pregunta {questionNumber} de {totalQuestions}
      </div>

      <div className="shadow-[var(--shadow-card)] rounded-[var(--radius-card)] p-5 bg-white border border-brand-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block text-xs font-medium text-brand-600 bg-brand-100 px-2.5 py-1 rounded-[var(--radius-badge)]">
            {exercise.type}
          </span>
          <span className="inline-block text-xs font-medium text-accent-600 bg-amber-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
            Dificultad {exercise.difficulty}
          </span>
        </div>
        <p className="text-[var(--text-lg)] text-brand-900 leading-[var(--leading-relaxed)]">
          {exercise.prompt}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="diagnostic-answer"
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Tu respuesta
          </label>
          <input
            ref={inputRef}
            id="diagnostic-answer"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Escribí tu respuesta..."
            className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white text-brand-900 min-h-[44px] disabled:bg-brand-100 disabled:text-brand-500 focus-visible:shadow-[var(--ring-focus)] transition-colors duration-[var(--duration-fast)]"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !answer.trim()}
          className="w-full bg-brand-900 text-white px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-800 disabled:bg-brand-400 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
        >
          {disabled ? "Evaluando..." : "Enviar respuesta"}
        </button>
      </form>
    </div>
  );
}
