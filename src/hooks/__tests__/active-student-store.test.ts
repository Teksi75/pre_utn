import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfilesState, StudentProfile } from "../../domain/student-profile";
import { saveProfiles } from "../../lib/student-profile-storage";

/** Assert that a MaybePromise result is sync (no adapter configured) and return it. */
function asSync<T>(value: T | Promise<T>): T {
  expect(value).not.toBeInstanceOf(Promise);
  return value as T;
}
import {
  createAndActivateActiveStudent,
  getActiveStudentSnapshot,
  refreshActiveStudent,
  subscribeActiveStudent,
  switchActiveStudent,
} from "../active-student-store";

const ana: StudentProfile = {
  studentId: "local-ana",
  displayName: "Ana",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastActiveAt: "2026-01-01T00:00:00.000Z",
};

const bruno: StudentProfile = {
  studentId: "local-bruno",
  displayName: "Bruno",
  createdAt: "2026-01-02T00:00:00.000Z",
  lastActiveAt: "2026-01-02T00:00:00.000Z",
};

function persistProfiles(state: ProfilesState): void {
  const result = asSync(saveProfiles(state));
  expect(result.ok).toBe(true);
  refreshActiveStudent();
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
  };
})();

describe("active student external store", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", localStorageMock);
    localStorage.clear();
    vi.clearAllMocks();
    refreshActiveStudent();
  });

  it("notifies multiple subscribers when a profile is created and activated", () => {
    const firstObserved: Array<string | null> = [];
    const secondObserved: Array<string | null> = [];

    const unsubscribeFirst = subscribeActiveStudent(() => {
      firstObserved.push(getActiveStudentSnapshot()?.displayName ?? null);
    });
    const unsubscribeSecond = subscribeActiveStudent(() => {
      secondObserved.push(getActiveStudentSnapshot()?.displayName ?? null);
    });

    const result = createAndActivateActiveStudent("Clara");

    expect(result.ok).toBe(true);
    expect(firstObserved).toEqual(["Clara"]);
    expect(secondObserved).toEqual(["Clara"]);
    expect(getActiveStudentSnapshot()?.displayName).toBe("Clara");

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it("notifies every subscriber when switching active profiles", () => {
    persistProfiles({ profiles: [ana, bruno], activeStudentId: ana.studentId });
    const observed: Array<string | null> = [];

    const unsubscribe = subscribeActiveStudent(() => {
      observed.push(getActiveStudentSnapshot()?.displayName ?? null);
    });

    const result = switchActiveStudent(bruno.studentId);

    expect(result.ok).toBe(true);
    expect(observed).toEqual(["Bruno"]);
    expect(getActiveStudentSnapshot()).toEqual(bruno);

    unsubscribe();
  });
});
