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
import { loadExercisesForSkill, loadFeedbackContent, loadExampleContent } from "../catalog/content-loaders";
import { tagError } from "../evaluator/error-tagging";
import { evaluateAnswer } from "../evaluator/index";
import { loadTaxonomy } from "../error-taxonomy/index";
import { generateFeedback } from "../feedback/index";
import type { Exercise } from "../models/exercise";

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
    const cases = [
      ["ex.u3.traduccion_lenguaje_verbal.2", "12x = 31", "u3_traduccion_incorrecta", "TRADUCCIÓN"],
      ["ex.u3.traduccion_lenguaje_verbal.4", "2x - 4 = 18; falta resolver e interpretar la edad de María", "u3_verificacion_omitida", "verifica"],
      ["ex.u3.traduccion_lenguaje_verbal.6", "Pedro tiene 15 años y Juan 25; confunde edades futuras con edades actuales", "u3_interpretacion_contextual_incorrecta", "representa"],
    ] as const;
    for (const [id, answer, tag, feedbackText] of cases) {
      const exercise = exercises.find((ex) => ex.id === id);
      expect(exercise).toBeDefined();
      const result = evaluateAnswer(exercise!, answer);
      expect(result.errorTag).toBe(tag);
      expect(generateFeedback(result.correct, result.errorTag, loadFeedbackContent("unit-3")).message)
        .toContain(feedbackText);
    }
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

describe("u3_racionalizacion_irracional — detector + P1l integration (PR2)", () => {
  const P1L = (overrides: Partial<Exercise> = {}): Exercise => makeExercise({
    id: "ex.u3.ecuaciones_lineales.6", skillId: "mat.u3.ecuaciones_lineales",
    prompt: "Resuelve para x: (3 + √5)·x = 14 + 6√5",
    expectedAnswer: "x = 3 + √5",
    commonErrorTags: ["u3_racionalizacion_irracional"],
    options: [{ value: "x = (14 + 6√5) / (3 + √5)", label: "A" }, { value: "x = 3 + √5", label: "B" }, { value: "x = 3 − √5", label: "C" }, { value: "x = 14 + 6√5", label: "D" }],
    ...overrides,
  });

  test("fires on every option retaining √5; declared-only guard prevents firing when tag absent", () => {
    const ex = P1L();
    expect(tagError(ex, "x = (14 + 6√5) / (3 + √5)")).toBe("u3_racionalizacion_irracional");
    expect(tagError(ex, "x = 3 − √5")).toBe("u3_racionalizacion_irracional");
    expect(tagError(ex, "x = 14 + 6√5")).toBe("u3_racionalizacion_irracional");
    expect(tagError(ex, "x = 3 + √5")).toBeUndefined();
    expect(tagError(P1L({ commonErrorTags: [] }), "x = (14 + 6√5) / (3 + √5)")).toBeUndefined();
  });

  test("MC-only: never fires on a numerical item", () => {
    expect(tagError(P1L({ type: "numerical", options: undefined }), "(14 + 6√5) / (3 + √5)")).toBeUndefined();
  });

  test("evaluateAnswer fires the tag end-to-end on the loaded P1l exercise", () => {
    const p1l = loadExercisesForSkill("mat.u3.ecuaciones_lineales").find((e) => e.id === "ex.u3.ecuaciones_lineales.6")!;
    expect(evaluateAnswer(p1l, p1l.expectedAnswer).errorTag).toBeUndefined();
    expect(evaluateAnswer(p1l, "x = (14 + 6√5) / (3 − √5)").errorTag).toBe("u3_racionalizacion_irracional");
    expect(evaluateAnswer(p1l, "x = 3 − √5").errorTag).toBe("u3_racionalizacion_irracional");
    expect(evaluateAnswer(p1l, "x = 14 + 6√5").errorTag).toBe("u3_racionalizacion_irracional");
  });

  test("feedback mapping is wired to a real example id and surfaces through generateFeedback", () => {
    const feedback = loadFeedbackContent("unit-3");
    const mapping = feedback.find((f) => f.errorTag === "u3_racionalizacion_irracional")!;
    expect(new Set(loadExampleContent("unit-3").map((ex) => ex.id)).has(mapping.recoveryTarget!)).toBe(true);
    expect(generateFeedback(false, "u3_racionalizacion_irracional", feedback).message).toBe(mapping.message);
  });
});

