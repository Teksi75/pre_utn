import { describe, test, expect } from "vitest";
import {
  selectBalancedSet,
  estimateSkills,
  suggestPractice,
  isExerciseReliable,
} from "../diagnostic/index";
import { loadCatalog } from "../catalog/index";
import type { Exercise } from "../models/exercise";
import type { Attempt } from "../diagnostic/index";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: "ex.u1.reales_operaciones.1",
  skillId: "mat.u1.reales_operaciones",
  type: "numerical",
  difficulty: 2,
  prompt: "Calcula 5",
  expectedAnswer: "5",
  commonErrorTags: [],
  pedagogicalNote: "Test exercise",
  ...overrides,
});

const makeAttempt = (overrides: Partial<Attempt> = {}): Attempt => ({
  exerciseId: "ex.u1.reales_operaciones.1",
  skillId: "mat.u1.reales_operaciones",
  correct: true,
  ...overrides,
});

// Build a catalog with exercises across multiple units
const buildMultiUnitCatalog = (): Exercise[] => [
  makeExercise({ id: "ex.u1.reales_operaciones.1", skillId: "mat.u1.reales_operaciones" }),
  makeExercise({ id: "ex.u1.potencias_raices.1", skillId: "mat.u1.potencias_raices" }),
  makeExercise({ id: "ex.u2.polinomios_basico.1", skillId: "mat.u2.polinomios_basico" }),
  makeExercise({ id: "ex.u2.factorizacion.1", skillId: "mat.u2.factorizacion" }),
  makeExercise({ id: "ex.u3.ecuaciones_lineales.1", skillId: "mat.u3.ecuaciones_lineales" }),
  makeExercise({ id: "ex.u3.ecuaciones_cuadraticas.1", skillId: "mat.u3.ecuaciones_cuadraticas" }),
  makeExercise({ id: "ex.u4.pitagoras.1", skillId: "mat.u4.pitagoras" }),
  makeExercise({ id: "ex.u4.thales.1", skillId: "mat.u4.thales" }),
];

// ── selectBalancedSet ────────────────────────────────────────────────────────

describe("selectBalancedSet — balanced selection across units", () => {
  test("returns exercises from multiple units when catalog is sufficient", () => {
    const catalog = buildMultiUnitCatalog();
    const result = selectBalancedSet(catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) return; // type narrowing

    // Should have exercises from at least 3 different units
    const units = new Set(
      result.exercises.map((e) => {
        const match = e.skillId.match(/^mat\.u(\d+)\./);
        return match ? Number(match[1]) : 0;
      })
    );
    expect(units.size).toBeGreaterThanOrEqual(3);
  });

  test("does not over-select from a single unit", () => {
    const catalog = buildMultiUnitCatalog();
    const result = selectBalancedSet(catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // No unit should contribute more than half the exercises
    const unitCounts = new Map<number, number>();
    for (const exercise of result.exercises) {
      const match = exercise.skillId.match(/^mat\.u(\d+)\./);
      const unit = match ? Number(match[1]) : 0;
      unitCounts.set(unit, (unitCounts.get(unit) ?? 0) + 1);
    }

    const maxPerUnit = Math.max(...unitCounts.values());
    expect(maxPerUnit).toBeLessThanOrEqual(Math.ceil(result.exercises.length / 2));
  });

  test("returns deterministic results for same catalog", () => {
    const catalog = buildMultiUnitCatalog();
    const first = selectBalancedSet(catalog);
    const second = selectBalancedSet(catalog);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(first.exercises.map((e) => e.id)).toEqual(second.exercises.map((e) => e.id));
  });
});

describe("selectBalancedSet — insufficient catalog report", () => {
  test("reports missing coverage when catalog is too small", () => {
    // Only 2 exercises, both from unit 1 — not enough for balanced selection
    const catalog = [
      makeExercise({ id: "ex.u1.reales_operaciones.1", skillId: "mat.u1.reales_operaciones" }),
      makeExercise({ id: "ex.u1.potencias_raices.1", skillId: "mat.u1.potencias_raices" }),
    ];
    const result = selectBalancedSet(catalog);

    expect(result.ok).toBe(false);
    if (result.ok) return; // type narrowing

    // Should report that other units are missing
    expect(result.missingCoverage.length).toBeGreaterThan(0);
    expect(result.missingCoverage.some((u) => u.includes("u2") || u.includes("u3") || u.includes("u4"))).toBe(true);
  });

  test("returns ok when catalog covers enough units (≤3 missing)", () => {
    // buildMultiUnitCatalog covers units 1-4 → 2 missing (u5, u6) → ok
    const catalog = buildMultiUnitCatalog();
    const result = selectBalancedSet(catalog);
    expect(result.ok).toBe(true);
  });

  test("returns ok when exactly 3 units are missing", () => {
    // Units 1,2,3 present → missing u4,u5,u6 (3 missing) → ok
    const catalog = [
      makeExercise({ id: "ex.u1.reales_operaciones.1", skillId: "mat.u1.reales_operaciones" }),
      makeExercise({ id: "ex.u2.polinomios_basico.1", skillId: "mat.u2.polinomios_basico" }),
      makeExercise({ id: "ex.u3.ecuaciones_lineales.1", skillId: "mat.u3.ecuaciones_lineales" }),
    ];
    const result = selectBalancedSet(catalog);
    expect(result.ok).toBe(true);
  });

  test("returns ok=false when exactly 4 units are missing", () => {
    // Units 1,2 present → missing u3,u4,u5,u6 (4 missing) → not ok
    const catalog = [
      makeExercise({ id: "ex.u1.reales_operaciones.1", skillId: "mat.u1.reales_operaciones" }),
      makeExercise({ id: "ex.u2.polinomios_basico.1", skillId: "mat.u2.polinomios_basico" }),
    ];
    const result = selectBalancedSet(catalog);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.missingCoverage).toEqual(
      expect.arrayContaining(["u3", "u4", "u5", "u6"])
    );
  });
});

