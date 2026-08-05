import { describe, expect, test } from "vitest";
import {
  SUPPORTED_EXERCISE_TYPES,
  hasStructuredMathAnswer,
  validateExercise,
  type EvaluableExercise,
  type StructuredAnswerSpec,
} from "../models/exercise";

/**
 * RED suite for the structured-answer surface.
 * Each test asserts a contract that depends on the structured kind,
 * StructuredAnswerSpec, and StructuredSubmissionV1 contracts declared
 * in math-exercise-model/spec.md.
 */

const KNOWN_SKILL_ID = "mat.u5.medicion_angulos_y_arcos";
const KNOWN_TAG = "u5_dms_conversion";

function okKnownSkillIds(): Set<string> {
  return new Set([KNOWN_SKILL_ID]);
}

function okKnownErrorTags(): Set<string> {
  return new Set([KNOWN_TAG]);
}

describe("Structured type model", () => {
  test("SUPPORTED_EXERCISE_TYPES includes 'structured'", () => {
    // Acceptance: list contains the new type literal.
    expect(SUPPORTED_EXERCISE_TYPES.has("structured")).toBe(true);
  });

  test("'structured' is NOT falsely detected as a structured-math fill-blank answer", () => {
    // hasStructuredMathAnswer runs over an exercise.prompt string; the literal
    // word "structured" must not trip the structured-math heuristic (it has
    // no digits, no operators, no roots, no logs).
    expect(hasStructuredMathAnswer("structured")).toBe(false);
  });

  test("hasStructuredMathAnswer still rejects an a+bi complex answer", () => {
    // Defensive regression for fill-blank: the prompt may still contain
    // expressions we forbid. The structured-math check must keep working
    // for fill-blank exercises even after we add a structured type.
    expect(hasStructuredMathAnswer("a+bi")).toBe(true);
  });
});

describe("EvaluableExercise accepts StructuredAnswerSpec", () => {
  const piSpec: StructuredAnswerSpec = {
    kind: "pi-rational",
    expected: { numerator: 1, denominator: 5 },
    decimal: 0.6283,
    tolerance: 0.0001,
  };

  test("EvaluableExercise accepts a pi-rational answerSpec", () => {
    const ex: EvaluableExercise = {
      type: "structured",
      skillId: KNOWN_SKILL_ID as never,
      expectedAnswer: "1/5",
      commonErrorTags: [KNOWN_TAG],
      prompt: "Convertir 36° a radianes como múltiplo de π",
      answerSpec: piSpec,
    };
    // The shape compiles and the runtime check passes (no throw at construction).
    expect(ex.type).toBe("structured");
    expect(ex.answerSpec?.kind).toBe("pi-rational");
  });

  test("EvaluableExercise accepts an angle-dms answerSpec", () => {
    const dmsSpec: StructuredAnswerSpec = {
      kind: "angle-dms",
      expected: { degrees: 11, minutes: 27, seconds: 33 },
      tolerance: 0.5,
    };
    const ex: EvaluableExercise = {
      type: "structured",
      skillId: KNOWN_SKILL_ID as never,
      expectedAnswer: "11° 27' 33\"",
      commonErrorTags: [KNOWN_TAG],
      prompt: "Expresá el ángulo en grados, minutos y segundos",
      answerSpec: dmsSpec,
    };
    expect(ex.answerSpec?.kind).toBe("angle-dms");
  });
});

describe("Structured normalization rules (exercised through validateExercise)", () => {
  test("validateExercise accepts a structured exercise with valid answerSpec", () => {
    const result = validateExercise(
      {
        id: "ex.u5.medicion_angulos_y_arcos.1a",
        skillId: KNOWN_SKILL_ID as never,
        type: "structured",
        difficulty: 1,
        prompt: "Convertir 36° a radianes",
        expectedAnswer: "1/5",
        commonErrorTags: [],
        pedagogicalNote: "Conversión de grados a múltiplos de π",
        unit: 5,
        answerSpec: {
          kind: "pi-rational",
          expected: { numerator: 1, denominator: 5 },
          decimal: 0.6283,
          tolerance: 0.0001,
        },
      },
      okKnownSkillIds() as never,
      okKnownErrorTags()
    );
    expect(result.ok).toBe(true);
  });

  test("validateExercise rejects a structured exercise with denominator = 0", () => {
    const result = validateExercise(
      {
        id: "ex.u5.medicion_angulos_y_arcos.bad1",
        skillId: KNOWN_SKILL_ID as never,
        type: "structured",
        difficulty: 1,
        prompt: "x",
        expectedAnswer: "0/0",
        commonErrorTags: [],
        pedagogicalNote: "bad",
        unit: 5,
        answerSpec: {
          kind: "pi-rational",
          expected: { numerator: 0, denominator: 0 },
          decimal: 0,
          tolerance: 0.0001,
        },
      },
      okKnownSkillIds() as never,
      okKnownErrorTags()
    );
    // Either ok=false OR thrown at parse — both are acceptable. Here we
    // only need to prove the validation rejects the malformed spec.
    if (result.ok) {
      // If validateExercise returned ok=true, downstream normalization
      // must still reject it: the loader path is the gate.
      throw new Error("expected validation to reject denominator=0");
    } else {
      expect(result.error.message.toLowerCase()).toContain("denominator");
    }
  });

  test("validateExercise rejects a structured exercise with minutes = 60", () => {
    const result = validateExercise(
      {
        id: "ex.u5.medicion_angulos_y_arcos.bad2",
        skillId: KNOWN_SKILL_ID as never,
        type: "structured",
        difficulty: 1,
        prompt: "x",
        expectedAnswer: "11° 60' 33\"",
        commonErrorTags: [],
        pedagogicalNote: "bad",
        unit: 5,
        answerSpec: {
          kind: "angle-dms",
          expected: { degrees: 11, minutes: 60, seconds: 33 },
          tolerance: 0.5,
        },
      },
      okKnownSkillIds() as never,
      okKnownErrorTags()
    );
    if (result.ok) {
      throw new Error("expected validation to reject minutes=60");
    } else {
      expect(result.error.message.toLowerCase()).toContain("minutes");
    }
  });
});