interface PhaseBadgeProps {
  step?: number;
  total?: number;
  label: string;
}

/**
 * Compact badge announcing the current phase of the practice flow.
 * When `step` + `total` are provided, renders "Paso N de M — label".
 * Otherwise renders just the label.
 */
export function PhaseBadge({ step, total, label }: PhaseBadgeProps) {
  const prefix =
    step !== undefined && total !== undefined
      ? `Paso ${step} de ${total} — `
      : "";

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-1 rounded-[var(--radius-badge)]">
      {prefix}
      {label}
    </div>
  );
}
