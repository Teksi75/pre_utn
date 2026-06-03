import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadProgress,
  saveProgress,
  resetProgress,
  addAttempt,
  PRACTICE_STORAGE_KEY,
} from "../practice-progress";
import type { PracticeProgress } from "../../domain/progress/index";

// Mock localStorage
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

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe("practice-progress localStorage adapter", () => {
  describe("PRACTICE_STORAGE_KEY", () => {
    it("uses versioned key to avoid collisions", () => {
      expect(PRACTICE_STORAGE_KEY).toBe("pre-utn.practice.v1");
    });
  });

  describe("loadProgress", () => {
    it("returns empty progress when nothing stored", () => {
      const result = loadProgress();
      expect(result.attempts).toEqual([]);
      expect(result.accuracyBySkill).toEqual({});
      expect(result.trendBySkill).toEqual({});
    });

    it("returns stored progress when valid JSON exists", () => {
      const stored: PracticeProgress = {
        attempts: [
          {
            exerciseId: "ex.u1.test",
            skillId: "mat.u1.reales_operaciones",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        accuracyBySkill: { "mat.u1.reales_operaciones": 1 },
        trendBySkill: { "mat.u1.reales_operaciones": "improving" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(stored));

      const result = loadProgress();
      expect(result.attempts).toHaveLength(1);
      expect(result.attempts[0].skillId).toBe("mat.u1.reales_operaciones");
      expect(result.accuracyBySkill["mat.u1.reales_operaciones"]).toBe(1);
    });

    it("returns empty progress when stored data is invalid JSON", () => {
      localStorageMock.setItem(PRACTICE_STORAGE_KEY, "not-valid-json {{{");

      const result = loadProgress();
      expect(result.attempts).toEqual([]);
      expect(result.accuracyBySkill).toEqual({});
    });

    it("returns empty progress when stored data lacks required fields", () => {
      localStorageMock.setItem(
        PRACTICE_STORAGE_KEY,
        JSON.stringify({ foo: "bar" })
      );

      const result = loadProgress();
      expect(result.attempts).toEqual([]);
    });

    it("returns defaults for new fields when loading old (pre-WU5) data", () => {
      // Simulate data saved before WU 5: only the three original fields
      const oldData = {
        attempts: [
          {
            exerciseId: "ex.u1.01",
            skillId: "mat.u1.reales_operaciones",
            correct: true,
            answeredAt: "2024-12-01T00:00:00.000Z",
          },
        ],
        accuracyBySkill: { "mat.u1.reales_operaciones": 1 },
        trendBySkill: { "mat.u1.reales_operaciones": "stable" },
      };
      localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));

      const result = loadProgress();

      // Original fields preserved
      expect(result.attempts).toHaveLength(1);
      expect(result.accuracyBySkill["mat.u1.reales_operaciones"]).toBe(1);
      expect(result.trendBySkill["mat.u1.reales_operaciones"]).toBe("stable");

      // New fields defaulted
      expect(result.lastPracticedBySkill).toEqual({});
      expect(result.diagnosticResult).toBeNull();
      expect(result.studyPlan).toBeNull();
    });

    it("preserves stored values for new fields when present", () => {
      const storedDiagnostic = {
        completedAt: "2025-06-01T10:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1 as const,
      };
      const full: PracticeProgress = {
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: { "mat.u1.reales_operaciones": "2025-06-01" },
        diagnosticResult: storedDiagnostic,
        studyPlan: null,
      };
      localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(full));

      const result = loadProgress();

      expect(result.lastPracticedBySkill["mat.u1.reales_operaciones"]).toBe(
        "2025-06-01"
      );
      expect(result.diagnosticResult).toEqual(storedDiagnostic);
      expect(result.studyPlan).toBeNull();
    });

    it("keeps diagnosticResult and studyPlan across round-trip even with no attempts", () => {
      const diag = {
        completedAt: "2025-06-01T10:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1 as const,
      };
      const initial: PracticeProgress = {
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: diag,
        studyPlan: null,
      };

      saveProgress(initial);
      const loaded = loadProgress();

      expect(loaded.diagnosticResult).toEqual(diag);
    });
  });

  describe("saveProgress", () => {
    it("persists progress to localStorage", () => {
      const progress: PracticeProgress = {
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };

      saveProgress(progress);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        PRACTICE_STORAGE_KEY,
        JSON.stringify(progress)
      );
    });

    it("round-trips through load correctly", () => {
      const progress: PracticeProgress = {
        attempts: [
          {
            exerciseId: "ex.u1.test",
            skillId: "mat.u1.intervalos",
            correct: false,
            errorTag: "u1_error_intervalo",
            answeredAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        accuracyBySkill: { "mat.u1.intervalos": 0 },
        trendBySkill: { "mat.u1.intervalos": "needs-review" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };

      saveProgress(progress);
      const loaded = loadProgress();

      expect(loaded.attempts).toHaveLength(1);
      expect(loaded.attempts[0].errorTag).toBe("u1_error_intervalo");
      expect(loaded.trendBySkill["mat.u1.intervalos"]).toBe("needs-review");
    });
  });

  describe("resetProgress", () => {
    it("removes stored data from localStorage", () => {
      localStorageMock.setItem(PRACTICE_STORAGE_KEY, '{"some":"data"}');

      resetProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        PRACTICE_STORAGE_KEY
      );
    });
  });

  describe("addAttempt", () => {
    it("appends attempt to existing progress and recomputes accuracy", () => {
      const existing: PracticeProgress = {
        attempts: [
          {
            exerciseId: "ex.u1.01",
            skillId: "mat.u1.reales_operaciones",
            correct: true,
            answeredAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        accuracyBySkill: { "mat.u1.reales_operaciones": 1 },
        trendBySkill: { "mat.u1.reales_operaciones": "stable" },
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      };
      saveProgress(existing);

      const updated = addAttempt({
        exerciseId: "ex.u1.02",
        skillId: "mat.u1.reales_operaciones",
        correct: false,
        errorTag: "u1_orden_operaciones",
        answeredAt: "2025-01-01T01:00:00.000Z",
      });

      expect(updated.attempts).toHaveLength(2);
      expect(updated.accuracyBySkill["mat.u1.reales_operaciones"]).toBe(0.5);
    });

    it("creates new skill entry when first attempt for that skill", () => {
      saveProgress({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      });

      const updated = addAttempt({
        exerciseId: "ex.u1.01",
        skillId: "mat.u1.intervalos",
        correct: true,
        answeredAt: "2025-01-01T00:00:00.000Z",
      });

      expect(updated.attempts).toHaveLength(1);
      expect(updated.accuracyBySkill["mat.u1.intervalos"]).toBe(1);
      expect(updated.trendBySkill["mat.u1.intervalos"]).toBe("stable");
    });

    it("persists the updated progress after adding attempt", () => {
      saveProgress({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      });

      addAttempt({
        exerciseId: "ex.u1.01",
        skillId: "mat.u1.reales_operaciones",
        correct: true,
        answeredAt: "2025-01-01T00:00:00.000Z",
      });

      const loaded = loadProgress();
      expect(loaded.attempts).toHaveLength(1);
    });

    it("stores difficulty in the persisted attempt", () => {
      saveProgress({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      });

      addAttempt({
        exerciseId: "ex.u1.01",
        skillId: "mat.u1.reales_operaciones",
        correct: true,
        answeredAt: "2025-01-01T00:00:00.000Z",
        difficulty: 4,
      });

      const loaded = loadProgress();
      expect(loaded.attempts[0].difficulty).toBe(4);
    });

    it("updates lastPracticedBySkill with the attempt's answeredAt", () => {
      saveProgress({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      });

      const updated = addAttempt({
        exerciseId: "ex.u1.01",
        skillId: "mat.u1.reales_operaciones",
        correct: true,
        answeredAt: "2025-03-15T08:00:00.000Z",
        difficulty: 2,
      });

      expect(updated.lastPracticedBySkill["mat.u1.reales_operaciones"]).toBe(
        "2025-03-15T08:00:00.000Z"
      );
    });

    it("overwrites lastPracticedBySkill on subsequent attempts for the same skill", () => {
      saveProgress({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: { "mat.u1.reales_operaciones": "2025-01-01T00:00:00.000Z" },
        diagnosticResult: null,
        studyPlan: null,
      });

      const updated = addAttempt({
        exerciseId: "ex.u1.02",
        skillId: "mat.u1.reales_operaciones",
        correct: false,
        answeredAt: "2025-02-01T00:00:00.000Z",
        difficulty: 3,
      });

      expect(updated.lastPracticedBySkill["mat.u1.reales_operaciones"]).toBe(
        "2025-02-01T00:00:00.000Z"
      );
    });

    it("preserves diagnosticResult and studyPlan when adding an attempt", () => {
      const diag = {
        completedAt: "2025-01-01T00:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1 as const,
      };
      saveProgress({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: diag,
        studyPlan: null,
      });

      const updated = addAttempt({
        exerciseId: "ex.u1.01",
        skillId: "mat.u1.reales_operaciones",
        correct: true,
        answeredAt: "2025-02-01T00:00:00.000Z",
        difficulty: 1,
      });

      expect(updated.diagnosticResult).toEqual(diag);
    });
  });
});