/**
 * R3-001 (post-validation) regression proof — focused remediation for the
 * equivalent-option bug on ex.u3.ecuaciones_lineales.6 (canonical P1l).
 *
 * History:
 *   - R1 (origin): option A "x = (14 + 6√5) / (3 + √5)" was algebraically
 *     equivalent to expected "x = 3 + √5" → false-positive rationalization error.
 *   - R2 (interim): "x = 12 + 4√5" — non-equivalent, but rationale ("forgot to
 *     divide by 4") did not match the approved feedback taxonomy.
 *   - R3-001 (first try): "x = 18 + 8√5" — non-equivalent, but the feedback clause
 *     "invertir el signo del conjugado cambia el signo del término con √" claimed a
 *     radical-sign effect the expression doesn't visibly show. Rejected by scoped
 *     validator.
 *   - R3-001 (this): "x = (14 + 6√5) / (3 − √5)" — direct conjugate-procedure error.
 *     The student replaces the original divisor (3 + √5) by its conjugate (3 − √5)
 *     instead of multiplying numerator AND denominator by the conjugate. The result
 *     still contains √5 in the denominator — observable, not a claim — and maps
 *     literally to feedback pattern (1): "dejás el radical en el denominador y
 *     dividís sin racionalizar — la respuesta queda con un √ que se puede eliminar".
 */
