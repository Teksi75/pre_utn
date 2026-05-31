"use client";

import { lookupTag } from "@/domain/error-taxonomy/index";

interface FeedbackDisplayProps {
  readonly correct: boolean;
  readonly errorTag?: string;
  readonly feedback?: string;
}

/**
 * Shows correctness + lookupTag description when errorTag present.
 * Never shows expectedAnswer.
 */
export function FeedbackDisplay({
  correct,
  errorTag,
  feedback,
}: FeedbackDisplayProps) {
  const errorTagData = errorTag ? lookupTag(errorTag) : undefined;

  return (
    <div
      className={`rounded-lg p-4 ${
        correct
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div
        className={`font-medium ${
          correct ? "text-green-800" : "text-red-800"
        }`}
      >
        {correct ? "¡Correcto!" : "Incorrecto"}
      </div>

      {feedback && feedback !== "manual-review" && (
        <p className="mt-2 text-sm text-gray-700">{feedback}</p>
      )}

      {errorTagData && (
        <div className="mt-3 text-sm">
          <p className="font-medium text-red-700">Categoría del error:</p>
          <p className="text-red-600">{errorTagData.description}</p>
          {errorTagData.examples.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Ejemplo común:</p>
              <p className="text-xs text-gray-600 italic">
                {errorTagData.examples[0]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
