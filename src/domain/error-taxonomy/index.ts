/**
 * Error taxonomy — static collection of normalized mathematics error tags.
 * No external dependencies. Pure TypeScript.
 */

import type { ErrorTag } from "../models/error-tag";

/**
 * Static error taxonomy data.
 * Each tag follows u{1-6}_{slug} pattern, with at least 2 tags per unit.
 * These are original pedagogical transformations, not verbatim canonical content.
 */
const TAXONOMY: readonly ErrorTag[] = [
  // Unit 1: Algebraic expressions
  {
    id: "u1_orden_operaciones",
    unit: 1,
    description:
      "Error en el orden de operaciones: resuelve sumas antes que multiplicaciones o divisiones.",
    examples: [
      "Calcular 2 + 3 × 4 como (2+3)×4 = 20 en vez de 2+12 = 14",
      "Resolver 10 - 2² como (10-2)² = 64 en vez de 10-4 = 6",
    ],
  },
  {
    id: "u1_signo_racionalizacion",
    unit: 1,
    description:
      "Error al aplicar signo en racionalización: olvida cambiar signo del numerador o denominador al multiplicar por el conjugado.",
    examples: [
      "Racionalizar 1/(√2 - 1) y escribir (√2 + 1)/(2 - 1) en vez de (√2 + 1)/(1)",
      "Olvidar cambiar signo al multiplicar por conjugado",
    ],
  },

  // Unit 2: Equations and systems
  {
    id: "u2_aislamiento_variable",
    unit: 2,
    description:
      "Error al aislar la variable: olvida aplicar la misma operación a ambos lados de la ecuación.",
    examples: [
      "En 2x = 6, escribir x = 6 en vez de x = 3",
      "En x/3 = 4, escribir x = 4 en vez de x = 12",
    ],
  },
  {
    id: "u2_signo_al_mover",
    unit: 2,
    description:
      "Error de signo al mover términos: no cambia el signo al pasar un término de un lado al otro.",
    examples: [
      "En x + 5 = 3, escribir x = 3 + 5 en vez de x = 3 - 5",
      "En 2x - 1 = 7, escribir 2x = 7 - 1 en vez de 2x = 7 + 1",
    ],
  },

  // Unit 3: Inequalities and absolute value
  {
    id: "u3_signo_desigualdad",
    unit: 3,
    description:
      "Error al multiplicar o dividir por negativo: olvida invertir el sentido de la desigualdad.",
    examples: [
      "-2x > 4 → x > -2 en vez de x < -2",
      "(-3)x ≤ 9 → x ≤ -3 en vez de x ≥ -3",
    ],
  },
  {
    id: "u3_direccion_desigualdad",
    unit: 3,
    description:
      "Error al interpretar el sentido de la desigualdad: confunde mayor con menor.",
    examples: [
      "Interpretar x > 3 como valores menores que 3",
      "Graficar x ≤ -2 como círculo abierto en -2 y sombra a la derecha",
    ],
  },

  // Unit 4: Geometry and measures
  {
    id: "u4_formula_area",
    unit: 4,
    description:
      "Error al aplicar fórmula de área: usa fórmula incorrecta o aplica dimensiones equivocadas.",
    examples: [
      "Calcular área de rectángulo como base × altura × 2",
      "Usar fórmula de área de triángulo para un rectángulo",
    ],
  },
  {
    id: "u4_suma_angulos",
    unit: 4,
    description:
      "Error en suma de ángulos: olvida que la suma de ángulos internos de un triángulo es 180°.",
    examples: [
      "Decir que los ángulos de un triángulo suman 360°",
      "Calcular un ángulo faltante sumando 90° en vez de 180° - (a + b)",
    ],
  },

  // Unit 5: Trigonometry
  {
    id: "u5_cuadrante_angulo",
    unit: 5,
    description:
      "Error al ubicar un ángulo en la circunferencia trigonométrica: confunde cuadrantes o sentido de giro.",
    examples: [
      "Ubicar 300° en el primer cuadrante en vez del cuarto",
      "Leer 210° como si estuviera entre 0° y 90°",
    ],
  },
  {
    id: "u5_identidad_pitagorica",
    unit: 5,
    description:
      "Error al aplicar identidades trigonométricas básicas: reemplaza sen²(θ)+cos²(θ) por una expresión no equivalente.",
    examples: [
      "Escribir sen²(θ)+cos²(θ)=2 en vez de 1",
      "Tratar sen²(θ)+cos²(θ) como (sen(θ)+cos(θ))²",
    ],
  },

  // Unit 6: Functions
  {
    id: "u6_dominio_funcion",
    unit: 6,
    description:
      "Error al determinar el dominio: olvida restricciones como división por cero o raíz de negativo.",
    examples: [
      "Decir que el dominio de f(x)=1/x son todos los reales",
      "Incluir -4 en el dominio de f(x)=√(x+4)",
    ],
  },
  {
    id: "u6_rango_funcion",
    unit: 6,
    description:
      "Error al determinar el rango: confunde valores posibles de salida con valores de entrada.",
    examples: [
      "Decir que el rango de f(x)=x² son todos los reales",
      "Olvidar que f(x)=1/x no puede ser 0",
    ],
  },
] as const;

/**
 * Load the complete error taxonomy.
 * Validates coverage (≥2 tags/unit) and uniqueness.
 * @returns Array of ErrorTag objects
 * @throws Error if taxonomy is invalid
 */
export function loadTaxonomy(): ErrorTag[] {
  // Validate uniqueness
  const ids = TAXONOMY.map((t) => t.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    throw new Error(`Duplicate error tag IDs: ${[...new Set(duplicates)].join(", ")}`);
  }

  // Validate coverage per unit
  for (let unit = 1; unit <= 6; unit++) {
    const unitTags = TAXONOMY.filter((t) => t.unit === unit);
    if (unitTags.length < 2) {
      throw new Error(`Unit ${unit} has only ${unitTags.length} error tags; requires at least 2`);
    }
  }

  return [...TAXONOMY]; // return mutable copy
}

/**
 * Look up an error tag by its ID.
 * @param tagId - The error tag ID to find
 * @returns The matching ErrorTag, or undefined if not found
 */
export function lookupTag(tagId: string): ErrorTag | undefined {
  return TAXONOMY.find((t) => t.id === tagId);
}

/**
 * Filter error tags by unit number.
 * @param unit - Unit number (1-6)
 * @returns Array of ErrorTag objects for that unit
 */
export function filterByUnit(unit: number): ErrorTag[] {
  return TAXONOMY.filter((t) => t.unit === unit);
}
