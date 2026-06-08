/**
 * Interval Representation — structured model for interval graphics.
 * Pure TypeScript. No external dependencies.
 *
 * Covers notation, set-builder condition, bounds, endpoint inclusion,
 * and unbounded infinity sides for accessible interval visualization.
 */

import type { Result } from "../models/result";
import { ok, err } from "../models/result";

/** A bound on one side of an interval. */
export type IntervalBound =
  | { readonly kind: "finite"; readonly value: number; readonly label?: string }
  | { readonly kind: "infinity"; readonly direction: "negative" | "positive" };

/** Whether an endpoint is included or excluded. */
export type EndpointInclusion = "open" | "closed";

/** Structured interval representation for graphics and accessibility. */
export interface IntervalRepresentation {
  readonly id: string;
  readonly notation: string;
  readonly setBuilderLabel: string;
  readonly lower: IntervalBound;
  readonly upper: IntervalBound;
  readonly lowerInclusion: EndpointInclusion;
  readonly upperInclusion: EndpointInclusion;
  readonly ariaLabel: string;
}

/** Validation error with field and message. */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

/**
 * Validate an interval representation.
 *
 * @param input - The interval representation to validate
 * @returns Ok<IntervalRepresentation> on success, Err<ValidationError> on failure
 */
export function validateIntervalRepresentation(
  input: IntervalRepresentation
): Result<IntervalRepresentation, ValidationError> {
  // Validate id
  if (!input.id || input.id.trim().length === 0) {
    return err({ field: "id", message: "id is required" });
  }

  // Validate notation
  if (!input.notation || input.notation.trim().length === 0) {
    return err({ field: "notation", message: "notation is required" });
  }

  // Validate setBuilderLabel
  if (!input.setBuilderLabel || input.setBuilderLabel.trim().length === 0) {
    return err({ field: "setBuilderLabel", message: "setBuilderLabel is required" });
  }

  // Validate ariaLabel
  if (!input.ariaLabel || input.ariaLabel.trim().length === 0) {
    return err({ field: "ariaLabel", message: "ariaLabel is required" });
  }

  // Validate infinity direction constraints
  if (input.lower.kind === "infinity" && input.lower.direction === "positive") {
    return err({ field: "lower", message: "lower bound cannot be positive infinity" });
  }

  if (input.upper.kind === "infinity" && input.upper.direction === "negative") {
    return err({ field: "upper", message: "upper bound cannot be negative infinity" });
  }

  // Validate infinity bounds must be open
  if (input.lower.kind === "infinity" && input.lowerInclusion === "closed") {
    return err({ field: "lowerInclusion", message: "infinity lower bound must be open" });
  }

  if (input.upper.kind === "infinity" && input.upperInclusion === "closed") {
    return err({ field: "upperInclusion", message: "infinity upper bound must be open" });
  }

  // Validate bounded interval: lower < upper
  if (input.lower.kind === "finite" && input.upper.kind === "finite") {
    if (input.lower.value > input.upper.value) {
      return err({ field: "bounds", message: "lower bound must be less than or equal to upper bound" });
    }
  }

  return ok(input);
}

/**
 * Check if an interval representation is valid.
 *
 * @param input - The interval representation to check
 * @returns true if valid, false otherwise
 */
export function isValidIntervalRepresentation(input: IntervalRepresentation): boolean {
  return validateIntervalRepresentation(input).ok;
}

/**
 * Format an interval representation as notation string.
 *
 * @param input - The interval representation to format
 * @returns Formatted notation string
 */
export function formatIntervalRepresentation(input: IntervalRepresentation): string {
  const leftBracket = input.lowerInclusion === "closed" ? "[" : "(";
  const rightBracket = input.upperInclusion === "closed" ? "]" : ")";

  const leftStr = formatBound(input.lower);
  const rightStr = formatBound(input.upper);

  return `${leftBracket}${leftStr}, ${rightStr}${rightBracket}`;
}

/**
 * Generate a descriptive aria label for an interval representation.
 *
 * @param input - The interval representation
 * @returns Descriptive text for screen readers
 */
export function generateAriaLabel(input: IntervalRepresentation): string {
  const notation = formatIntervalRepresentation(input);
  const inclusionDesc = describeInclusion(input.lowerInclusion, input.upperInclusion);
  const lowerStr = formatBound(input.lower);
  const upperStr = formatBound(input.upper);

  let direction = "";
  if (input.lower.kind === "infinity" && input.upper.kind === "infinity") {
    direction = "todos los reales";
  } else if (input.lower.kind === "infinity") {
    direction = `con infinito negativo hasta ${upperStr}`;
  } else if (input.upper.kind === "infinity") {
    direction = `desde ${lowerStr} con infinito positivo`;
  } else {
    direction = `de ${lowerStr} a ${upperStr}`;
  }

  return `Intervalo ${inclusionDesc} ${notation}, ${direction}, ${input.setBuilderLabel}`;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function formatBound(bound: IntervalBound): string {
  if (bound.kind === "infinity") {
    return bound.direction === "negative" ? "−∞" : "+∞";
  }
  const label = bound.label ?? String(bound.value);
  return label.replace("-", "−");
}

function describeInclusion(lower: EndpointInclusion, upper: EndpointInclusion): string {
  if (lower === "closed" && upper === "closed") return "cerrado";
  if (lower === "open" && upper === "open") return "abierto";
  return "semiabierto";
}
