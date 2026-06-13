interface DiagnosticProgressProps {
  readonly currentIndex: number;
  readonly total: number;
}

/**
 * Pure helper: round the (currentIndex + 1) / total ratio into a
 * 0..100 integer percentage. Returns 0 when total is non-positive to
 * avoid division by zero or negative widths.
 */
export function computeProgressPercent(
  currentIndex: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return Math.round(((currentIndex + 1) / total) * 100);
}

/**
 * Pure helper: the visible percent text is suppressed on the very
 * first question so the student is not greeted by a "0%". The
 * counter ("Pregunta 1 de N") stays visible regardless. The bar
 * itself still fills proportionally — the helper only controls
 * the textual readout.
 */
export function shouldShowPercent(currentIndex: number): boolean {
  return currentIndex > 0;
}

/**
 * Sober progress bar for the diagnostic question screen. Per the spec
 * v4 (C2):
 * - Always renders the "Pregunta X de N" counter (primary locator).
 * - Hides the percent text on the first question (currentIndex === 0).
 * - Uses the percentage model exclusively for aria-valuemin/max/now
 *   (min=0, max=100, now=computeProgressPercent(...)). Does not
 *   mix this with the question-number model.
 * - Animates only the bar width with the duration token, never
 *   the catch-all `transition: all` shorthand (so prefers-reduced-motion
 *   and low-end devices are not penalised).
 *
 * Visual: thin 1.5px track, accent fill, brand-200 background.
 */
export function DiagnosticProgress({
  currentIndex,
  total,
}: DiagnosticProgressProps) {
  const progressPercent = computeProgressPercent(currentIndex, total);
  const showPercent = shouldShowPercent(currentIndex);

  return (
    <div
      className="mb-6"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progressPercent}
      aria-label={`Progreso: pregunta ${currentIndex + 1} de ${total}`}
    >
      <div className="flex items-center justify-between text-xs text-[var(--color-brand-500)] mb-1.5">
        <span>
          Pregunta {currentIndex + 1} de {total}
        </span>
        {showPercent ? <span>{progressPercent}%</span> : <span aria-hidden="true">&nbsp;</span>}
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-brand-200)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent-500)] transition-[width] duration-[var(--duration-normal)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
