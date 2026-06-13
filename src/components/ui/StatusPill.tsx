import type { HTMLAttributes, ReactNode } from "react";

/**
 * Six semantic pill variants. The order here is the contract that A2.b
 * (MathRoutePanel, FocusSelector) and later phases consume.
 *
 * - `neutral`  : not started / upcoming / generic.
 * - `available`: skill ready, content reachable, optimistic state.
 * - `locked`   : blocked by prerequisite or content not yet available.
 * - `weak`     : needs reinforcement / error state.
 * - `active`   : currently selected / in-progress unit.
 * - `success`  : mastered / completed / achieved.
 */
export type StatusPillVariant =
  | "neutral"
  | "available"
  | "locked"
  | "weak"
  | "active"
  | "success";

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: StatusPillVariant;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Maps a semantic variant to its full Tailwind class string. All
 * colors come from `--color-status-*` / `--color-status-*-soft` tokens
 * declared in `src/app/globals.css`. No raw hex, no Tailwind palette.
 */
const VARIANT_CLASSES: Record<StatusPillVariant, string> = {
  neutral:
    "bg-brand-50 text-brand-700 border border-brand-200",
  available:
    "bg-status-available-soft text-status-available border border-status-available",
  locked:
    "bg-status-locked-soft text-status-locked border border-status-locked",
  weak:
    "bg-status-weak-soft text-status-weak border border-status-weak",
  active:
    "bg-status-active-soft text-status-active border border-status-active",
  success:
    "bg-status-success-soft text-status-success border border-status-success",
};

const BASE_CLASSES =
  "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[var(--radius-badge)]";

/**
 * Compact, semantic status pill. Use this anywhere a component needs to
 * communicate state (Disponible, Bloqueada, Dominada, En progreso, etc.).
 *
 * The component is a `<span>` by default — it's decorative content that
 * travels with a label. Callers may extend it via `className` for
 * one-off spacing tweaks. Accessibility attributes (`aria-label`,
 * `data-testid`, etc.) are forwarded through the underlying
 * `HTMLAttributes<HTMLSpanElement>`.
 */
export function StatusPill({
  variant = "neutral",
  className = "",
  children,
  ...rest
}: StatusPillProps) {
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}${
    className ? ` ${className}` : ""
  }`;

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
