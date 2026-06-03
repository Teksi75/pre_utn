/**
 * Exercise catalog — loads and queries the static exercise catalog.
 * No external dependencies. Pure TypeScript.
 */

import type { Exercise } from "../models/exercise";
import { validateExercise } from "../models/exercise";
import type { SkillDependency } from "../models/skill-catalog";
import { KNOWN_SKILL_IDS } from "../models/skill-catalog";
import { SKILL_DEPENDENCIES } from "../models/skill-catalog";
import { loadTaxonomy } from "../error-taxonomy/index";

// Import the static JSON catalog
import exercisesJson from "../../../content/matematica/exercises.json";
import conjuntosNumericosExercises from "../../../content/matematica/exercises/conjuntos-numericos.json";
import { applyExerciseDefaults } from "./content-loaders";

/** Skill IDs that have dedicated per-skill exercise files. */
const PER_SKILL_SKILL_IDS = new Set(["mat.u1.conjuntos_numericos"]);

// Cast and compose: take the main catalog, filter out exercises owned by
// per-skill files, then merge in the per-skill file entries with defaults applied.
const mainExercises = exercisesJson as unknown as readonly Record<string, unknown>[];
const MAIN_FILTERED = mainExercises.filter(
  (raw) => !PER_SKILL_SKILL_IDS.has(raw.skillId as string)
);
const PER_SKILL_EXERCISES: Record<string, readonly Record<string, unknown>[]> = {
  "mat.u1.conjuntos_numericos": conjuntosNumericosExercises as unknown as readonly Record<string, unknown>[],
};

const COMPOSED_EXERCISES: Record<string, unknown>[] = [...MAIN_FILTERED];
for (const [skillId, exercises] of Object.entries(PER_SKILL_EXERCISES)) {
  for (const raw of exercises) {
    COMPOSED_EXERCISES.push({ ...raw, skillId } as Record<string, unknown>);
  }
}

const EXERCISES: readonly Exercise[] = COMPOSED_EXERCISES.map(applyExerciseDefaults) as unknown as readonly Exercise[];

/**
 * Detect prerequisite cycles in the skill dependency graph.
 * Uses DFS to find cycles.
 * @returns Array of cycle paths if any, empty array if no cycles
 */
export function detectPrerequisiteCycles(
  dependencies: readonly SkillDependency[] = SKILL_DEPENDENCIES
): string[][] {
  const adjacency = new Map<string, string[]>();
  const nodes = new Set<string>();

  for (const dep of dependencies) {
    adjacency.set(dep.skillId, [...dep.prerequisites]);
    nodes.add(dep.skillId);
    for (const prerequisite of dep.prerequisites) {
      nodes.add(prerequisite);
    }
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, path: string[]): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = adjacency.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(neighbor));
        }
      }
    }

    recursionStack.delete(node);
  }

  for (const skillId of nodes) {
    if (!visited.has(skillId)) {
      dfs(skillId, []);
    }
  }

  return cycles;
}

/**
 * Load the exercise catalog.
 * Validates coverage (≥5 per unit), skill references, and prerequisite cycles.
 * @returns Array of Exercise objects
 * @throws Error if catalog is invalid
 */
export function loadCatalog(): Exercise[] {
  // Check for prerequisite cycles first
  const cycles = detectPrerequisiteCycles();
  if (cycles.length > 0) {
    throw new Error(
      `Prerequisite cycles detected: ${cycles.map((c) => c.join(" → ")).join("; ")}`
    );
  }

  // Load taxonomy for error tag validation
  const taxonomy = loadTaxonomy();
  const knownErrorTagIds = new Set(taxonomy.map((t) => t.id));

  // Validate each exercise
  const validated: Exercise[] = [];
  for (const raw of EXERCISES) {
    const result = validateExercise(raw, KNOWN_SKILL_IDS, knownErrorTagIds);
    if (!result.ok) {
      throw new Error(
        `Invalid exercise ${raw.id}: ${result.error.field} - ${result.error.message}`
      );
    }
    validated.push(result.value);
  }

  // Validate coverage per unit
  for (let unit = 1; unit <= 6; unit++) {
    const unitExercises = validated.filter((e) => {
      const match = e.skillId.match(/^mat\.u(\d+)\./);
      return match && Number(match[1]) === unit;
    });
    if (unitExercises.length < 5) {
      throw new Error(
        `Unit ${unit} has only ${unitExercises.length} exercises; requires at least 5`
      );
    }
  }

  return [...validated]; // return mutable copy
}

/**
 * Query exercises by unit number.
 * Results sorted by difficulty ascending, then ID ascending.
 * @param unit - Unit number (1-6)
 * @returns Array of Exercise objects for that unit
 */
export function queryByUnit(unit: number): Exercise[] {
  const catalog = loadCatalog();
  const filtered = catalog.filter((e) => {
    const match = e.skillId.match(/^mat\.u(\d+)\./);
    return match && Number(match[1]) === unit;
  });
  return sortExercises(filtered);
}

/**
 * Query exercises by skill ID.
 * Results sorted by difficulty ascending, then ID ascending.
 * @param skillId - Skill ID to filter by
 * @returns Array of Exercise objects for that skill
 */
export function queryBySkill(skillId: string): Exercise[] {
  const catalog = loadCatalog();
  const filtered = catalog.filter((e) => e.skillId === skillId);
  return sortExercises(filtered);
}

/**
 * Query exercises by inclusive difficulty range.
 * Results sorted by difficulty ascending, then ID ascending.
 * @param minDifficulty - Minimum difficulty, inclusive
 * @param maxDifficulty - Maximum difficulty, inclusive
 * @returns Array of Exercise objects inside the requested range
 */
export function queryByDifficultyRange(
  minDifficulty: number,
  maxDifficulty: number
): Exercise[] {
  const catalog = loadCatalog();
  const filtered = catalog.filter(
    (e) => e.difficulty >= minDifficulty && e.difficulty <= maxDifficulty
  );
  return sortExercises(filtered);
}

/**
 * Sort exercises by difficulty ascending, then ID ascending.
 */
function sortExercises(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => {
    if (a.difficulty !== b.difficulty) {
      return a.difficulty - b.difficulty;
    }
    return a.id.localeCompare(b.id);
  });
}
