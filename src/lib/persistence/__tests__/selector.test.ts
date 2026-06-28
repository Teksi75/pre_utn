/**
 * Tests for src/lib/persistence/selector.ts — withLocalFallback wrapper.
 *
 * The wrapper's job is to keep the student workflow usable when the remote
 * adapter is unavailable OR when the remote returns "no data" while local
 * HAS data. The latter is the post-auth-sync scenario: a student links a
 * Supabase account to a fresh, empty remote profile, but their local
 * progress is real and must keep rendering.
 *
 * Spec:
 * - REQ-NEW-2c — "Remote empty + local progress MUST fall back to local."
 * - supabase-adapter-v0 §"Remote empty falls back to local progress"
 * - "An empty or missing remote snapshot MUST be treated as recoverable,
 *   not as canonical deletion, when local progress exists."
 *
 * Behavior matrix for `loadProgress(studentId)`:
 *
 *   remote result       | local result       | wrapper returns | fallback event
 *   --------------------|--------------------|-----------------|---------------
 *   has real progress   | any                | remote          | no
 *   EMPTY_PROGRESS      | has data           | local           | YES (method)
 *   EMPTY_PROGRESS      | empty              | EMPTY_PROGRESS  | no
 *   throws/rejects      | any                | local           | YES (thrown)
 *   remote-unavailable  | any                | local           | YES (unavailable)
 *
 * Behavior matrix for `loadDiagnosticResult(studentId)` and
 * `loadStudyPlan(studentId)` (post PR1.10 — partial-import blocker fix):
 *
 *   remote result       | local result       | wrapper returns | fallback event
 *   --------------------|--------------------|-----------------|---------------
 *   has real data       | any                | remote          | no
 *   null (not prepared) | has data           | local           | YES (method)
 *   null (not prepared) | null               | null            | no
 *   throws/rejects      | any                | local           | YES (thrown)
 *   remote-unavailable  | any                | local           | YES (unavailable)
 *
 * The diagnostic/study-plan branch is the structural twin of the
 * loadProgress branch — when remote returns its empty sentinel (`null`
 * for nullable reads, `EMPTY_PROGRESS` for progress) AND local has
 * real data, the wrapper MUST preserve the local slice instead of
 * treating remote-null as canonical. This applies equally to:
 *   - the post-auth-sync scenario (linked account, fresh empty remote)
 *   - the partial-import local-fallback scenario (sync status
 *     "local-fallback" because import-partial failed, but local data
 *     must keep rendering — see PR1.10 blocker)
 *
 * Note: `{ok:false}` semantics apply only to WRITE methods (`saveProgress`,
 * `saveDiagnosticResult`, `saveStudyPlan`, `saveProfiles`) which return
 * `PersistenceResult<T>` / `ProfileSaveResult`. The nullable READ methods
 * (`loadProgress`, `loadDiagnosticResult`, `loadStudyPlan`) treat their
 * domain empty value as recoverable — never as canonical deletion when
 * local has data.
 */

import { describe, it, expect, vi } from "vitest";
import type { PersistenceAdapter } from "../port";
import type { PracticeProgress } from "../../../domain/progress/index";
import type { DiagnosticResult, StudyPlan } from "../../../domain/diagnostic";
import { createRemoteUnavailableSentinel } from "../selector";

const EMPTY_PROGRESS: PracticeProgress = {
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
};

const LOCAL_PROGRESS: PracticeProgress = {
  attempts: [
    {
      exerciseId: "ex.u1.reales.1",
      skillId: "mat.u1.propiedades_operaciones_reales",
      correct: true,
      answeredAt: "2026-06-26T12:00:00.000Z",
      timeMs: 1200,
      attemptIndex: 1,
    },
  ],
  accuracyBySkill: { "mat.u1.propiedades_operaciones_reales": 1 },
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
};

