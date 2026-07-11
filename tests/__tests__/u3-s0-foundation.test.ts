/**
 * S0 Foundation — RED→GREEN→REFACTOR tests for `align-u3-practice-official-exercises`.
 *
 * Six test groups, each proving one piece of the S0 contract:
 *   1. canonicalTrace           — Exercise has optional typed trace; loader parses it.
 *   2. progression-meta+comparator — progressionFamily + numeric progressionOrder; pair comparator.
 *   3. trace-path-validator      — Node-only fs.existsSync wrapper accepting a project-root.
 *   4. loader-type-reject        — Generic challenge loader rejects `text` and other unsupported types.
 *   5. audit-inert               — Scoped U3 alignment audit exists and is INERT until S11.
 *   6. fixture-parse             — Four literal immutable compatibility fixtures parse to documented shape.
 *
 * S11 owns the only GREEN run of the exact-nine audit. These tests stay RED
 * for the audit-inert group until S11; all other groups must be GREEN by
 * the end of S0.
 */

import { describe, test, expect } from "vitest";
import { resolve as resolvePath } from "node:path";
import type { Exercise, ExerciseOption } from "@/domain/models/exercise";
import type {
  ProgressionFamily,
  ProgressionOrder,
} from "@/domain/models/exercise";
import {
  validateExercise,
} from "@/domain/models/exercise";
import type { SkillId } from "@/domain/models/skill";
import { validateChallengeEntry } from "@/lib/challenges/loader";
import { validateTracePath } from "@/lib/trace-path";
import {
  parseOptionalCanonicalTrace,
  runU3AlignmentAudit,
} from "@/domain/catalog/content-loaders";
import { compareValidatedU3LogExercises } from "@/domain/catalog/index";

import { FROZEN_U3_EXERCISE_BASELINE } from "../fixtures/compatibility/u3-exercise-baseline";
import { FROZEN_U3_CHALLENGE_BASELINE } from "../fixtures/compatibility/u3-challenge-baseline";
import { FROZEN_U3_PRACTICE_PROGRESS_BASELINE } from "../fixtures/compatibility/u3-practice-progress-baseline";
import { FROZEN_U3_ADVANCED_PROGRESS_BASELINE } from "../fixtures/compatibility/u3-advanced-progress-baseline";

// S0b companion WIP: the trace-path group (#3) below was updated in
// lockstep with the S0b fix that switched `validateTracePath` to take
// an EXPLICIT `repositoryRoot` anchor instead of falling back to
// `process.cwd()`. See `tests/__tests__/u3-s0b-path.test.ts` for the
// focused contract tests and `apply-progress.md` for the corrective
// TDD evidence.
const PROJECT_ROOT = resolvePath(__dirname, "..", "..");

// Minimal known skill/error-tag sets to satisfy validateExercise generic checks.
const KNOWN_SKILL_IDS: Set<SkillId> = new Set<SkillId>([
  "mat.u3.ecuaciones_lineales",
  "mat.u3.logaritmicas",
  "mat.u3.traduccion_lenguaje_verbal",
]);
const KNOWN_ERROR_TAGS = new Set<string>(["u3_aislamiento_incorrecto"]);

// ---------------------------------------------------------------------------
// 1. canonicalTrace — Exercise model carries optional typed trace + parser.
// ---------------------------------------------------------------------------

