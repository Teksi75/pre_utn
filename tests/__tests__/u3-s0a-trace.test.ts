/**
 * S0a — Per-surface Exercise canonicalTrace contract (focused tests).
 *
 * Per `align-u3-practice-official-exercises/design.md`:
 *   Exercise / WorkedExample / Theory surface accepts ONLY
 *   `ExerciseSourceUse = "adapted" | "reinforcement" | "reference"`.
 *   Challenge-only literals (`canonical-source`, `calibrated-from-exam`,
 *   `solution-pattern`) MUST be rejected at the type level AND at runtime.
 *
 * The companion WIP file `u3-s0-foundation.test.ts` covers S0 broadly;
 * this file isolates the per-surface contract for the eventual S0a PR.
 */

import { describe, test, expect } from "vitest";
import type {
  Exercise,
  ExerciseBaseShape,
  ExerciseCanonicalTrace,
  ExerciseSourceUse,
} from "@/domain/models/exercise";
import type { ChallengeCanonicalTrace } from "@/domain/catalog/challenges/types";
import { validateExercise } from "@/domain/models/exercise";
import type { SkillId } from "@/domain/models/skill";
import { parseOptionalCanonicalTrace } from "@/domain/catalog/content-loaders";

const KNOWN_SKILL_IDS: Set<SkillId> = new Set<SkillId>([
  "mat.u3.ecuaciones_lineales",
]);
const KNOWN_ERROR_TAGS = new Set<string>(["u3_aislamiento_incorrecto"]);
const PATH =
  "material_canonico/utn-frm/matematica/unidad-03/practica/03_ej_utn.pdf";

const VALID_BASE_SOURCE_USES: readonly ExerciseSourceUse[] = [
  "adapted",
  "reinforcement",
  "reference",
];
const CHALLENGE_ONLY_SOURCE_USES = [
  "canonical-source",
  "calibrated-from-exam",
  "solution-pattern",
] as const;

function minimalExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex.u3.ecuaciones_lineales.2",
    skillId: "mat.u3.ecuaciones_lineales",
    type: "multiple-choice",
    difficulty: 1,
    prompt: "Sample",
    expectedAnswer: "A",
    commonErrorTags: [],
    pedagogicalNote: "Note",
    unit: 3,
    options: ["A", "B", "C"],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Compile-time separation.
// ---------------------------------------------------------------------------

describe("S0a — ExerciseCanonicalTrace is a per-surface type", () => {
  test("ExerciseCanonicalTrace is the canonical entry shape for Exercise.canonicalTrace", () => {
    const trace: ExerciseCanonicalTrace = {
      path: PATH,
      section: "P1l",
      sourceUse: "reference",
      pedagogicalIntent: "Base trace entry on the Exercise surface",
    };
    const exercise = minimalExercise({ canonicalTrace: [trace] });
    expect(exercise.canonicalTrace).toHaveLength(1);
    expect(exercise.canonicalTrace![0].sourceUse).toBe("reference");
  });

  test("challenge-only ChallengeCanonicalTrace is NOT assignable to Exercise.canonicalTrace", () => {
    // S0a contract (compile-time half): a `ChallengeCanonicalTrace` literal
    // (the typed challenge-surface trace) MUST NOT be structurally
    // assignable to `Exercise.canonicalTrace` (which is `readonly
    // ExerciseCanonicalTrace[]`). The two trace types are intentionally
    // non-overlapping on `sourceUse` (challenge-only literals like
    // `canonical-source` are not in `ExerciseSourceUse`).
    //
    // The @ts-expect-error sits on the OBJECT CONSTRUCTION (the value
    // flowing into the `canonicalTrace` field), NOT on a property mutation
    // of a `readonly` field. That is, the suppressed error MUST be the
    // sourceUse-type mismatch (TS2322) — NOT a "Cannot assign to
    // 'canonicalTrace' because it is a read-only property" (TS2540). The
    // construction form removes the readonly error from the equation so
    // the directive can only be satisfied by the value-mismatch error.
    const challengeOnlyTrace: ChallengeCanonicalTrace = {
      path: PATH,
      section: "P1l",
      sourceUse: "canonical-source",
      pedagogicalIntent: "must NOT typecheck as Exercise trace",
    };
    // @ts-expect-error — challenge-only ChallengeCanonicalTrace must NOT structurally assign to Exercise.canonicalTrace
    const exercise = minimalExercise({ canonicalTrace: [challengeOnlyTrace] });
    // Touch the value so the test exercises real code paths (not just a
    // discarded binding).
    expect(exercise.id).toBe("ex.u3.ecuaciones_lineales.2");
  });

  test("ExerciseBaseShape is the structural base shared by Exercise and ChallengeExercise", () => {
    // Renderers / the evaluator (which do NOT read canonicalTrace) accept
    // either surface uniformly by typing against ExerciseBaseShape.
    const sampleShape: ExerciseBaseShape = minimalExercise();
    expect(sampleShape.id).toBe("ex.u3.ecuaciones_lineales.2");
  });
});

// ---------------------------------------------------------------------------
// Runtime rejection — every challenge-only literal must fail fast.
// ---------------------------------------------------------------------------

