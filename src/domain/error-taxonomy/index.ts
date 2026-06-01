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
  {
    id: "u1_error_intervalo",
    unit: 1,
    description:
      "Error al evaluar operaciones con intervalos: confunde notación de intervalo abierto/cerrado o aplica operaciones incorrectamente sobre extremos.",
    examples: [
      "Unir [1,3] y [3,5] como [1,5) en vez de [1,5]",
      "Sumar extremos de [2,4] y [1,3] como [3,7] sin considerar intersección",
    ],
  },
  {
    id: "u1_extremo_inclusion",
    unit: 1,
    description:
      "Error al determinar inclusión de extremos en intervalos: usa paréntesis cuando debería usar corchetes o viceversa.",
    examples: [
      "Escribir x > 3 como [3,∞) en vez de (3,∞)",
      "Escribir x ≤ 5 como (−∞,5) en vez de (−∞,5]",
    ],
  },
  {
    id: "u1_propiedad_operacion",
    unit: 1,
    description:
      "Error al aplicar propiedades de operaciones con reales: distribuye mal o confunde conmutatividad con asociatividad.",
    examples: [
      "Aplicar a(b + c) = ab + c en vez de ab + ac",
      "Calcular -(2 + 3) como -2 + 3 = 1 en vez de -5",
    ],
  },
  {
    id: "u1_agrupacion_signo",
    unit: 1,
    description:
      "Error al agrupar términos con signos: pierde o cambia signo al reorganizar sumas y restas.",
    examples: [
      "Calcular 5 - 3 + 2 como 5 - (3 + 2) = 0 en vez de 4",
      "Reordenar 7 - 4 + 1 como 7 + 1 - 4 y olvidar que el signo original era negativo",
    ],
  },
  {
    id: "u1_signo_parentesis",
    unit: 1,
    description:
      "Error al interpretar potencia con base negativa: confunde (-a)^n con -a^n, olvidando que los paréntesis incluyen al signo negativo.",
    examples: [
      "Calcular $(-3)^2 = -9$ en vez de $9$, confundiendo $(-3)\\times(-3)$ con $-(3\\times3)$",
      "Calcular $(-2)^3 = 8$ en vez de $-8$, invirtiendo la regla de signos",
    ],
  },

  // Unit 1: Potencias y raíces — error tags backed by the Unit 1 SDD sequence
  // and regression coverage in src/domain/__tests__/error-taxonomy.test.ts.
  {
    id: "u1_exponente_cero",
    unit: 1,
    description:
      "Error al evaluar exponente cero: cree que cualquier número elevado a la potencia cero es 0 en vez de 1.",
    examples: [
      "Calcular $5^0 = 0$ en vez de $1$",
      "Calcular $(-3)^0 = 0$ en vez de $1$",
    ],
  },
  {
    id: "u1_producto_potencias",
    unit: 1,
    description:
      "Error al multiplicar potencias de distinta base: suma los exponentes cuando las bases son diferentes, o multiplica los exponentes en vez de sumarlos.",
    examples: [
      "Calcular $2^3 \\times 3^2$ como $6^5$ en vez de $8 \\times 9 = 72$",
      "Calcular $2^3 \\times 2^4$ como $2^{12}$ en vez de $2^7 = 128$",
    ],
  },
  {
    id: "u1_cociente_potencias",
    unit: 1,
    description:
      "Error al dividir potencias de distinta base: resta los exponentes cuando las bases son diferentes, o aplica la regla incorrectamente.",
    examples: [
      "Calcular $6^4 \\div 3^2$ como $2^2 = 4$ en vez de $36$",
      "Calcular $5^6 \\div 5^2$ como $5^3$ en vez de $5^4 = 625$",
    ],
  },
  {
    id: "u1_potencia_de_potencia",
    unit: 1,
    description:
      "Error al elevar una potencia a otra potencia: suma los exponentes en vez de multiplicarlos, o no aplica la regla $(a^m)^n = a^{m\\times n}$.",
    examples: [
      "Calcular $(2^3)^2$ como $2^5 = 32$ en vez de $2^6 = 64$",
      "Calcular $(3^2)^3$ como $3^5 = 243$ en vez de $3^6 = 729$",
    ],
  },
  {
    id: "u1_raiz_principal",
    unit: 1,
    description:
      "Error al calcular raíz cuadrada: responde con el valor negativo en vez de la raíz principal (no negativa).",
    examples: [
      "Calcular $\\sqrt{9} = -3$ en vez de $3$",
      "Calcular $\\sqrt{25} = -5$ en vez de $5$",
    ],
  },
  {
    id: "u1_raiz_negativa_par",
    unit: 1,
    description:
      "Error al evaluar raíz par de número negativo: afirma que existe resultado real en vez de reconocer que no tiene raíz real.",
    examples: [
      "Afirmar que $\\sqrt{-4}$ pertenece a los números reales",
      "Decir que $\\sqrt{-9} = -3$ en vez de que no existe en los reales",
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
      "Incluir -5 en el dominio de f(x)=√(x+4)",
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