describe("R3-001 regression proof — P1l option A is a direct conjugate-replacement error (radical retained)", () => {
  const P1L_ID = "ex.u3.ecuaciones_lineales.6";
  const NEW_DISTRACTOR = "x = (14 + 6√5) / (3 − √5)";
  const BUG_DISTRACTOR = "x = (14 + 6√5) / (3 + √5)";

  function loadP1L() {
    return loadExercisesForSkill("mat.u3.ecuaciones_lineales").find((e) => e.id === P1L_ID)!;
  }

  function optionValues(p1l: { options?: ReadonlyArray<string | { value: string; label?: string }> }) {
    return p1l!.options!.map((o) => (typeof o === "string" ? o : o.value));
  }

  // (a) correct answer is valid in the loaded catalog
  test("P1l expectedAnswer 'x = 3 + √5' is present and graded correct with no error tag", () => {
    const p1l = loadP1L();
    const opts = optionValues(p1l);
    expect(opts).toContain(p1l.expectedAnswer);
    expect(p1l.expectedAnswer.trim()).toBe("x = 3 + √5");
    const result = evaluateAnswer(p1l, p1l.expectedAnswer);
    expect(result.correct).toBe(true);
    expect(result.errorTag).toBeUndefined();
  });

  // (b) chosen distractor is numerically AND algebraically non-equivalent to expectedAnswer
  test("new distractor 'x = (14 + 6√5) / (3 − √5)' is numerically and algebraically non-equivalent to 'x = 3 + √5'", () => {
    const p1l = loadP1L();
    const opts = optionValues(p1l);
    expect(opts).toContain(NEW_DISTRACTOR);
    expect(opts).not.toContain(BUG_DISTRACTOR);
    const sqrt5 = Math.sqrt(5);
    const distractorNum = (14 + 6 * sqrt5) / (3 - sqrt5);
    const expectedNum = 3 + sqrt5;
    // Numerically non-equivalent at 5 decimal places (~35.889 vs ~5.236)
    expect(distractorNum).not.toBeCloseTo(expectedNum, 5);
    // Algebraic check: rationalising the distractor still yields a √5-bearing value
    // (18 + 8√5), NOT 3 + √5 — the radical is NOT cancelled.
    const rationalised = ((14 + 6 * sqrt5) * (3 + sqrt5)) / ((3 - sqrt5) * (3 + sqrt5));
    expect(rationalised).toBeCloseTo(18 + 8 * sqrt5, 10);
    expect(rationalised).not.toBeCloseTo(expectedNum, 5);
    // Only expectedAnswer resolves to 3 + √5 among the four options
    const optionNumerics: Record<string, number> = {
      "x = 3 + √5": 3 + sqrt5,
      "x = 3 − √5": 3 - sqrt5,
      "x = 14 + 6√5": 14 + 6 * sqrt5,
      "x = (14 + 6√5) / (3 + √5)": (14 + 6 * sqrt5) / (3 + sqrt5),
      "x = (14 + 6√5) / (3 − √5)": (14 + 6 * sqrt5) / (3 - sqrt5),
    };
    const equivalentOptions = opts.filter((opt) => optionNumerics[opt] === expectedNum);
    expect(equivalentOptions).toEqual([p1l.expectedAnswer]);
  });

  // (c) derivation is exactly the specified replacement-by-conjugate procedure and the
  //     pedagogicalNote reflects that mistake (not the rejected wrong-sign claim)
  test("new distractor is exactly the result of replacing the divisor (3 + √5) with its conjugate (3 − √5), and pedagogicalNote names that direct conjugate-procedure error", () => {
    const p1l = loadP1L();
    // The student error: take the original divisor (3 + √5) and *replace* it with its
    // conjugate (3 − √5) — instead of multiplying numerator AND denominator by it.
    const sqrt5 = Math.sqrt(5);
    const replacedDivisor = 3 - sqrt5;          // student's mistaken divisor
    const result = (14 + 6 * sqrt5) / replacedDivisor;
    expect(result).toBeCloseTo((14 + 6 * sqrt5) / (3 - sqrt5), 12);
    // The new distractor still contains √5 in the denominator (observable fact).
    expect(NEW_DISTRACTOR).toMatch(/3\s*−\s*√5/);
    // pedagogicalNote must describe the conjugate-procedure / retained-denominator error,
    // not the rejected "invertir el signo" sign-flip claim that this fix replaces.
    expect(p1l.pedagogicalNote).toBeDefined();
    expect(p1l.pedagogicalNote).toMatch(/conjugado/i);
    expect(p1l.pedagogicalNote).toMatch(/denominador/i); // names the retained denominator radical
    expect(p1l.pedagogicalNote).not.toMatch(/invertir\s*el\s*signo\s*del\s*conjugado/i);
  });

  // (d) generateFeedback/mapping text explicitly corresponds to retained-radical-denominator
  //     guidance — not merely that a tag fires
  test("generateFeedback for u3_racionalizacion_irracional surfaces the retained-radical-denominator guidance and the mapping is wired to a real example id", () => {
    const p1l = loadP1L();
    const result = evaluateAnswer(p1l, NEW_DISTRACTOR);
    expect(result.correct).toBe(false);
    expect(result.errorTag).toBe("u3_racionalizacion_irracional");
    const feedback = loadFeedbackContent("unit-3");
    const message = generateFeedback(result.correct, result.errorTag!, feedback).message;
    // Approved feedback pattern (1) — literal retained-radical-denominator guidance,
    // which maps directly to the new distractor (denominator still contains √5).
    expect(message).toMatch(/radical\s*en\s*el\s*denominador/i);
    // Mapping wired to a real example id (proves the recovery target exists)
    const mapping = feedback.find((f) => f.errorTag === "u3_racionalizacion_irracional")!;
    expect(new Set(loadExampleContent("unit-3").map((ex) => ex.id)).has(mapping.recoveryTarget!)).toBe(true);
    // pedagogicalNote references the same √ / denominador / conjugado vocabulary
    expect(p1l.pedagogicalNote).toMatch(/√|denominador|conjugado/i);
    // pedagogicalNote describes the *direct* conjugate-replacement error (not "forgot to divide")
    expect(p1l.pedagogicalNote).toMatch(/reemplaz|reemplazo/i);
  });
});
