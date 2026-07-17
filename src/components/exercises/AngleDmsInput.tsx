"use client";

import { useState } from "react";
import {
  serializeStructuredSubmissionV1,
  type AngleDmsSubmissionV1,
} from "@/domain/evaluator/structured";

/**
 * AngleDmsInput — structured control for `angle-dms` answers.
 *
 * Renders three numeric fields (degrees, minutes, seconds) and emits the
 * canonical JSON v1 submission via `onComplete` once every field is
 * non-empty AND the bounds are respected (0 ≤ minutes < 60, 0 ≤ seconds < 60).
 *
 * Pure presentational component: state lives locally.
 */

interface AngleDmsInputProps {
  readonly disabled: boolean;
  readonly onComplete: (submissionJson: string) => void;
  /** Pre-fill the fields (used by retry / resume). Optional. */
  readonly initial?: {
    readonly degrees: number;
    readonly minutes: number;
    readonly seconds: number;
  };
}

export function AngleDmsInput({
  disabled,
  onComplete,
  initial,
}: AngleDmsInputProps) {
  const [degrees, setDegrees] = useState<string>(
    initial ? String(initial.degrees) : "",
  );
  const [minutes, setMinutes] = useState<string>(
    initial ? String(initial.minutes) : "",
  );
  const [seconds, setSeconds] = useState<string>(
    initial ? String(initial.seconds) : "",
  );
  const [error, setError] = useState<string | null>(null);

  function handleComplete() {
    const d = Number(degrees);
    const m = Number(minutes);
    const s = Number(seconds);
    if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isFinite(s)) {
      setError("Completá grados, minutos y segundos con números válidos.");
      return;
    }
    if (m >= 60) {
      setError("Los minutos deben estar entre 0 y 59.");
      return;
    }
    if (s >= 60) {
      setError("Los segundos deben estar entre 0 y 59.99.");
      return;
    }
    if (m < 0 || s < 0 || d < 0) {
      setError("Los valores deben ser no negativos.");
      return;
    }
    setError(null);
    const submission: AngleDmsSubmissionV1 = {
      v: 1,
      kind: "angle-dms",
      degrees: d,
      minutes: m,
      seconds: s,
    };
    onComplete(serializeStructuredSubmissionV1(submission));
  }

  return (
    <div className="space-y-3" data-testid="angle-dms-input">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="angle-dms-degrees"
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Grados
          </label>
          <input
            id="angle-dms-degrees"
            type="number"
            step="1"
            min={0}
            inputMode="numeric"
            aria-label="Grados del ángulo"
            value={degrees}
            onChange={(e) => setDegrees(e.target.value)}
            disabled={disabled}
            className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white/90 text-brand-900 min-h-[44px] focus-visible:shadow-[var(--ring-focus)]"
          />
        </div>
        <div>
          <label
            htmlFor="angle-dms-minutes"
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Minutos
          </label>
          <input
            id="angle-dms-minutes"
            type="number"
            step="1"
            min={0}
            max={59}
            inputMode="numeric"
            aria-label="Minutos del ángulo"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            disabled={disabled}
            className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white/90 text-brand-900 min-h-[44px] focus-visible:shadow-[var(--ring-focus)]"
          />
        </div>
        <div>
          <label
            htmlFor="angle-dms-seconds"
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Segundos
          </label>
          <input
            id="angle-dms-seconds"
            type="number"
            step="any"
            min={0}
            max={59.99}
            inputMode="decimal"
            aria-label="Segundos del ángulo"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            disabled={disabled}
            className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white/90 text-brand-900 min-h-[44px] focus-visible:shadow-[var(--ring-focus)]"
          />
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-button)] px-3 py-2"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleComplete}
        disabled={disabled || !degrees || !minutes || !seconds}
        className="w-full bg-[var(--color-brand-900)] text-white px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-[var(--color-brand-800)] disabled:bg-[var(--color-brand-200)] disabled:text-[var(--color-brand-500)] min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
      >
        Enviar respuesta
      </button>
    </div>
  );
}