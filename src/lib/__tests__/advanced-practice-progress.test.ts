/**
 * Advanced practice progress — localStorage adapter for challenge attempts.
 *
 * Storage shape:
 * {
 *   challengeAttempts: readonly ChallengeAttempt[];
 *   readinessBySkill: Record<SkillId, number | null>;
 * }
 *
 * Key: pre-utn.advanced-practice.v1 (separate from base pre-utn.practice.v1)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SkillId } from "../../domain/models/skill";
import {
  addChallengeAttempt,
  loadAdvancedProgress,
  computeAdvancedReadiness,
  ADVANCED_PRACTICE_STORAGE_KEY,
  type ChallengeAttempt,
  type AdvancedPracticeProgress,
} from "../advanced-practice-progress";
import { getActiveProfileId } from "../active-session";

vi.mock("../active-session", () => ({
  getActiveProfileId: vi.fn(() => null),
}));

// ---------------------------------------------------------------------------
// Mock localStorage
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
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

const makeAttempt = (overrides: Partial<ChallengeAttempt> = {}): ChallengeAttempt => ({
  studentId: "student-a",
  exerciseId: "ex.u1.complejos.desafio-1",
  skillId: "mat.u1.complejos",
  correct: true,
  answeredAt: "2025-01-01T00:00:00.000Z",
  timeMs: 30000,
  attemptIndex: 1,
  ...overrides,
});

const emptyAdvancedProgress = (): AdvancedPracticeProgress => ({
  challengeAttempts: [],
  readinessBySkill: {},
});

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.restoreAllMocks();
  // Default: active student is "student-a" so existing tests keep working
  vi.mocked(getActiveProfileId).mockReturnValue("student-a");
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("advanced-practice-progress localStorage adapter", () => {
  describe("ADVANCED_PRACTICE_STORAGE_KEY", () => {
    it("uses separate versioned key from base practice", () => {
      expect(ADVANCED_PRACTICE_STORAGE_KEY).toBe("pre-utn.advanced-practice.v1");
    });

    it("is different from base PRACTICE_STORAGE_KEY", () => {
      // This ensures challenge attempts never pollute base progress
      // Hardcoded to avoid module resolution issues in tests
      expect(ADVANCED_PRACTICE_STORAGE_KEY).not.toBe("pre-utn.practice.v1");
    });
  });

  describe("loadAdvancedProgress", () => {
    it("returns empty progress when nothing stored", () => {
      const result = loadAdvancedProgress();
      expect(result.challengeAttempts).toEqual([]);
      expect(result.readinessBySkill).toEqual({});
    });

    it("returns stored challenge attempts", () => {
      const stored: AdvancedPracticeProgress = {
        challengeAttempts: [
          makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true }),
          makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false }),
        ],
        readinessBySkill: { "mat.u1.complejos": 50 },
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(stored)
      );

      const result = loadAdvancedProgress();

      expect(result.challengeAttempts).toHaveLength(2);
      expect(result.challengeAttempts[0].exerciseId).toBe("ex.u1.complejos.desafio-1");
      expect(result.challengeAttempts[1].exerciseId).toBe("ex.u1.complejos.desafio-2");
    });

    it("returns stored challenge attempts with studentId", () => {
      const stored: AdvancedPracticeProgress = {
        challengeAttempts: [
          makeAttempt({ studentId: "student-a", exerciseId: "ex.u1.complejos.desafio-1", correct: true }),
          makeAttempt({ studentId: "student-a", exerciseId: "ex.u1.complejos.desafio-2", correct: false }),
        ],
        readinessBySkill: { "mat.u1.complejos": 50 },
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(stored)
      );

      const result = loadAdvancedProgress();

      expect(result.challengeAttempts).toHaveLength(2);
      expect(result.challengeAttempts[0].studentId).toBe("student-a");
    });

    it("tolerates corrupt JSON in localStorage", () => {
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, "not-valid-json {{{");

      const result = loadAdvancedProgress();

      expect(result.challengeAttempts).toEqual([]);
      expect(result.readinessBySkill).toEqual({});
    });

    it("tolerates empty string in localStorage", () => {
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, "");

      const result = loadAdvancedProgress();

      expect(result.challengeAttempts).toEqual([]);
      expect(result.readinessBySkill).toEqual({});
    });

    it("tolerates null values in readinessBySkill — recomputes from attempts", () => {
      const stored: AdvancedPracticeProgress = {
        challengeAttempts: [],
        readinessBySkill: { "mat.u1.complejos": null },
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(stored)
      );

      const result = loadAdvancedProgress();

      // With zero attempts, readiness is recomputed → no entry for that skill
      // (old behavior: blindly returned persisted null; new behavior: derive from attempts)
      expect(result.readinessBySkill["mat.u1.complejos"]).toBeUndefined();
    });
  });

  describe("addChallengeAttempt", () => {
    it("appends a challenge attempt to the store", () => {
      const before = loadAdvancedProgress();
      expect(before.challengeAttempts).toHaveLength(0);

      const result = addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.challengeAttempts).toHaveLength(1);
        expect(result.value.challengeAttempts[0].exerciseId).toBe("ex.u1.complejos.desafio-1");
        expect(result.value.challengeAttempts[0].correct).toBe(true);
      }

      // Verify persisted
      const persisted: AdvancedPracticeProgress = JSON.parse(
        localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.challengeAttempts).toHaveLength(1);
    });

    it("accumulates multiple attempts", () => {
      addChallengeAttempt(makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true }));
      addChallengeAttempt(makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false }));
      addChallengeAttempt(makeAttempt({ exerciseId: "ex.u1.complejos.desafio-3", correct: true }));

      const result = loadAdvancedProgress();
      expect(result.challengeAttempts).toHaveLength(3);
    });

    it("stores all attempt fields correctly", () => {
      const attempt: ChallengeAttempt = {
        studentId: "student-a",
        exerciseId: "ex.u1.complejos.desafio-1",
        skillId: "mat.u1.complejos",
        correct: true,
        answeredAt: "2025-06-16T10:30:00.000Z",
        timeMs: 45000,
        attemptIndex: 3,
      };

      addChallengeAttempt(attempt);

      const result = loadAdvancedProgress();
      const saved = result.challengeAttempts[0];
      expect(saved.exerciseId).toBe("ex.u1.complejos.desafio-1");
      expect(saved.skillId).toBe("mat.u1.complejos");
      expect(saved.correct).toBe(true);
      expect(saved.answeredAt).toBe("2025-06-16T10:30:00.000Z");
      expect(saved.timeMs).toBe(45000);
      expect(saved.attemptIndex).toBe(3);
    });

    it("recomputes readinessBySkill for the affected skill after each attempt", () => {
      // Two attempts: first incorrect, second correct → 1 correct out of 2 deduplicated = 50%
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: true })
      );

      const result = loadAdvancedProgress();
      expect(result.readinessBySkill["mat.u1.complejos"]).toBe(50);
    });

    it("does NOT read or write pre-utn.practice.v1", () => {
      addChallengeAttempt(makeAttempt({ correct: true }));

      expect(localStorageMock.getItem("pre-utn.practice.v1")).toBeNull();
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        "pre-utn.practice.v1",
        expect.any(String)
      );
    });
  });

  describe("computeAdvancedReadiness", () => {
    it("returns null when no attempts exist for the skill", () => {
      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBeNull();
    });

    it("returns null when skill has no attempts (different skill has attempts)", () => {
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.valor_absoluto", correct: true })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBeNull();
    });

    it("returns 100 when all deduplicated attempts are correct", () => {
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: true })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(100);
    });

    it("returns 0 when all deduplicated attempts are incorrect", () => {
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(0);
    });

    it("returns rounded accuracy percentage for mixed results", () => {
      // 1 correct out of 3 = 33.33...% → 33
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-2", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-3", correct: false })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(33);
    });

    it("deduplicates by last attempt per exerciseId", () => {
      // Two attempts on same exercise: first incorrect, second correct (later attemptIndex wins)
      // Only the last attempt counts → 1 correct / 1 total = 100%
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: false, attemptIndex: 1 })
      );
      addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-1", correct: true, attemptIndex: 2 })
      );

      const progress = loadAdvancedProgress();
      const result = computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts);
      expect(result).toBe(100);
    });

    it("handles multiple skills independently", () => {
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.complejos", exerciseId: "ex.u1.complejos.desafio-1", correct: true })
      );
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.complejos", exerciseId: "ex.u1.complejos.desafio-2", correct: false })
      );
      addChallengeAttempt(
        makeAttempt({ skillId: "mat.u1.valor_absoluto", exerciseId: "ex.u1.valor_absoluto.desafio-1", correct: true })
      );

      const progress = loadAdvancedProgress();
      expect(computeAdvancedReadiness("mat.u1.complejos", progress.challengeAttempts)).toBe(50);
      expect(computeAdvancedReadiness("mat.u1.valor_absoluto", progress.challengeAttempts)).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // Phase 1 RED: student identity tasks 1.1–1.7
  // -------------------------------------------------------------------------

  describe("student identity — addChallengeAttempt (tasks 1.1, 1.2)", () => {
    it("1.1 — persists with studentId === getActiveStudentId()", () => {
      vi.mocked(getActiveProfileId).mockReturnValue("student-42");

      const result = addChallengeAttempt(
        makeAttempt({ studentId: "student-42", exerciseId: "ex.u1.complejos.desafio-1" })
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.challengeAttempts[0].studentId).toBe("student-42");
      }

      // Verify persisted JSON contains studentId
      const persisted = JSON.parse(
        localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.challengeAttempts[0].studentId).toBe("student-42");
    });

    it("1.2 — no active profile → blocked; storage untouched", () => {
      vi.mocked(getActiveProfileId).mockReturnValue(null);
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify({ challengeAttempts: [{ studentId: "student-a", exerciseId: "ex-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 }], readinessBySkill: {} })
      );
      const beforeSnapshot = localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY);

      const result = addChallengeAttempt(
        makeAttempt({ exerciseId: "ex.u1.complejos.desafio-NEW" })
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("missing-active-profile");
      }

      // Storage must be unchanged
      expect(localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY)).toBe(beforeSnapshot);
    });
  });

  describe("student identity — loadAdvancedProgress (tasks 1.3, 1.4)", () => {
    it("1.3 — legacy anonymous attempts (no studentId) load without throwing", () => {
      // Seed raw JSON with anonymous attempts (no studentId field)
      const legacyPayload = {
        challengeAttempts: [
          { exerciseId: "ex-legacy-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1 },
          { exerciseId: "ex-legacy-2", skillId: "mat.u1.complejos", correct: false, answeredAt: "2025-01-02T00:00:00.000Z", timeMs: 6000, attemptIndex: 1 },
        ],
        readinessBySkill: { "mat.u1.complejos": 50 },
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(legacyPayload)
      );

      // Should not throw
      const result = loadAdvancedProgress();

      // Anonymous attempts are preserved in storage but excluded from active student reads
      // With student-a active and no studentId on records, result is filtered
      expect(result.challengeAttempts).toHaveLength(0);
    });

    it("1.3b — legacy anonymous attempts remain in persisted JSON", () => {
      const legacyPayload = {
        challengeAttempts: [
          { exerciseId: "ex-legacy-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 5000, attemptIndex: 1 },
        ],
        readinessBySkill: {},
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(legacyPayload)
      );

      // Load for active student — triggers filter
      loadAdvancedProgress();

      // Verify the stored JSON is NOT modified (preservation)
      const persisted = JSON.parse(
        localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.challengeAttempts).toHaveLength(1);
      expect(persisted.challengeAttempts[0].exerciseId).toBe("ex-legacy-1");
    });

    it("1.4 — filters to studentId === activeStudentId; excludes other-student and anonymous", () => {
      const mixedPayload = {
        challengeAttempts: [
          { studentId: "student-a", exerciseId: "ex-a-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
          { studentId: "student-b", exerciseId: "ex-b-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
          { exerciseId: "ex-legacy-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
        ],
        readinessBySkill: {},
      };
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify(mixedPayload)
      );
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");

      const result = loadAdvancedProgress();

      // Only student-a's attempt should be returned
      expect(result.challengeAttempts).toHaveLength(1);
      expect(result.challengeAttempts[0].exerciseId).toBe("ex-a-1");
      expect(result.challengeAttempts[0].studentId).toBe("student-a");
    });
  });

  describe("student identity — readiness isolation (task 1.5)", () => {
    it("1.5 — computeAdvancedReadiness ignores cross-student + anonymous; A active → readiness reflects A only", () => {
      const mixedAttempts: ChallengeAttempt[] = [
        makeAttempt({ studentId: "student-a", exerciseId: "ex-a-1", correct: true }),
        makeAttempt({ studentId: "student-a", exerciseId: "ex-a-2", correct: false }),
        makeAttempt({ studentId: "student-b", exerciseId: "ex-b-1", correct: true }),
        // Anonymous (no studentId) — cast to simulate legacy
        { exerciseId: "ex-legacy-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 } as unknown as ChallengeAttempt,
      ];

      // With only student-a's attempts: 1 correct / 2 total = 50%
      const result = computeAdvancedReadiness("mat.u1.complejos", mixedAttempts, "student-a");
      expect(result).toBe(50);
    });
  });

  describe("student identity — storage error (task 1.6)", () => {
    it("1.6 — setItem throws → blocked with storage-error; no partial write", () => {
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");
      // Seed one existing attempt so we can detect partial writes
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify({
          challengeAttempts: [makeAttempt({ exerciseId: "ex-existing" })],
          readinessBySkill: {},
        })
      );

      // Make setItem throw (quota exceeded)
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      const result = addChallengeAttempt(
        makeAttempt({ exerciseId: "ex-new-after-error" })
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("storage-error");
      }

      // Verify no partial write — the existing attempt should still be the only one
      const persisted = JSON.parse(
        localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY) ?? "{}"
      );
      expect(persisted.challengeAttempts).toHaveLength(1);
      expect(persisted.challengeAttempts[0].exerciseId).toBe("ex-existing");
    });
  });

  describe("student identity — idempotency (task 1.7)", () => {
    it("1.7a — re-loading after blocked write is no-op", () => {
      vi.mocked(getActiveProfileId).mockReturnValue(null);

      // Blocked write
      const writeResult = addChallengeAttempt(makeAttempt());
      expect(writeResult.ok).toBe(false);

      // Load should still return empty (nothing was written)
      const loadResult = loadAdvancedProgress();
      expect(loadResult.challengeAttempts).toHaveLength(0);
    });

    it("1.7b — after successful write, re-loading preserves stamped attempts verbatim", () => {
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");

      addChallengeAttempt(
        makeAttempt({ studentId: "student-a", exerciseId: "ex-1", correct: true })
      );

      // Reload
      const reloaded = loadAdvancedProgress();
      expect(reloaded.challengeAttempts).toHaveLength(1);
      expect(reloaded.challengeAttempts[0].studentId).toBe("student-a");
      expect(reloaded.challengeAttempts[0].exerciseId).toBe("ex-1");
    });
  });

  describe("student identity — no active profile returns empty progress (task 1.4b)", () => {
    it("1.4b — loadAdvancedProgress with no active profile returns empty", () => {
      vi.mocked(getActiveProfileId).mockReturnValue(null);
      localStorageMock.setItem(
        ADVANCED_PRACTICE_STORAGE_KEY,
        JSON.stringify({
          challengeAttempts: [
            { studentId: "student-a", exerciseId: "ex-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
          ],
          readinessBySkill: {},
        })
      );

      const result = loadAdvancedProgress();
      expect(result.challengeAttempts).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // CRITICAL: stale readinessBySkill must not leak across students
  // -------------------------------------------------------------------------

  describe("stale readinessBySkill isolation", () => {
    it("loadAdvancedProgress discards persisted readinessBySkill from other students", () => {
      // Storage has student-b's readiness for mat.u1.valor_absoluto
      // but student-a is active and has NO attempts for that skill
      const payload = {
        challengeAttempts: [
          { studentId: "student-b", exerciseId: "ex-b-1", skillId: "mat.u1.valor_absoluto", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
        ],
        readinessBySkill: { "mat.u1.valor_absoluto": 100 },
      };
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, JSON.stringify(payload));
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");

      const result = loadAdvancedProgress();

      // student-a has zero attempts → readinessBySkill must be empty, NOT { "mat.u1.valor_absoluto": 100 }
      expect(result.readinessBySkill).toEqual({});
    });

    it("loadAdvancedProgress discards persisted readinessBySkill from anonymous attempts", () => {
      // Storage has anonymous (legacy) readiness
      const payload = {
        challengeAttempts: [
          { exerciseId: "ex-legacy-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
        ],
        readinessBySkill: { "mat.u1.complejos": 100 },
      };
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, JSON.stringify(payload));
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");

      const result = loadAdvancedProgress();

      // student-a has no attempts; anonymous readiness must not leak
      expect(result.readinessBySkill).toEqual({});
    });

    it("loadAdvancedProgress recomputes readiness only from active student attempts", () => {
      // student-a has 1 correct; student-b has 1 incorrect
      // Persisted readinessBySkill reflects the mixed state (50)
      const payload = {
        challengeAttempts: [
          { studentId: "student-a", exerciseId: "ex-a-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
          { studentId: "student-b", exerciseId: "ex-b-1", skillId: "mat.u1.complejos", correct: false, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
        ],
        readinessBySkill: { "mat.u1.complejos": 50 },
      };
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, JSON.stringify(payload));
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");

      const result = loadAdvancedProgress();

      // student-a has 1 correct / 1 total = 100, not 50
      expect(result.readinessBySkill["mat.u1.complejos"]).toBe(100);
    });

    it("addChallengeAttempt does not preserve stale readiness from other skills/students", () => {
      // Storage has student-b's readiness for mat.u1.valor_absoluto
      const payload = {
        challengeAttempts: [
          { studentId: "student-b", exerciseId: "ex-b-1", skillId: "mat.u1.valor_absoluto", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
        ],
        readinessBySkill: { "mat.u1.valor_absoluto": 100 },
      };
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, JSON.stringify(payload));
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");

      // student-a adds a challenge attempt for a DIFFERENT skill
      const result = addChallengeAttempt(
        makeAttempt({ studentId: "student-a", exerciseId: "ex-a-1", skillId: "mat.u1.complejos", correct: true })
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        // readinessBySkill must NOT contain student-b's stale entry for mat.u1.valor_absoluto
        expect(result.value.readinessBySkill["mat.u1.valor_absoluto"]).toBeUndefined();
        // Only the newly computed skill should be present
        expect(result.value.readinessBySkill["mat.u1.complejos"]).toBe(100);
      }

      // Verify persisted storage also does not leak
      const persisted = JSON.parse(localStorageMock.getItem(ADVANCED_PRACTICE_STORAGE_KEY) ?? "{}");
      expect(persisted.readinessBySkill["mat.u1.valor_absoluto"]).toBeUndefined();
    });

    it("addChallengeAttempt recomputes all skills from active student, not just affected skill", () => {
      // student-a has 2 attempts for mat.u1.complejos (1 correct, 1 incorrect = 50%)
      // student-b has 1 attempt for mat.u1.valor_absoluto (correct = 100%)
      // Persisted readinessBySkill reflects mixed state
      const payload = {
        challengeAttempts: [
          { studentId: "student-a", exerciseId: "ex-a-1", skillId: "mat.u1.complejos", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
          { studentId: "student-a", exerciseId: "ex-a-2", skillId: "mat.u1.complejos", correct: false, answeredAt: "2025-01-02T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
          { studentId: "student-b", exerciseId: "ex-b-1", skillId: "mat.u1.valor_absoluto", correct: true, answeredAt: "2025-01-01T00:00:00.000Z", timeMs: 1000, attemptIndex: 1 },
        ],
        readinessBySkill: { "mat.u1.complejos": 50, "mat.u1.valor_absoluto": 100 },
      };
      localStorageMock.setItem(ADVANCED_PRACTICE_STORAGE_KEY, JSON.stringify(payload));
      vi.mocked(getActiveProfileId).mockReturnValue("student-a");

      // student-a adds another attempt for mat.u1.complejos
      const result = addChallengeAttempt(
        makeAttempt({ studentId: "student-a", exerciseId: "ex-a-3", skillId: "mat.u1.complejos", correct: true })
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        // student-a's readiness for mat.u1.complejos: 2 correct / 3 total = 67%
        expect(result.value.readinessBySkill["mat.u1.complejos"]).toBe(67);
        // student-b's stale readiness for mat.u1.valor_absoluto must NOT be present
        expect(result.value.readinessBySkill["mat.u1.valor_absoluto"]).toBeUndefined();
      }
    });
  });
});
