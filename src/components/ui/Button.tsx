import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand-900)] text-white hover:bg-[var(--color-brand-800)] disabled:bg-[var(--color-brand-200)] disabled:text-[var(--color-brand-500)]",
  secondary:
    "bg-[var(--color-brand-100)] text-brand-700 hover:bg-[var(--color-brand-200)]",
  ghost: "text-brand-700 hover:text-brand-900 hover:bg-[var(--color-brand-50)]",
  danger: "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
};

const BASE_CLASSES =
  "px-4 py-2.5 text-sm font-medium rounded-[var(--radius-button)] min-h-[44px] transition-colors duration-[var(--duration-fast)] focus-visible:shadow-[var(--ring-focus)]";

/**
 * Reusable button with explicit visual variants. Spread remaining props onto
 * the underlying <button> element so callers can override padding/width as
 * needed.
 */
export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}${
    className ? ` ${className}` : ""
  }`;

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
