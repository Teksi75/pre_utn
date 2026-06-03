import { describe, test, expect } from "vitest";
import { createStudyPlan } from "../diagnostic/index";
import type { DiagnosticResult } from "../diagnostic/index";
import type { PracticeProgress, PracticeAttempt } from "../progress/index";
import { PILOT_SKILLS } from "../catalog/pilot-skills";

// ── Helpers ──────────────────────────────────────────────────────────────────

const emptyProgress = (overrides: Partial<PracticeProgress> = {}): PracticeProgress => ({
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
  ...overrides,
});

const diagnostic = (
  pairs: Array<[skillId: string, accuracy: number, errorTags: readonly string[]]>
): DiagnosticResult => {
  const weakPairs = pairs.filter((pair) => pair[1] < 0.7);
  return {
    completedAt: "2025-06-03T10:00:00.000Z",
    estimates: pairs.map(([skillId, accuracy, errorTags]) => ({
      skillId: skillId as never,
      accuracy,
      attempts: 2,
      provisional: true,
      errorTags,
    })),
    // A skill appears in suggestions only when it's below the WEAK_THRESHOLD (0.7)
    suggestions: weakPairs.map(([skillId, accuracy, errorTags]) => ({
      skillId: skillId as never,
      accuracy,
      errorTags,
    })),
    version: 1,
  };
};

/**
 * A diagnostic where every pilot skill is strong (accuracy >= 0.7).
 * Used to assert "empty plan" semantics.
 */
const allPilotsStrong = (accuracy = 0.9): DiagnosticResult =>
  diagnostic(
    PILOT_SKILLS.map(
      (s) => [s.skillId, accuracy, []] as [string, number, readonly string[]]
    )
  );

/** A progress where every pilot skill has been practiced to >= 0.7. */
const allPilotsPracticed = (accuracy = 0.9): PracticeProgress =>
  emptyProgress({
    accuracyBySkill: Object.fromEntries(
      PILOT_SKILLS.map((s) => [s.skillId, accuracy])
    ),
  });

// ── Tests ────────────────────────────────────────────────────────────────────

