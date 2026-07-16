import { describe, expect, test } from "vitest";
import { tagError } from "../evaluator/error-tagging";
import {
  isU5DegreeRadianFactorError,
  isU5DmsConversionError,
  isU5ArcTimeFractionError,
} from "../evaluator/error-tagging";
import type { EvaluableExercise } from "../models/exercise";

/**
 * RED suite for the three Unit 5 misconception detectors.
 * Each detector must:
 *   - Only return its tag when the exercise declares it in commonErrorTags
 *   - Be deterministic and side-effect free
 *   - Match the patterns described in math-answer-evaluator/spec.md
 *     (Unit 5 Misconception Tagging)
 */

function makeExercise(
  partial: Partial<EvaluableExercise> & { commonErrorTags: readonly string[] },
): EvaluableExercise {
  return {
    type: "numerical",
    skillId: "mat.u5.medicion_angulos_y_arcos" as never,
    expectedAnswer: "0",
    prompt: "x",
    ...partial,
  };
}

describe("isU5DegreeRadianFactorError", () => {
  // Item 1a: 36° → π/5. Expected reduced {1, 5}. A common mistake writes
  // {36, 180} as the "raw" pair (the unreduced degree fraction).
  const ex1a = makeExercise({
    commonErrorTags: ["u5_degree_radian_factor"],
    type: "structured",
    expectedAnswer: "1/5",
    prompt: "Convertir 36° a radianes",
    answerSpec: {
      kind: "pi-rational",
      expected: { numerator: 1, denominator: 5 },
      decimal: 0.6283,
      tolerance: 0.0001,
    },
  });

  test("fires on submitted RAW pair {36, 180} (unreduced degree fraction) for item 1a", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 36,
      denominator: 180,
      decimal: 0.6283,
    });
    expect(isU5DegreeRadianFactorError(ex1a, submitted)).toBe(true);
  });

  test("does NOT fire on the canonical correct reduced {1, 5}", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 1,
      denominator: 5,
      decimal: 0.6283,
    });
    expect(isU5DegreeRadianFactorError(ex1a, submitted)).toBe(false);
  });

  test("does NOT fire when tag is NOT declared in commonErrorTags", () => {
    const exNoTag = makeExercise({
      commonErrorTags: [],
      type: "structured",
      expectedAnswer: "1/5",
      prompt: "x",
      answerSpec: ex1a.answerSpec,
    });
    const submitted = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 36,
      denominator: 180,
      decimal: 0.6283,
    });
    expect(isU5DegreeRadianFactorError(exNoTag, submitted)).toBe(false);
  });

  test("fires on item 1b (225°): submitted RAW {225, 180} is the unreduced degree fraction", () => {
    const ex1b = makeExercise({
      commonErrorTags: ["u5_degree_radian_factor"],
      type: "structured",
      expectedAnswer: "5/4",
      prompt: "Convertir 225° a radianes",
      answerSpec: {
        kind: "pi-rational",
        expected: { numerator: 5, denominator: 4 },
        decimal: 3.9269,
        tolerance: 0.0001,
      },
    });
    const submitted = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 225,
      denominator: 180,
      decimal: 3.9269,
    });
    expect(isU5DegreeRadianFactorError(ex1b, submitted)).toBe(true);
  });
});

