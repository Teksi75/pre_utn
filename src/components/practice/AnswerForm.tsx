import { useState, useRef, useEffect } from "react";
import type { Exercise } from "@/domain/models/exercise";

interface AnswerFormProps {
  readonly onSubmit: (answer: string) => void;
  readonly disabled: boolean;
  readonly autoFocus?: boolean;
  readonly exercise?: Exercise | null;
}

export function AnswerForm({ onSubmit, disabled, autoFocus = true, exercise }: AnswerFormProps) {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled && exercise?.type !== "multiple-choice") {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled, exercise?.type]);

  useEffect(() => {
    setAnswer("");
    setSelectedOption(null);
  }, [exercise?.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = exercise?.type === "multiple-choice"
      ? selectedOption?.trim() ?? ""
      : answer.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setAnswer("");
      setSelectedOption(null);
    }
  }

  // Multiple-choice rendering
  if (exercise?.type === "multiple-choice" && exercise.options) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3" data-testid="answer-form-multiple-choice">
        <fieldset disabled={disabled} className="space-y-2">
          <legend className="text-sm font-semibold text-brand-700 mb-2">
            Seleccioná una opción
          </legend>
          {exercise.options.map((option) => {
            const isSelected = selectedOption === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedOption(option)}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-[var(--radius-button)] min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)] border ${
                  isSelected
                    ? "bg-brand-900 text-white border-brand-900"
                    : "bg-white text-brand-900 border-brand-300 hover:bg-brand-50"
                } disabled:bg-brand-100 disabled:text-brand-500 disabled:cursor-not-allowed`}
              >
                {option}
              </button>
            );
          })}
        </fieldset>
        <button
          type="submit"
          disabled={disabled || !selectedOption}
          className="w-full bg-brand-900 text-white px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-brand-800 disabled:bg-brand-400 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
        >
          {disabled ? "Evaluando..." : "Enviar respuesta"}
        </button>
      </form>
    );
  }

  // Free-text rendering for all other types
  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="answer-form-text">
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
