import type { PracticeProgress, Trend } from "../progress/index";
import type { SkillId } from "../models/skill";

const LOW_ACCURACY_THRESHOLD = 0.7;

export type HomeNextStepKind = "diagnostic" | "practice" | "continue-unit";

export interface ReadySkill {
  readonly skillId: SkillId;
  readonly label: string;
}

export interface HomeNextStep {
  readonly kind: HomeNextStepKind;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly skillId?: SkillId;
}

export function deriveHomeNextStep(
  progress: Pick<PracticeProgress, "attempts" | "accuracyBySkill" | "trendBySkill">,
  readySkills: readonly ReadySkill[]
): HomeNextStep {
  if (progress.attempts.length === 0) {
    return {
      kind: "diagnostic",
      title: "Hacer diagnóstico inicial",
      description: "Empezá con un diagnóstico corto para detectar qué conviene practicar primero.",
      href: "/diagnostic",
    };
  }

  const weakReadySkill = readySkills.find(({ skillId }) => {
    const attempts = progress.attempts.filter((attempt) => attempt.skillId === skillId);
    if (attempts.length === 0) return false;

    const accuracy = progress.accuracyBySkill[skillId] ?? 0;
    const trend = progress.trendBySkill[skillId] as Trend | undefined;

    return accuracy < LOW_ACCURACY_THRESHOLD || trend === "needs-review";
  });

  if (weakReadySkill) {
    return {
      kind: "practice",
      title: `Practicar ${weakReadySkill.label}`,
      description: "Tu progreso muestra que esta habilidad necesita recuperación antes de avanzar.",
      href: `/practice?skill=${weakReadySkill.skillId}`,
      skillId: weakReadySkill.skillId,
    };
  }

  return {
    kind: "continue-unit",
    title: "Continuar Unidad 1 parcial",
    description: "Seguí revisando la teoría y los ejemplos disponibles, o repetí el diagnóstico para recalibrar.",
    href: "/learn/matematica",
  };
}
