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
