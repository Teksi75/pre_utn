import { describe, expect, it } from "vitest";
import type { TeacherHomeInput } from "../student-home/index";
import { deriveTeacherHomeViewModel } from "../student-home/index";
import { deriveHomeNextStep } from "../next-step/index";
import type { ReadySkill } from "../next-step/index";
import type { PracticeProgress, PracticeAttempt } from "../progress/index";
import type { PilotSkill } from "../catalog/pilot-skills";
import type { SkillId } from "../models/skill";

// ── Test helpers ──────────────────────────────────────────────────────────────

function pp(overrides: Partial<PracticeProgress> = {}): PracticeProgress {
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

let aCounter = 0;

function att(
  skillId: SkillId,
  overrides: Partial<PracticeAttempt> = {}
): PracticeAttempt {
  aCounter++;
  return {
    exerciseId: `ex-${aCounter}`,
    skillId,
    correct: overrides.correct ?? true,
    answeredAt: overrides.answeredAt ?? `2026-06-0${(aCounter % 9) + 1}T00:00:00.000Z`,
    timeMs: overrides.timeMs ?? 5000,
    attemptIndex: overrides.attemptIndex ?? 1,
    ...overrides,
  };
}

const pilotSkills: readonly PilotSkill[] = [
  { skillId: "mat.u1.conjuntos_numericos", unitKey: "unit-1", label: "Conjuntos numéricos" },
  { skillId: "mat.u1.potencias_raices", unitKey: "unit-1", label: "Potencias y raíces" },
  { skillId: "mat.u1.intervalos", unitKey: "unit-1", label: "Intervalos" },
  { skillId: "mat.u2.polinomios_basico", unitKey: "unit-2", label: "Polinomios: definición y clasificación" },
  { skillId: "mat.u2.operaciones_polinomios", unitKey: "unit-2", label: "Operaciones con polinomios" },
];

/** Build a TeacherHomeInput from progress + available/pilot skills. */
function input(
  progress: PracticeProgress,
  available: readonly ReadySkill[],
  pilot: readonly PilotSkill[]
): TeacherHomeInput {
  const nextStep = deriveHomeNextStep(progress, available, pilot);
  return {
    progress,
    diagnosticResult: progress.diagnosticResult ?? null,
    availableSkills: available,
    pilotSkills: pilot,
    nextStep,
  };
}

// ── Case 1: Missing data tolerance ────────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Case 1: Missing data tolerance", () => {
  it("does not throw when accuracyBySkill and trendBySkill are empty", () => {
    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true }),
        att("mat.u1.conjuntos_numericos", { correct: false }),
      ],
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    expect(vm).toBeDefined();
    expect(vm.teacherMessage).toBeDefined();
    expect(vm.mission).toBeDefined();
    expect(vm.primaryActions).toBeDefined();
    expect(vm.routeUnits).toBeDefined();
    expect(vm.studentSituation).toBeDefined();
    expect(vm.todayPlan).toBeDefined();
  });

  it("treats missing accuracy as 0 (no throw)", () => {
    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true }),
        att("mat.u1.conjuntos_numericos", { correct: false }),
      ],
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    expect(vm.studentSituation.weakSkillsCount).toBeGreaterThanOrEqual(0);
  });

  it("does not throw with empty availableSkills", () => {
    const p = pp({});
    const vm = deriveTeacherHomeViewModel(input(p, [], pilotSkills));

    expect(vm).toBeDefined();
    expect(vm.studentSituation.readinessPercent).toBe(0);
  });
});

// ── Case 2: No invented evidence / empty progress ─────────────────────────────

describe("deriveTeacherHomeViewModel — Case 2: No invented evidence", () => {
  it("returns readinessPercent 0 when no attempts exist", () => {
    const p = pp({ attempts: [] });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    expect(vm.studentSituation.readinessPercent).toBe(0);
    expect(vm.studentSituation.practicedSkillsCount).toBe(0);
  });

  it("does not fabricate mastery gaps when no attempts exist", () => {
    const p = pp({ attempts: [] });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    expect(vm.studentSituation.weakSkillsCount).toBe(0);
    expect(vm.studentSituation.practicedSkillsCount).toBe(0);
  });

  it("recommends diagnostic CTA when progress is empty", () => {
    const p = pp({ attempts: [] });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const diagnosticAction = vm.primaryActions.find(
      (a) => a.href === "/diagnostic"
    );
    expect(diagnosticAction).toBeDefined();
  });
});