function makeRemoteAdapter(
  loadProgress: PersistenceAdapter["loadProgress"],
  loadDiagnosticResult: PersistenceAdapter["loadDiagnosticResult"] = vi.fn(
    async () => null
  ),
  loadStudyPlan: PersistenceAdapter["loadStudyPlan"] = vi.fn(async () => null)
): PersistenceAdapter {
  return {
    loadProfiles: vi.fn(async () => ({ profiles: [], activeStudentId: null })),
    saveProfiles: vi.fn(async () => ({ ok: true, state: { profiles: [], activeStudentId: null } } as never)),
    loadProgress,
    saveProgress: vi.fn(async () => ({ ok: true, value: undefined } as never)),
    loadDiagnosticResult,
    saveDiagnosticResult: vi.fn(async () => ({ ok: true, value: undefined } as never)),
    loadStudyPlan,
    saveStudyPlan: vi.fn(async () => ({ ok: true, value: undefined } as never)),
  };
}

function makeLocalAdapter(
  loadProgress: PersistenceAdapter["loadProgress"],
  loadDiagnosticResult: PersistenceAdapter["loadDiagnosticResult"] = vi.fn(
    () => null
  ),
  loadStudyPlan: PersistenceAdapter["loadStudyPlan"] = vi.fn(() => null)
): PersistenceAdapter {
  return {
    loadProfiles: vi.fn(() => ({ profiles: [], activeStudentId: null })),
    saveProfiles: vi.fn(() => ({ ok: true, state: { profiles: [], activeStudentId: null } } as never)),
    loadProgress,
    saveProgress: vi.fn(() => ({ ok: true, value: undefined } as never)),
    loadDiagnosticResult,
    saveDiagnosticResult: vi.fn(() => ({ ok: true, value: undefined } as never)),
    loadStudyPlan,
    saveStudyPlan: vi.fn(() => ({ ok: true, value: undefined } as never)),
  };
}