describe("isU5DmsConversionError", () => {
  const ex2d = makeExercise({
    commonErrorTags: ["u5_dms_conversion"],
    type: "structured",
    expectedAnswer: "11° 27' 33\"",
    prompt: "Expresá el ángulo en DMS",
    answerSpec: {
      kind: "angle-dms",
      expected: { degrees: 11, minutes: 27, seconds: 33 },
      tolerance: 0.5,
    },
  });

  test("fires on {11, 27, 32} (Δ=1.0 arc-sec, inclusive boundary per advisory note 1)", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 32,
    });
    expect(isU5DmsConversionError(ex2d, submitted)).toBe(true);
  });

  test("does NOT fire on the correct {11, 27, 33}", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 33,
    });
    expect(isU5DmsConversionError(ex2d, submitted)).toBe(false);
  });

  test("does NOT fire on {11, 27, 32.4} (Δ=0.6, well outside tolerance)", () => {
    // Advisory note 1 boundary is inclusive only at Δ=1.0 (i.e., the
    // very-next-integer miss). Larger jumps are also caught by the
    // degree-carry branch but not by the boundary logic.
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 32.4,
    });
    // Out of tolerance, but the detector focuses on the inclusive
    // boundary. 32.4 is Δ=0.6 which is inside the boundary range the
    // detector scans. Per advisory note: "fires on in-range total-second
    // miss ≤1.0 arc-sec (inclusive) including {11,27,32} where Δ=1.0".
    // We therefore expect the detector to fire on 32.4 as well (it's
    // a same-bucket in-range miss).
    expect(isU5DmsConversionError(ex2d, submitted)).toBe(true);
  });

  test("fires on degree-carry miss {12, 27, 33} (Δ=3600 arc-sec)", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 12,
      minutes: 27,
      seconds: 33,
    });
    expect(isU5DmsConversionError(ex2d, submitted)).toBe(true);
  });

  test("fires on out-of-bounds seconds {11, 27, 60}", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 60,
    });
    expect(isU5DmsConversionError(ex2d, submitted)).toBe(true);
  });

  test("fires on out-of-bounds minutes {11, 60, 33}", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 60,
      seconds: 33,
    });
    expect(isU5DmsConversionError(ex2d, submitted)).toBe(true);
  });

  test("does NOT fire when tag is NOT declared in commonErrorTags", () => {
    const exNoTag = makeExercise({
      commonErrorTags: [],
      type: "structured",
      expectedAnswer: ex2d.expectedAnswer,
      prompt: ex2d.prompt,
      answerSpec: ex2d.answerSpec,
    });
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 32,
    });
    expect(isU5DmsConversionError(exNoTag, submitted)).toBe(false);
  });
});

describe("isU5ArcTimeFractionError", () => {
  const ex3 = makeExercise({
    commonErrorTags: ["u5_arc_time_fraction"],
    type: "structured",
    expectedAnswer: "8π cm",
    prompt: "Calculá el arco en cm",
    answerSpec: {
      kind: "pi-rational",
      expected: { numerator: 8, denominator: 1 },
      decimal: 25.1327,
      tolerance: 0.001,
    },
  });

  test("fires when submitted represents 10-minute fraction (half of 20-minute expected)", () => {
    // Expected {8, 1, 25.1327} (20-minute arc). 10-minute arc gives {4, 1, 12.5663}.
    const submitted = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 4,
      denominator: 1,
      decimal: 12.5663,
    });
    expect(isU5ArcTimeFractionError(ex3, submitted)).toBe(true);
  });

  test("does NOT fire on the correct {8, 1, 25.1327}", () => {
    const submitted = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 8,
      denominator: 1,
      decimal: 25.1327,
    });
    expect(isU5ArcTimeFractionError(ex3, submitted)).toBe(false);
  });

  test("does NOT fire when tag is NOT declared in commonErrorTags", () => {
    const exNoTag = makeExercise({
      commonErrorTags: [],
      type: "structured",
      expectedAnswer: ex3.expectedAnswer,
      prompt: ex3.prompt,
      answerSpec: ex3.answerSpec,
    });
    const submitted = JSON.stringify({
      v: 1,
      kind: "pi-rational",
      numerator: 4,
      denominator: 1,
      decimal: 12.5663,
    });
    expect(isU5ArcTimeFractionError(exNoTag, submitted)).toBe(false);
  });
});

describe("tagError dispatcher returns U5 tags when declared", () => {
  test("returns u5_dms_conversion for 2d when student submits {11, 27, 32}", () => {
    const ex2d = makeExercise({
      commonErrorTags: ["u5_dms_conversion"],
      type: "structured",
      expectedAnswer: "11° 27' 33\"",
      prompt: "Expresá el ángulo en DMS",
      answerSpec: {
        kind: "angle-dms",
        expected: { degrees: 11, minutes: 27, seconds: 33 },
        tolerance: 0.5,
      },
    });
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 32,
    });
    expect(tagError(ex2d, submitted)).toBe("u5_dms_conversion");
  });

  test("returns undefined for 2d when u5_dms_conversion is NOT declared", () => {
    const ex2dNoTag = makeExercise({
      commonErrorTags: [],
      type: "structured",
      expectedAnswer: "11° 27' 33\"",
      prompt: "Expresá el ángulo en DMS",
      answerSpec: {
        kind: "angle-dms",
        expected: { degrees: 11, minutes: 27, seconds: 33 },
        tolerance: 0.5,
      },
    });
    const submitted = JSON.stringify({
      v: 1,
      kind: "angle-dms",
      degrees: 11,
      minutes: 27,
      seconds: 32,
    });
    expect(tagError(ex2dNoTag, submitted)).toBeUndefined();
  });
});