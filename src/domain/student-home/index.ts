/**
 * Student Home — view-model derivation.
 *
 * Pure domain function: no React, Next.js, Supabase, or I/O.
 * Receives pre-computed `nextStep` (from `deriveHomeNextStep`) as input
 * alongside progress, diagnostic, and skill catalogs.
 */
import type { PracticeProgress, Trend } from "../progress/index";
import { computeMasteryLevel } from "../progress/index";
import type { HomeNextStep, ReadySkill } from "../next-step/index";
import type { PilotSkill } from "../catalog/pilot-skills";
import type { SkillAvailabilityStatus } from "../catalog/skill-availability";
import { getSkillAvailability } from "../catalog/skill-availability";
import type { DiagnosticResult } from "../diagnostic/index";
import { parseSkillUnit } from "../shared/skill-id";

// ── Constants ────────────────────────────────────────────────────────────────

/** Accuracy below this threshold marks a skill as weak for recovery. */
export const WEAK_SKILL_THRESHOLD = 0.7;

/** Diagnostic estimate accuracy below this threshold marks a weak estimate. */
export const DIAGNOSTIC_WEAK_THRESHOLD = 0.7;

/** Maximum recovery cards shown in primaryActions. */
const MAX_RECOVERY_CARDS = 3;

// ── Public types ─────────────────────────────────────────────────────────────

export interface StudentHomeInput {
  readonly progress: PracticeProgress;
  readonly diagnosticResult?: DiagnosticResult | null;
  readonly availableSkills: readonly ReadySkill[];
  readonly pilotSkills: readonly PilotSkill[];
  readonly nextStep: HomeNextStep;
}

export interface StudentHomeViewModel {
  /** Hero / mission panel data. */
  readonly mission: Mission;
  /** Action cards with verified hrefs. */
  readonly primaryActions: readonly StudentHomeAction[];
  /** Exactly 6 units U1–U6 with status and skill counts. */
  readonly routeUnits: readonly StudentRouteUnit[];
  /** Student stats (diagnostic date, readiness, counts). */
  readonly studentSituation: StudentSituation;
  /** Suggested actions derived from current progress evidence. */
  readonly suggestedActions: readonly StudentSuggestedAction[];
}

export interface Mission {
  readonly subtitle: string;
  readonly ctaLabel: string;
  readonly ctaHref: string;
}

export interface StudentHomeAction {
  readonly label: string;
  readonly href: string;
  readonly description: string;
}

export interface StudentRouteUnit {
  readonly unitKey: string;
  readonly unitNumber: number;
  readonly status: "mastered" | "in-progress" | "not-started";
  readonly skillCount: number;
  /** Best available state among the unit's skills (practice-ready > theory-ready > in-preparation > coming-soon). */
  readonly availability: SkillAvailabilityStatus;
  /** Per-skill breakdown. Empty for units with no pilot skills (U3-U6 today). */
  readonly skills: readonly RouteSkill[];
}

export interface RouteSkill {
  readonly skillId: string;
  readonly label: string;
  readonly availability: SkillAvailabilityStatus;
  /**
   * True if the student has mastered this skill (per computeMasteryLevel).
   * Drives the "temas superados" chips in the MathRoutePanel card.
   * Orthogonal to `availability`: a skill can be `practice-ready` but
   * not yet mastered (e.g. the student hasn't attempted it), and a
   * skill can be mastered but its availability may have changed.
   */
  readonly mastered: boolean;
}

export interface StudentSituation {
  readonly diagnosticCompletedAt: string | null;
  readonly weakSkillsCount: number;
  readonly totalSkillsCount: number;
  readonly practicedSkillsCount: number;
  readonly totalPilotCount: number;
  readonly readinessPercent: number;
}

