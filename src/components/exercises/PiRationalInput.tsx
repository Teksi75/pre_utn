"use client";

import { useState } from "react";
import {
  serializeStructuredSubmissionV1,
  type PiRationalSubmissionV1,
} from "@/domain/evaluator/structured";

/**
 * PiRationalInput — structured control for `pi-rational` answers.
 * Renders three numeric fields (numerator, denominator, decimal) and
 * emits the canonical JSON v1 submission via `onComplete` once every
 * field is non-empty AND the denominator is positive. Tolerance is
 * content-side config and is NOT a student-facing input.
 */

interface PiRationalInputProps {
  readonly disabled: boolean;
  readonly onComplete: (submissionJson: string) => void;
  /** Pre-fill the fields (used by retry / resume). Optional. */
  readonly initial?: {
    readonly numerator: number;
    readonly denominator: number;
    readonly decimal: number;
  };
}

export function PiRationalInput({
  disabled,
  onComplete,
  initial,
}: PiRationalInputProps) {
  const [numerator, setNumerator] = useState<string>(
    initial ? String(initial.numerator) : "",
  );
  const [denominator, setDenominator] = useState<string>(
    initial ? String(initial.denominator) : "",
  );
  const [decimal, setDecimal] = useState<string>(
    initial ? String(initial.decimal) : "",
  );
  const [error, setError] = useState<string | null>(null);

  function handleComplete() {
    const numN = Number(numerator);
    const numD = Number(denominator);
    const numDec = Number(decimal);
    if (
      !Number.isInteger(numN) ||
      !Number.isInteger(numD) ||
      !Number.isFinite(numDec)
    ) {
      setError("Completá numerador, denominador y decimal con números válidos.");
      return;
    }
    if (numD <= 0) {
      setError("El denominador debe ser un entero positivo.");
      return;
    }
    setError(null);
    const submission: PiRationalSubmissionV1 = {
      v: 1,
      kind: "pi-rational",
      numerator: numN,
      denominator: numD,
      decimal: numDec,
    };
    onComplete(serializeStructuredSubmissionV1(submission));
  }

  return (
    <div className="space-y-3" data-testid="pi-rational-input">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="pi-rational-numerator"
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Numerador
          </label>
          <input
            id="pi-rational-numerator"
            type="number"
            step="1"
            inputMode="numeric"
            aria-label="Numerador del múltiplo de π"
            value={numerator}
            onChange={(e) => setNumerator(e.target.value)}
            disabled={disabled}
            className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white/90 text-brand-900 min-h-[44px] focus-visible:shadow-[var(--ring-focus)]"
          />
        </div>
        <div>
          <label
            htmlFor="pi-rational-denominator"
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Denominador
          </label>
          <input
            id="pi-rational-denominator"
            type="number"
            step="1"
            min={1}
            inputMode="numeric"
            aria-label="Denominador del múltiplo de π"
            value={denominator}
            onChange={(e) => setDenominator(e.target.value)}
            disabled={disabled}
            className="w-full border border-brand-300 rounded-[var(--radius-button)] px-3 py-2.5 text-sm bg-white/90 text-brand-900 min-h-[44px] focus-visible:shadow-[var(--ring-focus)]"
          />
        </div>
        <div>
          <label
            htmlFor="pi-rational-decimal"
            className="block text-sm font-semibold text-brand-700 mb-1"
          >
            Valor decimal
          </label>
          <input
            id="pi-rational-decimal"
            type="number"
            step="any"
            inputMode="decimal"
            aria-label="Valor decimal del múltiplo de π"
            value={decimal}
            onChange={(e) => setDecimal(e.target.value)}
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
        disabled={disabled || !numerator || !denominator || !decimal}
        className="w-full bg-[var(--color-brand-900)] text-white px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] hover:bg-[var(--color-brand-800)] disabled:bg-[var(--color-brand-200)] disabled:text-[var(--color-brand-500)] min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]"
      >
        Enviar respuesta
      </button>
    </div>
  );
}