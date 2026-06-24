import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadProgress,
  addAttempt,
  resetProgress,
  PRACTICE_STORAGE_KEY,
} from "../practice-progress";
import type { PracticeProgress } from "../../domain/progress/index";

/** Assert that a MaybePromise result is sync (no adapter configured) and return it. */
function asSync<T>(value: T | Promise<T>): T {
  expect(value).not.toBeInstanceOf(Promise);
  return value as T;
}

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

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
  };
})();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PRACTICE_STORAGE_KEY", () => {
  it("uses versioned key pre-utn.practice.v1", () => {
    expect(PRACTICE_STORAGE_KEY).toBe("pre-utn.practice.v1");
  });
});

describe("loadProgress", () => {
  it("returns empty progress when nothing stored", () => {
    const result = asSync(loadProgress());
    expect(result.attempts).toEqual([]);
    expect(result.accuracyBySkill).toEqual({});
    expect(result.trendBySkill).toEqual({});
  });

  it("returns empty progress when stored data is invalid JSON", () => {
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, "not-valid-json {{{");
    const result = asSync(loadProgress());
    expect(result.attempts).toEqual([]);
  });

  it("returns defaults for new fields when loading old (pre-WU5) data", () => {
    // Legacy flat data (before student-scoped change)
    const oldData = {
      attempts: [
        {
          exerciseId: "ex.u1.01",
          skillId: "mat.u1.propiedades_operaciones_reales",
          correct: true,
          answeredAt: "2024-12-01T00:00:00.000Z",
        },
      ],
      accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 1 },
      trendBySkill: { "mat.u1.propiedades_operaciones_reales": "stable" },
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));

    const result = asSync(loadProgress());

    // Migration runs: data is re-keyed under Alumno local
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].timeMs).toBe(0);
    expect(result.attempts[0].attemptIndex).toBe(1);
    expect(result.lastPracticedBySkill).toEqual({});
    expect(result.diagnosticResult).toBeNull();
    expect(result.studyPlan).toBeNull();
  });

  it("normalizes legacy attempts missing timeMs and attemptIndex after migration", () => {
    const oldData = {
      attempts: [
        {
          exerciseId: "ex.u1.01",
          skillId: "mat.u1.propiedades_operaciones_reales",
          correct: true,
          answeredAt: "2024-12-01T00:00:00.000Z",
        },
        {
          exerciseId: "ex.u1.02",
          skillId: "mat.u1.propiedades_operaciones_reales",
          correct: false,
          answeredAt: "2024-12-01T01:00:00.000Z",
        },
      ],
      accuracyBySkill: {},
      trendBySkill: {},
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));

    const result = asSync(loadProgress());

    expect(result.attempts).toHaveLength(2);
    expect(result.attempts[0].timeMs).toBe(0);
    expect(result.attempts[0].attemptIndex).toBe(1);
    expect(result.attempts[1].timeMs).toBe(0);
    expect(result.attempts[1].attemptIndex).toBe(1);
  });
});

describe("resetProgress", () => {
  it("removes stored data from localStorage", () => {
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, '{"some":"data"}');
    resetProgress();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(PRACTICE_STORAGE_KEY);
  });
});

describe("addAttempt", () => {
  // SCENARIO: recording with an active profile
  it("appends attempt to active student's progress after migration", () => {
    // Setup: legacy data triggers migration
    const oldData = {
      attempts: [
        {
          exerciseId: "ex.u1.01",
          skillId: "mat.u1.propiedades_operaciones_reales",
          correct: true,
          answeredAt: "2025-01-01T00:00:00.000Z",
          timeMs: 5000,
          attemptIndex: 1,
        },
      ],
      accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 1 },
      trendBySkill: { "mat.u1.propiedades_operaciones_reales": "stable" },
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));

    // Migration runs on loadProgress
    loadProgress();

    // addAttempt with active profile
    const result = addAttempt({
      exerciseId: "ex.u1.02",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: false,
      errorTag: "u1_orden_operaciones",
      answeredAt: "2025-01-01T01:00:00.000Z",
      timeMs: 3000,
      attemptIndex: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.attempts).toHaveLength(2);
    }
  });

  it("creates new skill entry when first attempt for that skill after migration", () => {
    const oldData = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));
    loadProgress();

    const result = addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.intervalos",
      correct: true,
      answeredAt: "2025-01-01T00:00:00.000Z",
      timeMs: 5000,
      attemptIndex: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.attempts).toHaveLength(1);
    }
  });

  it("persists the updated progress after adding attempt", () => {
    const oldData = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));
    loadProgress();

    addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2025-01-01T00:00:00.000Z",
      timeMs: 0,
      attemptIndex: 1,
    });

    const loaded = asSync(loadProgress());
    expect(loaded.attempts).toHaveLength(1);
  });

  it("stores difficulty in the persisted attempt", () => {
    const oldData = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));
    asSync(loadProgress());

    addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2025-01-01T00:00:00.000Z",
      difficulty: 4,
      timeMs: 0,
      attemptIndex: 1,
    });

    const loaded = asSync(loadProgress());
    expect(loaded.attempts[0].difficulty).toBe(4);
  });

  it("updates lastPracticedBySkill with the attempt timestamp", () => {
    const oldData = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));
    asSync(loadProgress());

    const result = addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2025-03-15T08:00:00.000Z",
      difficulty: 2,
      timeMs: 0,
      attemptIndex: 1,
    });

    if (result.ok) {
      expect(result.value.lastPracticedBySkill["mat.u1.propiedades_operaciones_reales"]).toBe(
        "2025-03-15T08:00:00.000Z"
      );
    }
  });

  it("preserves diagnosticResult and studyPlan when adding attempt", () => {
    const diag = {
      completedAt: "2025-01-01T00:00:00.000Z",
      estimates: [],
      suggestions: [],
      version: 1 as const,
    };
    const oldData = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: diag,
      studyPlan: null,
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));
    loadProgress();

    const result = addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2025-02-01T00:00:00.000Z",
      difficulty: 1,
      timeMs: 0,
      attemptIndex: 1,
    });

    if (result.ok) {
      expect(result.value.diagnosticResult).toEqual(diag);
    }
  });

  it("persists timeMs and attemptIndex when present in addAttempt", () => {
    const oldData = {
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(oldData));
    loadProgress();

    const result = addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2025-02-01T00:00:00.000Z",
      timeMs: 45000,
      attemptIndex: 2,
    });

    if (result.ok) {
      expect(result.value.attempts).toHaveLength(1);
      expect(result.value.attempts[0].timeMs).toBe(45000);
      expect(result.value.attempts[0].attemptIndex).toBe(2);
    }
  });

  // SCENARIO: addAttempt without active profile writes nothing and signals blocked
  it("returns blocked result when no active profile exists", () => {
    // No data at all — no migration runs, no profiles created
    const result = addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2025-01-01T00:00:00.000Z",
      timeMs: 0,
      attemptIndex: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing-active-profile");
    }
  });

  it("does not persist attempt when no active profile", () => {
    addAttempt({
      exerciseId: "ex.u1.01",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2025-01-01T00:00:00.000Z",
      timeMs: 0,
      attemptIndex: 1,
    });

    // Nothing should be written to storage
    const raw = localStorageMock.getItem(PRACTICE_STORAGE_KEY);
    // If migration ran, there would be a students map. If not, still old shape.
    // Either way, no NEW attempt should appear without active profile
    const loaded = asSync(loadProgress());
    expect(loaded.attempts).toHaveLength(0);
  });
});
