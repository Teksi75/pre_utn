import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveDiagnosticResult,
  loadDiagnosticResult,
  clearDiagnosticResult,
  saveStudyPlan,
  loadStudyPlan,
  clearStudyPlan,
  DIAGNOSTIC_STORAGE_KEY,
  STUDY_PLAN_STORAGE_KEY,
} from "../diagnostic-storage";
import { PROFILES_STORAGE_KEY } from "../student-profile-storage";
import type { DiagnosticResult, StudyPlan } from "@/domain/diagnostic";

/** Assert that a MaybePromise result is sync (no adapter configured) and return it. */
function asSync<T>(value: T | Promise<T>): T {
  expect(value).not.toBeInstanceOf(Promise);
  return value as T;
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

const makeDiagnostic = (overrides: Partial<DiagnosticResult> = {}): DiagnosticResult => ({
  completedAt: "2025-06-03T10:00:00.000Z",
  estimates: [
    {
      skillId: "mat.u1.conjuntos_numericos",
      accuracy: 0.5,
      attempts: 2,
      provisional: true,
      errorTags: ["u1_orden_operaciones"],
    },
  ],
  suggestions: [
    {
      skillId: "mat.u1.conjuntos_numericos",
      accuracy: 0.5,
      errorTags: ["u1_orden_operaciones"],
    },
  ],
  version: 1,
  ...overrides,
});

const makePlan = (overrides: Partial<StudyPlan> = {}): StudyPlan => ({
  createdAt: "2025-06-03T10:00:00.000Z",
  diagnosticResult: makeDiagnostic({ estimates: [], suggestions: [] }),
  skillPriorities: [
    {
      skillId: "mat.u1.conjuntos_numericos",
      priority: 1,
      reason: "diagnostic-weak",
      weakConcepts: ["u1_orden_operaciones"],
    },
  ],
  ...overrides,
});

function activateStudent(studentId = "local-student-a") {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        {
          studentId,
          displayName: "Ana",
          createdAt: "2025-01-01T00:00:00.000Z",
          lastActiveAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeStudentId: studentId,
    })
  );
  return studentId;
}

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.restoreAllMocks();
});

describe("diagnostic-storage", () => {
  describe("DIAGNOSTIC_STORAGE_KEY", () => {
    it("uses versioned key to avoid collisions", () => {
      expect(DIAGNOSTIC_STORAGE_KEY).toBe("pre-utn.diagnostic.v1");
    });
  });

  describe("loadDiagnosticResult", () => {
    it("returns null when no diagnostic stored", () => {
      activateStudent();

      expect(asSync(loadDiagnosticResult())).toBeNull();
    });

    it("round-trips a diagnostic result for the active student", () => {
      const studentId = activateStudent("local-a");
      const result = makeDiagnostic();

      const saveResult = asSync(saveDiagnosticResult(result));
      const stored = JSON.parse(localStorageMock.getItem(DIAGNOSTIC_STORAGE_KEY) ?? "{}");

      expect(saveResult.ok).toBe(true);
      expect(stored.activeStudentId).toBe(studentId);
      expect(stored.students[studentId]).toEqual(result);
      expect(asSync(loadDiagnosticResult())).toEqual(result);
    });

    it("returns only the active student's diagnostic from the central map", () => {
      activateStudent("local-a");
      const activeResult = makeDiagnostic({ completedAt: "2025-06-03T10:00:00.000Z" });
      const otherResult = makeDiagnostic({ completedAt: "2025-06-04T10:00:00.000Z" });
      localStorageMock.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify({
          students: { "local-a": activeResult, "local-b": otherResult },
          activeStudentId: "local-a",
        })
      );

      expect(asSync(loadDiagnosticResult())).toEqual(activeResult);
    });

    it("returns null for corrupt JSON or non-map storage", () => {
      activateStudent();
      localStorageMock.setItem(DIAGNOSTIC_STORAGE_KEY, "not-json {{{{");
      expect(asSync(loadDiagnosticResult())).toBeNull();

      localStorageMock.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify({ completedAt: "2025-06-03" }));
      expect(asSync(loadDiagnosticResult())).toBeNull();
    });
  });

  describe("saveDiagnosticResult", () => {
    it("returns blocked result and writes nothing without an active profile", () => {
      const result = asSync(saveDiagnosticResult(makeDiagnostic()));

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("missing-active-profile");
      expect(localStorageMock.getItem(DIAGNOSTIC_STORAGE_KEY)).toBeNull();
    });

    it("does not throw when localStorage is unavailable", () => {
      activateStudent();
      vi.spyOn(localStorageMock, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => asSync(saveDiagnosticResult(makeDiagnostic()))).not.toThrow();
    });
  });

  describe("clearDiagnosticResult", () => {
    it("removes only the active student's diagnostic", () => {
      activateStudent("local-a");
      localStorageMock.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify({
          students: {
            "local-a": makeDiagnostic({ completedAt: "2025-06-03T10:00:00.000Z" }),
            "local-b": makeDiagnostic({ completedAt: "2025-06-04T10:00:00.000Z" }),
          },
          activeStudentId: "local-a",
        })
      );

      clearDiagnosticResult();
      const stored = JSON.parse(localStorageMock.getItem(DIAGNOSTIC_STORAGE_KEY) ?? "{}");

      expect(stored.students["local-a"]).toBeUndefined();
      expect(stored.students["local-b"]).toEqual(makeDiagnostic({ completedAt: "2025-06-04T10:00:00.000Z" }));
      expect(asSync(loadDiagnosticResult())).toBeNull();
    });

    it("does not throw when nothing was stored", () => {
      expect(() => clearDiagnosticResult()).not.toThrow();
    });
  });
});

