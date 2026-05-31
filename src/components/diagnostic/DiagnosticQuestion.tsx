"use client";

import { useState } from "react";
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
      <div className="text-xs text-gray-500">
        Pregunta {questionNumber} de {totalQuestions}
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="text-xs text-gray-500 mb-2">
          {exercise.type} • Dificultad {exercise.difficulty}
        </div>
        <p className="text-lg text-gray-900">{exercise.prompt}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="diagnostic-answer"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tu respuesta
          </label>
          <input
            id="diagnostic-answer"
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Escribí tu respuesta..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !answer.trim()}
          className="w-full bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {disabled ? "Evaluando..." : "Enviar respuesta"}
        </button>
      </form>
    </div>
  );
}
