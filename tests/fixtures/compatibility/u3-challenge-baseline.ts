/**
 * Frozen U3 challenge baseline (as const, immutable).
 *
 * Captures the pre-change `traduccion_lenguaje_verbal` desafios
 * with their id, skillId, difficulty, type, and canonicalTrace
 * shape. These two desafios are owned by the
 * `fortalecer-u3-lenguaje-modelizacion-transferencia` companion and
 * MUST be preserved unchanged across the U3 alignment change.
 *
 * This file is a FIXTURE — it MUST NOT import from
 * `src/domain/catalog/`, MUST be `as const`, and the expected
 * values MUST NOT be derived from the post-change catalog.
 *
 * S0 owns creation + parse assertions; S11 uses this baseline to
 * assert that `desafio-01` retains `difficulty: 5` and
 * `desafio-02` retains `difficulty: 4`.
 */
export const FROZEN_U3_CHALLENGE_BASELINE = [
  {
    id: "ex.u3.traduccion_lenguaje_verbal.desafio-01",
    skillId: "mat.u3.traduccion_lenguaje_verbal",
    difficulty: 5,
    type: "multiple-choice",
    canonicalTrace: [
      {
        path: "material_canonico/Matemática/UNIDAD3_matemática.pdf",
        section: "Capítulo 1: Ecuaciones lineales — modelización con dos incógnitas y dos relaciones",
        sourceUse: "canonical-source",
        pedagogicalIntent:
          "Requiere encadenar la cadena completa: elegir la incógnita para cada cantidad, traducir dos relaciones del enunciado como un sistema de dos ecuaciones lineales con dos incógnitas, resolver por sustitución, verificar algebraicamente y reinterpretar las soluciones en el contexto del problema. Integra planteo de sistema con verificación contextual.",
      },
    ],
  },
  {
    id: "ex.u3.traduccion_lenguaje_verbal.desafio-02",
    skillId: "mat.u3.traduccion_lenguaje_verbal",
    difficulty: 4,
    type: "multiple-choice",
    canonicalTrace: [
      {
        path: "material_canonico/Matemática/UNIDAD3_matemática.pdf",
        section: "Capítulo 1: Ecuaciones lineales — modelización con perímetro y razón entre lados",
        sourceUse: "canonical-source",
        pedagogicalIntent:
          "Pide encadenar la cadena completa de modelización: elegir la incógnita (lado menor), traducir dos condiciones del enunciado (perímetro y razón entre lados) como una sola ecuación lineal, resolver, y luego verificar AMBAS condiciones — no solo la ecuación — antes de interpretar las dimensiones. Integra perímetro con razón y verificación doble.",
      },
    ],
  },
] as const;

export type FrozenU3ChallengeBaseline = (typeof FROZEN_U3_CHALLENGE_BASELINE)[number];
