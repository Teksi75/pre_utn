/**
 * U2 Aplicaciones error-tagging detectors.
 *
 * Spec coverage: U2APP-TAG-001..U2APP-TAG-003 (taxonomy),
 *                detector scenarios for u2_denominador_cero and u2_confunde_mcm_mcd
 */
import { describe, test, expect } from "vitest";
import { tagError } from "../evaluator/error-tagging";
import { loadTaxonomy } from "../error-taxonomy/index";
import type { Exercise } from "../models/exercise";

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: "ex.u2.mcm_mcd_polinomios.1",
    skillId: "mat.u2.mcm_mcd_polinomios",
    type: "multiple-choice",
    difficulty: 2,
    prompt: "¿Cuál es el MCM de (x-2)(x-3) y (x-2)(x+1)?",
    expectedAnswer: "(x-2)(x-3)(x+1)",
    commonErrorTags: [],
    pedagogicalNote: "Test exercise",
    unit: 2,
    options: [
      { value: "(x-2)(x-3)(x+1)", label: "A" },
      { value: "(x-2)", label: "B" },
      { value: "(x-2)(x-3)(x-2)(x+1)", label: "C" },
      { value: "(x-3)(x+1)", label: "D" },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// u2_denominador_cero — MC detection
// ---------------------------------------------------------------------------

describe("u2_denominador_cero MC detection", () => {
  test("detects when student picks excluded value (x=2) for equation with (x-2) denominator", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.1",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve la ecuación: 1/(x-2) = 3/(x-2). ¿Cuál es el valor de x?",
      expectedAnswer: "No tiene solución",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "No tiene solución", label: "A" },
        { value: "x=2", label: "B" },
        { value: "x=3", label: "C" },
        { value: "x=0", label: "D" },
      ],
    });

    // Student picks x=2 — the excluded value that zeroes denominator (x-2)
    const result = tagError(exercise, "x=2");
    expect(result).toBe("u2_denominador_cero");
  });

  test("detects when student picks excluded value for (x+3) denominator", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.2",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve la ecuación: x/(x+3) = 3/(x+3). ¿Cuál es el valor de x?",
      expectedAnswer: "No tiene solución",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "No tiene solución", label: "A" },
        { value: "x=-3", label: "B" },
        { value: "x=3", label: "C" },
        { value: "x=0", label: "D" },
      ],
    });

    // Student picks x=-3 — excluded value (x+3=0 → x=-3)
    const result = tagError(exercise, "x=-3");
    expect(result).toBe("u2_denominador_cero");
  });

  test("detects with multiple denominators: picks one excluded value", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.3",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve: 1/(x-2) + 1/(x-4) = 2/(x-2). ¿Cuál es el valor de x?",
      expectedAnswer: "x=4",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "x=4", label: "A" },
        { value: "x=2", label: "B" },
        { value: "x=3", label: "C" },
        { value: "x=0", label: "D" },
      ],
    });

    // x=2 zeroes denominator (x-2) — excluded
    const result = tagError(exercise, "x=2");
    expect(result).toBe("u2_denominador_cero");
  });

  test("does NOT tag when student picks a valid wrong answer (not excluded)", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.4",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve: 1/(x-2) = 3/(x-2). ¿Cuál es el valor de x?",
      expectedAnswer: "No tiene solución",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "No tiene solución", label: "A" },
        { value: "x=2", label: "B" },
        { value: "x=5", label: "C" },
        { value: "x=0", label: "D" },
      ],
    });

    // x=5 is wrong but doesn't zero the denominator (x-2)
    const result = tagError(exercise, "x=5");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when student answer is correct", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.5",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve: 1/(x-3) = 2/(x-3) + 1. ¿Cuál es el valor de x?",
      expectedAnswer: "x=5",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "x=5", label: "A" },
        { value: "x=3", label: "B" },
        { value: "x=2", label: "C" },
      ],
    });

    // Student picks correct answer
    const result = tagError(exercise, "x=5");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when tag not declared in commonErrorTags", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.6",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve: 1/(x-2) = 3/(x-2). ¿Cuál es el valor de x?",
      expectedAnswer: "No tiene solución",
      commonErrorTags: [], // NOT declared
      options: [
        { value: "No tiene solución", label: "A" },
        { value: "x=2", label: "B" },
      ],
    });

    const result = tagError(exercise, "x=2");
    expect(result).toBeUndefined();
  });

  test("does NOT tag for non-MC exercise types", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.7",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      type: "numerical",
      prompt:
        "Resuelve: 1/(x-2) = 3/(x-2). Ingresa el valor de x.",
      expectedAnswer: "2",
      commonErrorTags: ["u2_denominador_cero"],
      options: undefined,
    });

    // Numerical type — detector only works on MC
    const result = tagError(exercise, "2");
    expect(result).toBeUndefined();
  });

  // Regression: Unicode minus in student answer MUST NOT cause false-positive
  // for denominator (x-2) → excluded value is +2, NOT -2
  test("does NOT tag x=−2 for (x-2) denominator (Unicode minus, opposite sign)", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.regr1",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve: 1/(x-2) + 1/(x-4) = 2/(x-2). ¿Cuál es el valor de x?",
      expectedAnswer: "x=4",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "x=4", label: "A" },
        { value: "x=2", label: "B" },
        { value: "x=−2", label: "C" },
        { value: "x=0", label: "D" },
      ],
    });

    // x=−2 (Unicode minus) does NOT zero denominator (x-2) — excluded value is +2
    const result = tagError(exercise, "x=−2");
    expect(result).toBeUndefined();
  });

  // Regression: ASCII minus negative value MUST NOT be falsely tagged
  test("does NOT tag x=-2 for (x-2) denominator (ASCII minus, opposite sign)", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.regr2",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve: 1/(x-2) + 1/(x-4) = 2/(x-2). ¿Cuál es el valor de x?",
      expectedAnswer: "x=4",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "x=4", label: "A" },
        { value: "x=2", label: "B" },
        { value: "x=-2", label: "C" },
        { value: "x=0", label: "D" },
      ],
    });

    // x=-2 (ASCII minus) does NOT zero denominator (x-2) — excluded value is +2
    const result = tagError(exercise, "x=-2");
    expect(result).toBeUndefined();
  });

  // Regression: Unicode minus for actual excluded value MUST still be detected
  test("detects x=−3 for (x+3) denominator (Unicode minus, correct sign)", () => {
    const exercise = makeExercise({
      id: "ex.u2.ecuaciones_fraccionarias.regr3",
      skillId: "mat.u2.ecuaciones_fraccionarias",
      prompt:
        "Resuelve: x/(x+3) = 3/(x+3). ¿Cuál es el valor de x?",
      expectedAnswer: "No tiene solución",
      commonErrorTags: ["u2_denominador_cero"],
      options: [
        { value: "No tiene solución", label: "A" },
        { value: "x=−3", label: "B" },
        { value: "x=3", label: "C" },
        { value: "x=0", label: "D" },
      ],
    });

    // x=−3 (Unicode minus) — this IS the excluded value for (x+3) denominator
    const result = tagError(exercise, "x=−3");
    expect(result).toBe("u2_denominador_cero");
  });
});

