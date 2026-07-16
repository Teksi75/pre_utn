import { describe, expect, test } from "vitest";
import {
  evaluatePiRational,
  evaluateAngleDms,
  evaluateStructuredAnswer,
} from "../evaluator/structured";
import type { StructuredAnswerSpec } from "../models/exercise";

/**
 * RED suite for the structured-answer evaluators.
 * Tests assert the contract from math-answer-evaluator/spec.md for
 * Pi-Rational Evaluation and Angle DMS Evaluation.
 */

describe("evaluatePiRational", () => {
  const pi1a: StructuredAnswerSpec = {
    kind: "pi-rational",
    expected: { numerator: 1, denominator: 5 },
    decimal: 0.6283,
    tolerance: 0.0001,
  };

  test("exact coefficient and within tolerance is correct", () => {
    const result = evaluatePiRational(pi1a, { numerator: 1, denominator: 5, decimal: 0.6283 });
    expect(result.correct).toBe(true);
  });

  test("coefficient off, decimal within tolerance is incorrect", () => {
    const result = evaluatePiRational(pi1a, { numerator: 2, denominator: 5, decimal: 0.6283 });
    expect(result.correct).toBe(false);
  });

  test("coefficient exact, decimal outside tolerance is incorrect", () => {
    const result = evaluatePiRational(pi1a, { numerator: 1, denominator: 5, decimal: 0.65 });
    expect(result.correct).toBe(false);
  });

  test("equivalence under reduction is correct", () => {
    // 2/10 reduces to 1/5; both pass.
    const result = evaluatePiRational(pi1a, { numerator: 2, denominator: 10, decimal: 0.6283 });
    expect(result.correct).toBe(true);
  });

  test("decimal exactly on tolerance boundary is correct", () => {
    // 0.6283 + 0.0001 = 0.6284 — boundary inclusive
    const result = evaluatePiRational(pi1a, { numerator: 1, denominator: 5, decimal: 0.6284 });
    expect(result.correct).toBe(true);
  });

  test("decimal just outside tolerance boundary is incorrect", () => {
    const result = evaluatePiRational(pi1a, { numerator: 1, denominator: 5, decimal: 0.6285 });
    expect(result.correct).toBe(false);
  });

  test("negative coefficient compares exactly (sign on numerator)", () => {
    const neg: StructuredAnswerSpec = {
      kind: "pi-rational",
      expected: { numerator: -1, denominator: 5 },
      decimal: -0.6283,
      tolerance: 0.0001,
    };
    expect(evaluatePiRational(neg, { numerator: -1, denominator: 5, decimal: -0.6283 }).correct).toBe(true);
    expect(evaluatePiRational(neg, { numerator: 1, denominator: 5, decimal: 0.6283 }).correct).toBe(false);
  });

  test("item .3 expected {8,1,25.1327} is correct for exact submission", () => {
    const item3: StructuredAnswerSpec = {
      kind: "pi-rational",
      expected: { numerator: 8, denominator: 1 },
      decimal: 25.1327,
      tolerance: 0.001,
    };
    const result = evaluatePiRational(item3, { numerator: 8, denominator: 1, decimal: 25.1327 });
    expect(result.correct).toBe(true);
  });
});

describe("evaluateAngleDms", () => {
  const dms: StructuredAnswerSpec = {
    kind: "angle-dms",
    expected: { degrees: 11, minutes: 27, seconds: 33 },
    tolerance: 0.5,
  };

  test("exact {11, 27, 33} is correct (Δ=0)", () => {
    expect(evaluateAngleDms(dms, { degrees: 11, minutes: 27, seconds: 33 }).correct).toBe(true);
  });

  test("32.7 seconds is within tolerance (Δ=0.3)", () => {
    expect(evaluateAngleDms(dms, { degrees: 11, minutes: 27, seconds: 32.7 }).correct).toBe(true);
  });

  test("32 seconds is OUTSIDE tolerance (Δ=1.0, inclusive boundary per advisory note 1)", () => {
    // Advisory note 1: in-range total-second miss boundary is INCLUSIVE (≤ 1.0).
    // Tolerance is 0.5, so 32" gives Δ=1.0 → incorrect.
    const result = evaluateAngleDms(dms, { degrees: 11, minutes: 27, seconds: 32 });
    expect(result.correct).toBe(false);
  });

  test("exactly 32.5 seconds is on the inclusive boundary (Δ=0.5) → correct", () => {
    // |32.5 - 33| = 0.5 = tolerance → inclusive correct
    expect(evaluateAngleDms(dms, { degrees: 11, minutes: 27, seconds: 32.5 }).correct).toBe(true);
  });

  test("exactly 32.4 seconds is just outside tolerance (Δ=0.6) → incorrect", () => {
    expect(evaluateAngleDms(dms, { degrees: 11, minutes: 27, seconds: 32.4 }).correct).toBe(false);
  });

  test("33.6 seconds is just outside tolerance (Δ=0.6) → incorrect", () => {
    expect(evaluateAngleDms(dms, { degrees: 11, minutes: 27, seconds: 33.6 }).correct).toBe(false);
  });

  test("minutes=60 rejected as malformed submission", () => {
    expect(() =>
      evaluateAngleDms(dms, { degrees: 11, minutes: 60, seconds: 33 })
    ).toThrow();
  });

  test("seconds=60 rejected as malformed submission", () => {
    expect(() =>
      evaluateAngleDms(dms, { degrees: 11, minutes: 27, seconds: 60 })
    ).toThrow();
  });

  test("degree-carry miss (12°27′33″) has Δ=3600 arc-seconds and is incorrect", () => {
    // Advisory note 1: degree-carry misses must be caught.
    expect(evaluateAngleDms(dms, { degrees: 12, minutes: 27, seconds: 33 }).correct).toBe(false);
  });
});

