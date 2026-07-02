/**
 * Challenge catalog loader — loads challenge exercises from static JSON.
 *
 * Lives in src/lib/ (not src/domain/) because it uses a mutable module-level
 * parse cache and throws on malformed entries — runtime side effects that
 * violate domain purity rules in AGENTS.md.
 *
 * The domain facade (src/domain/catalog/challenges/index.ts) re-exports
 * the public API from this module.
 */

import type { ChallengeCanonicalTrace, ChallengeExercise, ChallengeSourceUse } from "@/domain/catalog/challenges/types";

// ---------------------------------------------------------------------------
// Static JSON imports — loaded once at module initialization
// ---------------------------------------------------------------------------

import unit1ChallengesRaw from "../../../content/matematica/challenges/unit-1.json";
import unit2ChallengesRaw from "../../../content/matematica/challenges/unit-2.json";
import unit3ChallengesRaw from "../../../content/matematica/challenges/unit-3.json";

// ---------------------------------------------------------------------------
// Raw registry
// ---------------------------------------------------------------------------

type RawChallengeEntry = Record<string, unknown>;

const UNIT_REGISTRY: ReadonlyArray<readonly RawChallengeEntry[]> = [
  unit1ChallengesRaw as readonly RawChallengeEntry[],
  unit2ChallengesRaw as readonly RawChallengeEntry[],
  unit3ChallengesRaw as readonly RawChallengeEntry[],
];

// ---------------------------------------------------------------------------
// Cache — lazily populated on first access per unit
// ---------------------------------------------------------------------------

type ParseCache = Map<number, readonly ChallengeExercise[]>;

const cache: ParseCache = new Map();

