/**
 * Persistence port — asserts PersistenceAdapter contract shape.
 *
 * Spec: "Identity-bearing profile and progress persistence MUST be accessible
 * through a shared adapter contract so local storage and Supabase-backed
 * persistence provide equivalent behavior to callers."
 */

import { describe, it, expect } from "vitest";
import {
  isPersistenceAdapter,
  type PersistenceAdapter,
  type ProfileSaveResult,
  type PersistenceResult,
} from "../persistence/port";
import type { ProfilesState } from "../../domain/student-profile/index";

describe("PersistenceAdapter contract", () => {
  it("isPersistenceAdapter returns true for a conforming adapter", () => {
    const adapter: PersistenceAdapter = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: (state) => ({ ok: true, state }),
      loadProgress: () => ({
        attempts: [],
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      }),
      saveProgress: () => ({ ok: true, value: undefined }),
      loadDiagnosticResult: () => null,
      saveDiagnosticResult: () => ({ ok: true, value: undefined }),
      loadStudyPlan: () => null,
      saveStudyPlan: () => ({ ok: true, value: undefined }),
    };

    expect(isPersistenceAdapter(adapter)).toBe(true);
  });

  it("isPersistenceAdapter returns false for a non-conforming object", () => {
    expect(isPersistenceAdapter({})).toBe(false);
    expect(isPersistenceAdapter(null)).toBe(false);
    expect(isPersistenceAdapter(undefined)).toBe(false);
    expect(isPersistenceAdapter("string")).toBe(false);
  });

  it("isPersistenceAdapter returns false when methods are missing", () => {
    const partial = {
      loadProfiles: () => ({ profiles: [], activeStudentId: null }),
      saveProfiles: () => ({ ok: true, state: { profiles: [], activeStudentId: null } }),
      // Missing loadProgress, saveProgress, etc.
    };
    expect(isPersistenceAdapter(partial)).toBe(false);
  });

  it("PersistenceResult ok variant carries value", () => {
    const ok: PersistenceResult<string> = { ok: true, value: "test" };
    expect(ok.ok).toBe(true);
    expect(ok.value).toBe("test");
  });

  it("PersistenceResult blocked variant carries reason", () => {
    const blocked: PersistenceResult<void> = {
      ok: false,
      reason: "missing-active-profile",
    };
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("missing-active-profile");
  });

  it("ProfileSaveResult ok variant carries state", () => {
    const state: ProfilesState = { profiles: [], activeStudentId: null };
    const ok: ProfileSaveResult = { ok: true, state };
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.state).toEqual(state);
    }
  });

  it("ProfileSaveResult blocked variant carries reason", () => {
    const blocked: ProfileSaveResult = {
      ok: false,
      reason: "storage-unavailable",
    };
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("storage-unavailable");
  });
});
