import { describe, expect, test } from "vitest";
import { applyExerciseDefaults } from "../catalog/content-loaders";

/**
 * RED suite for the structured `answerSpec` validation gate.
 *
 * `applyExerciseDefaults` is the load-time validator. A malformed
 * structured spec MUST throw — not produce a half-validated exercise —
 * because the evaluator cannot recover from a malformed expected spec.
 *
 * Per spec `math-exercise-model/spec.md` (Structured Spec Malformed at
 * Load Returns Configuration Error).
 */

function baseStructured(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "ex.u5.medicion_angulos_y_arcos.1a",
    skillId: "mat.u5.medicion_angulos_y_arcos",
    type: "structured",
    difficulty: 1,
    prompt: "Convertir 36° a radianes",
    expectedAnswer: "1/5",
    commonErrorTags: [],
    pedagogicalNote: "x",
    unit: 5,
    ...overrides,
  };
}

describe("applyExerciseDefaults — structured answerSpec validation", () => {
  test("accepts a valid pi-rational spec", () => {
    const exercise = applyExerciseDefaults(
      baseStructured({
        answerSpec: {
          kind: "pi-rational",
          expected: { numerator: 1, denominator: 5 },
          decimal: 0.6283,
          tolerance: 0.0001,
        },
      }),
    );
    expect(exercise.type).toBe("structured");
    expect(exercise.answerSpec?.kind).toBe("pi-rational");
  });

  test("accepts a valid angle-dms spec", () => {
    const exercise = applyExerciseDefaults(
      baseStructured({
        id: "ex.u5.medicion_angulos_y_arcos.2d",
        expectedAnswer: "11° 27' 33\"",
        answerSpec: {
          kind: "angle-dms",
          expected: { degrees: 11, minutes: 27, seconds: 33 },
          tolerance: 0.5,
        },
      }),
    );
    expect(exercise.type).toBe("structured");
    expect(exercise.answerSpec?.kind).toBe("angle-dms");
  });

  test("rejects a pi-rational with missing decimal", () => {
    expect(() =>
      applyExerciseDefaults(
        baseStructured({
          answerSpec: {
            kind: "pi-rational",
            expected: { numerator: 1, denominator: 5 },
            // decimal missing
            tolerance: 0.0001,
          },
        }),
      ),
    ).toThrow(/decimal/);
  });

  test("rejects a pi-rational with denominator = 0", () => {
    expect(() =>
      applyExerciseDefaults(
        baseStructured({
          answerSpec: {
            kind: "pi-rational",
            expected: { numerator: 0, denominator: 0 },
            decimal: 0,
            tolerance: 0.0001,
          },
        }),
      ),
    ).toThrow(/denominator/);
  });

  test("rejects a pi-rational with negative tolerance", () => {
    expect(() =>
      applyExerciseDefaults(
        baseStructured({
          answerSpec: {
            kind: "pi-rational",
            expected: { numerator: 1, denominator: 5 },
            decimal: 0.6283,
            tolerance: -0.0001,
          },
        }),
      ),
    ).toThrow(/tolerance/);
  });

  test("rejects an unknown structured kind", () => {
    expect(() =>
      applyExerciseDefaults(
        baseStructured({
          answerSpec: {
            kind: "set-tuple",
            expected: { a: 1, b: 2 },
          },
        }),
      ),
    ).toThrow(/set-tuple|kind/);
  });

  test("rejects an angle-dms with minutes = 60", () => {
    expect(() =>
      applyExerciseDefaults(
        baseStructured({
          id: "ex.u5.medicion_angulos_y_arcos.2d",
          expectedAnswer: "11° 60' 33\"",
          answerSpec: {
            kind: "angle-dms",
            expected: { degrees: 11, minutes: 60, seconds: 33 },
            tolerance: 0.5,
          },
        }),
      ),
    ).toThrow(/minutes/);
  });

  test("rejects an angle-dms with seconds = 60", () => {
    expect(() =>
      applyExerciseDefaults(
        baseStructured({
          id: "ex.u5.medicion_angulos_y_arcos.2d",
          expectedAnswer: "11° 27' 60\"",
          answerSpec: {
            kind: "angle-dms",
            expected: { degrees: 11, minutes: 27, seconds: 60 },
            tolerance: 0.5,
          },
        }),
      ),
    ).toThrow(/seconds/);
  });

  test("rejects an angle-dms with negative or non-integer expected degrees", () => {
    // normalizeAngleDms rejects these at submission time; the expected
    // spec must reject at load too so the exercise is answerable.
    for (const degrees of [-11, 11.5]) {
      expect(() =>
        applyExerciseDefaults(
          baseStructured({
            id: "ex.u5.medicion_angulos_y_arcos.2d",
            expectedAnswer: "11° 27' 33\"",
            answerSpec: {
              kind: "angle-dms",
              expected: { degrees, minutes: 27, seconds: 33 },
              tolerance: 0.5,
            },
          }),
        ),
      ).toThrow(/degrees/);
    }
  });

  test("rejects a structured exercise missing the answerSpec field", () => {
    expect(() => applyExerciseDefaults(baseStructured({}))).toThrow(
      /answerSpec/,
    );
  });

  test("error message includes the offending exercise id", () => {
    expect(() =>
      applyExerciseDefaults(
        baseStructured({
          id: "ex.u5.medicion_angulos_y_arcos.badmissingdecimal",
          answerSpec: {
            kind: "pi-rational",
            expected: { numerator: 1, denominator: 5 },
            tolerance: 0.0001,
          },
        }),
      ),
    ).toThrow(/ex\.u5\.medicion_angulos_y_arcos\.badmissingdecimal/);
  });
});