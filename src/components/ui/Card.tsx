import type { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "accent" | "danger";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  readonly variant?: CardVariant;
  readonly children: ReactNode;
};

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "app-glass-surface rounded-[var(--radius-card)] p-5",
  accent:
    "rounded-[var(--radius-card)] border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] p-5 shadow-[var(--shadow-card)]",
  danger:
    "rounded-[var(--radius-card)] border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-5 shadow-[var(--shadow-card)]",
};

/**
 * Surface card with explicit visual variants. Override padding via className
 * when a tighter layout is needed.
 *
 * Forwards standard HTML attributes (including `aria-*` and `data-*`)
 * onto the underlying <div>, so call sites can wire the card as a
 * landmark (`aria-labelledby`) or expose a `data-testid` for tests.
 */
export function Card({
  variant = "default",
  className = "",
  children,
  ...rest
}: CardProps) {
  const classes = `${VARIANT_CLASSES[variant]}${
    className ? ` ${className}` : ""
  }`;

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