// ---------------------------------------------------------------------------
// u2_confunde_mcm_mcd — MC detection
// ---------------------------------------------------------------------------

describe("u2_confunde_mcm_mcd MC detection", () => {
  test("detects when student picks MCD instead of MCM (fewer factors)", () => {
    const exercise = makeExercise({
      id: "ex.u2.mcm_mcd_polinomios.2",
      skillId: "mat.u2.mcm_mcd_polinomios",
      prompt:
        "¿Cuál es el mínimo común múltiplo (MCM) de (x-2)(x-3) y (x-2)(x+1)?",
      expectedAnswer: "(x-2)(x-3)(x+1)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
      options: [
        { value: "(x-2)(x-3)(x+1)", label: "A" }, // MCM
        { value: "(x-2)", label: "B" },           // MCD — fewer factors
        { value: "(x-3)(x+1)", label: "C" },
        { value: "(x-2)(x-3)", label: "D" },
      ],
    });

    // Student picks (x-2) — that's the MCD, not MCM
    const result = tagError(exercise, "(x-2)");
    expect(result).toBe("u2_confunde_mcm_mcd");
  });

  test("detects when student picks MCM instead of MCD (more factors)", () => {
    const exercise = makeExercise({
      id: "ex.u2.mcm_mcd_polinomios.3",
      skillId: "mat.u2.mcm_mcd_polinomios",
      prompt:
        "¿Cuál es el máximo común divisor (MCD) de (x-1)²(x+2) y (x-1)(x+2)³?",
      expectedAnswer: "(x-1)(x+2)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
      options: [
        { value: "(x-1)(x+2)", label: "A" },              // MCD
        { value: "(x-1)²(x+2)³", label: "B" },            // MCM — more factors/higher exponents
        { value: "(x-1)(x+2)²", label: "C" },
        { value: "(x-1)²", label: "D" },
      ],
    });

    // Student picks (x-1)²(x+2)³ — MCM when MCD was asked
    const result = tagError(exercise, "(x-1)²(x+2)³");
    expect(result).toBe("u2_confunde_mcm_mcd");
  });

  test("detects with variant keyword 'Mínimo Común Múltiplo' (capitalized)", () => {
    const exercise = makeExercise({
      id: "ex.u2.mcm_mcd_polinomios.4",
      skillId: "mat.u2.mcm_mcd_polinomios",
      prompt:
        "Calcula el Mínimo Común Múltiplo de (x+1)(x-1) y (x+1)(x+2).",
      expectedAnswer: "(x+1)(x-1)(x+2)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
      options: [
        { value: "(x+1)(x-1)(x+2)", label: "A" },   // MCM
        { value: "(x+1)", label: "B" },               // MCD — fewer factors
        { value: "(x-1)(x+2)", label: "C" },
        { value: "(x+1)(x-1)", label: "D" },
      ],
    });

    const result = tagError(exercise, "(x+1)");
    expect(result).toBe("u2_confunde_mcm_mcd");
  });

  test("does NOT tag when student picks a wrong answer that has MORE factors (not MCD confusion)", () => {
    const exercise = makeExercise({
      id: "ex.u2.mcm_mcd_polinomios.5",
      skillId: "mat.u2.mcm_mcd_polinomios",
      prompt:
        "¿Cuál es el MCM de (x-2)(x-3) y (x-2)(x+1)?",
      expectedAnswer: "(x-2)(x-3)(x+1)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
      options: [
        { value: "(x-2)(x-3)(x+1)", label: "A" },     // correct MCM
        { value: "(x-2)", label: "B" },                 // MCD
        { value: "(x-2)(x-3)(x-2)(x+1)", label: "C" },  // WRONG but more factors than MCM
        { value: "(x-3)(x+1)", label: "D" },
      ],
    });

    // Option C has MORE factors than expected MCM — not MCD confusion
    // This tests that the detector doesn't trigger on just any wrong answer
    const result = tagError(exercise, "(x-2)(x-3)(x-2)(x+1)");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when student answer is correct", () => {
    const exercise = makeExercise({
      prompt:
        "¿Cuál es el MCM de (x-2)(x-3) y (x-2)(x+1)?",
      expectedAnswer: "(x-2)(x-3)(x+1)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
    });

    const result = tagError(exercise, "(x-2)(x-3)(x+1)");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when tag not declared in commonErrorTags", () => {
    const exercise = makeExercise({
      prompt:
        "¿Cuál es el MCM de (x-2)(x-3) y (x-2)(x+1)?",
      expectedAnswer: "(x-2)(x-3)(x+1)",
      commonErrorTags: [], // not declared
    });

    const result = tagError(exercise, "(x-2)");
    expect(result).toBeUndefined();
  });

  test("does NOT tag when prompt doesn't mention MCM/MCD at all", () => {
    const exercise = makeExercise({
      id: "ex.u2.mcm_mcd_polinomios.6",
      skillId: "mat.u2.mcm_mcd_polinomios",
      prompt:
        "Factoriza completamente: x² − 9",
      expectedAnswer: "(x-3)(x+3)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
      options: [
        { value: "(x-3)(x+3)", label: "A" },
        { value: "(x-3)(x-3)", label: "B" },
      ],
    });

    // Exercise is not about MCM/MCD — detector should not trigger
    const result = tagError(exercise, "(x-3)(x-3)");
    expect(result).toBeUndefined();
  });

  test("does NOT tag for non-MC exercise types", () => {
    const exercise = makeExercise({
      id: "ex.u2.mcm_mcd_polinomios.7",
      skillId: "mat.u2.mcm_mcd_polinomios",
      type: "fill-blank",
      prompt: "¿Cuál es el MCM de (x-2) y (x+1)? Escribí la expresión.",
      expectedAnswer: "(x-2)(x+1)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
      options: undefined,
    });

    // fill-blank type — detector only works on MC
    const result = tagError(exercise, "(x-2)");
    expect(result).toBeUndefined();
  });

  // Regression: MCD prompt — distractor with more factors that is NOT the MCM
  // (e.g., picking one of the original polynomials instead of the MCM)
  test("does NOT tag MCD when distractor has more factors but is not MCM", () => {
    const exercise = makeExercise({
      id: "ex.u2.mcm_mcd_polinomios.regr1",
      skillId: "mat.u2.mcm_mcd_polinomios",
      prompt:
        "¿Cuál es el MCD de (x-1)(x-2) y (x-1)(x-3)?",
      expectedAnswer: "(x-1)",
      commonErrorTags: ["u2_confunde_mcm_mcd"],
      options: [
        { value: "(x-1)", label: "A" },              // MCD (correct)
        { value: "(x-1)(x-2)(x-3)", label: "B" },    // MCM (3 factors)
        { value: "(x-1)(x-2)", label: "C" },          // original poly (2 factors, NOT MCM)
        { value: "(x-1)(x-3)", label: "D" },          // other original poly (2 factors)
      ],
    });

    // Student picks (x-1)(x-2) — has more factors than MCD but is NOT the MCM
    // (MCM would be (x-1)(x-2)(x-3) with 3 factors)
    const result = tagError(exercise, "(x-1)(x-2)");
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Taxonomy validation: new tags load correctly
// ---------------------------------------------------------------------------

describe("U2 aplicaciones taxonomy entries", () => {
  test("u2_denominador_cero is present in taxonomy", () => {
    const taxonomy = loadTaxonomy();
    const tag = taxonomy.find((t) => t.id === "u2_denominador_cero");
    expect(tag).toBeDefined();
    expect(tag?.unit).toBe(2);
    expect(tag?.description).toBeTruthy();
    expect(tag?.examples.length).toBeGreaterThanOrEqual(1);
  });

  test("u2_confunde_mcm_mcd is present in taxonomy", () => {
    const taxonomy = loadTaxonomy();
    const tag = taxonomy.find((t) => t.id === "u2_confunde_mcm_mcd");
    expect(tag).toBeDefined();
    expect(tag?.unit).toBe(2);
    expect(tag?.description).toBeTruthy();
    expect(tag?.examples.length).toBeGreaterThanOrEqual(1);
  });

  test("taxonomy has no duplicate IDs after adding aplicaciones tags", () => {
    const taxonomy = loadTaxonomy();
    const ids = taxonomy.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
