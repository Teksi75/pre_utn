/**
 * S0c — Validated `progressionFamily` / `progressionOrder` metadata +
 * pair-scoped U3 logarithmic comparator.
 *
 * Per `specs/math-exercise-catalog/spec.md` (MODIFIED `Catalog Querying`):
 * the cross-family override applies ONLY when ALL of the following hold:
 *
 *   1. `a.skillId === "mat.u3.logaritmicas"` AND
 *      `b.skillId === "mat.u3.logaritmicas"`.
 *   2. Both carry a recognized `progressionFamily`
 *      (`"log-expansion"` or `"log-combining"`).
 *   3. Both carry a finite numeric `progressionOrder`.
 *
 * Otherwise the comparator falls back to legacy difficulty ASC + ID
 * lexicographic ASC. This is the ONLY cross-family override.
 *
 * No text matching — assertions operate on `id`, `difficulty`, and
 * typed metadata fields, never on prompt / pedagogicalNote / anchors.
 */

import { describe, test, expect } from "vitest";
import type {
  Exercise,
  ProgressionFamily,
} from "@/domain/models/exercise";
import {
  compareValidatedU3LogExercises,
  queryBySkill,
} from "@/domain/catalog/index";
import {
  applyExerciseDefaults,
  parseRecord,
} from "@/domain/catalog/content-loaders";

// Build a LOADED catalog `Exercise` via `applyExerciseDefaults` (real parser).
function loadedLog(
  id: string,
  difficulty: number,
  family?: ProgressionFamily,
  order?: number,
): Exercise {
  const raw: Record<string, unknown> = {
    id,
    skillId: "mat.u3.logaritmicas",
    type: "multiple-choice",
    difficulty,
    prompt: `p ${id}`,
    expectedAnswer: "A",
    commonErrorTags: [],
    pedagogicalNote: "n",
    options: ["A", "B"],
  };
  if (family !== undefined) raw.progressionFamily = family;
  if (order !== undefined) raw.progressionOrder = order;
  return applyExerciseDefaults(parseRecord(raw, `test[${id}]`));
}

// Same loader, but with a non-U3 skillId. Override MUST NOT fire.
function loadedOther(
  id: string,
  skillId: string,
  difficulty: number,
  family?: ProgressionFamily,
  order?: number,
): Exercise {
  const raw: Record<string, unknown> = {
    id,
    skillId,
    type: "multiple-choice",
    difficulty,
    prompt: `p ${id}`,
    expectedAnswer: "A",
    commonErrorTags: [],
    pedagogicalNote: "n",
    options: ["A", "B"],
  };
  if (family !== undefined) raw.progressionFamily = family;
  if (order !== undefined) raw.progressionOrder = order;
  return applyExerciseDefaults(parseRecord(raw, `test[${id}]`));
}

// 1. P37 expansion (rank 0) precedes P38 combining (rank 1).
describe("S0c — cross-family rank: P37 expansion precedes P38 combining", () => {
  test("P37 expansion < P38 combining on a U3 log pair", () => {
    const expansion = loadedLog("ex.u3.logaritmicas.7", 4, "log-expansion", 1);
    const combining = loadedLog("ex.u3.logaritmicas.8", 2, "log-combining", 1);
    expect(compareValidatedU3LogExercises(expansion, combining)).toBeLessThan(0);
    expect(compareValidatedU3LogExercises(combining, expansion)).toBeGreaterThan(0);
  });

  test("multi-entry sort: ALL expansion precede ALL combining, order ASC within family", () => {
    const items: Exercise[] = [
      loadedLog("ex.u3.logaritmicas.4", 5, "log-combining", 2),
      loadedLog("ex.u3.logaritmicas.1", 1, "log-expansion", 2),
      loadedLog("ex.u3.logaritmicas.2", 4, "log-combining", 1),
      loadedLog("ex.u3.logaritmicas.3", 2, "log-expansion", 1),
    ];
    const sorted = [...items].sort(compareValidatedU3LogExercises);
    expect(sorted.map((e) => e.progressionFamily)).toEqual([
      "log-expansion",
      "log-expansion",
      "log-combining",
      "log-combining",
    ]);
    expect(sorted.map((e) => e.progressionOrder)).toEqual([1, 2, 1, 2]);
  });

  test.each([
    ["log-expansion", 1],
    ["log-combining", 1],
  ] as const)("within %s: numeric progressionOrder ASC", (family, _) => {
    const early = loadedLog("ex.u3.logaritmicas.7", 4, family, 1);
    const late = loadedLog("ex.u3.logaritmicas.8", 1, family, 2);
    expect(compareValidatedU3LogExercises(early, late)).toBeLessThan(0);
    expect(compareValidatedU3LogExercises(late, early)).toBeGreaterThan(0);
  });

  test("same family + same order: tie-break by legacy difficulty then ID", () => {
    const a = loadedLog("ex.u3.logaritmicas.5", 1, "log-expansion", 1);
    const b = loadedLog("ex.u3.logaritmicas.7", 1, "log-expansion", 1);
    expect(compareValidatedU3LogExercises(a, b)).toBeLessThan(0); // "5" < "7"
  });
});

