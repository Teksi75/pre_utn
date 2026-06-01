"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { RichText } from "@/components/math/RichText";
import type { Exercise } from "@/domain/models/exercise";
import {
  canSubmitExerciseAnswer,
  getSubmittedExerciseAnswer,
  isTextAnswerType,
} from "./exercise-answer-state";

interface ExerciseAnswerInputProps {
  readonly exercise: Exercise;
  readonly disabled: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly autoFocus?: boolean;
  readonly inputId?: string;
}

const TRUE_FALSE_OPTIONS = [
  { label: "Verdadero", value: "true" },
  { label: "Falso", value: "false" },
] as const;

const submitButtonClassName =
  "w-full px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] border min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]";

function submitButtonStyle(enabled: boolean): CSSProperties {
  if (enabled) {
    return {
      backgroundColor: "var(--color-brand-900)",
      borderColor: "var(--color-brand-900)",
      color: "#ffffff",
      cursor: "pointer",
    };
  }

  return {
    backgroundColor: "var(--color-brand-200)",
    borderColor: "var(--color-brand-300)",
    color: "var(--color-brand-700)",
    cursor: "not-allowed",
  };
}

function optionClassName(selected: boolean): string {
  return `flex w-full cursor-pointer items-center gap-3 text-left px-4 py-3 text-sm rounded-[var(--radius-button)] min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-within:shadow-[var(--ring-focus)] border ${
    selected
      ? "bg-[var(--color-brand-900)] text-white border-[var(--color-brand-900)]"
      : "bg-white text-[var(--color-brand-900)] border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]"
  } has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-[var(--color-brand-100)] has-[:disabled]:text-[var(--color-brand-600)] has-[:disabled]:border-[var(--color-brand-200)]`;
}

export function ExerciseAnswerInput({
  exercise,
  disabled,
  onSubmit,
  autoFocus = true,
  inputId = "exercise-answer",
}: ExerciseAnswerInputProps) {
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = canSubmitExerciseAnswer(
    exercise.type,
    answer,
    selectedOption
  );

  useEffect(() => {
    if (autoFocus && !disabled && isTextAnswerType(exercise.type)) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled, exercise.id, exercise.type]);

  useEffect(() => {
    setAnswer("");
    setSelectedOption(null);
  }, [exercise.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submittedAnswer = getSubmittedExerciseAnswer(
      exercise.type,
      answer,
      selectedOption
    );

    if (!submittedAnswer) return;

    onSubmit(submittedAnswer);
    setAnswer("");
    setSelectedOption(null);
  }

  if (exercise.type === "multiple-choice") {
    if (!exercise.options || exercise.options.length === 0) {
      return (
        <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este ejercicio no tiene opciones cargadas todavía.
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-3" data-testid="answer-form-multiple-choice">
        <fieldset disabled={disabled} className="space-y-2">
          <legend className="text-sm font-semibold text-brand-700 mb-2">
            Seleccioná una opción
          </legend>
          {exercise.options.map((option) => {
            const selected = selectedOption === option;
            return (
              <label
                key={option}
                className={optionClassName(selected)}
              >
                <input
                  type="radio"
                  name={`${inputId}-${exercise.id}`}
                  value={option}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => setSelectedOption(option)}
                  className="h-4 w-4 accent-brand-900"
                />
                <span><RichText text={option} /></span>
              </label>
            );
          })}
        </fieldset>
        <button
          type="submit"
          disabled={disabled || !canSubmit}
          className={submitButtonClassName}
          style={submitButtonStyle(!disabled && canSubmit)}
        >
          {disabled ? "Evaluando..." : "Enviar respuesta"}
        </button>
      </form>
    );
  }

  if (exercise.type === "true-false") {
    return (
      <form onSubmit={handleSubmit} className="space-y-3" data-testid="answer-form-true-false">
        <fieldset disabled={disabled} className="space-y-2">
          <legend className="text-sm font-semibold text-brand-700 mb-2">
            Seleccioná verdadero o falso
          </legend>
          {TRUE_FALSE_OPTIONS.map((option) => {
            const selected = selectedOption === option.value;
            return (
              <label
                key={option.value}
                className={optionClassName(selected)}
              >
                <input
                  type="radio"
                  name={`${inputId}-${exercise.id}`}
                  value={option.value}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => setSelectedOption(option.value)}
                  className="h-4 w-4 accent-brand-900"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </fieldset>
        <button
          type="submit"
          disabled={disabled || !canSubmit}
          className={submitButtonClassName}
          style={submitButtonStyle(!disabled && canSubmit)}
        >
          {disabled ? "Evaluando..." : "Enviar respuesta"}
        </button>
      </form>
    );
  }

  if (isTextAnswerType(exercise.type)) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3" data-testid="answer-form-text">
        <div>
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Tu respuesta
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Escribí tu respuesta..."
            className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white text-brand-900 min-h-[44px] disabled:bg-brand-100 disabled:text-brand-600 focus-visible:shadow-[var(--ring-focus)] transition-colors duration-[var(--duration-fast)]"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !canSubmit}
          className={submitButtonClassName}
          style={submitButtonStyle(!disabled && canSubmit)}
        >
          {disabled ? "Evaluando..." : "Enviar respuesta"}
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      Este tipo de ejercicio requiere una interacción específica y todavía no
      está disponible en esta ruta.
    </div>
  );
}