// ── estimateSkills ───────────────────────────────────────────────────────────

describe("estimateSkills — provisional accuracy ranking", () => {
  test("lower-accuracy skill is ranked as weaker", () => {
    const attempts: Attempt[] = [
      // Skill A: 1 correct out of 1 (100%)
      makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
      // Skill B: 1 correct out of 2 (50%)
      makeAttempt({ skillId: "mat.u2.polinomios_basico", correct: true }),
      makeAttempt({ skillId: "mat.u2.polinomios_basico", correct: false }),
    ];

    const estimates = estimateSkills(attempts);

    expect(estimates.length).toBe(2);

    const skillA = estimates.find((e) => e.skillId === "mat.u1.reales_operaciones");
    const skillB = estimates.find((e) => e.skillId === "mat.u2.polinomios_basico");

    expect(skillA).toBeDefined();
    expect(skillB).toBeDefined();
    if (!skillA || !skillB) return;

    expect(skillA.accuracy).toBe(1);
    expect(skillB.accuracy).toBe(0.5);
    expect(skillA.accuracy).toBeGreaterThan(skillB.accuracy);
  });

  test("estimates are marked as provisional", () => {
    const attempts: Attempt[] = [
      makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
    ];

    const estimates = estimateSkills(attempts);
    expect(estimates.length).toBe(1);
    expect(estimates[0].provisional).toBe(true);
  });

  test("attempts count matches the number of attempts per skill", () => {
    const attempts: Attempt[] = [
      makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
      makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: false }),
      makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
    ];

    const estimates = estimateSkills(attempts);
    expect(estimates.length).toBe(1);
    expect(estimates[0].attempts).toBe(3);
    expect(estimates[0].accuracy).toBeCloseTo(2 / 3);
  });

  test("returns empty array for empty attempts", () => {
    const estimates = estimateSkills([]);
    expect(estimates).toEqual([]);
  });
});

// ── suggestPractice ──────────────────────────────────────────────────────────

