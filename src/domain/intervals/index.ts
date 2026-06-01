export type IntervalEndpoint =
  | { readonly kind: "finite"; readonly value: number; readonly closed: boolean }
  | { readonly kind: "negativeInfinity" }
  | { readonly kind: "positiveInfinity" };

export interface IntervalModel {
  readonly left: IntervalEndpoint;
  readonly right: IntervalEndpoint;
}

export type InfinityKind = "negativeInfinity" | "positiveInfinity";

function formatEndpoint(endpoint: IntervalEndpoint): string {
  switch (endpoint.kind) {
    case "negativeInfinity":
      return "−∞";
    case "positiveInfinity":
      return "+∞";
    case "finite":
      return String(endpoint.value).replace("-", "−");
  }
}

export function formatInterval(interval: IntervalModel): string {
  const leftBracket = interval.left.kind === "finite" && interval.left.closed ? "[" : "(";
  const rightBracket = interval.right.kind === "finite" && interval.right.closed ? "]" : ")";

  return `${leftBracket}${formatEndpoint(interval.left)}, ${formatEndpoint(interval.right)}${rightBracket}`;
}

export function isValidInterval(interval: IntervalModel): boolean {
  if (interval.left.kind === "positiveInfinity") return false;
  if (interval.right.kind === "negativeInfinity") return false;

  if (interval.left.kind === "negativeInfinity") {
    return interval.right.kind === "finite" || interval.right.kind === "positiveInfinity";
  }

  if (interval.right.kind === "positiveInfinity") {
    return interval.left.kind === "finite";
  }

  if (interval.left.kind === "finite" && interval.right.kind === "finite") {
    return interval.left.value < interval.right.value;
  }

  return false;
}

export function normalizeInfinityInput(input: string): InfinityKind | null {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/−/g, "-");

  const positiveInputs = new Set([
    "∞",
    "+∞",
    "infinito",
    "+infinito",
    "inf",
    "+inf",
    "infinity",
    "+infinity",
    "oo",
    "+oo",
  ]);

  const negativeInputs = new Set([
    "-∞",
    "-infinito",
    "-inf",
    "-infinity",
    "-oo",
  ]);

  if (positiveInputs.has(normalized)) return "positiveInfinity";
  if (negativeInputs.has(normalized)) return "negativeInfinity";

  return null;
}