describe("withLocalFallback — loadProgress remote-empty + local-has branch", () => {
  it("remote returns EMPTY_PROGRESS + local has data → returns LOCAL + emits fallback event", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(async () => EMPTY_PROGRESS);
    const local = makeLocalAdapter(() => LOCAL_PROGRESS);

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadProgress("student-1");

    expect(result).toEqual(LOCAL_PROGRESS);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("loadProgress", expect.anything());
  });

  it("remote returns EMPTY_PROGRESS + local is also empty → returns EMPTY_PROGRESS (no fallback event)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(async () => EMPTY_PROGRESS);
    const local = makeLocalAdapter(() => EMPTY_PROGRESS);

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadProgress("student-1");

    expect(result).toEqual(EMPTY_PROGRESS);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote returns REAL progress + local has different data → returns REMOTE (remote wins)", async () => {
    const onFallback = vi.fn();
    const remoteProgress: PracticeProgress = {
      attempts: [
        {
          exerciseId: "ex.u1.reales.2",
          skillId: "mat.u1.propiedades_operaciones_reales",
          correct: true,
          answeredAt: "2026-06-26T13:00:00.000Z",
          timeMs: 1500,
          attemptIndex: 1,
        },
      ],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    };
    const remote = makeRemoteAdapter(async () => remoteProgress);
    const local = makeLocalAdapter(() => LOCAL_PROGRESS);

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadProgress("student-1");

    expect(result).toEqual(remoteProgress);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote throws → returns LOCAL + emits fallback event (regression)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(async () => {
      throw new Error("network-down");
    });
    const local = makeLocalAdapter(() => LOCAL_PROGRESS);

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadProgress("student-1");

    expect(result).toEqual(LOCAL_PROGRESS);
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it("remote returns __remoteUnavailable sentinel + local is also empty → returns LOCAL empty (NOT the sentinel)", async () => {
    // Regression: prior semantics for the remote-unavailable sentinel must be
    // preserved BEFORE applying the specialized remote-empty/local-has branch.
    // Otherwise the sentinel would leak downstream and be treated as data.
    const onFallback = vi.fn();
    const sentinel = createRemoteUnavailableSentinel<PracticeProgress>();
    const remote = makeRemoteAdapter(async () => sentinel);
    const local = makeLocalAdapter(() => EMPTY_PROGRESS);

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadProgress("student-1");

    // Returns the LOCAL empty progress (not the sentinel — sentinel must
    // never leak past the fallback wrapper for read methods).
    expect(result).toEqual(EMPTY_PROGRESS);
    expect(result).not.toBe(sentinel);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("loadProgress", sentinel);
  });

  it("remote returns __remoteUnavailable sentinel + local has data → returns LOCAL + emits fallback event", async () => {
    const onFallback = vi.fn();
    const sentinel = createRemoteUnavailableSentinel<PracticeProgress>();
    const remote = makeRemoteAdapter(async () => sentinel);
    const local = makeLocalAdapter(() => LOCAL_PROGRESS);

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadProgress("student-1");

    expect(result).toEqual(LOCAL_PROGRESS);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("loadProgress", sentinel);
  });

  it("write methods: remote returns {ok:false} → falls back to local (regression for write semantics)", async () => {
    // {ok:false} only applies to write methods that return PersistenceResult<T>.
    // This test lives here to lock in the regression: the standard attempt()
    // path still handles resolved write failures.
    const onFallback = vi.fn();
    const remote: PersistenceAdapter = {
      loadProfiles: vi.fn(async () => ({ profiles: [], activeStudentId: null })),
      saveProfiles: vi.fn(async () => ({ ok: true, state: { profiles: [], activeStudentId: null } } as never)),
      loadProgress: vi.fn(async () => EMPTY_PROGRESS),
      saveProgress: vi.fn(async () => ({ ok: false, reason: "missing-active-profile" } as never)),
      loadDiagnosticResult: vi.fn(async () => null),
      saveDiagnosticResult: vi.fn(async () => ({ ok: true, value: undefined } as never)),
      loadStudyPlan: vi.fn(async () => null),
      saveStudyPlan: vi.fn(async () => ({ ok: true, value: undefined } as never)),
    };
    const local: PersistenceAdapter = {
      loadProfiles: vi.fn(() => ({ profiles: [], activeStudentId: null })),
      saveProfiles: vi.fn(() => ({ ok: true, state: { profiles: [], activeStudentId: null } } as never)),
      loadProgress: vi.fn(() => EMPTY_PROGRESS),
      saveProgress: vi.fn(() => ({ ok: true, value: undefined } as never)),
      loadDiagnosticResult: vi.fn(() => null),
      saveDiagnosticResult: vi.fn(() => ({ ok: true, value: undefined } as never)),
      loadStudyPlan: vi.fn(() => null),
      saveStudyPlan: vi.fn(() => ({ ok: true, value: undefined } as never)),
    };

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.saveProgress("student-1", EMPTY_PROGRESS);

    expect(result).toEqual({ ok: true, value: undefined });
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it("sync remote returning EMPTY_PROGRESS + sync local with data → returns LOCAL + emits fallback event", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(() => EMPTY_PROGRESS);
    const local = makeLocalAdapter(() => LOCAL_PROGRESS);

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadProgress("student-1");

    expect(result).toEqual(LOCAL_PROGRESS);
    expect(onFallback).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Shared fixtures for loadDiagnosticResult / loadStudyPlan tests
// ---------------------------------------------------------------------------

const LOCAL_DIAGNOSTIC: DiagnosticResult = {
  completedAt: "2026-06-26T11:00:00.000Z",
  version: 1,
  estimates: [
    {
      skillId: "mat.u1.propiedades_operaciones_reales",
      accuracy: 0.75,
      attempts: 6,
      provisional: true,
      errorTags: [],
    },
  ],
  suggestions: [
    {
      skillId: "mat.u1.propiedades_operaciones_reales",
      accuracy: 0.75,
      errorTags: [],
    },
  ],
};

const REMOTE_DIAGNOSTIC: DiagnosticResult = {
  completedAt: "2026-06-27T09:00:00.000Z",
  version: 1,
  estimates: [
    {
      skillId: "mat.u2.ecuaciones_lineales",
      accuracy: 0.5,
      attempts: 2,
      provisional: true,
      errorTags: ["signo"],
    },
  ],
  suggestions: [
    {
      skillId: "mat.u2.ecuaciones_lineales",
      accuracy: 0.5,
      errorTags: ["signo"],
    },
  ],
};

const LOCAL_STUDY_PLAN: StudyPlan = {
  createdAt: "2026-06-26T11:05:00.000Z",
  diagnosticResult: LOCAL_DIAGNOSTIC,
  skillPriorities: [
    {
      skillId: "mat.u1.propiedades_operaciones_reales",
      priority: 1,
      reason: "diagnostic-weak",
      weakConcepts: ["asociatividad"],
    },
  ],
};

const REMOTE_STUDY_PLAN: StudyPlan = {
  createdAt: "2026-06-27T09:05:00.000Z",
  diagnosticResult: REMOTE_DIAGNOSTIC,
  skillPriorities: [
    {
      skillId: "mat.u2.ecuaciones_lineales",
      priority: 1,
      reason: "diagnostic-weak",
      weakConcepts: ["signo"],
    },
  ],
};

// ---------------------------------------------------------------------------
// loadDiagnosticResult — remote-null + local-has fallback (PR1.10 BLOCKER FIX)
//
// Rationale: a partial-import scenario can leave post-auth-sync status at
// "local-fallback". Even when the adapter selector keeps going remote, the
// wrapper MUST recover the local diagnostic when remote returns null (i.e.
// "no prepared remote row"). The same invariant the loadProgress branch
// already enforces — applied here to nullable READ methods.
// ---------------------------------------------------------------------------

describe("withLocalFallback — loadDiagnosticResult remote-null + local-has branch", () => {
  it("remote returns null + local has diagnostic → returns LOCAL + emits fallback event (BLOCKER FIX)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => LOCAL_DIAGNOSTIC
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadDiagnosticResult("student-1");

    expect(result).toEqual(LOCAL_DIAGNOSTIC);
    expect(onFallback).toHaveBeenCalledTimes(1);
    // The fallback signal value is the remote null itself — the trigger
    // for the recovery branch. `expect.anything()` does NOT match null,
    // so we assert on the literal value to lock in the contract.
    expect(onFallback).toHaveBeenCalledWith("loadDiagnosticResult", null);
  });

  it("remote returns null + local is also null → returns null (no fallback event)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadDiagnosticResult("student-1");

    expect(result).toBeNull();
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote returns REAL diagnostic + local is null → returns REMOTE (remote wins, no fallback)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => REMOTE_DIAGNOSTIC
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadDiagnosticResult("student-1");

    expect(result).toEqual(REMOTE_DIAGNOSTIC);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote returns REAL diagnostic + local has DIFFERENT diagnostic → returns REMOTE (remote wins, no fallback)", async () => {
    // Coverage complement of the BLOCKER FIX case: when BOTH adapters have
    // data and they DISAGREE, the remote is canonical. The wrapper must NOT
    // trigger the remote-null + local-has recovery branch (remote is not
    // null) and must NOT emit a fallback event.
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => REMOTE_DIAGNOSTIC
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => LOCAL_DIAGNOSTIC
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadDiagnosticResult("student-1");

    expect(result).toEqual(REMOTE_DIAGNOSTIC);
    expect(result).not.toEqual(LOCAL_DIAGNOSTIC);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote throws → returns LOCAL + emits fallback event (regression)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => {
        throw new Error("network-down");
      }
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => LOCAL_DIAGNOSTIC
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadDiagnosticResult("student-1");

    expect(result).toEqual(LOCAL_DIAGNOSTIC);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("loadDiagnosticResult", expect.any(Error));
  });

  it("remote returns __remoteUnavailable sentinel + local has data → returns LOCAL + emits fallback event", async () => {
    const onFallback = vi.fn();
    const sentinel = createRemoteUnavailableSentinel<DiagnosticResult | null>();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => sentinel
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => LOCAL_DIAGNOSTIC
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadDiagnosticResult("student-1");

    expect(result).toEqual(LOCAL_DIAGNOSTIC);
    expect(result).not.toBe(sentinel);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("loadDiagnosticResult", sentinel);
  });
});

// ---------------------------------------------------------------------------
// loadStudyPlan — remote-null + local-has fallback (PR1.10 BLOCKER FIX)
//
// Same invariant as loadDiagnosticResult. The study plan is a derived
// snapshot of the diagnostic, so when remote has no prepared row but
// local has a real plan, the wrapper MUST preserve the local slice.
// ---------------------------------------------------------------------------

describe("withLocalFallback — loadStudyPlan remote-null + local-has branch", () => {
  it("remote returns null + local has studyPlan → returns LOCAL + emits fallback event (BLOCKER FIX)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null,
      async () => null
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null,
      () => LOCAL_STUDY_PLAN
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadStudyPlan("student-1");

    expect(result).toEqual(LOCAL_STUDY_PLAN);
    expect(onFallback).toHaveBeenCalledTimes(1);
    // The fallback signal value is the remote null itself — the trigger
    // for the recovery branch. `expect.anything()` does NOT match null,
    // so we assert on the literal value to lock in the contract.
    expect(onFallback).toHaveBeenCalledWith("loadStudyPlan", null);
  });

  it("remote returns null + local is also null → returns null (no fallback event)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null,
      async () => null
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null,
      () => null
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadStudyPlan("student-1");

    expect(result).toBeNull();
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote returns REAL studyPlan + local is null → returns REMOTE (remote wins, no fallback)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null,
      async () => REMOTE_STUDY_PLAN
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null,
      () => null
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadStudyPlan("student-1");

    expect(result).toEqual(REMOTE_STUDY_PLAN);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote returns REAL studyPlan + local has DIFFERENT studyPlan → returns REMOTE (remote wins, no fallback)", async () => {
    // Coverage complement of the BLOCKER FIX case: when BOTH adapters have
    // data and they DISAGREE, the remote is canonical. The wrapper must NOT
    // trigger the remote-null + local-has recovery branch (remote is not
    // null) and must NOT emit a fallback event.
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null,
      async () => REMOTE_STUDY_PLAN
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null,
      () => LOCAL_STUDY_PLAN
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadStudyPlan("student-1");

    expect(result).toEqual(REMOTE_STUDY_PLAN);
    expect(result).not.toEqual(LOCAL_STUDY_PLAN);
    expect(onFallback).not.toHaveBeenCalled();
  });

  it("remote throws → returns LOCAL + emits fallback event (regression)", async () => {
    const onFallback = vi.fn();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null,
      async () => {
        throw new Error("network-down");
      }
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null,
      () => LOCAL_STUDY_PLAN
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadStudyPlan("student-1");

    expect(result).toEqual(LOCAL_STUDY_PLAN);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("loadStudyPlan", expect.any(Error));
  });

  it("remote returns __remoteUnavailable sentinel + local has data → returns LOCAL + emits fallback event", async () => {
    const onFallback = vi.fn();
    const sentinel = createRemoteUnavailableSentinel<StudyPlan | null>();
    const remote = makeRemoteAdapter(
      vi.fn(async () => EMPTY_PROGRESS),
      async () => null,
      async () => sentinel
    );
    const local = makeLocalAdapter(
      () => EMPTY_PROGRESS,
      () => null,
      () => LOCAL_STUDY_PLAN
    );

    const { withLocalFallback } = await import("../selector");
    const wrapper = withLocalFallback(remote, local, onFallback);

    const result = await wrapper.loadStudyPlan("student-1");

    expect(result).toEqual(LOCAL_STUDY_PLAN);
    expect(result).not.toBe(sentinel);
    expect(onFallback).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith("loadStudyPlan", sentinel);
  });
});