// ── Case 3: Skill label priority ──────────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Case 3: Skill label priority", () => {
  it("uses catalog labels in routeUnits, not raw skill IDs", () => {
    const p = pp({
      attempts: [att("mat.u1.conjuntos_numericos", { correct: true })],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 1 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "stable" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    // routeUnits should not contain raw skill ID patterns
    const unitStrings = JSON.stringify(vm.routeUnits);
    expect(unitStrings).not.toMatch(/mat\.u\d\./);
  });

  it("does not expose raw skill IDs in primaryActions", () => {
    const p = pp({
      attempts: [att("mat.u1.intervalos", { correct: false })],
      accuracyBySkill: { "mat.u1.intervalos": 0.3 },
      trendBySkill: { "mat.u1.intervalos": "needs-review" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    for (const action of vm.primaryActions) {
      expect(action.label).not.toMatch(/mat\.u\d\./);
      expect(action.description).not.toMatch(/mat\.u\d\./);
    }
  });
});

// ── Case 4: Initial no-progress → Diagnostic CTA ──────────────────────────────

describe("deriveTeacherHomeViewModel — Case 4: Diagnostic CTA", () => {
  it("todayPlan includes a diagnostic step when no attempts", () => {
    const p = pp({ attempts: [] });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    expect(vm.todayPlan.length).toBeGreaterThan(0);
    expect(vm.todayPlan[0].skillId).toBe("diagnostic");
  });

  it("mission CTA points to /diagnostic when no attempts", () => {
    const p = pp({ attempts: [] });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    expect(vm.mission.ctaHref).toBe("/diagnostic");
  });
});

// ── Case 5: Weak skill thresholds ─────────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Case 5: Weak skill thresholds", () => {
  it("identifies a skill with accuracy < WEAK_SKILL_THRESHOLD as weak", () => {
    const p = pp({
      attempts: [
        att("mat.u1.intervalos", { correct: false }),
        att("mat.u1.intervalos", { correct: false }),
        att("mat.u1.intervalos", { correct: true }),
      ],
      accuracyBySkill: { "mat.u1.intervalos": 1 / 3 },
      trendBySkill: { "mat.u1.intervalos": "stable" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    // primaryActions should include a practice action for the weak skill
    const recovery = vm.primaryActions.filter(
      (a) => a.href.includes("mat.u1.intervalos")
    );
    expect(recovery.length).toBeGreaterThan(0);
  });

  it("identifies a skill with trend needs-review as weak regardless of accuracy", () => {
    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true }),
        att("mat.u1.conjuntos_numericos", { correct: true }),
        att("mat.u1.conjuntos_numericos", { correct: true }),
        att("mat.u1.conjuntos_numericos", { correct: false }),
        att("mat.u1.conjuntos_numericos", { correct: false }),
      ],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.6 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "needs-review" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const recovery = vm.primaryActions.filter(
      (a) => a.href.includes("mat.u1.conjuntos_numericos")
    );
    expect(recovery.length).toBeGreaterThan(0);
  });
});

// ── Case 6: Mastered definition ───────────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Case 6: Mastered definition", () => {
  it("marks a unit as mastered when all skills meet mastery criteria", () => {
    // Single-unit scenario: unit 1 with 2 mastered skills
    const singlePilot: PilotSkill[] = [
      { skillId: "mat.u1.conjuntos_numericos", unitKey: "unit-1", label: "Conjuntos numéricos" },
      { skillId: "mat.u1.potencias_raices", unitKey: "unit-1", label: "Potencias y raíces" },
    ];
    const singleAvailable: ReadySkill[] = singlePilot;

    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-2" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-3" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-4" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-5" }),
        att("mat.u1.potencias_raices", { correct: true, exerciseId: "ex-6" }),
        att("mat.u1.potencias_raices", { correct: true, exerciseId: "ex-7" }),
        att("mat.u1.potencias_raices", { correct: true, exerciseId: "ex-8" }),
        att("mat.u1.potencias_raices", { correct: true, exerciseId: "ex-9" }),
        att("mat.u1.potencias_raices", { correct: true, exerciseId: "ex-10" }),
      ],
      accuracyBySkill: {
        "mat.u1.conjuntos_numericos": 0.85,
        "mat.u1.potencias_raices": 0.85,
      },
      trendBySkill: {
        "mat.u1.conjuntos_numericos": "stable",
        "mat.u1.potencias_raices": "stable",
      },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, singleAvailable, singlePilot)
    );

    const unit1 = vm.routeUnits.find((u) => u.unitNumber === 1);
    expect(unit1).toBeDefined();
    expect(unit1!.status).toBe("mastered");
  });

  it("does not mark as mastered with accuracy >= 0.8 but fewer than 5 unique attempts", () => {
    const singlePilot: PilotSkill[] = [
      { skillId: "mat.u1.conjuntos_numericos", unitKey: "unit-1", label: "Conjuntos numéricos" },
    ];
    const singleAvailable: ReadySkill[] = singlePilot;

    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-2" }),
      ],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.9 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "stable" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, singleAvailable, singlePilot)
    );

    const unit1 = vm.routeUnits.find((u) => u.unitNumber === 1);
    expect(unit1).toBeDefined();
    expect(unit1!.status).not.toBe("mastered");
  });

  it("does not mark as mastered when trend is needs-review", () => {
    const singlePilot: PilotSkill[] = [
      { skillId: "mat.u1.conjuntos_numericos", unitKey: "unit-1", label: "Conjuntos numéricos" },
    ];
    const singleAvailable: ReadySkill[] = singlePilot;

    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-2" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-3" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-4" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-5" }),
      ],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 1 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "needs-review" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, singleAvailable, singlePilot)
    );

    const unit1 = vm.routeUnits.find((u) => u.unitNumber === 1);
    expect(unit1).toBeDefined();
    expect(unit1!.status).not.toBe("mastered");
  });
});

