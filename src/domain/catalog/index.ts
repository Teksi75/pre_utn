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

// ---------------------------------------------------------------------------
// Raw JSON imports — stored as unknown, no parsing at module init.
// Static imports are safe (bundler loads data); the composition that
// follows is deferred to getComposedExercises().
// ---------------------------------------------------------------------------
import _exercisesJson from "../../../content/matematica/exercises.json";
import _unit1Exercises from "../../../content/matematica/exercises/unit-1.json";
import _unit2Exercises from "../../../content/matematica/exercises/unit-2.json";
import _unit3Exercises from "../../../content/matematica/exercises/unit-3.json";
import _conjuntosNumericosExercises from "../../../content/matematica/exercises/conjuntos-numericos.json";

/** Skill IDs that have dedicated per-skill exercise files. */
const PER_SKILL_SKILL_IDS = new Set(["mat.u1.conjuntos_numericos"]);

/**
 * Compose exercises from all sources (unit files + main catalog + per-skill
 * files) with validated parsing. Pure: re-runs on every call.
 *
 * Uses parseRecord() for safe validation at the JSON boundary — no unchecked
 * `as Record<string, unknown>` casts. applyExerciseDefaults is called only
 * here, never at module init.
 *
 * GGA BLOCKER FIX: this function previously cached its result in a module-level
 * mutable (`let _composedExercises`). That violated the L0 domain-purity rule
 * (AGENTS.md: "Mantener `src/domain/` libre de ... efectos secundarios"). The
 * composition cost is dominated by validation in `loadCatalog` (which always
 * ran on every call); removing the cache preserves functional behavior with no
 * observable regression and lets the domain stay pure.
 */
function getComposedExercises(): readonly Exercise[] {
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

  return composed.map(applyExerciseDefaults) as readonly Exercise[];
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
 *
 * In S0 this remains the default ordering. The cross-family override
 * for validated U3 logarithmic metadata (P37 expansion precedes P38
 * combining) lives in `compareValidatedU3LogExercises`, which the
 * loader/coverage layer composes into a stable sort WHEN both sides of
 * every adjacent comparison carry the validated metadata. For ordinary
 * catalog use, this comparator is the entire ordering contract.
 */
function sortExercises(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => compareExercisesByMetadata(a, b));
}

/**
 * Pair-scoped comparator that overrides the default difficulty+ID
 * ordering ONLY when ALL of the following hold:
 *
 *   1. `a.skillId === "mat.u3.logaritmicas"` AND
 *      `b.skillId === "mat.u3.logaritmicas"`.
 *   2. Both entries carry a recognized `progressionFamily`
 *      (`"log-expansion"` or `"log-combining"`).
 *   3. Both entries carry a finite numeric `progressionOrder`.
 *
 * Otherwise the comparator falls back to legacy difficulty ASC then ID
 * lexicographic ASC. This includes: missing/malformed metadata on
 * either side, single-side metadata, malformed `progressionFamily`
 * outside the recognized set, non-finite or non-numeric
 * `progressionOrder`, AND pairs whose `skillId` is anything other than
 * `"mat.u3.logaritmicas"`.
 *
 * Family rank: `log-expansion` = 0, `log-combining` = 1.
 * Within the same family, numeric `progressionOrder` is sorted ASC.
 *
 * This is the ONLY cross-family override in the catalog — every other
 * pair uses legacy ordering. S0 owns the comparator; S9 consumes it
 * from the catalog loader to enforce P37-before-P38.
 *
 * `skillId` is OPTIONAL on the generic constraint so narrow types
 * (e.g. synthetic `Compared` shapes in tests) still typecheck. At
 * runtime, the override requires BOTH operands to carry
 * `skillId === "mat.u3.logaritmicas"`; a missing or different skillId
 * triggers the legacy fallback.
 */
export function compareValidatedU3LogExercises<
  T extends {
    readonly id: string;
    readonly skillId?: string;
    readonly difficulty: number;
    readonly progressionFamily?: "log-expansion" | "log-combining";
    readonly progressionOrder?: number;
  },
>(a: T, b: T): number {
  // Override condition: BOTH sides are U3 logarithms AND both carry
  // validated metadata. Anything else falls back to legacy.
  const aMeta =
    a.skillId === "mat.u3.logaritmicas" &&
    (a.progressionFamily === "log-expansion" || a.progressionFamily === "log-combining") &&
    typeof a.progressionOrder === "number" &&
    Number.isFinite(a.progressionOrder);
  const bMeta =
    b.skillId === "mat.u3.logaritmicas" &&
    (b.progressionFamily === "log-expansion" || b.progressionFamily === "log-combining") &&
    typeof b.progressionOrder === "number" &&
    Number.isFinite(b.progressionOrder);

  if (aMeta && bMeta) {
    const FAMILY_RANK: Readonly<Record<"log-expansion" | "log-combining", number>> = {
      "log-expansion": 0,
      "log-combining": 1,
    };
    const rankA = FAMILY_RANK[a.progressionFamily!];
    const rankB = FAMILY_RANK[b.progressionFamily!];
    if (rankA !== rankB) return rankA - rankB;
    // Same family: numeric progressionOrder ASC.
    if (a.progressionOrder! !== b.progressionOrder!) {
      return a.progressionOrder! - b.progressionOrder!;
    }
    // Same family + same order: tie-break by legacy rule (fall through).
  }
  // Legacy fallback (always — even when one side carries metadata,
  // or when skillId isn't "mat.u3.logaritmicas").
  if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
  return a.id.localeCompare(b.id);
}

/**
 * Internal stable comparator used by the catalog's sortExercises.
 * Defaults to legacy difficulty+ID; subclasses (U3 logaritmicas sort
 * in S9) can compose `compareValidatedU3LogExercises` for cross-family
 * precedence once content exists. S0 keeps the legacy contract
 * pristine.
 */
function compareExercisesByMetadata(a: Exercise, b: Exercise): number {
  return compareValidatedU3LogExercises(a, b);
}