describe("S0a — parser rejects every challenge-only sourceUse literal", () => {
  test.each(CHALLENGE_ONLY_SOURCE_USES)("rejects sourceUse=%s", (badUse) => {
    expect(() =>
      parseOptionalCanonicalTrace(
        {
          path: PATH,
          section: "P1l",
          sourceUse: badUse,
          pedagogicalIntent: "must reject challenge-only literal",
        },
        "ex.u3.ecuaciones_lineales.2"
      )
    ).toThrow(/sourceUse/);
  });

  test("rejects non-challenge invalid sourceUse (e.g. 'alignment')", () => {
    // S0a contract (runtime half, expanded): the base parser rejects
    // EVERY literal outside the 3-value exercise set — not just the
    // 3 challenge-only literals. "alignment" is the canonical example of
    // a non-challenge, non-base literal that the parser MUST also fail
    // fast on. This guards against accidentally widening the
    // ExerciseSourceUse set to absorb future values that are not
    // challenge-specific.
    expect(() =>
      parseOptionalCanonicalTrace(
        {
          path: PATH,
          section: "P1l",
          sourceUse: "alignment",
          pedagogicalIntent: "must reject any non-base literal",
        },
        "ex.u3.ecuaciones_lineales.2"
      )
    ).toThrow(/sourceUse/);
  });
});

// ---------------------------------------------------------------------------
// Runtime acceptance — every base literal is accepted; absent is null.
// ---------------------------------------------------------------------------

describe("S0a — parser accepts every ExerciseSourceUse literal", () => {
  test.each(VALID_BASE_SOURCE_USES)("accepts sourceUse=%s", (goodUse) => {
    const parsed = parseOptionalCanonicalTrace(
      {
        path: PATH,
        section: "P1l",
        sourceUse: goodUse,
        pedagogicalIntent: "valid base literal",
      },
      "ex.u3.ecuaciones_lineales.2"
    );
    expect(parsed).toHaveLength(1);
    expect(parsed![0].sourceUse).toBe(goodUse);
  });

  test("returns null when canonicalTrace is absent or empty", () => {
    // Absent / null semantics per model: the field is OPTIONAL and the
    // typed model treats `undefined | null` as "no trace attached".
    // Empty-array and empty-object are folded into the same absent
    // semantic so a JSON entry that explicitly set `canonicalTrace: {}`
    // is not flagged as malformed.
    expect(parseOptionalCanonicalTrace({}, "ex.u3.ecuaciones_lineales.2")).toBeNull();
    expect(parseOptionalCanonicalTrace([], "ex.u3.ecuaciones_lineales.2")).toBeNull();
  });

  // ─── GGA latest blocker — present-but-malformed non-object MUST throw ───
  //
  // The previous implementation returned `null` for ANY present-but-non-
  // object/array value (numbers, strings, booleans). That silently
  // swallowed malformed JSON entries — the loader treated a present-but-
  // broken shape the same as absent. The fix MUST throw for present-but-
  // non-object/array primitives so a malformed entry fails fast at the
  // JSON import boundary instead of being coerced into "no trace".

  test.each([
    ["number literal", 42],
    ["boolean literal", true],
    ["boolean literal false", false],
    ["non-empty string literal", "not-a-trace-object"],
    ["NaN", NaN],
  ])("throws when canonicalTrace is present but a %s (non-object)", (_label, raw) => {
    expect(() =>
      parseOptionalCanonicalTrace(raw, "ex.u3.ecuaciones_lineales.2"),
    ).toThrow(/canonicalTrace/);
  });

  test("absent / null remain null (absent semantics per model)", () => {
    // The presence test above pins the throw-on-malformed contract.
    // Symmetrically, the loader MUST preserve the absent/null semantic
    // — `undefined` and `null` are NOT malformed, they are "no trace
    // attached" and MUST continue to return null.
    expect(parseOptionalCanonicalTrace(undefined, "ex.u3.ecuaciones_lineales.2")).toBeNull();
    expect(parseOptionalCanonicalTrace(null, "ex.u3.ecuaciones_lineales.2")).toBeNull();
  });

  test("rejects whitespace-only section on a single-entry trace (canonical trace fields reject empty/whitespace)", () => {
    expect(() =>
      parseOptionalCanonicalTrace(
        {
          path: PATH,
          section: "   ",
          sourceUse: "reference",
          pedagogicalIntent: "valid base literal",
        },
        "ex.u3.ecuaciones_lineales.2"
      )
    ).toThrow(/section/);
  });

  test("accepts absent section (section is optional on the Exercise surface)", () => {
    const parsed = parseOptionalCanonicalTrace(
      {
        path: PATH,
        sourceUse: "reference",
        pedagogicalIntent: "valid base literal",
      },
      "ex.u3.ecuaciones_lineales.2"
    );
    expect(parsed).toHaveLength(1);
    expect(parsed![0].section).toBeUndefined();
  });

  test("accepts a non-empty section", () => {
    const parsed = parseOptionalCanonicalTrace(
      {
        path: PATH,
        section: "P1l",
        sourceUse: "reference",
        pedagogicalIntent: "valid base literal",
      },
      "ex.u3.ecuaciones_lineales.2"
    );
    expect(parsed).toHaveLength(1);
    expect(parsed![0].section).toBe("P1l");
  });
});

// ---------------------------------------------------------------------------
// End-to-end — validateExercise accepts a parsed ExerciseCanonicalTrace.
// ---------------------------------------------------------------------------

describe("S0a — validateExercise accepts a per-surface ExerciseCanonicalTrace", () => {
  test("exercise with parsed per-surface trace validates", () => {
    const parsed = parseOptionalCanonicalTrace(
      {
        path: PATH,
        section: "P1l",
        sourceUse: "adapted",
        pedagogicalIntent: "end-to-end per-surface trace",
      },
      "ex.u3.ecuaciones_lineales.2"
    )!;
    const exercise = minimalExercise({ canonicalTrace: parsed });
    const result = validateExercise(exercise, KNOWN_SKILL_IDS, KNOWN_ERROR_TAGS);
    expect(result.ok).toBe(true);
  });
});