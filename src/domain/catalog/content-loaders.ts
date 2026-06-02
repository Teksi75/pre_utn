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
import examplesUnit1 from "../../../content/matematica/examples/unit-1.json";
import feedbackUnit1 from "../../../content/matematica/feedback/unit-1.json";
import exercisesJson from "../../../content/matematica/exercises.json";

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
  },
  examples: {
    "unit-1": examplesUnit1 as unknown as readonly WorkedExample[],
  },
  feedback: {
    "unit-1": feedbackUnit1 as unknown as readonly FeedbackMapping[],
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
 * Checks that every exercise has a category field and that each required
 * category meets its minimum exercise count.
 *
 * @param skillId - The skill being validated
 * @param exercises - The exercises in the bank for this skill
 * @returns Array of diagnostic strings (empty if bank is valid)
 */
export function validatePracticeBank(
  skillId: string,
  exercises: readonly Exercise[]
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

  return diagnostics;
}
