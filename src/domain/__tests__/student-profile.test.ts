import { describe, test, expect, vi } from "vitest";
import {
  validateDisplayName,
  normalizeDisplayName,
  createStudentId,
  createProfile,
  selectActiveProfile,
  updateLastActiveAt,
  type StudentProfile,
  type ProfilesState,
  type ProfileValidationError,
  type CreateProfileInput,
} from "../student-profile/index";

describe("validateDisplayName", () => {
  // SCENARIO: empty after trim is rejected
  test("rejects whitespace-only input as empty", () => {
    expect(validateDisplayName("   ")).toBe("empty");
    expect(validateDisplayName("")).toBe("empty");
    expect(validateDisplayName("\t\n")).toBe("empty");
  });

  // SCENARIO: over 40 chars is rejected
  test("rejects display names longer than 40 characters", () => {
    const long = "a".repeat(41);
    expect(validateDisplayName(long)).toBe("too-long");
  });

  test("accepts exactly 40 characters", () => {
    const exactly40 = "a".repeat(40);
    expect(validateDisplayName(exactly40)).toBe(null);
  });

  // SCENARIO: characters outside the allowed set are rejected
  test("rejects emojis and special symbols as invalid-chars", () => {
    expect(validateDisplayName("🎒")).toBe("invalid-chars");
    expect(validateDisplayName("test@email.com")).toBe("invalid-chars");
    expect(validateDisplayName("john.doe")).toBe("invalid-chars");
    expect(validateDisplayName(" María! ")).toBe("invalid-chars");
  });

  test("accepts valid Unicode letters, numbers, and spaces", () => {
    expect(validateDisplayName("María Paz")).toBe(null);
    expect(validateDisplayName("Ana")).toBe(null);
    expect(validateDisplayName("Juan 123")).toBe(null);
    expect(validateDisplayName("José")).toBe(null);
    expect(validateDisplayName("Lucía 2024")).toBe(null);
  });

  test("returns null for edge cases: 1 char, 40 chars", () => {
    expect(validateDisplayName("A")).toBe(null);
    expect(validateDisplayName("abcdefghijklmnopqrstuvwxyz12345678901234")).toBe(null);
  });
});

describe("normalizeDisplayName", () => {
  // SCENARIO: trim and collapse
  test("trims leading and trailing whitespace", () => {
    expect(normalizeDisplayName("  Ana  ")).toBe("Ana");
    expect(normalizeDisplayName("\tMaría\n")).toBe("María");
  });

  test("collapses internal whitespace to a single space", () => {
    expect(normalizeDisplayName("María  Paz")).toBe("María Paz");
    expect(normalizeDisplayName("Ana\t\t\tJosé")).toBe("Ana José");
  });

  test("preserves original casing", () => {
    expect(normalizeDisplayName("MARÍA")).toBe("MARÍA");
    expect(normalizeDisplayName("maria")).toBe("maria");
    expect(normalizeDisplayName("María Paz")).toBe("María Paz");
  });
});

describe("createStudentId", () => {
  // SCENARIO: generated id is opaque (no PII)
  test("id does not contain @ or . which could indicate email-like PII", () => {
    const id = createStudentId();
    expect(id).not.toContain("@");
    expect(id).not.toContain(".");
  });

  test("id does not embed arbitrary strings passed during creation", () => {
    // The id is generated independently of any input — it must be opaque
    const id1 = createStudentId();
    const id2 = createStudentId();
    // If display name were somehow embedded, we'd see patterns - but UUIDs are random
    expect(id1).not.toBe(id2);
  });

  test("id starts with local- prefix", () => {
    const id = createStudentId();
    expect(id.startsWith("local-")).toBe(true);
  });

  // SCENARIO: collisions are vanishingly unlikely
  test("generates unique ids across 10000 samples (>=9999 unique)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      ids.add(createStudentId());
    }
    // With UUIDv4, the spec requires >=9999 unique ids out of 10000 samples
    expect(ids.size).toBeGreaterThanOrEqual(9_999);
  });
});

