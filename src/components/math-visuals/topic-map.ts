import type { MathTheme } from "./types";

const FALLBACK_TOPIC: MathTheme = "sets";

const TOPIC_RULES: readonly [readonly string[], MathTheme][] = [
  [["conjuntos", "conjuntos numericos", "conjuntos_numericos", "numericos"], "sets"],
  [["irracionales", "irracional", "pi", "raiz de dos", "raíz de dos"], "irrationals"],
  [["potencias", "potencia", "exponente", "exponentes"], "powers"],
  [["raices", "raíces", "raiz", "raíz", "radicacion", "radicación", "racionalizacion"], "roots"],
  [["intervalos", "intervalo"], "intervals"],
  [["valor absoluto", "valor_absoluto", "absoluto"], "absolute"],
  [["logaritmos", "logaritmo", "logs", "ln"], "logs"],
  [["complejos", "complejo", "complex"], "complex"],
];

function normalizeTopicKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.-]+/g, "_");
}

export function mathThemeForTopic(value: string | null | undefined): MathTheme | undefined {
  if (!value) return undefined;
  const normalized = normalizeTopicKey(value);

  for (const [needles, theme] of TOPIC_RULES) {
    if (needles.some((needle) => normalized.includes(normalizeTopicKey(needle)))) {
      return theme;
    }
  }

  return undefined;
}

export function mathThemeForSkill(value: string | null | undefined): MathTheme {
  return mathThemeForTopic(value) ?? FALLBACK_TOPIC;
}