describe("evaluateStructuredAnswer dispatcher", () => {
  const pi1a: StructuredAnswerSpec = {
    kind: "pi-rational",
    expected: { numerator: 1, denominator: 5 },
    decimal: 0.6283,
    tolerance: 0.0001,
  };
  const dms: StructuredAnswerSpec = {
    kind: "angle-dms",
    expected: { degrees: 11, minutes: 27, seconds: 33 },
    tolerance: 0.5,
  };

  test("routes pi-rational submission to evaluatePiRational", () => {
    const result = evaluateStructuredAnswer(pi1a, { numerator: 1, denominator: 5, decimal: 0.6283 });
    expect(result.correct).toBe(true);
  });

  test("routes angle-dms submission to evaluateAngleDms", () => {
    const result = evaluateStructuredAnswer(dms, { degrees: 11, minutes: 27, seconds: 33 });
    expect(result.correct).toBe(true);
  });

  test("returns incorrect result (not throw) for malformed submission", () => {
    // The dispatcher MUST NOT throw — it returns {correct:false, feedback}
    // so the student sees a clear "incorrect" rather than a runtime error.
    const result = evaluateStructuredAnswer(pi1a, { numerator: 1, denominator: 0, decimal: 0 });
    expect(result.correct).toBe(false);
    expect(typeof result.feedback).toBe("string");
  });
});

describe("evaluateAnswer dispatcher integration", () => {
  // Imports from the dispatcher module — proves the dispatcher routes the
  // structured type BEFORE the legacy numerical/true-false/etc. branches.
  test("evaluateAnswer routes a structured exercise to the structured dispatcher", async () => {
    const { evaluateAnswer } = await import("../evaluator/index");
    const result = evaluateAnswer(
      {
        type: "structured",
        skillId: "mat.u5.medicion_angulos_y_arcos" as never,
        expectedAnswer: "1/5",
        commonErrorTags: [],
        prompt: "Convertir 36° a radianes",
        answerSpec: {
          kind: "pi-rational",
          expected: { numerator: 1, denominator: 5 },
          decimal: 0.6283,
          tolerance: 0.0001,
        },
      },
      JSON.stringify({
        v: 1,
        kind: "pi-rational",
        numerator: 1,
        denominator: 5,
        decimal: 0.6283,
      })
    );
    expect(result.correct).toBe(true);
  });

  test("evaluateAnswer rejects malformed structured submission as incorrect (not throw)", async () => {
    const { evaluateAnswer } = await import("../evaluator/index");
    const result = evaluateAnswer(
      {
        type: "structured",
        skillId: "mat.u5.medicion_angulos_y_arcos" as never,
        expectedAnswer: "1/5",
        commonErrorTags: [],
        prompt: "x",
        answerSpec: {
          kind: "pi-rational",
          expected: { numerator: 1, denominator: 5 },
          decimal: 0.6283,
          tolerance: 0.0001,
        },
      },
      JSON.stringify({ v: 1, kind: "pi-rational" })
    );
    expect(result.correct).toBe(false);
  });

  test("evaluateAnswer routes a structured angle-dms exercise correctly", async () => {
    const { evaluateAnswer } = await import("../evaluator/index");
    const result = evaluateAnswer(
      {
        type: "structured",
        skillId: "mat.u5.medicion_angulos_y_arcos" as never,
        expectedAnswer: "11° 27' 33\"",
        commonErrorTags: [],
        prompt: "Expresá el ángulo en DMS",
        answerSpec: {
          kind: "angle-dms",
          expected: { degrees: 11, minutes: 27, seconds: 33 },
          tolerance: 0.5,
        },
      },
      JSON.stringify({
        v: 1,
        kind: "angle-dms",
        degrees: 11,
        minutes: 27,
        seconds: 32.7,
      })
    );
    expect(result.correct).toBe(true);
  });

  test("evaluateAnswer routes a numerical exercise via legacy path (NOT structured)", async () => {
    const { evaluateAnswer } = await import("../evaluator/index");
    const result = evaluateAnswer(
      {
        type: "numerical",
        skillId: "mat.u1.conjuntos_numericos" as never,
        expectedAnswer: "5",
        commonErrorTags: [],
        prompt: "Resuelve 2+3",
      },
      "5"
    );
    expect(result.correct).toBe(true);
  });
});