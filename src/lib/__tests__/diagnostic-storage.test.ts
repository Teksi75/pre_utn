import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveDiagnosticResult,
  loadDiagnosticResult,
  clearDiagnosticResult,
  DIAGNOSTIC_STORAGE_KEY,
} from "../diagnostic-storage";
import type { DiagnosticResult } from "@/domain/diagnostic";

// Mock localStorage (vitest runs in node environment)
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

describe("diagnostic-storage", () => {
  describe("DIAGNOSTIC_STORAGE_KEY", () => {
    it("uses versioned key to avoid collisions", () => {
      expect(DIAGNOSTIC_STORAGE_KEY).toBe("pre-utn.diagnostic.v1");
    });
  });

  describe("loadDiagnosticResult", () => {
    it("returns null when no diagnostic stored", () => {
      expect(loadDiagnosticResult()).toBeNull();
    });

    it("round-trips a diagnostic result", () => {
      const result: DiagnosticResult = {
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
      };

      saveDiagnosticResult(result);
      expect(loadDiagnosticResult()).toEqual(result);
    });

    it("returns null for corrupt JSON", () => {
      localStorageMock.setItem(DIAGNOSTIC_STORAGE_KEY, "not-json {{{{");
      expect(loadDiagnosticResult()).toBeNull();
    });

    it("returns null when stored data lacks required fields", () => {
      localStorageMock.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify({ completedAt: "2025-06-03" })
      );
      expect(loadDiagnosticResult()).toBeNull();
    });

    it("returns null when estimates is not an array", () => {
      localStorageMock.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify({
          completedAt: "2025-06-03",
          estimates: "not-an-array",
          suggestions: [],
          version: 1,
        })
      );
      expect(loadDiagnosticResult()).toBeNull();
    });

    it("returns null when suggestions is not an array", () => {
      localStorageMock.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify({
          completedAt: "2025-06-03",
          estimates: [],
          suggestions: null,
          version: 1,
        })
      );
      expect(loadDiagnosticResult()).toBeNull();
    });

    it("handles empty estimates and suggestions arrays", () => {
      const result: DiagnosticResult = {
        completedAt: "2025-06-03T10:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1,
      };
      saveDiagnosticResult(result);
      const loaded = loadDiagnosticResult();
      expect(loaded).toEqual(result);
      expect(loaded?.estimates).toEqual([]);
      expect(loaded?.suggestions).toEqual([]);
    });
  });

  describe("saveDiagnosticResult", () => {
    it("persists result to localStorage under versioned key", () => {
      const result: DiagnosticResult = {
        completedAt: "2025-06-03T10:00:00.000Z",
        estimates: [],
        suggestions: [],
        version: 1,
      };

      saveDiagnosticResult(result);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify(result)
      );
    });

    it("does not throw when localStorage is unavailable", () => {
      // Simulate quota exceeded / disabled storage
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });

      expect(() =>
        saveDiagnosticResult({
          completedAt: "2025-06-03",
          estimates: [],
          suggestions: [],
          version: 1,
        })
      ).not.toThrow();
    });
  });

  describe("clearDiagnosticResult", () => {
    it("removes stored diagnostic from localStorage", () => {
      localStorageMock.setItem(
        DIAGNOSTIC_STORAGE_KEY,
        JSON.stringify({
          completedAt: "2025-06-03",
          estimates: [],
          suggestions: [],
          version: 1,
        })
      );

      clearDiagnosticResult();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        DIAGNOSTIC_STORAGE_KEY
      );
      expect(loadDiagnosticResult()).toBeNull();
    });

    it("does not throw when nothing was stored", () => {
      expect(() => clearDiagnosticResult()).not.toThrow();
    });
  });
});
