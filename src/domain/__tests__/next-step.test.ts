import { describe, expect, it } from "vitest";
import { deriveHomeNextStep, type ReadySkill } from "../next-step/index";
import type { PracticeProgress } from "../progress/index";

const readySkills: readonly ReadySkill[] = [
  { skillId: "mat.u1.conjuntos_numericos", label: "Conjuntos numéricos" },
  { skillId: "mat.u1.propiedades_operaciones_reales", label: "Propiedades Operaciones de Números reales" },
  { skillId: "mat.u1.potencias_raices", label: "Potencias y raíces" },
  { skillId: "mat.u1.intervalos", label: "Intervalos" },
];

function progress(overrides: Partial<PracticeProgress>): PracticeProgress {
  return {
    attempts: [],
    accuracyBySkill: {},
    trendBySkill: {},
    lastPracticedBySkill: {},
    diagnosticResult: null,
    studyPlan: null,
    ...overrides,
  };
}

describe("deriveHomeNextStep", () => {
  it("recommends the initial diagnostic when there are no practice attempts", () => {
    const nextStep = deriveHomeNextStep(progress({}), readySkills);

    expect(nextStep.kind).toBe("diagnostic");
    expect(nextStep.href).toBe("/diagnostic");
  });

  it("recommends direct practice for a ready skill with low accuracy", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-1",
            skillId: "mat.u1.intervalos",
            correct: false,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
        ],
        accuracyBySkill: { "mat.u1.intervalos": 0.5 },
        trendBySkill: { "mat.u1.intervalos": "stable" },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.conjuntos_numericos");
  });

  it("does not generate a direct practice link for a skill that is not ready", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-2",
            skillId: "mat.u2.factorizacion",
            correct: false,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
        ],
        accuracyBySkill: { "mat.u2.factorizacion": 0 },
        trendBySkill: { "mat.u2.factorizacion": "needs-review" },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.conjuntos_numericos");
    expect(nextStep.href).not.toContain("mat.u2.factorizacion");
  });

  it("recommends the next unattempted ready step when previous skills have acceptable progress", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-cn",
            skillId: "mat.u1.conjuntos_numericos",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
          {
            exerciseId: "ex-3",
            skillId: "mat.u1.propiedades_operaciones_reales",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
        ],
        accuracyBySkill: {
          "mat.u1.conjuntos_numericos": 1,
          "mat.u1.propiedades_operaciones_reales": 1,
        },
        trendBySkill: {
          "mat.u1.conjuntos_numericos": "stable",
          "mat.u1.propiedades_operaciones_reales": "stable",
        },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.potencias_raices");
  });

  it("prioritizes the next pedagogical step before recovering later ready skills", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-0",
            skillId: "mat.u1.conjuntos_numericos",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
          {
            exerciseId: "ex-1",
            skillId: "mat.u1.propiedades_operaciones_reales",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
          {
            exerciseId: "ex-2",
            skillId: "mat.u1.intervalos",
            correct: false,
            answeredAt: "2026-06-01T00:01:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
        ],
        accuracyBySkill: {
          "mat.u1.conjuntos_numericos": 1,
          "mat.u1.propiedades_operaciones_reales": 1,
          "mat.u1.intervalos": 0.5,
        },
        trendBySkill: {
          "mat.u1.conjuntos_numericos": "stable",
          "mat.u1.propiedades_operaciones_reales": "stable",
          "mat.u1.intervalos": "needs-review",
        },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.potencias_raices");
  });

  it("recommends conjuntos_numericos as the first pedagogical step when no attempts yet but progress exists on later skills", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-1",
            skillId: "mat.u1.propiedades_operaciones_reales",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
        ],
        accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 1 },
        trendBySkill: { "mat.u1.propiedades_operaciones_reales": "stable" },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.conjuntos_numericos");
  });

  it("advances to reales_operaciones after conjuntos_numericos is completed with stable accuracy", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-cn-1",
            skillId: "mat.u1.conjuntos_numericos",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
        ],
        accuracyBySkill: { "mat.u1.conjuntos_numericos": 1 },
        trendBySkill: { "mat.u1.conjuntos_numericos": "stable" },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.propiedades_operaciones_reales");
  });

  it("recovers conjuntos_numericos when accuracy is low or trend is needs-review", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-cn-1",
            skillId: "mat.u1.conjuntos_numericos",
            correct: false,
            answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1,
          },
        ],
        accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.5 },
        trendBySkill: { "mat.u1.conjuntos_numericos": "needs-review" },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.conjuntos_numericos");
  });
});