function parseCacheForUnit(unit: number): readonly ChallengeExercise[] {
  const cached = cache.get(unit);
  if (cached !== undefined) return cached;

  const unitIndex = unit - 1;
  if (unitIndex < 0 || unitIndex >= UNIT_REGISTRY.length) {
    return [];
  }

  const rawEntries = UNIT_REGISTRY[unitIndex];
  const parsed: ChallengeExercise[] = [];

  for (const raw of rawEntries) {
    try {
      const entry = validateChallengeEntry(raw);
      parsed.push(entry as ChallengeExercise);
    } catch (err) {
      // Fail fast at load time — malformed challenge JSON is a development error
      throw new Error(
        `Failed to parse challenge entry (id=${raw["id"] ?? "unknown"}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  cache.set(unit, parsed);
  return parsed;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_SOURCE_USES: ReadonlySet<ChallengeSourceUse> = new Set([
  "canonical-source",
  "adapted",
  "calibrated-from-exam",
  "solution-pattern",
]);

const CHALLENGE_ID_PATTERN = /^ex\.u([1-6])\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;

/**
 * Validate a single challenge entry at runtime.
 * Throws a descriptive Error if the entry is invalid.
 *
 * Validation rules (from SDD design):
 * - canonicalTrace: required, ≥1 entry
 * - Each trace entry must have all 4 fields: path, section, sourceUse, pedagogicalIntent
 * - sourceUse must be one of: canonical-source | adapted | calibrated-from-exam | solution-pattern
 * - challengeSection must be exactly true
 * - category must be exactly "desafio"
 * - tags must include both "desafio" and "integrador"
 * - difficulty must be 4 or 5
 * - ID must match pattern: ex.u{unit}.{slug}.desafio-{index}
 */
export function validateChallengeEntry(raw: unknown): ChallengeExercise {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("challenge entry must be a non-null, non-array object");
  }

  const entry = raw as Record<string, unknown>;

  // --- ID format ---
  const id = entry["id"];
  if (typeof id !== "string" || !CHALLENGE_ID_PATTERN.test(id)) {
    throw new Error(`id must match pattern ex.u{unit}.{slug}.{slug}; got: ${JSON.stringify(id)}`);
  }

  // --- challengeSection ===
  if (entry["challengeSection"] !== true) {
    throw new Error(`challengeSection must be true; got: ${JSON.stringify(entry["challengeSection"])}`);
  }

  // --- category ===
  if (entry["category"] !== "desafio") {
    throw new Error(`category must be "desafio"; got: ${JSON.stringify(entry["category"])}`);
  }

  // --- difficulty ---
  const difficulty = entry["difficulty"];
  if (typeof difficulty !== "number" || (difficulty !== 4 && difficulty !== 5)) {
    throw new Error(`difficulty must be 4 or 5; got: ${JSON.stringify(difficulty)}`);
  }

  // --- expectedAnswer ∈ options (defense-in-depth for multiple-choice) ---
  // The evaluator uses exact matching against options, so a visible correct
  // option whose text differs from expectedAnswer would be graded wrong even
  // when the student picks it. Enforce the invariant at load time.
  if (entry["type"] === "multiple-choice") {
    const rawOptions = entry["options"];
    if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
      throw new Error(
        `multiple-choice challenge requires at least 2 options; got: ${JSON.stringify(rawOptions)}`,
      );
    }
    // Each option must be a string OR { value: string, ... }; the previous
    // version mapped invalid objects to `undefined` silently.
    const optionValues: string[] = [];
    for (let i = 0; i < rawOptions.length; i++) {
      const o = rawOptions[i];
      if (typeof o === "string") {
        optionValues.push(o);
        continue;
      }
      if (typeof o !== "object" || o === null) {
        throw new Error(
          `options[${i}] must be a string or { value: string, ... }; got: ${JSON.stringify(o)}`,
        );
      }
      const value = (o as Record<string, unknown>)["value"];
      if (typeof value !== "string") {
        throw new Error(
          `options[${i}].value must be a string; got: ${JSON.stringify(value)}`,
        );
      }
      optionValues.push(value);
    }
    // Validate expectedAnswer shape BEFORE membership; otherwise null/number/empty answers slip through silently.
    const expectedAnswer = entry["expectedAnswer"];
    if (typeof expectedAnswer !== "string" || expectedAnswer === "") {
      throw new Error(
        `expectedAnswer must be a non-empty string for multiple-choice challenges; got: ${JSON.stringify(expectedAnswer)}`,
      );
    }
    if (!optionValues.includes(expectedAnswer)) {
      throw new Error(
        `expectedAnswer must be exactly one of the options for multiple-choice challenges; got: ${JSON.stringify(expectedAnswer)}`,
      );
    }
  }

  // --- tags ---
  const tags = entry["tags"];
  if (!Array.isArray(tags)) {
    throw new Error(`tags must be an array; got: ${JSON.stringify(tags)}`);
  }
  if (!tags.includes("desafio")) {
    throw new Error(`tags must include "desafio"; got: ${JSON.stringify(tags)}`);
  }
  if (!tags.includes("integrador")) {
    throw new Error(`tags must include "integrador"; got: ${JSON.stringify(tags)}`);
  }

  // --- canonicalTrace ---
  const canonicalTrace = entry["canonicalTrace"];
  if (!Array.isArray(canonicalTrace) || canonicalTrace.length === 0) {
    throw new Error(`canonicalTrace must be a non-empty array; got: ${JSON.stringify(canonicalTrace)}`);
  }

  for (let i = 0; i < canonicalTrace.length; i++) {
    const trace = canonicalTrace[i];
    if (typeof trace !== "object" || trace === null) {
      throw new Error(`canonicalTrace[${i}] must be an object; got: ${JSON.stringify(trace)}`);
    }
    const t = trace as Record<string, unknown>;

    if (typeof t["path"] !== "string") {
      throw new Error(`canonicalTrace[${i}].path must be a string; got: ${JSON.stringify(t["path"])}`);
    }
    if (typeof t["section"] !== "string") {
      throw new Error(`canonicalTrace[${i}].section must be a string; got: ${JSON.stringify(t["section"])}`);
    }

    const sourceUse = t["sourceUse"];
    if (
      typeof sourceUse !== "string" ||
      !(VALID_SOURCE_USES.has(sourceUse as ChallengeSourceUse))
    ) {
      throw new Error(
        `canonicalTrace[${i}].sourceUse must be one of ${[...VALID_SOURCE_USES].join(" | ")}; got: ${JSON.stringify(sourceUse)}`
      );
    }

    if (typeof t["pedagogicalIntent"] !== "string") {
      throw new Error(
        `canonicalTrace[${i}].pedagogicalIntent must be a string; got: ${JSON.stringify(t["pedagogicalIntent"])}`
      );
    }
  }

  // All validations passed — return the entry as ChallengeExercise
  return entry as unknown as ChallengeExercise;
}

// ---------------------------------------------------------------------------
// Challenge loading
// ---------------------------------------------------------------------------

/**
 * Extract unit number from a SkillId (e.g. "mat.u1.complejos" -> 1).
 */
function unitFromSkillId(skillId: string): number | null {
  const match = /^mat\.u([1-6])\./.exec(skillId);
  if (!match) return null;
  return Number(match[1]) as 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Load all valid challenge exercises for a given unit.
 * Returns an empty array if the unit has no challenges.
 *
 * @param unit - Unit number (1–6)
 */
export function loadChallengesForUnit(unit: number): readonly ChallengeExercise[] {
  if (unit < 1 || unit > 6) return [];
  return parseCacheForUnit(unit);
}

/**
 * Load all valid challenge exercises for a given skillId.
 * Returns an empty array if the skill has no challenges or the skillId is unknown.
 *
 * @param skillId - e.g. "mat.u1.complejos"
 */
export function loadChallengesForSkill(skillId: string): readonly ChallengeExercise[] {
  const unit = unitFromSkillId(skillId);
  if (unit === null) return [];

  const unitChallenges = parseCacheForUnit(unit);
  return unitChallenges.filter((c) => c.skillId === skillId);
}
