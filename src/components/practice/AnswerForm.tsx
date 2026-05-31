"use client";

import { useState, useRef, useEffect } from "react";

interface AnswerFormProps {
  readonly onSubmit: (answer: string) => void;
  readonly disabled: boolean;
  readonly autoFocus?: boolean;
}

export function AnswerForm({ onSubmit, disabled, autoFocus = true }: AnswerFormProps) {
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled]);

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
          className="block text-sm font-semibold text-brand-700 mb-1"
        >
          Tu respuesta
        </label>
        <input
          ref={inputRef}
          id="answer-input"
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
  );
}
