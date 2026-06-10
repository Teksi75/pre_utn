/**
 * Content loaders — loads theory, examples, and feedback from static JSON.
 * No external dependencies. Pure TypeScript.
 */

import type { TheoryNode } from "../models/theory";
import type { WorkedExample } from "../models/worked-example";
import type { FeedbackMapping } from "../feedback/index";
import type { Exercise } from "../models/exercise";

// Static JSON imports
import theoryUnit1 from "../../../content/matematica/theory/unit-1.json";
import theoryUnit2 from "../../../content/matematica/theory/unit-2.json";
import examplesUnit1 from "../../../content/matematica/examples/unit-1.json";
import examplesUnit2 from "../../../content/matematica/examples/unit-2.json";
import feedbackUnit1 from "../../../content/matematica/feedback/unit-1.json";
import feedbackUnit2 from "../../../content/matematica/feedback/unit-2.json";
import feedbackUnit1ConjuntosNumericos from "../../../content/matematica/feedback/unit-1-conjuntos-numericos.json";
import exercisesJson from "../../../content/matematica/exercises.json";
import conjuntosNumericosExercises from "../../../content/matematica/exercises/conjuntos-numericos.json";

/** Linkage metadata for exercises referencing theory and examples. */
export interface ExerciseLinkage {
  readonly exerciseId: string;
  readonly relatedTheoryIds: readonly string[];
  readonly relatedExampleIds: readonly string[];
}

/** Content registry keyed by unit identifier. */
interface ContentRegistry {
  readonly theory: Record<string, readonly TheoryNode[]>;
  readonly examples: Record<string, readonly WorkedExample[]>;
  readonly feedback: Record<string, readonly FeedbackMapping[]>;
}

const REGISTRY: ContentRegistry = {
  theory: {
    "unit-1": theoryUnit1 as unknown as readonly TheoryNode[],
    "unit-2": theoryUnit2 as unknown as readonly TheoryNode[],
  },
  examples: {
    "unit-1": examplesUnit1 as unknown as readonly WorkedExample[],
    "unit-2": examplesUnit2 as unknown as readonly WorkedExample[],
  },
  feedback: {
    "unit-1": feedbackUnit1 as unknown as readonly FeedbackMapping[],
    "unit-2": feedbackUnit2 as unknown as readonly FeedbackMapping[],
    "unit-1-conjuntos-numericos": feedbackUnit1ConjuntosNumericos as unknown as readonly FeedbackMapping[],
  },
};

/**
 * Load theory nodes for a given unit.
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of TheoryNode objects
 * @throws Error if unit key is unknown
 */
export function loadTheoryContent(unitKey: string): readonly TheoryNode[] {
  const nodes = REGISTRY.theory[unitKey];
  if (!nodes) {
    throw new Error(`Unknown theory unit key: ${unitKey}`);
  }
  return nodes;
}

/**
 * Load worked examples for a given unit.
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of WorkedExample objects
 * @throws Error if unit key is unknown
 */
export function loadExampleContent(unitKey: string): readonly WorkedExample[] {
  const examples = REGISTRY.examples[unitKey];
  if (!examples) {
    throw new Error(`Unknown examples unit key: ${unitKey}`);
  }
  return examples;
}

/**
 * Load feedback mappings for a given unit.
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of FeedbackMapping objects
 * @throws Error if unit key is unknown
 */
export function loadFeedbackContent(unitKey: string): readonly FeedbackMapping[] {
  const mappings = REGISTRY.feedback[unitKey];
  if (!mappings) {
    throw new Error(`Unknown feedback unit key: ${unitKey}`);
  }
  return mappings;
}

/**
 * Extract exercise linkage metadata from the raw JSON exercises.
 * Filters to only exercises that have relatedTheoryIds or relatedExampleIds.
 * @param unitKey - Unit identifier (e.g. "unit-1")
 * @returns Array of ExerciseLinkage objects
 */
export function pilotExercisesWithLinks(unitKey: string): readonly ExerciseLinkage[] {
  const raw = exercisesJson as unknown as readonly Record<string, unknown>[];
  const unitNum = Number(unitKey.replace("unit-", ""));

  return raw
    .filter((ex) => {
      const id = ex.id as string;
      const match = /^ex\.u(\d+)\./.exec(id);
      return match && Number(match[1]) === unitNum;
    })
    .filter(
      (ex) =>
        Array.isArray(ex.relatedTheoryIds) || Array.isArray(ex.relatedExampleIds)
    )
    .map((ex) => ({
      exerciseId: ex.id as string,
      relatedTheoryIds: (ex.relatedTheoryIds as readonly string[]) ?? [],
      relatedExampleIds: (ex.relatedExampleIds as readonly string[]) ?? [],
    }));
}

/**
 * Apply backward-compat defaults to a raw exercise object.
 *
 * When loading exercises from JSON, optional metadata fields (category, tags)
 * may be absent. This function fills in sensible defaults so downstream code
 * can rely on their presence without null checks.
 *
 * @param raw - Raw exercise object from JSON (may lack optional fields)
 * @returns Exercise with defaults applied for missing optional fields
 */
export function applyExerciseDefaults(raw: Record<string, unknown>): Exercise {
  return {
    ...raw,
    category: (raw.category as string | undefined) ?? "clasificacion",
    tags: (raw.tags as readonly string[] | undefined) ?? [],
  } as unknown as Exercise;
}

