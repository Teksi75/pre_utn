import type { SkillId } from "../models/skill";

export interface PilotSkill {
  readonly skillId: SkillId;
  readonly unitKey: string;
  readonly label: string;
}

export const PILOT_SKILLS: readonly PilotSkill[] = [
  {
    skillId: "mat.u1.conjuntos_numericos",
    unitKey: "unit-1",
    label: "Conjuntos numéricos",
  },
  {
    skillId: "mat.u1.propiedades_operaciones_reales",
    unitKey: "unit-1",
    label: "Propiedades Operaciones de Números reales",
  },
  {
    skillId: "mat.u1.potencias_raices",
    unitKey: "unit-1",
    label: "Potencias y raíces",
  },
  {
    skillId: "mat.u1.racionalizacion",
    unitKey: "unit-1",
    label: "Racionalización de denominadores",
  },
  {
    skillId: "mat.u1.intervalos",
    unitKey: "unit-1",
    label: "Intervalos",
  },
  {
    skillId: "mat.u1.valor_absoluto",
    unitKey: "unit-1",
    label: "Valor absoluto",
  },
  {
    skillId: "mat.u1.logaritmos",
    unitKey: "unit-1",
    label: "Logaritmos",
  },
  {
    skillId: "mat.u1.complejos",
    unitKey: "unit-1",
    label: "Números complejos",
  },
  {
    skillId: "mat.u2.polinomios_basico",
    unitKey: "unit-2",
    label: "Polinomios: definición y clasificación",
  },
  {
    skillId: "mat.u2.operaciones_polinomios",
    unitKey: "unit-2",
    label: "Operaciones con polinomios",
  },
  {
    skillId: "mat.u2.ruffini_resto",
    unitKey: "unit-2",
    label: "Regla de Ruffini y teorema del resto",
  },
  {
    skillId: "mat.u2.factorizacion",
    unitKey: "unit-2",
    label: "Factorización de polinomios",
  },
  {
    skillId: "mat.u2.gauss",
    unitKey: "unit-2",
    label: "Método de Gauss",
  },
  {
    skillId: "mat.u2.mcm_mcd_polinomios",
    unitKey: "unit-2",
    label: "MCM y MCD de polinomios",
  },
  {
    skillId: "mat.u2.ecuaciones_fraccionarias",
    unitKey: "unit-2",
    label: "Ecuaciones fraccionarias",
  },
  {
    skillId: "mat.u3.ecuaciones_lineales",
    unitKey: "unit-3",
    label: "Ecuaciones lineales",
  },
  {
    skillId: "mat.u3.ecuaciones_cuadraticas",
    unitKey: "unit-3",
    label: "Ecuaciones cuadráticas",
  },
  {
    skillId: "mat.u3.inecuaciones_lineales",
    unitKey: "unit-3",
    label: "Inecuaciones lineales",
  },
  {
    skillId: "mat.u3.inecuaciones_valor_absoluto",
    unitKey: "unit-3",
    label: "Inecuaciones con valor absoluto",
  },
  {
    skillId: "mat.u3.recta",
    unitKey: "unit-3",
    label: "Ecuación de la recta",
  },
  {
    skillId: "mat.u3.sistemas",
    unitKey: "unit-3",
    label: "Sistemas de ecuaciones",
  },
  {
    skillId: "mat.u3.exponenciales",
    unitKey: "unit-3",
    label: "Ecuaciones exponenciales",
  },
  {
    skillId: "mat.u3.logaritmicas",
    unitKey: "unit-3",
    label: "Ecuaciones logarítmicas",
  },
] as const;

/**
 * Map from skillId to unitKey for quick lookup.
 *
 * The value type is intentionally `string | undefined` (not `string`) to
 * allow consumers to handle unknown skills without runtime exceptions.
 * Consumers receive `skillId` from URL params (`?skill=...`) which are not
 * pre-validated as `SkillId`, so the lookup must tolerate arbitrary keys.
 *
 * For strictly-typed lookups, use `Object.hasOwn(PILOT_SKILL_UNIT_MAP, skillId)`
 * or `skillId in PILOT_SKILL_UNIT_MAP` as a type guard.
 */
export const PILOT_SKILL_UNIT_MAP: Readonly<Record<string, string | undefined>> =
  Object.fromEntries(
    PILOT_SKILLS.map((skill) => [skill.skillId, skill.unitKey])
  );
