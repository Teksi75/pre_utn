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

  // The pedagogical chain is encoded by the order of `readySkills` (PILOT_SKILLS).
  // Walk it in order: the first skill with no attempts, whose every predecessor has
  // acceptable progress (attempts, accuracy >= LOW_ACCURACY_THRESHOLD, no needs-review),
  // is the next pedagogical step. The diagnostic branch above still wins when the
  // user has never practiced anything.
  const firstUnattemptedReadySkill = readySkills.find(({ skillId }, index) => {
    const hasAttempts = progress.attempts.some((attempt) => attempt.skillId === skillId);
    if (hasAttempts) return false;

    const previousReadySkills = readySkills.slice(0, index);
    return previousReadySkills.every((skill) => {
      const attempts = progress.attempts.filter((attempt) => attempt.skillId === skill.skillId);
      const accuracy = progress.accuracyBySkill[skill.skillId] ?? 0;
      const trend = progress.trendBySkill[skill.skillId] as Trend | undefined;

      return attempts.length > 0 && accuracy >= LOW_ACCURACY_THRESHOLD && trend !== "needs-review";
    });
  });

  if (firstUnattemptedReadySkill) {
    return {
      kind: "practice",
      title: `Practicar ${firstUnattemptedReadySkill.label}`,
      description: "Este es el próximo paso disponible del camino de Unidad 1 antes de avanzar a temas posteriores.",
      href: `/practice?skill=${firstUnattemptedReadySkill.skillId}`,
      skillId: firstUnattemptedReadySkill.skillId,
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
