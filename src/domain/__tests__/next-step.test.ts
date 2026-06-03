import { describe, expect, it } from "vitest";
import { deriveHomeNextStep, type ReadySkill } from "../next-step/index";
import type { PracticeProgress } from "../progress/index";

const readySkills: readonly ReadySkill[] = [
  { skillId: "mat.u1.conjuntos_numericos", label: "Conjuntos numéricos" },
  { skillId: "mat.u1.reales_operaciones", label: "Números reales y operaciones" },
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
            answeredAt: "2026-06-01T00:00:00.000Z",
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
            answeredAt: "2026-06-01T00:00:00.000Z",
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
            answeredAt: "2026-06-01T00:00:00.000Z",
          },
          {
            exerciseId: "ex-3",
            skillId: "mat.u1.reales_operaciones",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z",
          },
        ],
        accuracyBySkill: {
          "mat.u1.conjuntos_numericos": 1,
          "mat.u1.reales_operaciones": 1,
        },
        trendBySkill: {
          "mat.u1.conjuntos_numericos": "stable",
          "mat.u1.reales_operaciones": "stable",
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
            answeredAt: "2026-06-01T00:00:00.000Z",
          },
          {
            exerciseId: "ex-1",
            skillId: "mat.u1.reales_operaciones",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z",
          },
          {
            exerciseId: "ex-2",
            skillId: "mat.u1.intervalos",
            correct: false,
            answeredAt: "2026-06-01T00:01:00.000Z",
          },
        ],
        accuracyBySkill: {
          "mat.u1.conjuntos_numericos": 1,
          "mat.u1.reales_operaciones": 1,
          "mat.u1.intervalos": 0.5,
        },
        trendBySkill: {
          "mat.u1.conjuntos_numericos": "stable",
          "mat.u1.reales_operaciones": "stable",
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
            skillId: "mat.u1.reales_operaciones",
            correct: true,
            answeredAt: "2026-06-01T00:00:00.000Z",
          },
        ],
        accuracyBySkill: { "mat.u1.reales_operaciones": 1 },
        trendBySkill: { "mat.u1.reales_operaciones": "stable" },
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
            answeredAt: "2026-06-01T00:00:00.000Z",
          },
        ],
        accuracyBySkill: { "mat.u1.conjuntos_numericos": 1 },
        trendBySkill: { "mat.u1.conjuntos_numericos": "stable" },
      }),
      readySkills
    );

    expect(nextStep.kind).toBe("practice");
    expect(nextStep.href).toBe("/practice?skill=mat.u1.reales_operaciones");
  });

  it("recovers conjuntos_numericos when accuracy is low or trend is needs-review", () => {
    const nextStep = deriveHomeNextStep(
      progress({
        attempts: [
          {
            exerciseId: "ex-cn-1",
            skillId: "mat.u1.conjuntos_numericos",
            correct: false,
            answeredAt: "2026-06-01T00:00:00.000Z",
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