describe("study plan storage", () => {
  describe("STUDY_PLAN_STORAGE_KEY", () => {
    it("uses versioned key to avoid collisions", () => {
      expect(STUDY_PLAN_STORAGE_KEY).toBe("pre-utn.study-plan.v1");
    });
  });

  describe("loadStudyPlan", () => {
    it("returns null when no study plan stored", () => {
      activateStudent();

      expect(asSync(loadStudyPlan())).toBeNull();
    });

    it("round-trips a study plan for the active student", () => {
      const studentId = activateStudent("local-a");
      const plan = makePlan();

      const saveResult = asSync(saveStudyPlan(plan));
      const stored = JSON.parse(localStorageMock.getItem(STUDY_PLAN_STORAGE_KEY) ?? "{}");

      expect(saveResult.ok).toBe(true);
      expect(stored.activeStudentId).toBe(studentId);
      expect(stored.students[studentId]).toEqual(plan);
      expect(asSync(loadStudyPlan())).toEqual(plan);
    });

    it("returns only the active student's study plan from the central map", () => {
      activateStudent("local-a");
      const activePlan = makePlan({ createdAt: "2025-06-03T10:00:00.000Z" });
      const otherPlan = makePlan({ createdAt: "2025-06-04T10:00:00.000Z" });
      localStorageMock.setItem(
        STUDY_PLAN_STORAGE_KEY,
        JSON.stringify({
          students: { "local-a": activePlan, "local-b": otherPlan },
          activeStudentId: "local-a",
        })
      );

      expect(asSync(loadStudyPlan())).toEqual(activePlan);
    });

    it("returns null for corrupt JSON or non-map storage", () => {
      activateStudent();
      localStorageMock.setItem(STUDY_PLAN_STORAGE_KEY, "not-json {{{{");
      expect(asSync(loadStudyPlan())).toBeNull();

      localStorageMock.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify({ createdAt: "2025-06-03" }));
      expect(asSync(loadStudyPlan())).toBeNull();
    });
  });

  describe("saveStudyPlan", () => {
    it("returns blocked result and writes nothing without an active profile", () => {
      const result = asSync(saveStudyPlan(makePlan()));

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("missing-active-profile");
      expect(localStorageMock.getItem(STUDY_PLAN_STORAGE_KEY)).toBeNull();
    });

    it("does not throw when localStorage is unavailable", () => {
      activateStudent();
      vi.spyOn(localStorageMock, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() => asSync(saveStudyPlan(makePlan()))).not.toThrow();
    });
  });

  describe("clearStudyPlan", () => {
    it("removes only the active student's study plan", () => {
      activateStudent("local-a");
      const otherPlan = makePlan({ createdAt: "2025-06-04T10:00:00.000Z" });
      localStorageMock.setItem(
        STUDY_PLAN_STORAGE_KEY,
        JSON.stringify({
          students: { "local-a": makePlan(), "local-b": otherPlan },
          activeStudentId: "local-a",
        })
      );

      clearStudyPlan();
      const stored = JSON.parse(localStorageMock.getItem(STUDY_PLAN_STORAGE_KEY) ?? "{}");

      expect(stored.students["local-a"]).toBeUndefined();
      expect(stored.students["local-b"]).toEqual(otherPlan);
      expect(asSync(loadStudyPlan())).toBeNull();
    });

    it("does not affect the stored diagnostic", () => {
      activateStudent("local-a");
      const diag = makeDiagnostic({ completedAt: "2025-06-03T10:00:00.000Z" });
      asSync(saveDiagnosticResult(diag));
      asSync(saveStudyPlan(makePlan()));

      clearStudyPlan();

      expect(loadDiagnosticResult()).toEqual(diag);
    });
  });
});
