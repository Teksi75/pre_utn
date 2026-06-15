import type { MasteryLevel, PracticeProgress, Trend } from "../progress/index";
import { computeMasteryLevel } from "../progress/index";
import type { DiagnosticResult } from "../diagnostic/index";
import type { SkillId } from "../models/skill";
import { parseSkillUnit } from "../shared/skill-id";

const LOW_ACCURACY_THRESHOLD = 0.7;
/** Below this accuracy, an estimate counts as "weak" for the diagnostic summary. */
const DIAGNOSTIC_WEAK_THRESHOLD = 0.7;

export type HomeNextStepKind = "diagnostic" | "practice" | "continue-unit";

export interface ReadySkill {
  readonly skillId: SkillId;
  readonly label: string;
}

/** A single row in the home roadmap (Zone 2). */
export interface RoadmapSkill {
  readonly skillId: SkillId;
  readonly name: string;
  readonly masteryLevel: MasteryLevel;
  readonly accuracy: number;
}

/** Aggregated diagnostic summary shown above the roadmap when present. */
export interface DiagnosticSummary {
  readonly completedAt: string;
  readonly weakSkills: number;
  readonly totalSkills: number;
}

export interface HomeNextStep {
  readonly kind: HomeNextStepKind;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly skillId?: SkillId;
  /** Ordered list of all pilot skills with their current mastery state. */
  readonly roadmapSkills: readonly RoadmapSkill[];
  /** Aggregated diagnostic snapshot, or null if the user hasn't taken one. */
  readonly diagnosticSummary: DiagnosticSummary | null;
}

/**
 * Derive the next step + roadmap + diagnostic summary for the home page.
 *
 * @param progress - Practice progress (attempts, accuracy, trend, diagnosticResult)
 * @param readySkills - Skills the user can actually start practicing right now
 *                     (the next-step logic only walks this list).
 * @param pilotSkills - Full ordered pilot list used for the roadmap. Defaults
 *                     to `readySkills` so existing callers keep working.
 */
export function deriveHomeNextStep(
  progress: Pick<
    PracticeProgress,
    "attempts" | "accuracyBySkill" | "trendBySkill" | "diagnosticResult"
  >,
  readySkills: readonly ReadySkill[],
  pilotSkills: readonly ReadySkill[] = readySkills,
  effectiveDiagnosticResult?: DiagnosticResult | null
): HomeNextStep {
  const roadmapSkills = buildRoadmapSkills(progress, pilotSkills);
  const diagnosticSummary = buildDiagnosticSummary(progress);

  const hasCompletedDiagnostic =
    (effectiveDiagnosticResult ?? progress.diagnosticResult) !== null &&
    (effectiveDiagnosticResult ?? progress.diagnosticResult) !== undefined;

  if (progress.attempts.length === 0) {
    if (!hasCompletedDiagnostic) {
      return {
        kind: "diagnostic",
        title: "Hacer diagnóstico inicial",
        description: "Empezá con un diagnóstico corto para detectar qué conviene practicar primero.",
        href: "/diagnostic",
        roadmapSkills,
        diagnosticSummary,
      };
    }
    // hasCompletedDiagnostic && no attempts → fall through to practice step resolution
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
    const unit = parseSkillUnit(firstUnattemptedReadySkill.skillId);
    return {
      kind: "practice",
      title: `Practicar ${firstUnattemptedReadySkill.label}`,
      description: `Este es el próximo paso disponible del camino de Unidad ${unit} antes de avanzar a temas posteriores.`,
      href: `/practice?skill=${firstUnattemptedReadySkill.skillId}`,
      skillId: firstUnattemptedReadySkill.skillId,
      roadmapSkills,
      diagnosticSummary,
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
      roadmapSkills,
      diagnosticSummary,
    };
  }

  // Fallback: all ready skills have been practiced with acceptable progress.
  // When multiple units are present, use a generic title to avoid misleading
  // the user into thinking only Unit 1 remains.
  const distinctUnits = new Set(readySkills.map((s) => parseSkillUnit(s.skillId)));
  if (distinctUnits.size > 1) {
    return {
      kind: "continue-unit",
      title: "Seguir repasando",
      description:
        "Seguí revisando la teoría y los ejemplos disponibles, o repetí el diagnóstico para recalibrar.",
      href: "/learn/matematica",
      roadmapSkills,
      diagnosticSummary,
    };
  }

  const fallbackUnit = readySkills.length > 0 ? parseSkillUnit(readySkills[0].skillId) : 1;
  return {
    kind: "continue-unit",
    title: `Continuar Unidad ${fallbackUnit} parcial`,
    description:
      "Seguí revisando la teoría y los ejemplos disponibles, o repetí el diagnóstico para recalibrar.",
    href: "/learn/matematica",
    roadmapSkills,
    diagnosticSummary,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the roadmap rows. Each pilot skill gets a mastery level derived from
 * the user's current progress, plus its current accuracy. Pure function — no
 * side effects.
 */
function buildRoadmapSkills(
  progress: Pick<PracticeProgress, "attempts" | "accuracyBySkill" | "trendBySkill">,
  pilotSkills: readonly ReadySkill[]
): readonly RoadmapSkill[] {
  return pilotSkills.map(({ skillId, label }) => ({
    skillId,
    name: label,
    masteryLevel: computeMasteryLevel(skillId, progress),
    accuracy: progress.accuracyBySkill[skillId] ?? 0,
  }));
}

/**
 * Build the diagnostic summary card data. Returns null when the user hasn't
 * taken a diagnostic yet.
 */
function buildDiagnosticSummary(
  progress: Pick<PracticeProgress, "diagnosticResult">
): DiagnosticSummary | null {
  const result = progress.diagnosticResult;
  if (!result) return null;

  const weakSkills = result.estimates.filter(
    (estimate) => estimate.accuracy < DIAGNOSTIC_WEAK_THRESHOLD
  ).length;

  return {
    completedAt: result.completedAt,
    weakSkills,
    totalSkills: result.estimates.length,
  };
}
