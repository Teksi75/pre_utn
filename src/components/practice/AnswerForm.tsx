"use client";

import { useState } from "react";

interface AnswerFormProps {
  readonly onSubmit: (answer: string) => void;
  readonly disabled: boolean;
}

export function AnswerForm({ onSubmit, disabled }: AnswerFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="answer-input"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tu respuesta
        </label>
        <input
          id="answer-input"
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
  );
}
