/**
 * U3 Error Tagging — Unit 3 deterministic pattern detectors.
 *
 * Spec coverage (openspec/changes/implement-unit-3-mathematics/specs/math-error-taxonomy/spec.md):
 *   - U3-TAG-004: each new u3_* tag has at least one detection pattern
 *
 * Convention for U3 detectors:
 *   - Most detectors target MC exercises (comparing selected option against
 *     expected), with a few numerical cases for sign/one-root confusion.
 *   - Detectors are SAFE-FIRST: they only fire when the exercise declares
 *     the matching tag in `commonErrorTags`. With the per-U3 first-sprint
 *     discipline (`commonErrorTags: []` by default), the detectors will not
 *     trigger on real content yet — they exist to satisfy the spec and to
 *     be available when exercises graduate to non-empty tag lists.
 */

import { describe, test, expect } from "vitest";
import { loadExercisesForSkill, loadFeedbackContent } from "../catalog/content-loaders";
import { tagError } from "../evaluator/error-tagging";
import { evaluateAnswer } from "../evaluator/index";
import { loadTaxonomy } from "../error-taxonomy/index";
import { generateFeedback } from "../feedback/index";
import type { Exercise } from "../models/exercise";
import { getExerciseOptionValue } from "../models/exercise";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex.u3.test.1",
    skillId: "mat.u3.ecuaciones_lineales",
    type: "multiple-choice",
    difficulty: 2,
    prompt: "Resuelve: 2x + 5 = 13",
    expectedAnswer: "x = 4",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
    unit: 3,
    options: [
      { value: "x = 4", label: "A" },
      { value: "x = 8", label: "B" },
      { value: "x = 9", label: "C" },
      { value: "x = 18", label: "D" },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// u3_aislamiento_incorrecto — MC: student picks RHS − constant instead of (RHS − constant)/coef
// ---------------------------------------------------------------------------

describe("u3_aislamiento_incorrecto MC detection", () => {
  test("detects when student forgets to divide by coefficient", () => {
    const exercise = makeExercise({
      prompt: "Resuelve: 2x + 5 = 13",
      expectedAnswer: "x = 4",
      commonErrorTags: ["u3_aislamiento_incorrecto"],
      options: [
        { value: "x = 4", label: "A" },          // correct: (13-5)/2
        { value: "x = 8", label: "B" },           // wrong: forgot to divide by 2 (13-5)
        { value: "x = 18", label: "C" },
        { value: "x = 9", label: "D" },
      ],
    });
    expect(tagError(exercise, "x = 8")).toBe("u3_aislamiento_incorrecto");
  });

  test("detects when student picks a value that equals (RHS − constant) instead of (RHS − constant)/coef", () => {
    const exercise = makeExercise({
      prompt: "Resuelve: 3x − 2 = 10",
      expectedAnswer: "x = 4",
      commonErrorTags: ["u3_aislamiento_incorrecto"],
      options: [
        { value: "x = 4", label: "A" },
        { value: "x = 12", label: "B" },          // 10 - (-2) = 12 (forgot to divide by 3)
        { value: "x = 8", label: "C" },
      ],
    });
    expect(tagError(exercise, "x = 12")).toBe("u3_aislamiento_incorrecto");
  });

  test("does NOT tag when student picks the correct answer", () => {
    const exercise = makeExercise({
      commonErrorTags: ["u3_aislamiento_incorrecto"],
    });
    expect(tagError(exercise, "x = 4")).toBeUndefined();
  });

  test("does NOT tag when tag is not declared", () => {
    const exercise = makeExercise({
      commonErrorTags: [], // NOT declared
    });
    expect(tagError(exercise, "x = 8")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_factorizacion_cuadratica — MC: student picks only the positive root of x² = a²
// ---------------------------------------------------------------------------

describe("u3_factorizacion_cuadratica MC detection", () => {
  test("detects when student picks only one root for x² = 9 (omits negative root)", () => {
    const exercise = makeExercise({
      id: "ex.u3.factorizacion.1",
      skillId: "mat.u3.ecuaciones_cuadraticas",
      prompt: "Resuelve: x² = 9",
      expectedAnswer: "x = ±3",
      commonErrorTags: ["u3_factorizacion_cuadratica"],
      options: [
        { value: "x = ±3", label: "A" },          // correct
        { value: "x = 3", label: "B" },            // only positive root
        { value: "x = -3", label: "C" },
        { value: "x = 0", label: "D" },
      ],
    });
    expect(tagError(exercise, "x = 3")).toBe("u3_factorizacion_cuadratica");
  });

  test("detects when student picks a single root for x² = 25", () => {
    const exercise = makeExercise({
      id: "ex.u3.factorizacion.2",
      skillId: "mat.u3.ecuaciones_cuadraticas",
      prompt: "Resuelve: x² = 25",
      expectedAnswer: "x = ±5",
      commonErrorTags: ["u3_factorizacion_cuadratica"],
      options: [
        { value: "x = ±5", label: "A" },
        { value: "x = 5", label: "B" },
        { value: "x = -5", label: "C" },
      ],
    });
    expect(tagError(exercise, "x = 5")).toBe("u3_factorizacion_cuadratica");
  });

  test("does NOT tag when student picks the correct two-root answer", () => {
    const exercise = makeExercise({
      skillId: "mat.u3.ecuaciones_cuadraticas",
      prompt: "Resuelve: x² = 9",
      expectedAnswer: "x = ±3",
      commonErrorTags: ["u3_factorizacion_cuadratica"],
    });
    expect(tagError(exercise, "x = ±3")).toBeUndefined();
  });

  test("does NOT tag when prompt is not a perfect-square x² = a² pattern", () => {
    const exercise = makeExercise({
      id: "ex.u3.factorizacion.3",
      skillId: "mat.u3.ecuaciones_cuadraticas",
      prompt: "Factoriza: x² + 5x + 6",
      expectedAnswer: "(x+2)(x+3)",
      commonErrorTags: ["u3_factorizacion_cuadratica"],
      options: [
        { value: "(x+2)(x+3)", label: "A" },
        { value: "(x+1)(x+6)", label: "B" },
      ],
    });
    expect(tagError(exercise, "(x+1)(x+6)")).toBeUndefined();
  });

  test("does NOT tag when student picks a non-root single value (e.g. x = 4 for x² = 9)", () => {
    const exercise = makeExercise({
      id: "ex.u3.factorizacion.4",
      skillId: "mat.u3.ecuaciones_cuadraticas",
      prompt: "Resuelve: x² = 9",
      expectedAnswer: "x = ±3",
      commonErrorTags: ["u3_factorizacion_cuadratica"],
      options: [
        { value: "x = ±3", label: "A" },
        { value: "x = 3", label: "B" },            // one valid root
        { value: "x = -3", label: "C" },           // other valid root
        { value: "x = 4", label: "D" },            // invalid distractor
      ],
    });
    // x = 4 is NOT a valid root of x² = 9; must not be tagged.
    expect(tagError(exercise, "x = 4")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_signo_desigualdad — MC: student picks inequality with wrong sign direction
// ---------------------------------------------------------------------------

describe("u3_signo_desigualdad MC detection", () => {
  test("detects when student answers x > -2 for -2x > 4 (forgot to flip)", () => {
    const exercise = makeExercise({
      id: "ex.u3.signo_desigualdad.1",
      skillId: "mat.u3.inecuaciones_lineales",
      prompt: "Resuelve: −2x > 4",
      expectedAnswer: "x < −2",
      commonErrorTags: ["u3_signo_desigualdad"],
      options: [
        { value: "x < −2", label: "A" },           // correct (flipped)
        { value: "x > −2", label: "B" },           // forgot to flip
        { value: "x < 2", label: "C" },
        { value: "x > 2", label: "D" },
      ],
    });
    expect(tagError(exercise, "x > −2")).toBe("u3_signo_desigualdad");
  });

  test("does NOT tag when student picks the correct flipped inequality", () => {
    const exercise = makeExercise({
      skillId: "mat.u3.inecuaciones_lineales",
      prompt: "Resuelve: −2x > 4",
      expectedAnswer: "x < −2",
      commonErrorTags: ["u3_signo_desigualdad"],
    });
    expect(tagError(exercise, "x < −2")).toBeUndefined();
  });

  test("does NOT tag when prompt has no negative coefficient (no flip needed)", () => {
    const exercise = makeExercise({
      id: "ex.u3.signo_desigualdad.2",
      skillId: "mat.u3.inecuaciones_lineales",
      prompt: "Resuelve: 2x > 4",
      expectedAnswer: "x > 2",
      commonErrorTags: ["u3_signo_desigualdad"],
      options: [
        { value: "x > 2", label: "A" },
        { value: "x < 2", label: "B" },
      ],
    });
    expect(tagError(exercise, "x < 2")).toBeUndefined();
  });

  test("does NOT tag wrong-boundary same-direction answer (e.g. x > 2 for −2x > 4)", () => {
    const exercise = makeExercise({
      id: "ex.u3.signo_desigualdad.3",
      skillId: "mat.u3.inecuaciones_lineales",
      prompt: "Resuelve: −2x > 4",
      expectedAnswer: "x < −2",
      commonErrorTags: ["u3_signo_desigualdad"],
      options: [
        { value: "x < −2", label: "A" },           // correct
        { value: "x > −2", label: "B" },           // forgot flip, correct boundary
        { value: "x > 2", label: "C" },            // wrong boundary AND wrong direction
        { value: "x < 2", label: "D" },
      ],
    });
    // x > 2 has wrong boundary (2, not −2). The sign-direction tag requires
    // boundary match — this is a purely wrong answer, not a flip error.
    expect(tagError(exercise, "x > 2")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_dos_valores_absoluto — MC: student picks a single value for |ax + b| < c
// ---------------------------------------------------------------------------

describe("u3_dos_valores_absoluto MC detection", () => {
  test("detects when student picks a single value for |x − 2| < 5 (should be an interval)", () => {
    const exercise = makeExercise({
      id: "ex.u3.abs.1",
      skillId: "mat.u3.inecuaciones_valor_absoluto",
      prompt: "Resuelve: |x − 2| < 5",
      expectedAnswer: "−3 < x < 7",
      commonErrorTags: ["u3_dos_valores_absoluto"],
      options: [
        { value: "−3 < x < 7", label: "A" },         // correct
        { value: "x = 7", label: "B" },              // single value — wrong
        { value: "x < 7", label: "C" },              // half the answer
        { value: "x > −3", label: "D" },
      ],
    });
    expect(tagError(exercise, "x = 7")).toBe("u3_dos_valores_absoluto");
  });

  test("does NOT tag when student picks the correct compound inequality", () => {
    const exercise = makeExercise({
      skillId: "mat.u3.inecuaciones_valor_absoluto",
      prompt: "Resuelve: |x − 2| < 5",
      expectedAnswer: "−3 < x < 7",
      commonErrorTags: ["u3_dos_valores_absoluto"],
    });
    expect(tagError(exercise, "−3 < x < 7")).toBeUndefined();
  });

  test("does NOT tag when prompt is not an absolute-value inequality", () => {
    const exercise = makeExercise({
      id: "ex.u3.abs.2",
      skillId: "mat.u3.inecuaciones_valor_absoluto",
      prompt: "Resuelve: x − 2 < 5",
      expectedAnswer: "x < 7",
      commonErrorTags: ["u3_dos_valores_absoluto"],
      options: [
        { value: "x < 7", label: "A" },
        { value: "x = 7", label: "B" },
      ],
    });
    expect(tagError(exercise, "x = 7")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_pendiente_o_ordenada — MC: student picks slope/intercept swapped
// ---------------------------------------------------------------------------

describe("u3_pendiente_o_ordenada MC detection", () => {
  test("detects when student picks slope-intercept swapped answer for y = 3x + 2", () => {
    const exercise = makeExercise({
      id: "ex.u3.recta.1",
      skillId: "mat.u3.recta",
      prompt: "Para la recta y = 3x + 2, ¿cuál es la pendiente y la ordenada al origen?",
      expectedAnswer: "Pendiente 3, ordenada 2",
      commonErrorTags: ["u3_pendiente_o_ordenada"],
      options: [
        { value: "Pendiente 3, ordenada 2", label: "A" }, // correct
        { value: "Pendiente 2, ordenada 3", label: "B" }, // swapped
        { value: "Pendiente 3, ordenada 0", label: "C" },
        { value: "Pendiente 1, ordenada 2", label: "D" },
      ],
    });
    expect(tagError(exercise, "Pendiente 2, ordenada 3")).toBe("u3_pendiente_o_ordenada");
  });

  test("does NOT tag when student picks the correct answer", () => {
    const exercise = makeExercise({
      skillId: "mat.u3.recta",
      prompt: "Para la recta y = 3x + 2, ¿cuál es la pendiente y la ordenada al origen?",
      expectedAnswer: "Pendiente 3, ordenada 2",
      commonErrorTags: ["u3_pendiente_o_ordenada"],
    });
    expect(tagError(exercise, "Pendiente 3, ordenada 2")).toBeUndefined();
  });

  test("does NOT tag when prompt is not about a line's slope/intercept", () => {
    const exercise = makeExercise({
      id: "ex.u3.recta.2",
      skillId: "mat.u3.recta",
      prompt: "¿La recta pasa por el origen?",
      expectedAnswer: "Sí",
      commonErrorTags: ["u3_pendiente_o_ordenada"],
      options: [
        { value: "Sí", label: "A" },
        { value: "No", label: "B" },
      ],
    });
    expect(tagError(exercise, "No")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_sustitucion_o_eliminacion — MC: student picks answer that dropped a term
// ---------------------------------------------------------------------------

describe("u3_sustitucion_o_eliminacion MC detection", () => {
  test("detects when student picks the eliminated sign-flipped answer", () => {
    const exercise = makeExercise({
      id: "ex.u3.sistemas.1",
      skillId: "mat.u3.sistemas",
      prompt: "Resuelve el sistema: x + y = 5 y 2x − y = 1",
      expectedAnswer: "x = 2, y = 3",
      commonErrorTags: ["u3_sustitucion_o_eliminacion"],
      options: [
        { value: "x = 2, y = 3", label: "A" },      // correct
        { value: "x = 2, y = -3", label: "B" },     // sign flipped on y
        { value: "x = -2, y = 3", label: "C" },
        { value: "x = 4, y = 1", label: "D" },      // dropped y after substitution
      ],
    });
    expect(tagError(exercise, "x = 2, y = -3")).toBe("u3_sustitucion_o_eliminacion");
  });

  test("does NOT tag when student picks the correct answer", () => {
    const exercise = makeExercise({
      skillId: "mat.u3.sistemas",
      prompt: "Resuelve el sistema: x + y = 5 y 2x − y = 1",
      expectedAnswer: "x = 2, y = 3",
      commonErrorTags: ["u3_sustitucion_o_eliminacion"],
    });
    expect(tagError(exercise, "x = 2, y = 3")).toBeUndefined();
  });

  test("does NOT tag when prompt is not a system of equations", () => {
    const exercise = makeExercise({
      id: "ex.u3.sistemas.2",
      skillId: "mat.u3.sistemas",
      prompt: "Resuelve: x = 5",
      expectedAnswer: "x = 5",
      commonErrorTags: ["u3_sustitucion_o_eliminacion"],
      options: [
        { value: "x = 5", label: "A" },
        { value: "x = 0", label: "B" },
      ],
    });
    expect(tagError(exercise, "x = 0")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_igualdad_exponenciales — MC: student picks base confused answer
// ---------------------------------------------------------------------------

describe("u3_igualdad_exponenciales MC detection", () => {
  test("detects when student picks the RHS-as-answer distractor for 2^x = 8", () => {
    const exercise = makeExercise({
      id: "ex.u3.exp.1",
      skillId: "mat.u3.exponenciales",
      prompt: "Resuelve: 2^x = 8",
      expectedAnswer: "x = 3",
      commonErrorTags: ["u3_igualdad_exponenciales"],
      options: [
        { value: "x = 3", label: "A" },             // correct
        { value: "x = 8", label: "B" },             // treated RHS (8) as exponent result
        { value: "x = 2", label: "C" },             // treated base (2) as answer
        { value: "No tiene solución", label: "D" },
      ],
    });
    expect(tagError(exercise, "x = 8")).toBe("u3_igualdad_exponenciales");
  });

  test("does NOT tag when student picks the correct answer", () => {
    const exercise = makeExercise({
      skillId: "mat.u3.exponenciales",
      prompt: "Resuelve: 2^x = 8",
      expectedAnswer: "x = 3",
      commonErrorTags: ["u3_igualdad_exponenciales"],
    });
    expect(tagError(exercise, "x = 3")).toBeUndefined();
  });

  test("does NOT tag when prompt is not an exponential equation", () => {
    const exercise = makeExercise({
      id: "ex.u3.exp.2",
      skillId: "mat.u3.exponenciales",
      prompt: "Resuelve: x + 2 = 5",
      expectedAnswer: "x = 3",
      commonErrorTags: ["u3_igualdad_exponenciales"],
      options: [
        { value: "x = 3", label: "A" },
        { value: "x = 8", label: "B" },
      ],
    });
    expect(tagError(exercise, "x = 8")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_propiedad_logaritmo — MC: student picks the misapplied-property distractor
// ---------------------------------------------------------------------------

describe("u3_propiedad_logaritmo MC detection", () => {
  test("detects when student picks log(a · b) = log a · log b distractor", () => {
    const exercise = makeExercise({
      id: "ex.u3.log.1",
      skillId: "mat.u3.logaritmicas",
      prompt: "Aplica la propiedad del logaritmo de un producto: log(2 · 8)",
      expectedAnswer: "log 2 + log 8",
      commonErrorTags: ["u3_propiedad_logaritmo"],
      options: [
        { value: "log 2 + log 8", label: "A" },     // correct
        { value: "log 2 · log 8", label: "B" },     // sum → product confusion
        { value: "log 16", label: "C" },           // already-simplified
        { value: "log 2 − log 8", label: "D" },
      ],
    });
    expect(tagError(exercise, "log 2 · log 8")).toBe("u3_propiedad_logaritmo");
  });

  test("does NOT tag when student picks the correct answer", () => {
    const exercise = makeExercise({
      skillId: "mat.u3.logaritmicas",
      prompt: "Aplica la propiedad del logaritmo de un producto: log(2 · 8)",
      expectedAnswer: "log 2 + log 8",
      commonErrorTags: ["u3_propiedad_logaritmo"],
    });
    expect(tagError(exercise, "log 2 + log 8")).toBeUndefined();
  });

  test("does NOT tag when prompt is not about logarithmic properties", () => {
    const exercise = makeExercise({
      id: "ex.u3.log.2",
      skillId: "mat.u3.logaritmicas",
      prompt: "Calcula log(100)",
      expectedAnswer: "2",
      commonErrorTags: ["u3_propiedad_logaritmo"],
      options: [
        { value: "2", label: "A" },
        { value: "100", label: "B" },
      ],
    });
    expect(tagError(exercise, "100")).toBeUndefined();
  });
});

describe("U3 modeling feedback tags — runtime path", () => {
  test("tags both new modeling distractors and uses distinct feedback mappings", () => {
    const exercises = loadExercisesForSkill("mat.u3.traduccion_lenguaje_verbal");
    const ex2 = exercises.find((ex) => ex.id === "ex.u3.traduccion_lenguaje_verbal.2");
    expect(ex2).toBeDefined();
    // The actual option[1] text for ex.2 (a declared option whose LHS uses
    // `12x` where the expected is `x + 12` — a sum/times confusion).
    // The previous test passed the short substring `"12x = 31"` which is NOT
    // a declared option; the fix tightens the detector to fire only on
    // declared options with a defensible algebraic operator-mismatch pattern.
    const traduccionDistractorOption = ex2!.options!.find(
      (o) => (typeof o === "string" ? o : o.value) !== ex2!.expectedAnswer,
    )!;
    const cases = [
      [
        "ex.u3.traduccion_lenguaje_verbal.2",
        typeof traduccionDistractorOption === "string"
          ? traduccionDistractorOption
          : traduccionDistractorOption.value,
        "u3_traduccion_incorrecta",
        "TRADUCCIÓN",
      ],
      [
        "ex.u3.traduccion_lenguaje_verbal.4",
        "2x - 4 = 18; falta resolver e interpretar la edad de María",
        "u3_verificacion_omitida",
        "verifica",
      ],
      [
        "ex.u3.traduccion_lenguaje_verbal.6",
        "Pedro tiene 15 años y Juan 25; confunde edades futuras con edades actuales",
        "u3_interpretacion_contextual_incorrecta",
        "representa",
      ],
    ] as const;
    for (const [id, answer, tag, feedbackText] of cases) {
      const exercise = exercises.find((ex) => ex.id === id);
      expect(exercise).toBeDefined();
      const result = evaluateAnswer(exercise!, answer);
      expect(result.errorTag).toBe(tag);
      expect(
        generateFeedback(
          result.correct,
          result.errorTag,
          loadFeedbackContent("unit-3"),
        ).message,
      ).toContain(feedbackText);
    }
  });
});

// ---------------------------------------------------------------------------
// u3_traduccion_incorrecta — declared-option + algebraic-operator-mismatch
//
// Scope (S2 — mat.u3.traduccion_lenguaje_verbal leaf skill). The detector
// MUST only fire when:
//   1. The exercise is MC, has the matching skillId, and the student picked
//      a DECLARED option (one of `exercise.options`).
//   2. Both the expected and the student's option contain an explicit
//      equation (`X = Y` form).
//   3. The LHS or RHS of those equations have a DIFFERENT algebraic operator
//      class (sum/coefficient-multiplication/fraction/simple/exponent).
//      This is the documented sum-times confusion or related translation
//      misinterpretation pattern.
//
// REGRESSION FOR GGA BLOCKER (error-tagging traduccion):
// The previous implementation returned `true` for ANY wrong MC answer on
// the `mat.u3.traduccion_lenguaje_verbal` skill, labeling every wrong
// distractor as the same concept. The fix pins the detector to declared
// options and a defensible algebraic-operator-mismatch pattern.
// ---------------------------------------------------------------------------

describe("u3_traduccion_incorrecta MC detection (declared-option constraint)", () => {
  /**
   * Helper: build a translation-skill MC exercise whose expected answer
   * translates a verbal phrase into an explicit equation `A = B`. The
   * provided distractor options are all DECLARED options.
   */
  function makeTraduccionExercise(opts: {
    readonly id: string;
    readonly expectedEquationLhs: string; // e.g. "x + 12"
    readonly expectedEquationRhs: string; // e.g. "31"
    readonly expectedFull: string; // full expected answer text
    readonly distractors: readonly string[];
  }): Exercise {
    return makeExercise({
      id: opts.id as Exercise["id"],
      skillId: "mat.u3.traduccion_lenguaje_verbal",
      prompt:
        "Si a un número se le suman 12, se obtiene 31. ¿Cuál opción traduce correctamente el enunciado?",
      expectedAnswer: opts.expectedFull,
      commonErrorTags: ["u3_traduccion_incorrecta"],
      options: [
        { value: opts.expectedFull, label: "A" },
        ...opts.distractors.map((d, i) => ({
          value: d,
          label: String.fromCharCode(66 + i), // B, C, D...
        })),
      ],
    });
  }

  test("tags sum/times confusion distractor (12x vs x + 12)", () => {
    const exercise = makeTraduccionExercise({
      id: "ex.u3.traduccion.sum-times",
      expectedEquationLhs: "x + 12",
      expectedEquationRhs: "31",
      expectedFull:
        "Defino x como el número pedido; planteo x + 12 = 31; resuelvo x = 19",
      distractors: [
        "Planteo 12x = 31 (conector 'se le suman' mal traducido como multiplicación); falta definir la incógnita, resolver y verificar.",
      ],
    });
    expect(tagError(exercise, getExerciseOptionValue(exercise.options![1]))).toBe(
      "u3_traduccion_incorrecta",
    );
  });

  test("does NOT tag when student picks the correct answer", () => {
    const exercise = makeTraduccionExercise({
      id: "ex.u3.traduccion.correct",
      expectedEquationLhs: "x + 12",
      expectedEquationRhs: "31",
      expectedFull:
        "Defino x como el número pedido; planteo x + 12 = 31; resuelvo x = 19",
      distractors: [
        "Planteo 12x = 31; falta definir la incógnita.",
      ],
    });
    expect(tagError(exercise, exercise.expectedAnswer)).toBeUndefined();
  });

  // ----- REGRESSION (GGA blocker) -----

  test("REGRESSION: does NOT tag arbitrary wrong text that is NOT a declared option", () => {
    // The buggy detector returned `true` for ANY wrong answer on this skill;
    // the fix pins to declared options.
    const exercise = makeTraduccionExercise({
      id: "ex.u3.traduccion.regression-text",
      expectedEquationLhs: "x + 12",
      expectedEquationRhs: "31",
      expectedFull:
        "Defino x como el número pedido; planteo x + 12 = 31; resuelvo x = 19",
      distractors: [
        "Planteo 12x = 31 (conector 'se le suman' mal traducido como multiplicación); falta definir la incógnita, resolver y verificar.",
      ],
    });
    // Arbitrary text that is NOT a declared option and NOT structurally
    // an algebraic equation at all. The buggy detector returned
    // `u3_traduccion_incorrecta` for this; the fixed detector stays silent.
    expect(
      tagError(exercise, "Pongo cualquier cosa que no está en las opciones"),
    ).toBeUndefined();
    expect(
      tagError(exercise, "Respuesta cualquiera, sin estructura algebraica"),
    ).toBeUndefined();
  });

  test("REGRESSION: does NOT tag a declared option without an algebraic equation (chain-skip)", () => {
    // A declared option that simply OMITS the algebraic modeling step
    // (e.g. "x = 19; falta definir la incógnita, plantear la ecuación
    // explícita y verificar") describes a chain-of-modeling omission —
    // that's covered by `u3_verificacion_omitida`, NOT by
    // `u3_traduccion_incorrecta`. The traduccion detector MUST stay silent
    // when the student's option has no first-equation form to compare.
    const exercise = makeTraduccionExercise({
      id: "ex.u3.traduccion.no-equation",
      expectedEquationLhs: "x + 12",
      expectedEquationRhs: "31",
      expectedFull:
        "Defino x como el número pedido; planteo x + 12 = 31; resuelvo x = 19",
      distractors: [
        // Pure interpretation, no equation.
        "El número pedido es 19; falta definir la incógnita, plantear la ecuación explícita y verificar el resultado.",
      ],
    });
    // No `=` in the distractor → no first equation to compare → detector
    // must stay silent (the buggy detector returned `true` for any wrong
    // answer on this skill, including this one).
    expect(tagError(exercise, getExerciseOptionValue(exercise.options![1]))).toBeUndefined();
  });

  test("REGRESSION: does NOT tag a declared option whose structure matches (same class, different specifics)", () => {
    // A declared option whose first equation uses the SAME algebraic class
    // as the expected (e.g. both LHS are sum_diff: "x + 12" vs "x + 8")
    // is not a translation-class misinterpretation — it's either correct
    // or a different numeric-mistake outside the documented
    // sum/coeff/mult confusion patterns. Detector must stay silent.
    const exercise = makeTraduccionExercise({
      id: "ex.u3.traduccion.same-class",
      expectedEquationLhs: "x + 12",
      expectedEquationRhs: "31",
      expectedFull:
        "Defino x como el número pedido; planteo x + 12 = 31; resuelvo x = 19",
      distractors: [
        // Same sum_diff class as the expected — different constant, but no
        // algebraic operator-mismatch.
        "Defino x como el número pedido; planteo x + 8 = 31; resuelvo x = 23",
      ],
    });
    expect(tagError(exercise, getExerciseOptionValue(exercise.options![1]))).toBeUndefined();
  });

  test("does NOT tag when exercise is not a multiple-choice", () => {
    const exercise = makeTraduccionExercise({
      id: "ex.u3.traduccion.numerical",
      expectedEquationLhs: "x + 12",
      expectedEquationRhs: "31",
      expectedFull: "19",
      distractors: ["12x = 31"],
    });
    // type guard: type="numerical" must NOT trigger this MC-only detector.
    const numericExercise: Exercise = {
      ...exercise,
      type: "numerical",
      options: undefined,
    };
    expect(tagError(numericExercise, "12")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting: declared-tag contract + taxonomy presence
// ---------------------------------------------------------------------------

describe("U3 error-tagging — declared-tag contract", () => {
  test("no tag returned when commonErrorTags is empty", () => {
    const exercise = makeExercise({
      commonErrorTags: [],
    });
    expect(tagError(exercise, "x = 8")).toBeUndefined();
  });

  test("no tag returned when wrong answer does not match any U3 pattern", () => {
    const exercise = makeExercise({
      commonErrorTags: ["u3_aislamiento_incorrecto"],
    });
    // "x = 100" is wrong but doesn't match the (RHS - constant) pattern
    const exercise2: Exercise = {
      ...exercise,
      options: [
        { value: "x = 4", label: "A" },
        { value: "x = 100", label: "B" },
      ],
    };
    expect(tagError(exercise2, "x = 100")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// u3_abs_eq_signo_negativo_incorrecto — `- |x| = -k` (P8g) detection
//
// Scope (S3 — P8 family): tightly bound to the P8g signature. The detector
// MUST distinguish between:
//   - Distractor A: "no hay solución" / "sin solución" (treats -k as k<0).
//   - Distractor B: a SINGLE root matching ±k (forgot the symmetric root).
//   - Nothing else: any other MC distractor must NOT be tagged.
//
// REGRESSION FOR GGA BLOCKER (error-tagging abs_eq):
// The previous implementation returned `true` for ANY wrong single-value
// MC answer that didn't carry the compound-answer markers ("o" / "±" / ",").
// That tagged every wrong distractor of a `- |x| = -k` exercise as
// `u3_abs_eq_signo_negativo_incorrecto`, polluting every student session
// with the same misconception. The fix pins the single-value distractor
// to the documented ±k magnitude (the actual misconception) and nothing
// else.
// ---------------------------------------------------------------------------

describe("u3_abs_eq_signo_negativo_incorrecto MC detection (P8g `- |x| = -k`)", () => {
  /** Helper: construct a `- |x| = -k` exercise fixture. */
  function makeP8gExercise(opts: {
    readonly k: number;
    readonly wrongDistractors: readonly string[];
  }): Exercise {
    const expectedAnswer = `x = -${opts.k} o x = ${opts.k}`;
    const options: { value: string; label: string }[] = [
      { value: expectedAnswer, label: "A" }, // correct (compound two-root)
      ...opts.wrongDistractors.map((d, i) => ({
        value: d,
        label: String.fromCharCode(66 + i), // B, C, D...
      })),
    ];
    return makeExercise({
      id: `ex.u3.abs_eq.p8g.${opts.k}`,
      skillId: "mat.u3.ecuaciones_valor_absoluto",
      prompt: `Resuelve: -|x| = -${opts.k}`,
      expectedAnswer,
      commonErrorTags: ["u3_abs_eq_signo_negativo_incorrecto"],
      options,
    });
  }

  test("Detractor A: tags 'no hay solución' collapse", () => {
    // P8g canonical `- |x| = -10.5` has solution `x = -10.5 o x = 10.5`.
    // Reading -10.5 as a negative number makes the student conclude no solution.
    const exercise = makeP8gExercise({
      k: 10.5,
      wrongDistractors: ["No hay solución"],
    });
    expect(tagError(exercise, "No hay solución")).toBe(
      "u3_abs_eq_signo_negativo_incorrecto",
    );
  });

  test("Distractor B: tags the single positive root `x = k`", () => {
    const exercise = makeP8gExercise({
      k: 10.5,
      wrongDistractors: ["x = 10.5"], // forgot the negative symmetric root
    });
    expect(tagError(exercise, "x = 10.5")).toBe(
      "u3_abs_eq_signo_negativo_incorrecto",
    );
  });

  test("Distractor B: tags the single negative root `x = -k`", () => {
    const exercise = makeP8gExercise({
      k: 10.5,
      wrongDistractors: ["x = -10.5"], // forgot the positive symmetric root
    });
    expect(tagError(exercise, "x = -10.5")).toBe(
      "u3_abs_eq_signo_negativo_incorrecto",
    );
  });

  test("does NOT tag the correct compound answer", () => {
    const exercise = makeP8gExercise({
      k: 10.5,
      wrongDistractors: ["No hay solución", "x = 5"],
    });
    expect(tagError(exercise, "x = -10.5 o x = 10.5")).toBeUndefined();
  });

  // ----- REGRESSION (GGA blocker) -----

  test("REGRESSION: does NOT tag arbitrary wrong MC distractor (`x = 0`, `x = 100`, etc.)", () => {
    // The buggy detector returned true for ANY single-value wrong answer
    // (the final `return true` fell through after the compound check).
    // The fix pins the single-value trap to ±k specifically.
    const exercise = makeP8gExercise({
      k: 10.5,
      // Three arbitrary distractors that are NEITHER "no hay solución" NOR
      // a ±k value: the buggy detector would tag all three; the fixed
      // detector must tag NONE of them.
      wrongDistractors: ["x = 0", "x = 100", "x = 5"],
    });
    for (const wrong of ["x = 0", "x = 100", "x = 5"]) {
      expect(
        tagError(exercise, wrong),
        `must NOT tag "${wrong}" as u3_abs_eq_signo_negativo_incorrecto: it is not a P8g distractor`,
      ).toBeUndefined();
    }
  });

  test("REGRESSION: does NOT tag a wrong MC distractor that does NOT match `-|x|=-k` signature", () => {
    // P8c family — `|x - 2| = 5` is NOT a -|x|=-k exercise. Even if the
    // student picks a wrong single value, the skill-scoped + prompt-signature
    // guard MUST keep it quiet.
    const exercise = makeExercise({
      id: "ex.u3.abs_eq.signature-guard",
      skillId: "mat.u3.ecuaciones_valor_absoluto",
      prompt: "Resuelve: |x − 2| = 5",
      expectedAnswer: "x = -3 o x = 7",
      commonErrorTags: ["u3_abs_eq_signo_negativo_incorrecto"],
      options: [
        { value: "x = -3 o x = 7", label: "A" },
        { value: "x = 7", label: "B" },
        { value: "x = 100", label: "C" },
        { value: "x = -7", label: "D" },
      ],
    });
    expect(tagError(exercise, "x = 7")).toBeUndefined();
    expect(tagError(exercise, "x = 100")).toBeUndefined();
  });

  test("does NOT tag when student picks correct answer (always undefined)", () => {
    const exercise = makeP8gExercise({
      k: 10.5,
      wrongDistractors: ["x = 5"],
    });
    expect(tagError(exercise, "x = -10.5 o x = 10.5")).toBeUndefined();
  });
});

describe("U3 error-tagging — taxonomy-tag wiring", () => {
  test("all 8 U3 spec tags are present in the loaded taxonomy", () => {
    const taxonomy = loadTaxonomy();
    const ids: Set<string> = new Set(taxonomy.map((t) => t.id));
    const specIds = [
      "u3_aislamiento_incorrecto",
      "u3_factorizacion_cuadratica",
      "u3_signo_desigualdad",
      "u3_dos_valores_absoluto",
      "u3_pendiente_o_ordenada",
      "u3_sustitucion_o_eliminacion",
      "u3_igualdad_exponenciales",
      "u3_propiedad_logaritmo",
    ];
    for (const id of specIds) {
      expect(ids.has(id), `Tag ${id} should be in taxonomy`).toBe(true);
    }
  });
});