export interface StudentSuggestedAction {
  readonly skillId: string;
  readonly skillLabel: string;
  readonly reason: string;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Derive the student home view-model from prepared inputs.
 *
 * Pure function — no I/O, no randomness, no side effects.
 *
 * @param input - Progress, diagnostic, skill catalogs, and pre-computed nextStep.
 * @returns Complete StudentHomeViewModel with all fields populated.
 */
export function deriveStudentHomeViewModel(
  input: StudentHomeInput
): StudentHomeViewModel {
  const { progress, diagnosticResult, availableSkills, pilotSkills, nextStep } =
    input;

  const studentSituation = buildStudentSituation(
    progress,
    diagnosticResult,
    nextStep,
    availableSkills,
    pilotSkills
  );

  const mission = buildMission(progress, nextStep, diagnosticResult);
  const primaryActions = buildPrimaryActions(progress, availableSkills, pilotSkills);
  const routeUnits = buildRouteUnits(progress, pilotSkills);
  const suggestedActions = buildSuggestedActions(
    progress,
    availableSkills,
    pilotSkills,
    nextStep
  );

  return {
    mission,
    primaryActions,
    routeUnits,
    studentSituation,
    suggestedActions,
  };
}

// ── Mission ──────────────────────────────────────────────────────────────────

// B3 (redesign closeout, latest revision): the brand is shown
// ONCE in the layout, in the top-left brand mark of the header
// (`INGENIUM`, all-caps). The hero panel has no title of its
// own; it goes straight from the welcome subtitle to the
// primary CTA. The Mission view-model therefore carries only
// subtitle + ctaLabel + ctaHref, not title.
//
// The subtitle is imperative-only: it speaks to the student
// with "empezá" / "seguí" / "repasá" and chooses the right
// one based on whether the student has already started.
// It does NOT re-state the institute's full name (redundant
// with the brand mark in the header).
// See AGENTS.md "Marca y voz".

// No previous attempts → student hasn't entered the app yet.
// Point them at the lowest-friction entry: the diagnostic.
const MISSION_SUBTITLE_NO_ATTEMPTS =
  "Empezá por el diagnóstico inicial o seguí donde dejaste.";

// Student has at least one attempt → they have a "previous
// step" and a "history of seen topics". Name the two real
// next actions: resume the previous step, or revisit
// something they have already seen.
const MISSION_SUBTITLE_HAS_ATTEMPTS =
  "Seguí donde dejaste o repasá algún tema que ya viste.";

function buildMission(
  progress: PracticeProgress,
  nextStep: HomeNextStep,
  diagnosticResult: DiagnosticResult | null | undefined
): Mission {
  const hasCompletedDiagnostic =
    diagnosticResult !== null && diagnosticResult !== undefined;
  if (progress.attempts.length === 0 && !hasCompletedDiagnostic) {
    return {
      subtitle: MISSION_SUBTITLE_NO_ATTEMPTS,
      ctaLabel: "Hacer diagnóstico inicial",
      ctaHref: "/diagnostic",
    };
  }

  return {
    subtitle: MISSION_SUBTITLE_HAS_ATTEMPTS,
    ctaLabel: nextStep.title,
    ctaHref: nextStep.href,
  };
}

// ── Student situation ────────────────────────────────────────────────────────

function buildStudentSituation(
  progress: PracticeProgress,
  diagnosticResult: DiagnosticResult | null | undefined,
  nextStep: HomeNextStep,
  availableSkills: readonly ReadySkill[],
  pilotSkills: readonly PilotSkill[]
): StudentSituation {
  const practicedSkillIds = new Set(
    progress.attempts.map((a) => a.skillId)
  );

  // Diagnostic stats: prefer the input.diagnosticResult that the
  // caller passed via StudentHomeInput (it is the source of
  // truth for the home view), and fall back to whatever is
  // carried on progress for the case where the caller did not
  // pass it explicitly.
  const effectiveDiagnosticResult =
    diagnosticResult ?? progress.diagnosticResult ?? null;
  const diagnosticCompletedAt =
    effectiveDiagnosticResult?.completedAt ?? null;

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
    diagnosticCompletedAt,
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
): readonly StudentHomeAction[] {
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

/**
 * Derive the best-availability of a unit from its constituent pilot skills.
 *
 * Precedence: practice-ready > theory-ready > in-preparation > coming-soon
 * (coming-soon only occurs when skills=[] — handled at call-site).
 */
function computeUnitAvailability(skills: readonly PilotSkill[]): SkillAvailabilityStatus {
  const availabilities = skills.map((s) => getSkillAvailability(s.skillId));

  if (availabilities.some((a) => a === "practice-ready")) return "practice-ready";
  if (availabilities.some((a) => a === "theory-ready")) return "theory-ready";
  if (availabilities.every((a) => a === "in-preparation")) return "in-preparation";
  return "in-preparation";
}

function buildRouteUnits(
  progress: PracticeProgress,
  pilotSkills: readonly PilotSkill[]
): readonly StudentRouteUnit[] {
  // Group pilot skills by unit number
  const byUnit = new Map<number, PilotSkill[]>();

  for (const skill of pilotSkills) {
    const unitNumber = parseSkillUnit(skill.skillId);
    const existing = byUnit.get(unitNumber) ?? [];
    existing.push(skill);
    byUnit.set(unitNumber, existing);
  }

  // Always produce 6 units U1–U6
  const result: StudentRouteUnit[] = [];
  for (let unitNumber = 1; unitNumber <= 6; unitNumber++) {
    const skills = byUnit.get(unitNumber) ?? [];

    if (skills.length === 0) {
      // U3–U6 have no pilot skills → honest coming-soon state
      result.push({
        unitKey: `unit-${unitNumber}`,
        unitNumber,
        status: "not-started",
        skillCount: 0,
        availability: "coming-soon",
        skills: [],
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

    let status: StudentRouteUnit["status"];
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
      availability: computeUnitAvailability(skills),
      skills: skills.map((s) => ({
        skillId: s.skillId,
        label: s.label,
        availability: getSkillAvailability(s.skillId),
        mastered: computeMasteryLevel(s.skillId, progress) === "mastered",
      })),
    });
  }

  return result;
}

// ── Suggested actions ────────────────────────────────────────────────────────

function buildSuggestedActions(
  progress: PracticeProgress,
  availableSkills: readonly ReadySkill[],
  pilotSkills: readonly PilotSkill[],
  nextStep: HomeNextStep
): readonly StudentSuggestedAction[] {
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