describe("suggestPractice — weak-area tag aggregation", () => {
  test("suggestions include practice targets for weakest skills", () => {
    const estimates = [
      { skillId: "mat.u1.reales_operaciones" as const, accuracy: 1, attempts: 3, provisional: true as const, errorTags: [] },
      { skillId: "mat.u2.polinomios_basico" as const, accuracy: 0.3, attempts: 3, provisional: true as const, errorTags: [] },
    ];

    const suggestions = suggestPractice(estimates);

    // Should suggest practice for the weaker skill
    expect(suggestions.some((s) => s.skillId === "mat.u2.polinomios_basico")).toBe(true);
    // Should NOT suggest practice for the strong skill
    expect(suggestions.some((s) => s.skillId === "mat.u1.reales_operaciones")).toBe(false);
  });

  test("suggestions include observed error tags when available", () => {
    const estimates = [
      { skillId: "mat.u2.polinomios_basico" as const, accuracy: 0.2, attempts: 3, provisional: true as const, errorTags: ["u2_signo_al_mover"] },
    ];

    const suggestions = suggestPractice(estimates);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].errorTags).toContain("u2_signo_al_mover");
  });

  test("returns empty suggestions when all skills are strong", () => {
    const estimates = [
      { skillId: "mat.u1.reales_operaciones" as const, accuracy: 1, attempts: 3, provisional: true as const, errorTags: [] },
      { skillId: "mat.u2.polinomios_basico" as const, accuracy: 0.95, attempts: 3, provisional: true as const, errorTags: [] },
    ];

    const suggestions = suggestPractice(estimates);
    expect(suggestions).toEqual([]);
  });

  test("returns empty suggestions for empty estimates", () => {
    const suggestions = suggestPractice([]);
    expect(suggestions).toEqual([]);
  });
});

// ── Diagnostic set type safety (WU-9 regression) ─────────────────────────

const SAFE_DIAGNOSTIC_TYPES = new Set(["multiple-choice", "true-false", "numerical"]);

