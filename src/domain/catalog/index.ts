/**
 * Exercise catalog — loads and queries the static exercise catalog.
 * No external dependencies. Pure TypeScript.
 *
 * Composition and default application are LAZY — no parsing or throws
 * at module initialization time. Raw JSON is stored as `unknown` and
 * only parsed/composed on first call to loadCatalog().
 */

import type { Exercise } from "../models/exercise";
import { validateExercise } from "../models/exercise";
import type { SkillDependency } from "../models/skill-catalog";
import { KNOWN_SKILL_IDS } from "../models/skill-catalog";
import { SKILL_DEPENDENCIES } from "../models/skill-catalog";
import { loadTaxonomy } from "../error-taxonomy/index";
import { parseSkillUnit } from "../shared/skill-id";
import { getUnitThreshold, applyExerciseDefaults, parseRecord } from "./content-loaders";

export { parseOptionalCanonicalTrace } from "./content-loaders";
export { auditU3TraceSourceUse } from "./u3-trace-audit";
export type { U3TraceAuditViolation } from "./u3-trace-audit";

// ---------------------------------------------------------------------------
// Raw JSON imports — stored as unknown, no parsing at module init.
// Static imports are safe (bundler loads data); the composition that
// follows is deferred to getComposedExercises().
// ---------------------------------------------------------------------------
import _exercisesJson from "../../../content/matematica/exercises.json";
import _unit1Exercises from "../../../content/matematica/exercises/unit-1.json";
import _unit2Exercises from "../../../content/matematica/exercises/unit-2.json";
import _unit3Exercises from "../../../content/matematica/exercises/unit-3.json";
import _unit5Exercises from "../../../content/matematica/exercises/unit-5.json";
import _conjuntosNumericosExercises from "../../../content/matematica/exercises/conjuntos-numericos.json";

/** Skill IDs that have dedicated per-skill exercise files. */
const PER_SKILL_SKILL_IDS = new Set(["mat.u1.conjuntos_numericos"]);

// ---------------------------------------------------------------------------
// Lazy composition cache — populated on first call to loadCatalog()
// ---------------------------------------------------------------------------
let _composedExercises: readonly Exercise[] | null = null;

/**
 * Compose exercises from all sources (unit files + main catalog + per-skill
 * files) with validated parsing. Result is cached after first call.
 *
 * Uses parseRecord() for safe validation at the JSON boundary — no unchecked
 * `as Record<string, unknown>` casts. applyExerciseDefaults is called only
 * here, never at module init.
 */
function getComposedExercises(): readonly Exercise[] {
  if (_composedExercises !== null) return _composedExercises;

  const seenIds = new Set<string>();
  const composed: Record<string, unknown>[] = [];

  function addExercises(source: unknown, label: string, excludeSkillIds?: Set<string>): void {
    if (!Array.isArray(source)) return;
    for (let i = 0; i < source.length; i++) {
      const raw = parseRecord(source[i], `${label}[${i}]`);
      // Skip exercises whose skillId has a dedicated per-skill file
      if (excludeSkillIds && typeof raw.skillId === "string" && excludeSkillIds.has(raw.skillId)) continue;
      const id = typeof raw.id === "string" ? raw.id : "";
      if (!seenIds.has(id)) {
        seenIds.add(id);
        composed.push(raw);
      }
    }
  }

  // Unit files first (highest priority for u1/u2/u3 exercises).
  // Exclude exercises whose skillId has a dedicated per-skill file.
  addExercises(_unit1Exercises, "unit-1", PER_SKILL_SKILL_IDS);
  addExercises(_unit2Exercises, "unit-2", PER_SKILL_SKILL_IDS);
  addExercises(_unit3Exercises, "unit-3", PER_SKILL_SKILL_IDS);
  addExercises(_unit5Exercises, "unit-5", PER_SKILL_SKILL_IDS);

  // Main catalog (u3-u6, plus any u1/u2 not in unit files).
  // Exclude exercises whose skillId has a dedicated per-skill file.
  addExercises(_exercisesJson, "main", PER_SKILL_SKILL_IDS);

  // Per-skill files (e.g. conjuntos-numericos.json)
  const perSkillSources: Record<string, unknown> = {
    "mat.u1.conjuntos_numericos": _conjuntosNumericosExercises as unknown,
  };
  for (const [skillId, exercises] of Object.entries(perSkillSources)) {
    if (!Array.isArray(exercises)) continue;
    for (let i = 0; i < exercises.length; i++) {
      const raw = parseRecord(exercises[i], `${skillId}[${i}]`);
      const id = typeof raw.id === "string" ? raw.id : "";
      const entry = { ...raw, skillId };
      if (!seenIds.has(id)) {
        seenIds.add(id);
        composed.push(entry);
      }
    }
  }

  _composedExercises = composed.map(applyExerciseDefaults) as readonly Exercise[];
  return _composedExercises;
}

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

  // Get composed exercises (lazy — parsed on first call)
  const exercises = getComposedExercises();

  // Validate each exercise
  const validated: Exercise[] = [];
  for (const raw of exercises) {
    const result = validateExercise(raw, KNOWN_SKILL_IDS, knownErrorTagIds);
    if (!result.ok) {
      throw new Error(
        `Invalid exercise ${raw.id}: ${result.error.field} - ${result.error.message}`
      );
    }
    validated.push(result.value);
  }

  // Validate coverage per unit using configured thresholds.
  // getUnitThreshold returns the configured minimum for units in
  // UNIT_THRESHOLDS, or the default minimum (5) for others.
  for (let unit = 1; unit <= 6; unit++) {
    const unitExercises = validated.filter((e) => parseSkillUnit(e.skillId) === unit);
    const threshold = getUnitThreshold(`unit-${unit}`);
    if (unitExercises.length < threshold) {
      throw new Error(
        `Unit ${unit} has only ${unitExercises.length} exercises; requires at least ${threshold}`
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
  const filtered = catalog.filter((e) => parseSkillUnit(e.skillId) === unit);
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
