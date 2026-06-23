/**
 * Active session boundary — tests for getActiveProfileId().
 *
 * Spec scenarios:
 * - active profile id is read through one boundary
 * - no active profile remains blocked (returns null)
 * - unsafe profile storage remains safe (corrupt/missing → null, never throws)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PROFILES_STORAGE_KEY } from "../student-profile-storage";

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
  vi.restoreAllMocks();
});

describe("getActiveProfileId", () => {
  it("returns stored studentId when active profile valid", async () => {
    localStorageMock.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        profiles: [
          {
            studentId: "local-student-a",
            displayName: "Ana",
            createdAt: "2025-01-01T00:00:00.000Z",
            lastActiveAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        activeStudentId: "local-student-a",
      })
    );

    const { getActiveProfileId } = await import("../active-session");
    expect(getActiveProfileId()).toBe("local-student-a");
  });

  it("returns null when storage missing or unreadable", async () => {
    // Nothing in localStorage
    const { getActiveProfileId } = await import("../active-session");
    expect(getActiveProfileId()).toBeNull();
  });

  it("returns null when storage is corrupt JSON", async () => {
    localStorageMock.setItem(PROFILES_STORAGE_KEY, "not-json {{{{");

    const { getActiveProfileId } = await import("../active-session");
    expect(getActiveProfileId()).toBeNull();
  });

  it("never throws even when localStorage throws", async () => {
    vi.spyOn(localStorageMock, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    const { getActiveProfileId } = await import("../active-session");
    expect(() => getActiveProfileId()).not.toThrow();
    expect(getActiveProfileId()).toBeNull();
  });

  it("returns null when activeStudentId is missing from stored state", async () => {
    localStorageMock.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        profiles: [],
      })
    );

    const { getActiveProfileId } = await import("../active-session");
    expect(getActiveProfileId()).toBeNull();
  });
});
