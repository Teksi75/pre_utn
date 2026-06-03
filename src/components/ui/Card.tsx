import type { ReactNode } from "react";

export type CardVariant = "default" | "accent" | "danger";

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default:
    "rounded-[var(--radius-card)] border border-brand-200 bg-white p-5 shadow-[var(--shadow-card)]",
  accent:
    "rounded-[var(--radius-card)] border border-amber-300 bg-amber-50 p-5 shadow-[var(--shadow-card)]",
  danger:
    "rounded-[var(--radius-card)] border border-red-200 bg-red-50 p-5 shadow-[var(--shadow-card)]",
};

/**
 * Surface card with explicit visual variants. Override padding via className
 * when a tighter layout is needed.
 */
export function Card({
  variant = "default",
  className = "",
  children,
}: CardProps) {
  const classes = `${VARIANT_CLASSES[variant]}${
    className ? ` ${className}` : ""
  }`;

  return <div className={classes}>{children}</div>;
}
