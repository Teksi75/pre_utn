import { describe, test, expect } from "vitest";

import { buildStudentProfileFixture } from "../student-profile";

describe("buildStudentProfileFixture", () => {
  test("returns a ProfilesState with one profile and activeStudentId set", () => {
    const studentId = "local-test-1";
    const state = buildStudentProfileFixture({ studentId });

    expect(state.activeStudentId).toBe(studentId);
    expect(state.profiles).toHaveLength(1);

    const profile = state.profiles[0];
    expect(profile.studentId).toBe(studentId);
    expect(typeof profile.displayName).toBe("string");
    expect(profile.displayName.length).toBeGreaterThan(0);
    expect(typeof profile.createdAt).toBe("string");
    expect(typeof profile.lastActiveAt).toBe("string");
  });

  test("displayName override replaces the default", () => {
    const state = buildStudentProfileFixture({
      studentId: "local-test-1",
      displayName: "Local Canary",
    });

    expect(state.profiles[0].displayName).toBe("Local Canary");
  });

  test("result is JSON-serializable so addInitScript can seed localStorage", () => {
    const state = buildStudentProfileFixture({ studentId: "local-test-1" });

    expect(() => JSON.stringify(state)).not.toThrow();
    const round = JSON.parse(JSON.stringify(state)) as ReturnType<
      typeof buildStudentProfileFixture
    >;
    expect(round.activeStudentId).toBe("local-test-1");
    expect(round.profiles).toHaveLength(1);
  });
});