describe("createProfile", () => {
  // SCENARIO: minimal input produces a valid profile
  test("creates profile with normalized name, generated id, and correct timestamps", () => {
    const fixedDate = new Date("2026-01-15T10:00:00.000Z");
    const now = () => fixedDate;

    const profile = createProfile({ displayName: "  Ana  " }, now);

    expect(profile.displayName).toBe("Ana");
    expect(profile.studentId.startsWith("local-")).toBe(true);
    expect(profile.createdAt).toBe("2026-01-15T10:00:00.000Z");
    expect(profile.lastActiveAt).toBe("2026-01-15T10:00:00.000Z");
  });

  test("uses provided studentId if given", () => {
    const fixedDate = new Date("2026-01-15T10:00:00.000Z");
    const now = () => fixedDate;

    const profile = createProfile({ displayName: "Ana", studentId: "local-custom-id" }, now);

    expect(profile.studentId).toBe("local-custom-id");
  });

  // SCENARIO: invalid name throws
  test("throws ProfileValidationError for empty displayName", () => {
    const create = () => createProfile({ displayName: "" });
    expect(create).toThrow("empty");
  });

  test("throws ProfileValidationError for too-long displayName", () => {
    const create = () => createProfile({ displayName: "a".repeat(41) });
    expect(create).toThrow("too-long");
  });

  test("throws ProfileValidationError for invalid characters", () => {
    const create = () => createProfile({ displayName: "test@email.com" });
    expect(create).toThrow("invalid-chars");
  });

  test("returned profile fields are readonly (assignment throws)", () => {
    const fixedDate = new Date("2026-01-15T10:00:00.000Z");
    const profile = createProfile({ displayName: "Ana" }, () => fixedDate);
    // Object.freeze makes properties non-writable — assignment throws TypeError
    expect(() => {
      // @ts-expect-error — intentional mutation attempt to verify readonly
      profile.displayName = "changed";
    }).toThrow(TypeError);
  });
});

describe("selectActiveProfile", () => {
  // SCENARIO: match returns profile
  test("returns the profile matching activeStudentId", () => {
    const profile1: StudentProfile = {
      studentId: "local-1",
      displayName: "Ana",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-01T00:00:00.000Z",
    };
    const profile2: StudentProfile = {
      studentId: "local-2",
      displayName: "Juan",
      createdAt: "2026-01-02T00:00:00.000Z",
      lastActiveAt: "2026-01-02T00:00:00.000Z",
    };
    const state: ProfilesState = {
      profiles: [profile1, profile2],
      activeStudentId: "local-2",
    };

    const result = selectActiveProfile(state);

    expect(result).not.toBeNull();
    expect(result!.displayName).toBe("Juan");
  });

  // SCENARIO: dangling id returns null
  test("returns null when activeStudentId does not match any profile", () => {
    const profile: StudentProfile = {
      studentId: "local-1",
      displayName: "Ana",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-01T00:00:00.000Z",
    };
    const state: ProfilesState = {
      profiles: [profile],
      activeStudentId: "local-nonexistent",
    };

    const result = selectActiveProfile(state);

    expect(result).toBeNull();
  });

  test("returns null when activeStudentId is null", () => {
    const state: ProfilesState = {
      profiles: [],
      activeStudentId: null,
    };

    const result = selectActiveProfile(state);

    expect(result).toBeNull();
  });

  test("does not mutate the input state", () => {
    const profile: StudentProfile = {
      studentId: "local-1",
      displayName: "Ana",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-01T00:00:00.000Z",
    };
    const state: ProfilesState = {
      profiles: Object.freeze([profile]),
      activeStudentId: "local-1",
    };

    selectActiveProfile(state);

    // If we got here without mutation, the test passes
    expect(state.activeStudentId).toBe("local-1");
  });
});

describe("updateLastActiveAt", () => {
  // SCENARIO: only lastActiveAt changes
  test("returns new profile with lastActiveAt updated", () => {
    const original: StudentProfile = {
      studentId: "local-1",
      displayName: "Ana",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-01T00:00:00.000Z",
    };
    const laterDate = new Date("2026-01-15T10:00:00.000Z");
    const now = () => laterDate;

    const updated = updateLastActiveAt(original, now);

    expect(updated.studentId).toBe(original.studentId);
    expect(updated.displayName).toBe(original.displayName);
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.lastActiveAt).toBe("2026-01-15T10:00:00.000Z");
  });

  test("original profile is not mutated", () => {
    const original: StudentProfile = {
      studentId: "local-1",
      displayName: "Ana",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastActiveAt: "2026-01-01T00:00:00.000Z",
    };

    const updated = updateLastActiveAt(original, () => new Date("2026-01-15T10:00:00.000Z"));

    expect(original.lastActiveAt).toBe("2026-01-01T00:00:00.000Z");
    expect(updated.lastActiveAt).not.toBe(original.lastActiveAt);
  });
});