// 2. Every other pair must fall back to legacy difficulty+ID.
describe("S0c — fallback: legacy difficulty+ID when override conditions fail", () => {
  test("no metadata on either side → legacy difficulty ASC", () => {
    expect(compareValidatedU3LogExercises(
      loadedLog("ex.u3.logaritmicas.5", 1),
      loadedLog("ex.u3.logaritmicas.7", 2),
    )).toBeLessThan(0);
  });

  test("single-side metadata on a U3 log → legacy (override requires BOTH sides)", () => {
    const aMissing = loadedLog("ex.u3.logaritmicas.7", 3);
    const b = loadedLog("ex.u3.logaritmicas.5", 1, "log-expansion", 1);
    expect(compareValidatedU3LogExercises(aMissing, b)).toBeGreaterThan(0); // 3 > 1
  });

  test.each([
    ["unrecognized family", { progressionFamily: "log-other", progressionOrder: 1 }],
    ["non-finite NaN order", { progressionFamily: "log-expansion", progressionOrder: Number.NaN }],
    ["non-finite Infinity order", { progressionFamily: "log-expansion", progressionOrder: Number.POSITIVE_INFINITY }],
    ["non-numeric string order", { progressionFamily: "log-expansion", progressionOrder: "1" }],
    ["family present but order missing", { progressionFamily: "log-expansion" }],
  ] as const)("malformed metadata: %s → parser drops → legacy", (_label, meta) => {
    const raw: Record<string, unknown> = {
      id: "ex.u3.logaritmicas.7",
      skillId: "mat.u3.logaritmicas",
      type: "multiple-choice",
      difficulty: 1,
      prompt: "x",
      expectedAnswer: "A",
      commonErrorTags: [],
      pedagogicalNote: "n",
      options: ["A", "B"],
      ...meta,
    };
    const a = applyExerciseDefaults(parseRecord(raw, "a"));
    const b = loadedLog("ex.u3.logaritmicas.8", 2);
    expect(compareValidatedU3LogExercises(a, b)).toBeLessThan(0); // legacy 1 < 2
  });

  test("non-U3 skillId with valid metadata on BOTH sides → legacy", () => {
    const a = loadedOther("ex.u3.ecuaciones_lineales.5", "mat.u3.ecuaciones_lineales", 2, "log-expansion", 1);
    const b = loadedOther("ex.u3.ecuaciones_lineales.7", "mat.u3.ecuaciones_lineales", 1, "log-combining", 1);
    // skillId !== "mat.u3.logaritmicas" → legacy: 1 < 2 → b < a.
    expect(compareValidatedU3LogExercises(a, b)).toBeGreaterThan(0);
  });

  test("mixed skillIds (one U3 log with metadata, one non-log without) → legacy", () => {
    const a = loadedLog("ex.u3.logaritmicas.5", 1, "log-expansion", 1);
    const b = loadedOther("ex.u3.ecuaciones_lineales.7", "mat.u3.ecuaciones_lineales", 2);
    expect(compareValidatedU3LogExercises(a, b)).toBeLessThan(0); // legacy 1 < 2
  });
});

// 3. Parser preservation: applyExerciseDefaults preserves valid, drops malformed.
describe("S0c — parser preserves valid metadata and drops malformed", () => {
  test("valid log-expansion + finite order survive", () => {
    const ex = loadedLog("ex.u3.logaritmicas.7", 1, "log-expansion", 2);
    expect(ex.progressionFamily).toBe("log-expansion");
    expect(ex.progressionOrder).toBe(2);
  });

  test("valid log-combining + finite order survive", () => {
    const ex = loadedLog("ex.u3.logaritmicas.7", 1, "log-combining", 5);
    expect(ex.progressionFamily).toBe("log-combining");
    expect(ex.progressionOrder).toBe(5);
  });

  test("absent metadata → undefined fields", () => {
    const ex = loadedLog("ex.u3.logaritmicas.7", 1);
    expect(ex.progressionFamily).toBeUndefined();
    expect(ex.progressionOrder).toBeUndefined();
  });
});

// 4. Real catalog integration: no metadata currently → legacy ordering.
describe("S0c — real catalog integration", () => {
  test("queryBySkill('mat.u3.logaritmicas') returns legacy-ordered results", () => {
    const loaded = queryBySkill("mat.u3.logaritmicas");
    expect(loaded.length).toBeGreaterThan(0);
    for (let i = 1; i < loaded.length; i++) {
      const prev = loaded[i - 1];
      const curr = loaded[i];
      if (prev.difficulty !== curr.difficulty) {
        expect(curr.difficulty).toBeGreaterThanOrEqual(prev.difficulty);
      } else {
        expect(curr.id.localeCompare(prev.id)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});