describe("deriveHomeNextStep — roadmap & diagnostic summary", () => {
  it("always returns a roadmap with all 4 pilot skills in order, even with no attempts", () => {
    const nextStep = deriveHomeNextStep(progress({}), readySkills);

    expect(nextStep.roadmapSkills).toHaveLength(4);
    expect(nextStep.roadmapSkills.map((s) => s.skillId)).toEqual([
      "mat.u1.conjuntos_numericos",
      "mat.u1.propiedades_operaciones_reales",
      "mat.u1.potencias_raices",
      "mat.u1.intervalos",
    ]);
    // No attempts yet → all 'not-started'
    expect(nextStep.roadmapSkills.every((s) => s.masteryLevel === "not-started")).toBe(true);
  });

  it("classifies each pilot skill's mastery level from progress", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        // 5 correct out of 5 for conjuntos_numericos → mastered
        attempts: [
          { exerciseId: "ex-1", skillId: "mat.u1.conjuntos_numericos", correct: true, answeredAt: "2026-06-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1 },
          { exerciseId: "ex-2", skillId: "mat.u1.conjuntos_numericos", correct: true, answeredAt: "2026-06-01T00:00:01.000Z", timeMs: 5000, attemptIndex: 1 },
          { exerciseId: "ex-3", skillId: "mat.u1.conjuntos_numericos", correct: true, answeredAt: "2026-06-01T00:00:02.000Z", timeMs: 5000, attemptIndex: 1 },
          { exerciseId: "ex-4", skillId: "mat.u1.conjuntos_numericos", correct: true, answeredAt: "2026-06-01T00:00:03.000Z", timeMs: 5000, attemptIndex: 1 },
          { exerciseId: "ex-5", skillId: "mat.u1.conjuntos_numericos", correct: true, answeredAt: "2026-06-01T00:00:04.000Z", timeMs: 5000, attemptIndex: 1 },
        ],
        accuracyBySkill: { "mat.u1.conjuntos_numericos": 1 },
        trendBySkill: { "mat.u1.conjuntos_numericos": "stable" },
      }),
      readySkills
    );

    const cn = nextStep.roadmapSkills.find(
      (s) => s.skillId === "mat.u1.conjuntos_numericos"
    );
    expect(cn?.masteryLevel).toBe("mastered");
    expect(cn?.accuracy).toBe(1);

    // The other three are still untouched
    const others = nextStep.roadmapSkills.filter(
      (s) => s.skillId !== "mat.u1.conjuntos_numericos"
    );
    expect(others.every((s) => s.masteryLevel === "not-started")).toBe(true);
  });

  it("returns diagnosticSummary as null when no diagnostic has been completed", () => {
    const nextStep = deriveHomeNextStep(progress({}), readySkills);
    expect(nextStep.diagnosticSummary).toBeNull();
  });

  it("returns diagnosticSummary with weakSkills count when a diagnostic exists", () => {
    const storedDiagnostic = {
      completedAt: "2026-06-01T10:00:00.000Z",
      version: 1 as const,
      estimates: [
        { skillId: "mat.u1.conjuntos_numericos" as const, accuracy: 0.4, attempts: 2, provisional: true as const, errorTags: [] },
        { skillId: "mat.u1.propiedades_operaciones_reales" as const, accuracy: 0.6, attempts: 2, provisional: true as const, errorTags: [] },
        { skillId: "mat.u1.potencias_raices" as const, accuracy: 0.9, attempts: 2, provisional: true as const, errorTags: [] },
      ],
      suggestions: [
        { skillId: "mat.u1.conjuntos_numericos" as const, accuracy: 0.4, errorTags: [] },
        { skillId: "mat.u1.propiedades_operaciones_reales" as const, accuracy: 0.6, errorTags: [] },
      ],
    };
    const nextStep = deriveHomeNextStep(
      progress({ diagnosticResult: storedDiagnostic }),
      readySkills
    );

    expect(nextStep.diagnosticSummary).not.toBeNull();
    expect(nextStep.diagnosticSummary?.completedAt).toBe("2026-06-01T10:00:00.000Z");
    // 2 skills below 0.7 in the stored estimate
    expect(nextStep.diagnosticSummary?.weakSkills).toBe(2);
    // 3 unique skills estimated
    expect(nextStep.diagnosticSummary?.totalSkills).toBe(3);
  });
});