// ── Case 7 & 8: Decision priority — Recovery beats advance ────────────────────

describe("deriveTeacherHomeViewModel — Case 7 & 8: Decision priority", () => {
  it("prioritizes weak skill recovery over new unattempted skill in primaryActions", () => {
    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: false }),
        att("mat.u1.conjuntos_numericos", { correct: false }),
        att("mat.u1.conjuntos_numericos", { correct: true }),
      ],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 1 / 3 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "stable" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const practiceActions = vm.primaryActions.filter(
      (a) => a.href.startsWith("/practice?skill=")
    );
    if (practiceActions.length > 0) {
      // First practice action should target the weak skill
      expect(practiceActions[0].href).toContain("mat.u1.conjuntos_numericos");
    }
  });

  it("recommends advance when no weak skills but unattempted skills exist", () => {
    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-2" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-3" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-4" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-5" }),
      ],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.85 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "stable" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const practiceActions = vm.primaryActions.filter(
      (a) => a.href.startsWith("/practice?skill=")
    );
    if (practiceActions.length > 0) {
      expect(practiceActions[0].href).not.toContain("mat.u1.conjuntos_numericos");
    }
  });
});

// ── Case 9: Safe links ────────────────────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Case 9: Safe links", () => {
  it("only produces primaryAction hrefs with verified routes", () => {
    const allowedPrefixes = ["/diagnostic", "/practice", "/learn/matematica"];

    const p = pp({
      attempts: [
        att("mat.u1.intervalos", { correct: false }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-2" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-3" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-4" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-cn-5" }),
      ],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.85, "mat.u1.intervalos": 0.5 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "stable", "mat.u1.intervalos": "needs-review" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    for (const action of vm.primaryActions) {
      const allowed = allowedPrefixes.some((prefix) =>
        action.href.startsWith(prefix)
      );
      expect(allowed).toBe(true);
    }
  });

  it("produces safe mission CTA href", () => {
    const p = pp({});
    const vm = deriveTeacherHomeViewModel(input(p, [], pilotSkills));

    const allowedPrefixes = ["/diagnostic", "/practice", "/learn/matematica"];
    const allowed = allowedPrefixes.some((prefix) =>
      vm.mission.ctaHref.startsWith(prefix)
    );
    expect(allowed).toBe(true);
  });
});

