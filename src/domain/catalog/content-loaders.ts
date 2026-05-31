/**
 * Content loaders — loads theory, examples, and feedback from static JSON.
 * No external dependencies. Pure TypeScript.
 */

import type { TheoryNode } from "../models/theory";
import type { WorkedExample } from "../models/worked-example";
import type { FeedbackMapping } from "../feedback/index";

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