describe("S0 — canonicalTrace (typed Exercise trace)", () => {
  test("Exercise shape allows optional canonicalTrace with sourceUse enum and parsed entry", () => {
    // RED: the field/parser don't exist yet — TypeScript will fail first.
    const trace = parseOptionalCanonicalTrace(
      {
        path: "content/matematica/challenges/unit-3.json",
        section: "sec",
        sourceUse: "reference",
        pedagogicalIntent: "verify trace parsing",
      },
      "ex.u3.ecuaciones_lineales.2"
    );
    expect(trace).not.toBeNull();
    expect(trace).toHaveLength(1);
    const [t] = trace!;
    expect(t.sourceUse).toBe("reference");
    expect(t.path).toBe("content/matematica/challenges/unit-3.json");
  });

  test("Exercise validates end-to-end with a parsed canonicalTrace attached", () => {
    // RED: validateExercise does not accept canonicalTrace today.
    const trace = parseOptionalCanonicalTrace(
      {
        path: "content/matematica/challenges/unit-3.json",
        section: "sec",
        sourceUse: "adapted",
        pedagogicalIntent: "end-to-end check",
      },
      "ex.u3.ecuaciones_lineales.2"
    )!;
    const exercise: Exercise = {
      id: "ex.u3.ecuaciones_lineales.2",
      skillId: "mat.u3.ecuaciones_lineales",
      type: "multiple-choice",
      difficulty: 3,
      prompt: "Sample",
      expectedAnswer: "A",
      commonErrorTags: [],
      pedagogicalNote: "Note",
      unit: 3,
      options: ["A", "B", "C"] as readonly ExerciseOption[],
      canonicalTrace: trace,
    };
    const result = validateExercise(exercise, KNOWN_SKILL_IDS, KNOWN_ERROR_TAGS);
    expect(result.ok).toBe(true);
  });

  test("rejects invalid sourceUse value at parse time", () => {
    expect(() =>
      parseOptionalCanonicalTrace(
        {
          path: "content/matematica/challenges/unit-3.json",
          section: "s",
          sourceUse: "alignment", // explicitly NOT allowed
          pedagogicalIntent: "x",
        },
        "ex.u3.ecuaciones_lineales.2"
      )
    ).toThrow("sourceUse");
  });

  test("returns null when canonicalTrace is absent (optional field)", () => {
    expect(parseOptionalCanonicalTrace({}, "ex.u3.ecuaciones_lineales.2")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. progression-meta + comparator — optional metadata + pair comparator.
// ---------------------------------------------------------------------------

describe("S0 — progression metadata + comparator", () => {
  test("Compare returns family-rank precedence when both entries have validated U3 log metadata", () => {
    type Compared = {
      id: string;
      skillId: string;
      difficulty: number;
      progressionFamily?: ProgressionFamily;
      progressionOrder?: ProgressionOrder;
    };
    const a: Compared = {
      id: "ex.u3.logaritmicas.7",
      skillId: "mat.u3.logaritmicas",
      difficulty: 3,
      progressionFamily: "log-combining",
      progressionOrder: 2,
    };
    const b: Compared = {
      id: "ex.u3.logaritmicas.5",
      skillId: "mat.u3.logaritmicas",
      difficulty: 2,
      progressionFamily: "log-expansion",
      progressionOrder: 1,
    };
    // log-expansion (rank 0) precedes log-combining (rank 1) → a > b.
    expect(compareValidatedU3LogExercises(a, b)).toBeGreaterThan(0);
    expect(compareValidatedU3LogExercises(b, a)).toBeLessThan(0);
  });

  test("Compare falls back to legacy difficulty+ID when metadata is missing on either side", () => {
    type Compared = {
      id: string;
      skillId: string;
      difficulty: number;
      progressionFamily?: ProgressionFamily;
      progressionOrder?: ProgressionOrder;
    };
    const aMissing: Compared = {
      id: "ex.u3.logaritmicas.7",
      skillId: "mat.u3.logaritmicas",
      difficulty: 3,
    };
    const b: Compared = {
      id: "ex.u3.logaritmicas.5",
      skillId: "mat.u3.logaritmicas",
      difficulty: 2,
      progressionFamily: "log-expansion",
      progressionOrder: 1,
    };
    // Legacy: difficulty 2 < difficulty 3 → a comes after b.
    expect(compareValidatedU3LogExercises(aMissing, b)).toBeGreaterThan(0);
  });

  test("Compare within same family uses numeric progressionOrder ASC", () => {
    type Compared = {
      id: string;
      skillId: string;
      difficulty: number;
      progressionFamily?: ProgressionFamily;
      progressionOrder?: ProgressionOrder;
    };
    const aEarly: Compared = {
      id: "ex.u3.logaritmicas.6",
      skillId: "mat.u3.logaritmicas",
      difficulty: 3,
      progressionFamily: "log-expansion",
      progressionOrder: 1,
    };
    const aLate: Compared = {
      id: "ex.u3.logaritmicas.4",
      skillId: "mat.u3.logaritmicas",
      difficulty: 2,
      progressionFamily: "log-expansion",
      progressionOrder: 2,
    };
    expect(compareValidatedU3LogExercises(aEarly, aLate)).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// 3. trace-path-validator — Node-only fs.existsSync wrapper.
// ---------------------------------------------------------------------------

describe("S0 — trace-path-validator (Node-only fs.existsSync)", () => {
  test("Returns true for a real existing file relative to the explicit repository root", () => {
    // S0b fix: the validator takes an EXPLICIT `repositoryRoot` anchor;
    // bare `process.cwd()` resolution is gone. Passing the project root
    // as the anchor, the in-repo content file resolves positively.
    expect(
      validateTracePath(PROJECT_ROOT, "content/matematica/challenges/unit-3.json")
    ).toBe(true);
  });

  test("Returns false for a path that does not exist on disk", () => {
    expect(
      validateTracePath(PROJECT_ROOT, "material_canonico/__definitely_missing__.pdf")
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. loader-type-reject — generic loader rejects `text` and other unsupported types.
// ---------------------------------------------------------------------------

describe("S0 — loader-type-reject (generic challenge type hardening)", () => {
  const VALID_BASE = {
    id: "ex.u3.ecuaciones_lineales.desafio-01",
    skillId: "mat.u3.ecuaciones_lineales",
    type: "multiple-choice" as const,
    difficulty: 5 as const,
    prompt: "Sample challenge",
    expectedAnswer: "A",
    options: ["A", "B", "C"] as string[],
    commonErrorTags: [] as string[],
    pedagogicalNote: "Note",
    challengeSection: true as const,
    category: "desafio" as const,
    tags: ["desafio", "integrador"] as const,
    canonicalTrace: [
      {
        path: "content/matematica/challenges/unit-3.json",
        section: "sec",
        sourceUse: "canonical-source" as const,
        pedagogicalIntent: "Evalúa",
      },
    ],
  };

  test("Existing `multiple-choice` challenges at diff 4 still parse", () => {
    // RED — guards the negative space: the diff 4/5 compatibility must not regress.
    expect(() =>
      validateChallengeEntry({ ...VALID_BASE, difficulty: 4 })
    ).not.toThrow();
  });

  test("Existing `multiple-choice` challenges at diff 5 still parse", () => {
    expect(() => validateChallengeEntry(VALID_BASE)).not.toThrow();
  });

  test("Rejects `text` type (free-form input prohibited by AGENTS.md)", () => {
    // RED — explicit `text` rejection is missing.
    expect(() =>
      validateChallengeEntry({ ...VALID_BASE, type: "text" as unknown as "multiple-choice" })
    ).toThrow(/text|unsupported|forbidden/i);
  });

  test("Rejects `free-response` type", () => {
    expect(() =>
      validateChallengeEntry({
        ...VALID_BASE,
        type: "free-response" as unknown as "multiple-choice",
      })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 5. audit-inert — scoped U3 alignment audit scaffold, INERT until S11.
// ---------------------------------------------------------------------------

describe("S0 — scoped U3 alignment audit scaffold (INERT)", () => {
  test("runU3AlignmentAudit exists and returns a result shape", () => {
    // RED — audit function doesn't exist yet.
    const result = runU3AlignmentAudit({
      expectedSkillIds: [],
      challengesBySkill: {},
    });
    expect(result).toBeDefined();
    expect(Array.isArray(result.violations)).toBe(true);
  });

  test("audit is INERT in S0: the same call against current state passes with an enabled flag", () => {
    // Inert meaning: by default (S0) the audit returns NO violations even when
    // the nine new diff-5 challenges are absent. S11 flips `enabled` to true.
    const result = runU3AlignmentAudit({
      expectedSkillIds: [
        "mat.u3.ecuaciones_lineales",
        "mat.u3.ecuaciones_cuadraticas",
        "mat.u3.inecuaciones_valor_absoluto",
        "mat.u3.recta",
        "mat.u3.sistemas",
        "mat.u3.exponenciales",
        "mat.u3.logaritmicas",
      ],
      challengesBySkill: {},
      enabled: false,
    });
    expect(result.violations).toHaveLength(0);
  });

  test("enabled=true: empty challenges list emits missing-challenge distinctly", () => {
    const result = runU3AlignmentAudit({
      expectedSkillIds: ["mat.u3.ecuaciones_lineales"],
      challengesBySkill: { "mat.u3.ecuaciones_lineales": [] },
      enabled: true,
    });
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].reason).toBe("missing-challenge");
  });

  test("enabled=true: skill with challenges of wrong difficulty (no diff=5) emits wrong-difficulty", () => {
    const result = runU3AlignmentAudit({
      expectedSkillIds: ["mat.u3.ecuaciones_lineales"],
      challengesBySkill: {
        "mat.u3.ecuaciones_lineales": [
          { difficulty: 4, type: "multiple-choice" },
          { difficulty: 3, type: "multiple-choice" },
        ],
      },
      enabled: true,
    });
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].reason).toBe("wrong-difficulty");
  });

  test("enabled=true: skill with diff=5 challenges of wrong type emits wrong-type", () => {
    const result = runU3AlignmentAudit({
      expectedSkillIds: ["mat.u3.ecuaciones_lineales"],
      challengesBySkill: {
        "mat.u3.ecuaciones_lineales": [
          { difficulty: 5, type: "numerical" },
          { difficulty: 5, type: "fill-blank" },
        ],
      },
      enabled: true,
    });
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].reason).toBe("wrong-type");
  });

  test("enabled=true: skill with exactly one diff=5 MC emits no violation", () => {
    const result = runU3AlignmentAudit({
      expectedSkillIds: ["mat.u3.ecuaciones_lineales"],
      challengesBySkill: {
        "mat.u3.ecuaciones_lineales": [
          { difficulty: 5, type: "multiple-choice" },
        ],
      },
      enabled: true,
    });
    expect(result.violations).toHaveLength(0);
  });

  test("enabled=true: skill with multiple diff=5 MC emits duplicate-challenge", () => {
    const result = runU3AlignmentAudit({
      expectedSkillIds: ["mat.u3.ecuaciones_lineales"],
      challengesBySkill: {
        "mat.u3.ecuaciones_lineales": [
          { difficulty: 5, type: "multiple-choice" },
          { difficulty: 5, type: "multiple-choice" },
        ],
      },
      enabled: true,
    });
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].reason).toBe("duplicate-challenge");
  });
});

// ---------------------------------------------------------------------------
// 6. fixture-parse — four literal immutable compatibility fixtures parse.
// ---------------------------------------------------------------------------

describe("S0 — four immutable compatibility fixtures parse to documented shape", () => {
  test("u3-exercise-baseline: every row has id, skillId, difficulty and the IDs match the documented shape", () => {
    expect(FROZEN_U3_EXERCISE_BASELINE.length).toBeGreaterThan(0);
    for (const row of FROZEN_U3_EXERCISE_BASELINE) {
      expect(row.id).toMatch(/^ex\.u3\..+\.[a-z0-9-]+$/);
      expect(row.skillId).toMatch(/^mat\.u3\..+$/);
      expect([1, 2, 3, 4, 5]).toContain(row.difficulty);
    }
  });

  test("u3-challenge-baseline: exactly two desafios with diff 5 and diff 4", () => {
    expect(FROZEN_U3_CHALLENGE_BASELINE).toHaveLength(2);
    expect(FROZEN_U3_CHALLENGE_BASELINE[0].difficulty).toBe(5);
    expect(FROZEN_U3_CHALLENGE_BASELINE[1].difficulty).toBe(4);
    for (const row of FROZEN_U3_CHALLENGE_BASELINE) {
      expect(row.skillId).toBe("mat.u3.traduccion_lenguaje_verbal");
      expect(row.type).toBe("multiple-choice");
      expect(row.canonicalTrace.length).toBeGreaterThan(0);
      expect(row.canonicalTrace[0].sourceUse).toBe("canonical-source");
    }
  });

  test("u3-practice-progress-baseline: full { students, activeStudentId } envelope", () => {
    const envelope = FROZEN_U3_PRACTICE_PROGRESS_BASELINE;
    expect(envelope.activeStudentId).toBeTruthy();
    const slice = envelope.students[envelope.activeStudentId];
    expect(slice).toBeDefined();
    // All six PracticeProgress fields documented in src/lib/practice-progress.ts.
    expect(Array.isArray(slice.attempts)).toBe(true);
    expect(typeof slice.accuracyBySkill).toBe("object");
    expect(typeof slice.trendBySkill).toBe("object");
    expect(typeof slice.lastPracticedBySkill).toBe("object");
    expect(slice.diagnosticResult).toBeNull();
    expect(slice.studyPlan).toBeNull();
  });

  test("u3-advanced-progress-baseline: ChallengeAttempt has the EXACT 7 documented fields", () => {
    const baseline = FROZEN_U3_ADVANCED_PROGRESS_BASELINE;
    expect(baseline.challengeAttempts).toHaveLength(1);
    const [attempt] = baseline.challengeAttempts;
    const keys = Object.keys(attempt).sort();
    expect(keys).toEqual([
      "answeredAt",
      "attemptIndex",
      "correct",
      "exerciseId",
      "skillId",
      "studentId",
      "timeMs",
    ]);
    expect(baseline.readinessBySkill["mat.u3.traduccion_lenguaje_verbal"]).toBe(100);
    expect(baseline.readinessBySkill["mat.u3.ecuaciones_lineales"]).toBeNull();
  });
});
