/**
 * Teacher Digital Home — view-model derivation.
 *
 * Pure domain function: no React, Next.js, Supabase, or I/O.
 * Receives pre-computed `nextStep` (from `deriveHomeNextStep`) as input
 * alongside progress, diagnostic, and skill catalogs.
 */
import type { PracticeProgress, Trend } from "../progress/index";
import { computeMasteryLevel } from "../progress/index";
import type { HomeNextStep, ReadySkill } from "../next-step/index";
import type { PilotSkill } from "../catalog/pilot-skills";
import type { DiagnosticResult } from "../diagnostic/index";

// ── Constants ────────────────────────────────────────────────────────────────

/** Accuracy below this threshold marks a skill as weak for recovery. */
export const WEAK_SKILL_THRESHOLD = 0.7;

/** Diagnostic estimate accuracy below this threshold marks a weak estimate. */
export const DIAGNOSTIC_WEAK_THRESHOLD = 0.7;

/** Maximum recovery cards shown in primaryActions. */
const MAX_RECOVERY_CARDS = 3;

// ── Public types ─────────────────────────────────────────────────────────────

export interface TeacherHomeInput {
  readonly progress: PracticeProgress;
  readonly diagnosticResult?: DiagnosticResult | null;
  readonly availableSkills: readonly ReadySkill[];
  readonly pilotSkills: readonly PilotSkill[];
  readonly nextStep: HomeNextStep;
}

export interface TeacherHomeViewModel {
  /** Contextual message to the teacher. */
  readonly teacherMessage: string;
  /** Hero / mission panel data. */
  readonly mission: Mission;
  /** Action cards with verified hrefs. */
  readonly primaryActions: readonly TeacherHomeAction[];
  /** Exactly 6 units U1–U6 with status and skill counts. */
  readonly routeUnits: readonly TeacherRouteUnit[];
  /** Student stats (diagnostic date, readiness, counts). */
  readonly studentSituation: StudentSituation;
  /** Today's plan steps. */
  readonly todayPlan: readonly TeacherPlanStep[];
}

export interface Mission {
  readonly title: string;
  readonly subtitle: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
}