/** Per-skill exercise file registry. */
const SKILL_EXERCISE_FILES: Readonly<Record<string, readonly Record<string, unknown>[]>> = {
  "mat.u1.conjuntos_numericos": conjuntosNumericosExercises as unknown as readonly Record<string, unknown>[],
};

/**
 * Load all exercises for a given skill, merging per-skill files with the main catalog.
 *
 * @param skillId - The skill ID to load exercises for
 * @returns Array of Exercise objects with defaults applied
 */
export function loadExercisesForSkill(skillId: string): readonly Exercise[] {
  const mainRaw = exercisesJson as unknown as readonly Record<string, unknown>[];
  const skillRaw = SKILL_EXERCISE_FILES[skillId] ?? [];

  const mainFiltered = mainRaw.filter((ex) => (ex.skillId as string) === skillId);
  const allRaw = [...mainFiltered, ...skillRaw];

  return allRaw.map(applyExerciseDefaults);
}

/**
 * Result of loading a practice bank: the exercises plus the diagnostics
 * produced by the bank validator.
 */
export interface SkillBank {
  readonly exercises: readonly Exercise[];
  readonly diagnostics: readonly string[];
}

/**
 * Derive the unit feedback key (e.g. "unit-1") from a skill ID.
 * Throws if the skill ID does not match the `mat.u{N}.*` convention.
 */
function skillIdToUnitKey(skillId: string): string {
  const match = /^mat\.u(\d+)\./.exec(skillId);
  if (!match) {
    throw new Error(`Cannot derive unit key from skillId: ${skillId}`);
  }
  return `unit-${match[1]}`;
}

/**
 * Load a skill's practice bank together with validation diagnostics.
 *
 * Wires the bank validator into the catalog load path: callers receive both
 * the exercises and any diagnostics produced by `validatePracticeBank`,
 * without having to call them separately. Backward compatible with
 * `loadExercisesForSkill`, which still returns exercises only.
 *
 * @param skillId - The skill ID to load the bank for
 * @returns Object with `exercises` array and `diagnostics` array (empty if bank is valid)
 */
export function loadSkillBank(skillId: string): SkillBank {
  const exercises = loadExercisesForSkill(skillId);

  // Try to load unit feedback for cross-checking error tag coverage.
  // If the unit is unknown or has no feedback, the validator will skip
  // the coverage check and return diagnostics only for category counts.
  let feedback: readonly FeedbackMapping[] = [];
  try {
    feedback = loadFeedbackContent(skillIdToUnitKey(skillId));
  } catch {
    // No feedback registered for this unit — proceed without.
  }

  const diagnostics = validatePracticeBank(skillId, exercises, feedback);
  return { exercises, diagnostics };
}

/** Per-category minimum exercise counts for practice bank validation. */
const CATEGORY_MINIMUMS: Readonly<Record<string, number>> = {
  pertenencia: 8,
  clasificacion: 12,
  "racionales-vs-irracionales": 8,
  decimales: 6,
  mapa: 4,
  "errores-comunes": 6,
};

/**
 * Validate a practice bank for category coverage and minimum counts.
 *
 * Checks that every exercise has a category field, that each required
 * category meets its minimum exercise count, and that all referenced
 * error tags have corresponding feedback entries.
 *
 * @param skillId - The skill being validated
 * @param exercises - The exercises in the bank for this skill
 * @param feedback - Optional feedback mappings to cross-check against exercise error tags
 * @returns Array of diagnostic strings (empty if bank is valid)
 */
export function validatePracticeBank(
  skillId: string,
  exercises: readonly Exercise[],
  feedback?: readonly FeedbackMapping[]
): readonly string[] {
  const diagnostics: string[] = [];

  // Check for exercises missing the category field
  const missingCategory = exercises.filter((ex) => !ex.category);
  if (missingCategory.length > 0) {
    diagnostics.push(
      `${missingCategory.length} exercise(s) missing category field: ${missingCategory.map((e) => e.id).join(", ")}`
    );
  }

  // Count exercises per category
  const counts = new Map<string, number>();
  for (const ex of exercises) {
    if (ex.category) {
      counts.set(ex.category, (counts.get(ex.category) ?? 0) + 1);
    }
  }

  // Check each required category against its minimum
  for (const [category, minimum] of Object.entries(CATEGORY_MINIMUMS)) {
    const count = counts.get(category) ?? 0;
    if (count < minimum) {
      diagnostics.push(
        `Category "${category}" has ${count} exercise(s) but requires at least ${minimum}`
      );
    }
  }

  // Cross-check feedback coverage for exercises with error tags
  if (feedback) {
    const feedbackTags = new Set(feedback.map((f) => f.errorTag));
    const exercisesWithMissingFeedback = exercises.filter(
      (ex) =>
        ex.commonErrorTags.length > 0 &&
        ex.commonErrorTags.some((tag) => !feedbackTags.has(tag))
    );
    if (exercisesWithMissingFeedback.length > 0) {
      for (const ex of exercisesWithMissingFeedback) {
        const missing = ex.commonErrorTags.filter((tag) => !feedbackTags.has(tag));
        diagnostics.push(
          `Exercise "${ex.id}" references error tag(s) without feedback: ${missing.join(", ")}`
        );
      }
    }
  }

  return diagnostics;
}