describe("selectBalancedSet — diagnostic type safety (WU-9)", () => {
  test("diagnostic set contains no symbolic or fill-blank exercises from the real catalog", () => {
    const catalog = loadCatalog();
    const result = selectBalancedSet(catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ambiguous = result.exercises.filter(
      (e) => !SAFE_DIAGNOSTIC_TYPES.has(e.type)
    );

    expect(
      ambiguous,
      `Diagnostic set contains ambiguous exercises: ${ambiguous.map((e) => `${e.id} (${e.type})`).join(", ")}`
    ).toHaveLength(0);
  });

  test("ex.u2.factorizacion.1 is multiple-choice with correct option in the real catalog", () => {
    const catalog = loadCatalog();
    const exercise = catalog.find((e) => e.id === "ex.u2.factorizacion.1");

    expect(exercise).toBeDefined();
    if (!exercise) return;

    expect(exercise.type).toBe("multiple-choice");
    expect(exercise.options).toBeDefined();
    expect(exercise.options!.length).toBeGreaterThanOrEqual(2);
    expect(exercise.options).toContain(exercise.expectedAnswer);
    expect(exercise.expectedAnswer).toBe("(x - 2)(x - 3)");
  });

  test("ex.u3.ecuaciones_cuadraticas.1 is multiple-choice with correct option in the real catalog", () => {
    const catalog = loadCatalog();
    const exercise = catalog.find((e) => e.id === "ex.u3.ecuaciones_cuadraticas.1");

    expect(exercise).toBeDefined();
    if (!exercise) return;

    expect(exercise.type).toBe("multiple-choice");
    expect(exercise.options).toBeDefined();
    expect(exercise.options!.length).toBeGreaterThanOrEqual(2);
    expect(exercise.options).toContain(exercise.expectedAnswer);
  });

  test("ex.u2.polinomios_basico.1 is multiple-choice with correct option in the real catalog", () => {
    const catalog = loadCatalog();
    const exercise = catalog.find((e) => e.id === "ex.u2.polinomios_basico.1");

    expect(exercise).toBeDefined();
    if (!exercise) return;

    expect(exercise.type).toBe("multiple-choice");
    expect(exercise.options).toBeDefined();
    expect(exercise.options!.length).toBeGreaterThanOrEqual(2);
    expect(exercise.options).toContain(exercise.expectedAnswer);
  });

  test("ex.u5.circunferencia_trigonometrica.1 is multiple-choice with correct option in the real catalog", () => {
    const catalog = loadCatalog();
    const exercise = catalog.find((e) => e.id === "ex.u5.circunferencia_trigonometrica.1");

    expect(exercise).toBeDefined();
    if (!exercise) return;

    expect(exercise.type).toBe("multiple-choice");
    expect(exercise.options).toBeDefined();
    expect(exercise.options!.length).toBeGreaterThanOrEqual(2);
    expect(exercise.options).toContain(exercise.expectedAnswer);
  });
});

// ── isExerciseReliable — diagnostic filtering ─────────────────────────────

describe("isExerciseReliable — excludes exercises with unreliable evaluation", () => {
  test("numerical exercise with non-numeric expected answer is unreliable", () => {
    const exercise = makeExercise({
      type: "numerical",
      expectedAnswer: "x = -2, x = 2",
    });
    expect(isExerciseReliable(exercise)).toBe(false);
  });

  test("numerical exercise with valid numeric answer is reliable", () => {
    const exercise = makeExercise({
      type: "numerical",
      expectedAnswer: "42",
    });
    expect(isExerciseReliable(exercise)).toBe(true);
  });

  test("multiple-choice with fewer than 3 options is unreliable", () => {
    const exercise = makeExercise({
      type: "multiple-choice",
      expectedAnswer: "A",
      options: ["A", "B"],
    });
    expect(isExerciseReliable(exercise)).toBe(false);
  });

  test("multiple-choice with expected answer not in options is unreliable", () => {
    const exercise = makeExercise({
      type: "multiple-choice",
      expectedAnswer: "A",
      options: ["B", "C", "D"],
    });
    expect(isExerciseReliable(exercise)).toBe(false);
  });

  test("multiple-choice with valid options and expected answer is reliable", () => {
    const exercise = makeExercise({
      type: "multiple-choice",
      expectedAnswer: "A",
      options: ["A", "B", "C"],
    });
    expect(isExerciseReliable(exercise)).toBe(true);
  });

  test("true-false exercise is always reliable", () => {
    const exercise = makeExercise({
      type: "true-false",
      expectedAnswer: "true",
    });
    expect(isExerciseReliable(exercise)).toBe(true);
  });

  test("symbolic exercise is always reliable", () => {
    const exercise = makeExercise({
      type: "symbolic",
      expectedAnswer: "x = 3, y = 2",
    });
    expect(isExerciseReliable(exercise)).toBe(true);
  });

  test("real catalog exercises are all reliable", () => {
    const catalog = loadCatalog();
    const unreliable = catalog.filter((e) => !isExerciseReliable(e));
    expect(
      unreliable,
      `Unexpected unreliable exercises: ${unreliable.map((e) => `${e.id} (${e.type})`).join(", ")}`
    ).toHaveLength(0);
  });

  test("ex.u5.radianes.1 is reliable after migration to structured multiple-choice", () => {
    const catalog = loadCatalog();
    const exercise = catalog.find((e) => e.id === "ex.u5.radianes.1");
    expect(exercise).toBeDefined();
    if (!exercise) return;
    expect(exercise.type).toBe("multiple-choice");
    expect(isExerciseReliable(exercise)).toBe(true);
  });
});

// ── selectBalancedSet — diagnostic excludes unreliable exercises ──────────

describe("selectBalancedSet — excludes unreliable exercises from diagnostic", () => {
  test("exercises with config error (numerical + non-numeric answer) are excluded", () => {
    // Build a catalog where one exercise per unit is valid,
    // but unit 7 has a config-error exercise that should be filtered out.
    const catalog = [
      makeExercise({ id: "ex.u1.reales_operaciones.1", skillId: "mat.u1.reales_operaciones" }),
      makeExercise({ id: "ex.u1.potencias_raices.1", skillId: "mat.u1.potencias_raices" }),
      makeExercise({ id: "ex.u2.polinomios_basico.1", skillId: "mat.u2.polinomios_basico" }),
      makeExercise({ id: "ex.u2.factorizacion.1", skillId: "mat.u2.factorizacion" }),
      makeExercise({ id: "ex.u3.ecuaciones_lineales.1", skillId: "mat.u3.ecuaciones_lineales" }),
      makeExercise({ id: "ex.u3.ecuaciones_cuadraticas.1", skillId: "mat.u3.ecuaciones_cuadraticas" }),
      makeExercise({ id: "ex.u4.pitagoras.1", skillId: "mat.u4.pitagoras" }),
      makeExercise({ id: "ex.u4.thales.1", skillId: "mat.u4.thales" }),
      makeExercise({
        id: "ex.u5.bad.1",
        skillId: "mat.u5.trigonometria_basica",
        type: "numerical",
        expectedAnswer: "x = -2, x = 2",
      }),
      makeExercise({ id: "ex.u5.good.1", skillId: "mat.u5.trigonometria_basica" }),
      makeExercise({ id: "ex.u6.good.1", skillId: "mat.u6.probabilidad_basica" }),
      makeExercise({ id: "ex.u6.good.2", skillId: "mat.u6.probabilidad_basica" }),
    ];

    const result = selectBalancedSet(catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const selectedIds = result.exercises.map((e) => e.id);
    expect(selectedIds).not.toContain("ex.u5.bad.1");
    expect(selectedIds).toContain("ex.u5.good.1");
  });

  test("all exercises in diagnostic set are reliable", () => {
    const catalog = loadCatalog();
    const result = selectBalancedSet(catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Guard: ensure the set is non-empty so the loop cannot silently pass on empty input.
    expect(result.exercises.length).toBeGreaterThan(0);

    for (const exercise of result.exercises) {
      expect(
        isExerciseReliable(exercise),
        `Exercise ${exercise.id} (${exercise.type}) is unreliable but was included in diagnostic set`
      ).toBe(true);
    }
  });

  test("real catalog diagnostic includes exercises from unit 5 after the radianes migration", () => {
    const catalog = loadCatalog();
    const result = selectBalancedSet(catalog);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const u5Exercises = result.exercises.filter((e) =>
      e.skillId.match(/^mat\.u5\./)
    );
    // ex.u5.radianes.1 is now reliable, but deterministic difficulty/id ordering
    // still picks earlier unit-5 exercises for the balanced diagnostic slice.
    expect(u5Exercises.length).toBeGreaterThanOrEqual(1);
    expect(u5Exercises.every((e) => e.id !== "ex.u5.radianes.1")).toBe(true);
  });

  test("multiple-choice with undefined options is unreliable", () => {
    const exercise = makeExercise({
      type: "multiple-choice",
      expectedAnswer: "A",
      options: undefined,
    });
    expect(isExerciseReliable(exercise)).toBe(false);
  });
});

// ── estimateSkills — excludes config-error attempts from accuracy ────────

describe("estimateSkills — excludes config-error attempts from accuracy", () => {
  test("config-error attempt does not count as incorrect", () => {
    const attempts: Attempt[] = [
      makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: true }),
      makeAttempt({ skillId: "mat.u1.reales_operaciones", correct: false, errorTag: "configuration_error" }),
    ];

    const estimates = estimateSkills(attempts);
    const skill = estimates.find((e) => e.skillId === "mat.u1.reales_operaciones");

    expect(skill).toBeDefined();
    if (!skill) return;

    // Config error excluded: only 1 valid attempt (correct) → accuracy = 1
    expect(skill.accuracy).toBe(1);
    expect(skill.attempts).toBe(1);
  });

  test("config-error attempts are fully excluded even when mixed with real errors", () => {
    const attempts: Attempt[] = [
      makeAttempt({ skillId: "mat.u2.polinomios_basico", correct: true }),
      makeAttempt({ skillId: "mat.u2.polinomios_basico", correct: false }),
      makeAttempt({ skillId: "mat.u2.polinomios_basico", correct: false, errorTag: "configuration_error" }),
    ];

    const estimates = estimateSkills(attempts);
    const skill = estimates.find((e) => e.skillId === "mat.u2.polinomios_basico");

    expect(skill).toBeDefined();
    if (!skill) return;

    // Config error excluded: 2 valid attempts (1 correct, 1 wrong) → accuracy = 0.5
    expect(skill.accuracy).toBe(0.5);
    expect(skill.attempts).toBe(2);
  });

  test("error tags from config errors are not included in skill estimates", () => {
    const attempts: Attempt[] = [
      makeAttempt({
        skillId: "mat.u3.ecuaciones_lineales",
        correct: false,
        errorTag: "configuration_error",
      }),
    ];

    const estimates = estimateSkills(attempts);

    // No valid attempts → empty estimates
    expect(estimates).toEqual([]);
  });
});