// ── Case 10: Route unit statuses ──────────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Case 10: Route unit statuses", () => {
  it("marks a unit as in-progress when some skills have attempts but not all mastered", () => {
    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-u1a-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-u1a-2" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-u1a-3" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-u1a-4" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-u1a-5" }),
        att("mat.u1.potencias_raices", { correct: true, exerciseId: "ex-u1b-1" }),
        att("mat.u2.polinomios_basico", { correct: false, exerciseId: "ex-u2a-1" }),
      ],
      accuracyBySkill: {
        "mat.u1.conjuntos_numericos": 0.9,
        "mat.u1.potencias_raices": 0.5,
        "mat.u2.polinomios_basico": 0.3,
      },
      trendBySkill: {
        "mat.u1.conjuntos_numericos": "stable",
        "mat.u1.potencias_raices": "stable",
        "mat.u2.polinomios_basico": "stable",
      },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const unit1 = vm.routeUnits.find((u) => u.unitNumber === 1);
    expect(unit1).toBeDefined();
    expect(unit1!.status).toBe("in-progress");

    const unit2 = vm.routeUnits.find((u) => u.unitNumber === 2);
    expect(unit2).toBeDefined();
    expect(unit2!.status).toBe("in-progress");
  });

  it("marks units as not-started when no skills have attempts", () => {
    const p = pp({ attempts: [] });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    for (const unit of vm.routeUnits) {
      if (unit.skillCount > 0) {
        expect(unit.status).toBe("not-started");
      }
    }
  });

  it("always produces 6 route units U1-U6", () => {
    const p = pp({});
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const unitNumbers = vm.routeUnits.map((u) => u.unitNumber);
    expect(unitNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

// ── Case 11: Unit number extraction ───────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Case 11: Unit number extraction", () => {
  it("includes unit 2 in routeUnits with correct unitKey", () => {
    const p = pp({});
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const unit2 = vm.routeUnits.find((u) => u.unitNumber === 2);
    expect(unit2).toBeDefined();
    expect(unit2!.unitKey).toBe("unit-2");
    expect(unit2!.skillCount).toBeGreaterThan(0);
  });

  it("includes unit 1 in routeUnits with correct unitKey", () => {
    const p = pp({});
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    const unit1 = vm.routeUnits.find((u) => u.unitNumber === 1);
    expect(unit1).toBeDefined();
    expect(unit1!.unitKey).toBe("unit-1");
    expect(unit1!.skillCount).toBeGreaterThan(0);
  });

  it("handles unknown patterns gracefully (defaults to unit 1)", () => {
    const weirdPilot: PilotSkill[] = [
      { skillId: "mat.x.unknown" as SkillId, unitKey: "unit-x", label: "Unknown" },
    ];
    const weirdAvailable: ReadySkill[] = weirdPilot;

    const p = pp({});
    const vm = deriveTeacherHomeViewModel(
      input(p, weirdAvailable, weirdPilot)
    );

    const unit1 = vm.routeUnits.find((u) => u.unitNumber === 1);
    expect(unit1).toBeDefined();
    expect(unit1!.skillCount).toBeGreaterThanOrEqual(1);
  });
});

// ── Happy path ────────────────────────────────────────────────────────────────

describe("deriveTeacherHomeViewModel — Happy path", () => {
  it("returns a complete view model with all fields populated", () => {
    const p = pp({
      attempts: [
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-1" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-2" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-3" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-4" }),
        att("mat.u1.conjuntos_numericos", { correct: true, exerciseId: "ex-5" }),
        att("mat.u1.intervalos", { correct: false }),
        att("mat.u1.intervalos", { correct: false }),
      ],
      accuracyBySkill: { "mat.u1.conjuntos_numericos": 0.85, "mat.u1.intervalos": 0.3 },
      trendBySkill: { "mat.u1.conjuntos_numericos": "stable", "mat.u1.intervalos": "needs-review" },
    });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    // teacherMessage
    expect(vm.teacherMessage.length).toBeGreaterThan(0);

    // mission
    expect(vm.mission.title.length).toBeGreaterThan(0);
    expect(vm.mission.ctaLabel.length).toBeGreaterThan(0);
    expect(vm.mission.ctaHref.length).toBeGreaterThan(0);

    // studentSituation
    expect(vm.studentSituation.totalPilotCount).toBe(pilotSkills.length);
    expect(vm.studentSituation.practicedSkillsCount).toBe(2);

    // routeUnits — 6 units U1-U6
    expect(vm.routeUnits.length).toBe(6);

    // primaryActions
    expect(vm.primaryActions.length).toBeGreaterThan(0);

    // todayPlan
    expect(vm.todayPlan.length).toBeGreaterThan(0);
  });

  it("uses diagnostic data when present", () => {
    const storedDiag = {
      completedAt: "2026-06-01T10:00:00.000Z",
      version: 1 as const,
      estimates: [
        { skillId: "mat.u1.conjuntos_numericos" as SkillId, accuracy: 0.4, attempts: 2, provisional: true as const, errorTags: [] },
        { skillId: "mat.u1.potencias_raices" as SkillId, accuracy: 0.6, attempts: 2, provisional: true as const, errorTags: [] },
        { skillId: "mat.u2.polinomios_basico" as SkillId, accuracy: 0.9, attempts: 2, provisional: true as const, errorTags: [] },
      ],
      suggestions: [
        { skillId: "mat.u1.conjuntos_numericos" as SkillId, accuracy: 0.4, errorTags: [] },
        { skillId: "mat.u1.potencias_raices" as SkillId, accuracy: 0.6, errorTags: [] },
      ],
    };

    const p = pp({ diagnosticResult: storedDiag });
    const vm = deriveTeacherHomeViewModel(
      input(p, pilotSkills.slice(0, 4), pilotSkills)
    );

    expect(vm.studentSituation.diagnosticCompletedAt).toBe(
      "2026-06-01T10:00:00.000Z"
    );
    expect(vm.studentSituation.weakSkillsCount).toBe(2);
    expect(vm.studentSituation.totalSkillsCount).toBe(3);
  });
});
