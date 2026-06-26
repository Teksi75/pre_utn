"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { validateDisplayName } from "../domain/student-profile/index";
import { Card } from "./ui/Card";

export interface StudentGateProps {
  /** Called with the validated display name when the user submits the form. */
  onSubmitProfile: (displayName: string) => void;
  /** External validation error (e.g., from a parent component). */
  externalError: string | null;
}

/**
 * Identification card shown when no active student profile exists.
 *
 * Copy is exact per the student-local-identity spec (updated in
 * `auth-sign-in-v0` PR2 for present-tense consistency):
 * - heading: `¿Quién está estudiando ahora?`
 * - body: `Ingresá tu nombre o apodo para guardar tu progreso en este dispositivo. No necesitás contraseña.`
 * - input label: `Nombre o apodo`
 * - primary action: `Empezar a estudiar`
 * - info line: `Este perfil es local. Si querés, también podés sincronizarlo con la cuenta del curso.`
 * - secondary CTA: `Sincronizar con la cuenta del curso` → `/cuenta/ingresar`
 *   (added in PR2 once sync became actually available).
 *
 * Validation uses the domain `validateDisplayName` function.
 */
export function StudentGate({ onSubmitProfile, externalError }: StudentGateProps) {
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDisplayName(value);
      if (localError) {
        setLocalError(null);
      }
    },
    [localError],
  );

  const handleSubmit = useCallback(() => {
    const error = validateDisplayName(displayName);
    if (error !== null) {
      setLocalError(
        error === "empty"
          ? "El nombre no puede estar vacío."
          : error === "too-long"
            ? "El nombre no puede superar los 40 caracteres."
            : "El nombre tiene caracteres no válidos.",
      );
      return;
    }
    onSubmitProfile(displayName.trim());
  }, [displayName, onSubmitProfile]);

  const errorMessage = externalError ?? localError;
  const inputId = "student-gate-name-input";
  const errorId = "student-gate-error";

  return (
    <Card
      variant="accent"
      className="max-w-md mx-auto p-6"
      aria-labelledby="student-gate-heading"
    >
      <div className="space-y-4">
        {/* Heading */}
        <h2
          id="student-gate-heading"
          className="text-xl font-bold text-[var(--color-brand-900)] text-center"
        >
          ¿Quién está estudiando ahora?
        </h2>

        {/* Body copy */}
        <p className="text-sm text-[var(--color-brand-700)] text-center leading-relaxed">
          Ingresá tu nombre o apodo para guardar tu progreso en este dispositivo.
          No necesitás contraseña.
        </p>

        {/* Input */}
        <div className="space-y-1">
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-brand-800)]"
          >
            Nombre o apodo
          </label>
          <input
            id={inputId}
            type="text"
            value={displayName}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && displayName.trim()) {
                handleSubmit();
              }
            }}
            placeholder="Ej: Ana"
            autoCapitalize="words"
            aria-describedby={errorMessage ? errorId : undefined}
            aria-invalid={errorMessage ? "true" : undefined}
            className="w-full px-3 py-2 rounded-[var(--radius-button)] border border-[var(--color-brand-300)] bg-[var(--color-surface)] text-[var(--color-brand-900)] placeholder:text-[var(--color-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent transition-colors"
            maxLength={60}
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <p
            id={errorId}
            role="alert"
            className="text-sm text-[var(--color-error)] flex items-center gap-1"
          >
            <span aria-hidden="true">⚠</span>
            {errorMessage}
          </p>
        )}

        {/* Primary action */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!displayName.trim()}
          className="w-full py-2.5 px-4 rounded-[var(--radius-button)] bg-[var(--color-brand-600)] text-white font-semibold text-sm hover:bg-[var(--color-brand-700)] active:bg-[var(--color-brand-800)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
        >
          Empezar a estudiar
        </button>

        {/* Informational line */}
        <p className="text-xs text-[var(--color-brand-500)] text-center leading-relaxed">
          Este perfil es local. Si querés, también podés sincronizarlo con la cuenta del curso.
        </p>

        {/* Secondary CTA — optional sync with the remote course account.
            Wired as a Next.js Link so it works without JavaScript too. */}
        <Link
          href="/cuenta/ingresar"
          className="block w-full py-2.5 px-4 text-center rounded-[var(--radius-button)] bg-[var(--color-brand-100)] text-[var(--color-brand-700)] font-medium text-sm hover:bg-[var(--color-brand-200)] active:bg-[var(--color-brand-300)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2"
        >
          Sincronizar con la cuenta del curso
        </Link>
      </div>
    </Card>
  );
}
