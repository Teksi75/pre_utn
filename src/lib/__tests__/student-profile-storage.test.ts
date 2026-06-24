import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  loadProfiles,
  saveProfiles,
  getActiveStudentId,
  setActiveStudentId,
  createProfileAndActivate,
  recoverActiveProfile,
  PROFILES_STORAGE_KEY,
} from "../student-profile-storage";
import type { ProfilesState, StudentProfile } from "../../domain/student-profile/index";

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

describe("PROFILES_STORAGE_KEY", () => {
  test("uses versioned key pre-utn.profiles.v1", () => {
    expect(PROFILES_STORAGE_KEY).toBe("pre-utn.profiles.v1");
  });
});

describe("loadProfiles", () => {
  // SCENARIO: empty storage returns empty state
  test("returns empty state when no key exists", () => {
    const result = asSync(loadProfiles());
    expect(result.profiles).toEqual([]);
    expect(result.activeStudentId).toBeNull();
  });

  // SCENARIO: corrupt JSON is recovered
  test("returns empty state on corrupt JSON without throwing", () => {
    localStorageMock.setItem(PROFILES_STORAGE_KEY, "not valid json {{{");
    const result = asSync(loadProfiles());
    expect(result.profiles).toEqual([]);
    expect(result.activeStudentId).toBeNull();
  });

  test("returns empty state when stored data lacks profiles array", () => {
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify({ activeStudentId: "local-1" }));
    const result = asSync(loadProfiles());
    expect(result.profiles).toEqual([]);
  });

  test("restores activeStudentId when stored", () => {
    const state: ProfilesState = {
      profiles: [],
      activeStudentId: "local-abc",
    };
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));
    const result = asSync(loadProfiles());
    expect(result.activeStudentId).toBe("local-abc");
  });
});

describe("saveProfiles", () => {
  test("persists state to localStorage", () => {
    const state: ProfilesState = { profiles: [], activeStudentId: null };
    const result = asSync(saveProfiles(state));
    expect(result.ok).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      PROFILES_STORAGE_KEY,
      JSON.stringify(state)
    );
  });
});

describe("getActiveStudentId", () => {
  test("returns null when no key exists", () => {
    expect(getActiveStudentId()).toBeNull();
  });

  test("returns activeStudentId when stored and matches a profile", () => {
    const state: ProfilesState = {
      profiles: [
        {
          studentId: "local-xyz",
          displayName: "Test",
          createdAt: "2025-01-01T00:00:00.000Z",
          lastActiveAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      activeStudentId: "local-xyz",
    };
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));
    expect(getActiveStudentId()).toBe("local-xyz");
  });

  test("returns null when activeStudentId is dangling (not in profiles)", () => {
    const state: ProfilesState = { profiles: [], activeStudentId: "local-xyz" };
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));
    expect(getActiveStudentId()).toBeNull();
  });
});

describe("createProfileAndActivate", () => {
  // SCENARIO: createProfileAndActivate writes a new profile and sets it active
  test("creates profile and sets it active in empty state", () => {
    const result = createProfileAndActivate({ displayName: "  Ana  " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.profiles).toHaveLength(1);
      expect(result.state.profiles[0].displayName).toBe("Ana");
      expect(result.state.activeStudentId).toBe(result.state.profiles[0].studentId);
    }
  });

  test("adds to existing profiles rather than replacing them", () => {
    // First, create a profile
    createProfileAndActivate({ displayName: "Ana" });
    // Then create another
    const result = createProfileAndActivate({ displayName: "Juan" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.profiles).toHaveLength(2);
      expect(result.state.profiles.map((p) => p.displayName).sort()).toEqual(["Ana", "Juan"]);
      expect(result.state.activeStudentId).toBe(result.state.profiles[1].studentId);
    }
  });

  test("returns error result when displayName is invalid", () => {
    const result = createProfileAndActivate({ displayName: "" });
    expect(result.ok).toBe(false);
  });
});

describe("setActiveStudentId", () => {
  // SCENARIO: valid id is set
  test("sets the given id as activeStudentId and preserves profiles", () => {
    const state: ProfilesState = {
      profiles: [
        { studentId: "local-1", displayName: "Ana", createdAt: "2026-01-01T00:00:00.000Z", lastActiveAt: "2026-01-01T00:00:00.000Z" },
        { studentId: "local-2", displayName: "Juan", createdAt: "2026-01-02T00:00:00.000Z", lastActiveAt: "2026-01-02T00:00:00.000Z" },
      ],
      activeStudentId: "local-1",
    };
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));

    const result = setActiveStudentId("local-2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.activeStudentId).toBe("local-2");
      expect(result.state.profiles).toHaveLength(2);
    }
  });

  // SCENARIO: unknown id returns a blocked result
  test("returns error when id does not match any profile", () => {
    const state: ProfilesState = {
      profiles: [
        { studentId: "local-1", displayName: "Ana", createdAt: "2026-01-01T00:00:00.000Z", lastActiveAt: "2026-01-01T00:00:00.000Z" },
      ],
      activeStudentId: "local-1",
    };
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));

    const result = setActiveStudentId("local-nonexistent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("profile-not-found");
    }
  });
});

describe("recoverActiveProfile", () => {
  // SCENARIO: dangling id is reported as null
  test("returns null when activeStudentId has no matching profile", () => {
    const state: ProfilesState = {
      profiles: [
        { studentId: "local-1", displayName: "Ana", createdAt: "2026-01-01T00:00:00.000Z", lastActiveAt: "2026-01-01T00:00:00.000Z" },
      ],
      activeStudentId: "local-nonexistent",
    };
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));

    const result = recoverActiveProfile();
    expect(result).toBeNull();
  });

  test("returns null when no profiles exist", () => {
    const result = recoverActiveProfile();
    expect(result).toBeNull();
  });

  test("returns the active profile when it exists", () => {
    const profile: StudentProfile = {
      studentId: "local-1",
      displayName: "Ana",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-01T00:00:00.000Z",
    };
    const state: ProfilesState = { profiles: [profile], activeStudentId: "local-1" };
    localStorageMock.setItem(PROFILES_STORAGE_KEY, JSON.stringify(state));

    const result = recoverActiveProfile();
    expect(result).not.toBeNull();
    expect(result!.displayName).toBe("Ana");
  });
});