export interface TeacherHomeAction {
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export interface TeacherRouteUnit {
  readonly unitKey: string;
  readonly unitNumber: number;
  readonly status: "mastered" | "in-progress" | "not-started";
  readonly skillCount: number;
}

export interface StudentSituation {
  readonly diagnosticCompletedAt: string | null;
  readonly weakSkillsCount: number;
  readonly totalSkillsCount: number;
  readonly practicedSkillsCount: number;
  readonly totalPilotCount: number;
  readonly readinessPercent: number;
}

export interface TeacherPlanStep {
  readonly skillId: string;
  readonly skillLabel: string;
  readonly reason: string;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Derive the teacher home view-model from prepared inputs.
 *
 * Pure function — no I/O, no randomness, no side effects.
 *
 * @param input - Progress, diagnostic, skill catalogs, and pre-computed nextStep.
 * @returns Complete TeacherHomeViewModel with all fields populated.
 */
export function deriveTeacherHomeViewModel(
  input: TeacherHomeInput
): TeacherHomeViewModel {
  const { progress, diagnosticResult, availableSkills, pilotSkills, nextStep } =
    input;

  const studentSituation = buildStudentSituation(
    progress,
    nextStep,
    availableSkills,
    pilotSkills
  );

  const teacherMessage = buildTeacherMessage(progress, studentSituation);
  const mission = buildMission(progress, nextStep);
  const primaryActions = buildPrimaryActions(progress, availableSkills, pilotSkills);
  const routeUnits = buildRouteUnits(progress, pilotSkills);
  const todayPlan = buildTodayPlan(progress, availableSkills, pilotSkills, nextStep);

  return {
    teacherMessage,
    mission,
    primaryActions,
    routeUnits,
    studentSituation,
    todayPlan,
  };
}

// ── Teacher message ──────────────────────────────────────────────────────────

function buildTeacherMessage(
  progress: PracticeProgress,
  situation: StudentSituation
): string {
  if (progress.attempts.length === 0) {
    return "Sin datos de práctica todavía. Empezá con un diagnóstico para obtener un panorama inicial.";
  }
  if (situation.weakSkillsCount > 0) {
    return `Hay ${situation.weakSkillsCount} habilidades que necesitan atención. Revisá las acciones recomendadas.`;
  }
  if (situation.readinessPercent >= 80) {
    return "El alumno va bien encaminado. Revisá las áreas específicas para seguir avanzando.";
  }
  return "Progreso en curso. Continuá practicando para consolidar las habilidades.";
}

// ── Mission ──────────────────────────────────────────────────────────────────

function buildMission(
  progress: PracticeProgress,
  nextStep: HomeNextStep
): Mission {
  if (progress.attempts.length === 0) {
    return {
      title: "Bienvenido/a al panel docente",
      subtitle:
        "Realizá un diagnóstico inicial para detectar qué áreas necesitan más atención y recibir un plan de práctica personalizado.",
      ctaLabel: "Hacer diagnóstico inicial",
      ctaHref: "/diagnostic",
    };
  }

  return {
    title: "Tu panel de decisiones",
    subtitle:
      "Revisá el progreso de tus estudiantes, las áreas con dificultad y las próximas acciones recomendadas.",
    ctaLabel: nextStep.title,
    ctaHref: nextStep.href,
  };
}

// ── Student situation ────────────────────────────────────────────────────────

function buildStudentSituation(
  progress: PracticeProgress,
  nextStep: HomeNextStep,
  availableSkills: readonly ReadySkill[],
  pilotSkills: readonly PilotSkill[]
): StudentSituation {
  const practicedSkillIds = new Set(
    progress.attempts.map((a) => a.skillId)
  );

  // Diagnostic stats from nextStep's pre-computed summary
  const diagnosticWeak =
    nextStep.diagnosticSummary?.weakSkills ?? 0;
  const diagnosticTotal =
    nextStep.diagnosticSummary?.totalSkills ?? 0;

  // Also count weak skills from practice data (accuracy < threshold or needs-review)
  const practiceWeakCount = availableSkills.filter(({ skillId }) => {
    const hasAttempts = progress.attempts.some((a) => a.skillId === skillId);
    if (!hasAttempts) return false;
    const accuracy = progress.accuracyBySkill[skillId] ?? 0;
    const trend = (progress.trendBySkill[skillId] ?? "stable") as Trend;
    return accuracy < WEAK_SKILL_THRESHOLD || trend === "needs-review";
  }).length;

  // weakSkillsCount: max of diagnostic count and practice-based count
  const weakSkillsCount = Math.max(diagnosticWeak, practiceWeakCount);

  return {
    diagnosticCompletedAt:
      progress.diagnosticResult?.completedAt ?? null,
    weakSkillsCount,
    totalSkillsCount:
      diagnosticTotal > 0 ? diagnosticTotal : pilotSkills.length,
    practicedSkillsCount: practicedSkillIds.size,
    totalPilotCount: pilotSkills.length,
    readinessPercent:
      progress.attempts.length === 0
        ? 0
        : pilotSkills.length > 0
          ? Math.round((availableSkills.length / pilotSkills.length) * 100)
          : 0,
  };
}

// ── Primary actions ──────────────────────────────────────────────────────────

function buildPrimaryActions(
  progress: PracticeProgress,
  availableSkills: readonly ReadySkill[],
  pilotSkills: readonly PilotSkill[]
): readonly TeacherHomeAction[] {
  // No attempts → diagnostic CTA
  if (progress.attempts.length === 0) {
    return [
      {
        label: "Hacer diagnóstico inicial",
        description:
          "Realizá un diagnóstico corto para detectar qué áreas necesitan más atención.",
        href: "/diagnostic",
      },
    ];
  }

  // Find weak ready skills: must have attempts AND be below threshold
  const weakSkills = availableSkills.filter(({ skillId }) => {
    const hasAttempts = progress.attempts.some(
      (a) => a.skillId === skillId
    );
    if (!hasAttempts) return false;

    const accuracy = progress.accuracyBySkill[skillId] ?? 0;
    const trend = (progress.trendBySkill[skillId] ?? "stable") as Trend;
    return accuracy < WEAK_SKILL_THRESHOLD || trend === "needs-review";
  });

  if (weakSkills.length > 0) {
    return weakSkills.slice(0, MAX_RECOVERY_CARDS).map((skill) => ({
      label: `Practicar ${skill.label}`,
      description:
        "Tu progreso muestra que esta habilidad necesita recuperación antes de avanzar.",
      href: `/practice?skill=${skill.skillId}`,
    }));
  }

  // No weak skills → look for first unattempted ready skill
  const firstUnattempted = availableSkills.find(({ skillId }) => {
    return !progress.attempts.some((a) => a.skillId === skillId);
  });

  if (firstUnattempted) {
    const unitNumber = parseSkillUnit(firstUnattempted.skillId);
    return [
      {
        label: `Practicar ${firstUnattempted.label}`,
        description: `Este es el próximo paso disponible del camino de Unidad ${unitNumber} antes de avanzar a temas posteriores.`,
        href: `/practice?skill=${firstUnattempted.skillId}`,
      },
    ];
  }

  // All skills progressing → generic review
  return [
    {
      label: "Seguir repasando",
      description:
        "Seguí revisando la teoría y los ejemplos disponibles, o repetí el diagnóstico para recalibrar.",
      href: "/learn/matematica",
    },
  ];
}

// ── Route units (6 units U1–U6) ──────────────────────────────────────────────

function buildRouteUnits(
  progress: PracticeProgress,
  pilotSkills: readonly PilotSkill[]
): readonly TeacherRouteUnit[] {
  // Group pilot skills by unit number
  const byUnit = new Map<number, PilotSkill[]>();

  for (const skill of pilotSkills) {
    const unitNumber = parseSkillUnit(skill.skillId);
    const existing = byUnit.get(unitNumber) ?? [];
    existing.push(skill);
    byUnit.set(unitNumber, existing);
  }

  // Always produce 6 units U1–U6
  const result: TeacherRouteUnit[] = [];
  for (let unitNumber = 1; unitNumber <= 6; unitNumber++) {
    const skills = byUnit.get(unitNumber) ?? [];

    if (skills.length === 0) {
      result.push({
        unitKey: `unit-${unitNumber}`,
        unitNumber,
        status: "not-started",
        skillCount: 0,
      });
      continue;
    }

    // Determine status from constituent skills
    const allMastered = skills.every((s) => {
      const mastery = computeMasteryLevel(s.skillId, progress);
      return mastery === "mastered";
    });

    const anyAttempted = skills.some((s) => {
      return progress.attempts.some((a) => a.skillId === s.skillId);
    });

    let status: TeacherRouteUnit["status"];
    if (allMastered) {
      status = "mastered";
    } else if (anyAttempted) {
      status = "in-progress";
    } else {
      status = "not-started";
    }

    result.push({
      unitKey: `unit-${unitNumber}`,
      unitNumber,
      status,
      skillCount: skills.length,
    });
  }

  return result;
}

// ── Today plan ───────────────────────────────────────────────────────────────

function buildTodayPlan(
  progress: PracticeProgress,
  availableSkills: readonly ReadySkill[],
  pilotSkills: readonly PilotSkill[],
  nextStep: HomeNextStep
): readonly TeacherPlanStep[] {
  // No attempts → diagnostic CTA
  if (progress.attempts.length === 0) {
    return [
      {
        skillId: "diagnostic",
        skillLabel: "Diagnóstico inicial",
        reason: "Sin datos de práctica — realizá un diagnóstico para empezar.",
      },
    ];
  }

  // Find weak ready skills
  const weakReady = availableSkills.filter(({ skillId }) => {
    const hasAttempts = progress.attempts.some((a) => a.skillId === skillId);
    if (!hasAttempts) return false;
    const accuracy = progress.accuracyBySkill[skillId] ?? 0;
    const trend = (progress.trendBySkill[skillId] ?? "stable") as Trend;
    return accuracy < WEAK_SKILL_THRESHOLD || trend === "needs-review";
  });

  if (weakReady.length > 0) {
    return weakReady.slice(0, MAX_RECOVERY_CARDS).map((skill) => ({
      skillId: skill.skillId,
      skillLabel: skill.label,
      reason:
        "Esta habilidad necesita recuperación antes de avanzar a temas posteriores.",
    }));
  }

  // No weak skills → check for unattempted
  const firstUnattempted = availableSkills.find(
    ({ skillId }) =>
      !progress.attempts.some((a) => a.skillId === skillId)
  );

  if (firstUnattempted) {
    return [
      {
        skillId: firstUnattempted.skillId,
        skillLabel: firstUnattempted.label,
        reason: "Próximo paso disponible para avanzar en el camino de aprendizaje.",
      },
    ];
  }

  // All progressing → generic review
  return [
    {
      skillId: "review",
      skillLabel: "Repaso general",
      reason:
        "Todas las habilidades disponibles están en progreso. Repasá teoría o repetí el diagnóstico para recalibrar.",
    },
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the unit number (1–6) from a SkillId like `mat.u2.polinomios_basico`.
 * Unknown patterns default to unit 1.
 */
function parseSkillUnit(skillId: string): number {
  const match = skillId.match(/^mat\.u(\d+)\./);
  return match ? parseInt(match[1], 10) : 1;
}
