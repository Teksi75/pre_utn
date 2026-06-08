import { RichText } from "@/components/math/RichText";
import { mapSubmittedAnswer } from "./submitted-answer-display";
import type { Exercise } from "@/domain/models/exercise";
import type { EvaluationResult } from "@/domain/evaluator/index";

interface SubmittedAnswerDisplayProps {
  readonly exercise: Exercise;
  readonly submittedAnswer: string;
  readonly evaluation: EvaluationResult;
  readonly feedback: string;
}

/**
 * Read-only display of a previously submitted answer.
 *
 * Renders the submitted answer text (mapped through `mapSubmittedAnswer`
 * for multiple-choice label resolution), a correctness indicator, and
 * any available feedback. No inputs, no submit controls — this is a
 * static historical view, not an interactive form.
 */
export function SubmittedAnswerDisplay({
  exercise,
  submittedAnswer,
  evaluation,
  feedback,
}: SubmittedAnswerDisplayProps) {
  const rows = mapSubmittedAnswer(exercise, submittedAnswer);

  return (
    <div
      className="rounded-[var(--radius-card)] border border-brand-200 bg-brand-50/60 p-4 space-y-3"
      data-testid="submitted-answer-display"
    >
      {/* Correctness badge */}
      <div className="flex items-center gap-2">
        {evaluation.correct ? (
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            ✓ Correcto
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-badge)] bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            ✗ Incorrecto
          </span>
        )}
      </div>

      {/* Submitted answer — one or more display rows */}
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.value} className="flex items-start gap-2">
            <span className="text-xs font-semibold text-brand-500 min-w-0 shrink-0">
              {row.label}:
            </span>
            <span className="text-sm text-brand-900">
              <RichText text={row.value} />
            </span>
          </div>
        ))}
      </div>

      {/* Feedback (if any) */}
      {feedback && (
        <div className="rounded-[var(--radius-card)] border border-brand-200 bg-white p-3">
          <span className="text-xs font-semibold text-brand-500 block mb-1">
            Retroalimentación
          </span>
          <span className="text-sm text-brand-800">
            <RichText text={feedback} />
          </span>
        </div>
      )}
    </div>
  );
}