describe("createStudyPlan", () => {
  test("returns null when no diagnostic is provided", () => {
    const plan = createStudyPlan(null, emptyProgress());
    expect(plan).toBeNull();
  });

  test("returns a StudyPlan with empty priorities when every pilot skill is strong", () => {
    // Every pilot skill is tested in the diagnostic AND accuracy >= 0.7
    // → nothing in the plan.
    const result = allPilotsStrong(0.9);
    const plan = createStudyPlan(result, emptyProgress());

    expect(plan).not.toBeNull();
    expect(plan?.skillPriorities).toEqual([]);
    // The plan should still embed the diagnostic it was built from so the
    // UI can render provenance ("basado en tu diagnóstico del …").
    expect(plan?.diagnosticResult).toBe(result);
    expect(plan?.createdAt).toBeTruthy();
  });

  test("returns a StudyPlan with empty priorities when every pilot skill is strong via practice", () => {
    // Even if the diagnostic was weak, practice to >= 0.7 master skips
    // every pilot skill.
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.3, ["u1_orden_operaciones"]],
    ]);
    const plan = createStudyPlan(result, allPilotsPracticed(0.9));

    expect(plan).not.toBeNull();
    expect(plan?.skillPriorities).toEqual([]);
  });

  test("flags two weak-diagnostic skills with priority 1 when prereqs are met", () => {
    // Two pilot skills with no prereqs are both weak in the diagnostic
    // → both get priority 1. The remaining pilot skills have no
    // diagnostic data, so they show up as not-attempted (we don't
    // assert about them here, just that the two weak ones are
    // priority 1).
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.4, ["u1_orden_operaciones"]],
      ["mat.u1.intervalos", 0.5, ["u1_error_intervalo"]],
    ]);

    const plan = createStudyPlan(result, emptyProgress());

    expect(plan).not.toBeNull();
    const priorities = plan?.skillPriorities ?? [];

    const conj = priorities.find((p) => p.skillId === "mat.u1.conjuntos_numericos");
    const intervalos = priorities.find((p) => p.skillId === "mat.u1.intervalos");
    expect(conj?.priority).toBe(1);
    expect(conj?.reason).toBe("diagnostic-weak");
    expect(intervalos?.priority).toBe(1);
    expect(intervalos?.reason).toBe("diagnostic-weak");
  });

  test("orders priorities ascending (priority 1 comes before priority 3)", () => {
    // Diagnostic flagged both conjuntos_numericos (no prereqs) and
    // reales_operaciones (prereq is conjuntos_numericos, which is
    // also weak → prereqs NOT met → priority 3). The not-attempted
    // skills also appear in the plan with priorities 2 and 4.
    const result = diagnostic([
      ["mat.u1.reales_operaciones", 0.3, ["u1_error_signos"]],
      ["mat.u1.conjuntos_numericos", 0.4, ["u1_orden_operaciones"]],
    ]);

    const plan = createStudyPlan(result, emptyProgress());
    const priorities = plan?.skillPriorities ?? [];

    // Verify the ordering: priority 1 must come before priority 2,
    // which must come before priority 3, which must come before
    // priority 4. (Stable, ascending.)
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i].priority).toBeGreaterThanOrEqual(priorities[i - 1].priority);
    }

    const conj = priorities.find((p) => p.skillId === "mat.u1.conjuntos_numericos");
    const real = priorities.find((p) => p.skillId === "mat.u1.reales_operaciones");
    expect(conj?.priority).toBe(1);
    expect(real?.priority).toBe(3);
  });

  test("assigns priority 3 when a weak skill's prerequisite is also weak", () => {
    // potencias_raices has prereq reales_operaciones, which is weak in
    // the diagnostic. So potencias_raices' prereqs are NOT met → 3.
    const result = diagnostic([
      ["mat.u1.reales_operaciones", 0.3, ["u1_error_signos"]],
      ["mat.u1.potencias_raices", 0.3, ["u1_potencia_signo"]],
    ]);

    const plan = createStudyPlan(result, emptyProgress());
    const priorities = plan?.skillPriorities ?? [];

    const potencias = priorities.find((p) => p.skillId === "mat.u1.potencias_raices");
    expect(potencias).toBeDefined();
    expect(potencias?.priority).toBe(3);
    expect(potencias?.reason).toBe("diagnostic-weak");
  });

  test("treats practice accuracy >= 0.7 as already strong (skips the skill)", () => {
    // The student was weak in the diagnostic on conjuntos_numericos, but
    // has since practiced it to a strong accuracy — they don't need a plan
    // entry for it.
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.3, ["u1_orden_operaciones"]],
    ]);

    const progress = emptyProgress({
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.9 },
    });

    const plan = createStudyPlan(result, progress);
    const priorities = plan?.skillPriorities ?? [];

    expect(priorities.find((p) => p.skillId === "mat.u1.conjuntos_numericos")).toBeUndefined();
  });

  test("flags pilot skills never tested in the diagnostic as not-attempted (priority 2)", () => {
    // Diagnostic only flagged 1 pilot skill, but the student has
    // never attempted another pilot skill with no prereqs — it shows
    // up as "not-attempted" with priority 2.
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.3, ["u1_orden_operaciones"]],
    ]);

    const plan = createStudyPlan(result, emptyProgress());
    const priorities = plan?.skillPriorities ?? [];

    const intervalos = priorities.find((p) => p.skillId === "mat.u1.intervalos");
    expect(intervalos).toBeDefined();
    expect(intervalos?.reason).toBe("not-attempted");
    expect(intervalos?.priority).toBe(2);
  });

  test("flags a not-attempted skill with blocked prereqs as priority 4", () => {
    // Diagnostic only flagged conjuntos_numericos. But potencias_raices
    // is in PILOT_SKILLS and was never tested nor practiced. Its prereq
    // is reales_operaciones, which is also never tested nor practiced.
    // → prereqs NOT met → priority 4.
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.3, ["u1_orden_operaciones"]],
    ]);

    const plan = createStudyPlan(result, emptyProgress());
    const priorities = plan?.skillPriorities ?? [];

    const potencias = priorities.find((p) => p.skillId === "mat.u1.potencias_raices");
    expect(potencias).toBeDefined();
    expect(potencias?.reason).toBe("not-attempted");
    expect(potencias?.priority).toBe(4);
  });

  test("treats a prereq as met when practice accuracy is >= 0.7 even if the diagnostic was weak", () => {
    // Diagnostic flagged conjuntos_numericos, reales_operaciones, and
    // potencias_raices as weak, but the student has since practiced
    // reales_operaciones to 0.8. From the perspective of
    // potencias_raices (which depends on reales_operaciones), the
    // prereq IS met. So potencias_raices → priority 1, not 3.
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.3, ["u1_orden_operaciones"]],
      ["mat.u1.reales_operaciones", 0.3, ["u1_error_signos"]],
      ["mat.u1.potencias_raices", 0.3, ["u1_potencia_signo"]],
    ]);

    const progress = emptyProgress({
      accuracyBySkill: { "mat.u1.reales_operaciones": 0.8 },
    });

    const plan = createStudyPlan(result, progress);
    const potencias = plan?.skillPriorities.find(
      (p) => p.skillId === "mat.u1.potencias_raices"
    );

    expect(potencias?.priority).toBe(1);
  });

  test("treats a prereq as met when the diagnostic estimate is >= 0.7 (not in suggestions)", () => {
    // Diagnostic has a strong estimate for reales_operaciones (0.85,
    // not in suggestions) AND a weak estimate for potencias_raices.
    // → prereq of potencias_raices IS met → priority 1.
    const result = diagnostic([
      ["mat.u1.reales_operaciones", 0.85, []],
      ["mat.u1.potencias_raices", 0.3, ["u1_potencia_signo"]],
    ]);

    const plan = createStudyPlan(result, emptyProgress());
    const potencias = plan?.skillPriorities.find(
      (p) => p.skillId === "mat.u1.potencias_raices"
    );

    expect(potencias?.priority).toBe(1);
  });

  test("extracts weak concepts from both diagnostic error tags and practice error tags", () => {
    // Diagnostic flagged conjuntos_numericos with one error tag; the
    // student has since practiced it twice, each producing a different
    // error tag. The plan entry's weakConcepts should include all of
    // them, deduped.
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.3, ["u1_orden_operaciones"]],
    ]);

    const attempts: PracticeAttempt[] = [
      {
        exerciseId: "ex.u1.cn.02",
        skillId: "mat.u1.conjuntos_numericos",
        correct: false,
        errorTag: "u1_orden_operaciones",
        answeredAt: "2025-06-01T10:00:00.000Z",
      },
      {
        exerciseId: "ex.u1.cn.03",
        skillId: "mat.u1.conjuntos_numericos",
        correct: false,
        errorTag: "u1_tipo_conjunto",
        answeredAt: "2025-06-01T10:05:00.000Z",
      },
    ];

    const progress = emptyProgress({
      attempts,
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0 },
    });

    const plan = createStudyPlan(result, progress);
    const conj = plan?.skillPriorities.find(
      (p) => p.skillId === "mat.u1.conjuntos_numericos"
    );

    expect(conj?.weakConcepts).toEqual(
      expect.arrayContaining(["u1_orden_operaciones", "u1_tipo_conjunto"])
    );
    expect(conj?.weakConcepts).toHaveLength(2);
  });

  test("uses the current ISO timestamp for createdAt", () => {
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.4, ["u1_orden_operaciones"]],
    ]);

    const before = new Date().toISOString();
    const plan = createStudyPlan(result, emptyProgress());
    const after = new Date().toISOString();

    expect(plan?.createdAt).toBeTruthy();
    // createdAt should fall within the window of the call
    expect(plan!.createdAt >= before).toBe(true);
    expect(plan!.createdAt <= after).toBe(true);
  });

  test("covers every pilot skill — never silently drops one without evidence of strength", () => {
    // Sanity check: when no pilot skill is mastered, every pilot skill
    // should appear in the plan. PILOT_SKILLS is the source of truth
    // for which skills the study plan considers.
    const result = diagnostic([
      ["mat.u1.conjuntos_numericos", 0.3, ["u1_orden_operaciones"]],
    ]);

    const plan = createStudyPlan(result, emptyProgress());
    const inPlan = new Set(plan?.skillPriorities.map((p) => p.skillId));

    const expectedIds = PILOT_SKILLS.map((s) => s.skillId);
    for (const id of expectedIds) {
      expect(inPlan.has(id)).toBe(true);
    }
  });
});
