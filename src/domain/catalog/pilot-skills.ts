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
    skillId: "mat.u1.reales_operaciones",
    unitKey: "unit-1",
    label: "Números reales y operaciones",
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
] as const;

export const PILOT_SKILL_UNIT_MAP: Readonly<Record<string, string>> =
  Object.fromEntries(
    PILOT_SKILLS.map((skill) => [skill.skillId, skill.unitKey])
  );
