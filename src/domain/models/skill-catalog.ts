/**
 * Skill catalog — 45 mathematics skills from spec 06.
 * Each skill ID follows mat.u{1-6}.{slug} format.
 * This file is a constant-only module with no logic.
 */

import type { SkillId } from "./skill";

// ── Unit 1: Aritmética y números ──────────────────────────────────────────

export const UNIT_1_SKILLS: readonly SkillId[] = [
  "mat.u1.conjuntos_numericos",
  "mat.u1.propiedades_operaciones_reales",
  "mat.u1.potencias_raices",
  "mat.u1.racionalizacion",
  "mat.u1.intervalos",
  "mat.u1.valor_absoluto",
  "mat.u1.logaritmos",
  "mat.u1.complejos",
] as const;

// ── Unit 2: Polinomios y álgebra ──────────────────────────────────────────

export const UNIT_2_SKILLS: readonly SkillId[] = [
  "mat.u2.polinomios_basico",
  "mat.u2.operaciones_polinomios",
  "mat.u2.ruffini_resto",
  "mat.u2.factorizacion",
  "mat.u2.gauss",
  "mat.u2.mcm_mcd_polinomios",
  "mat.u2.ecuaciones_fraccionarias",
] as const;

// ── Unit 3: Ecuaciones y desigualdades ────────────────────────────────────

export const UNIT_3_SKILLS: readonly SkillId[] = [
  "mat.u3.traduccion_lenguaje_verbal",
  "mat.u3.ecuaciones_lineales",
  "mat.u3.ecuaciones_cuadraticas",
  "mat.u3.inecuaciones_lineales",
  "mat.u3.inecuaciones_valor_absoluto",
  "mat.u3.recta",
  "mat.u3.sistemas",
  "mat.u3.exponenciales",
  "mat.u3.logaritmicas",
] as const;

// ── Unit 4: Geometría y medidas ───────────────────────────────────────────

export const UNIT_4_SKILLS: readonly SkillId[] = [
  "mat.u4.perimetro_area_volumen",
  "mat.u4.proporciones",
  "mat.u4.thales",
  "mat.u4.pitagoras",
  "mat.u4.razones_trigonometricas",
  "mat.u4.seno_coseno",
] as const;

// ── Unit 5: Trigonometría ─────────────────────────────────────────────────

export const UNIT_5_SKILLS: readonly SkillId[] = [
  "mat.u5.angulos",
  "mat.u5.radianes",
  "mat.u5.circunferencia_trigonometrica",
  "mat.u5.identidades",
  "mat.u5.ecuaciones_trigonometricas",
  "mat.u5.complejos_forma_polar",
] as const;

// ── Unit 6: Funciones ─────────────────────────────────────────────────────

export const UNIT_6_SKILLS: readonly SkillId[] = [
  "mat.u6.funcion_concepto",
  "mat.u6.dominio_imagen",
  "mat.u6.ceros_positividad_negatividad",
  "mat.u6.crecimiento_decrecimiento",
  "mat.u6.funcion_afin",
  "mat.u6.funcion_cuadratica",
  "mat.u6.funcion_exponencial",
  "mat.u6.funcion_logaritmica",
  "mat.u6.funcion_trigonometrica",
  "mat.u6.funcion_por_tramos",
] as const;

// ── All skills flat ───────────────────────────────────────────────────────

export const ALL_SKILLS: readonly SkillId[] = [
  ...UNIT_1_SKILLS,
  ...UNIT_2_SKILLS,
  ...UNIT_3_SKILLS,
  ...UNIT_4_SKILLS,
  ...UNIT_5_SKILLS,
  ...UNIT_6_SKILLS,
] as const;

/** Set of all known skill IDs for validation. */
export const KNOWN_SKILL_IDS: Set<SkillId> = new Set<SkillId>(ALL_SKILLS);

// ── Prerequisite dependencies (from spec 06) ─────────────────────────────

export interface SkillDependency {
  readonly skillId: SkillId;
  readonly prerequisites: readonly SkillId[];
}

export const SKILL_DEPENDENCIES: readonly SkillDependency[] = [
  { skillId: "mat.u1.propiedades_operaciones_reales", prerequisites: ["mat.u1.conjuntos_numericos"] },
  { skillId: "mat.u1.potencias_raices", prerequisites: ["mat.u1.propiedades_operaciones_reales"] },
  { skillId: "mat.u1.racionalizacion", prerequisites: ["mat.u1.potencias_raices"] },
  { skillId: "mat.u1.valor_absoluto", prerequisites: ["mat.u1.intervalos"] },
  { skillId: "mat.u1.logaritmos", prerequisites: ["mat.u1.valor_absoluto"] },
  { skillId: "mat.u1.complejos", prerequisites: ["mat.u1.propiedades_operaciones_reales"] },

  { skillId: "mat.u2.operaciones_polinomios", prerequisites: ["mat.u2.polinomios_basico"] },
  { skillId: "mat.u2.ruffini_resto", prerequisites: ["mat.u2.operaciones_polinomios"] },
  { skillId: "mat.u2.factorizacion", prerequisites: ["mat.u2.operaciones_polinomios", "mat.u2.ruffini_resto"] },
  { skillId: "mat.u2.gauss", prerequisites: ["mat.u2.ruffini_resto"] },
  { skillId: "mat.u2.mcm_mcd_polinomios", prerequisites: ["mat.u2.factorizacion"] },
  { skillId: "mat.u2.ecuaciones_fraccionarias", prerequisites: ["mat.u2.factorizacion", "mat.u2.mcm_mcd_polinomios"] },

  { skillId: "mat.u3.inecuaciones_valor_absoluto", prerequisites: ["mat.u1.valor_absoluto", "mat.u3.inecuaciones_lineales"] },
  { skillId: "mat.u3.recta", prerequisites: ["mat.u3.ecuaciones_lineales"] },
  { skillId: "mat.u3.exponenciales", prerequisites: ["mat.u1.potencias_raices"] },
  { skillId: "mat.u3.logaritmicas", prerequisites: ["mat.u1.logaritmos"] },

  { skillId: "mat.u4.pitagoras", prerequisites: ["mat.u1.potencias_raices"] },
  { skillId: "mat.u4.razones_trigonometricas", prerequisites: ["mat.u4.pitagoras"] },

  { skillId: "mat.u5.ecuaciones_trigonometricas", prerequisites: ["mat.u5.identidades"] },
  { skillId: "mat.u5.complejos_forma_polar", prerequisites: ["mat.u1.complejos", "mat.u5.radianes"] },

  { skillId: "mat.u6.dominio_imagen", prerequisites: ["mat.u1.intervalos"] },
  { skillId: "mat.u6.funcion_afin", prerequisites: ["mat.u3.recta"] },
  { skillId: "mat.u6.funcion_cuadratica", prerequisites: ["mat.u3.ecuaciones_cuadraticas"] },
  { skillId: "mat.u6.funcion_por_tramos", prerequisites: ["mat.u6.dominio_imagen", "mat.u6.ceros_positividad_negatividad"] },
] as const;
