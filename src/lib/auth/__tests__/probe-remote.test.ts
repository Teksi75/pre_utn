/**
 * Tests for src/lib/auth/probe-remote.ts — probeRemoteState()
 *
 * Verifies the read-only probe that the SIGNED_IN orchestrator uses to
 * decide between the four branches of the import-vs-link decision:
 *
 * - empty / throws → all false (safe default keeps local data; the
 *   orchestrator falls into the `local empty + remote empty` or
 *   `local has + remote empty` branch, which is non-destructive).
 * - non-empty progress + null diagnostic + null study plan →
 *   `{ hasRemoteProgress: true, hasDiagnostic: false, hasStudyPlan: false }`.
 * - The remote adapter's `EMPTY_PROGRESS` sentinel counts as empty
 *   (defensive — `supabase-adapter` returns EMPTY_PROGRESS for missing
 *   rows).
 * - Errors at any single load (e.g. one Promise rejects) collapse the
 *   whole probe to all false.
 *
 * Spec: REQ-NEW-2a (detect remote state), REQ-NEW-2d (conflict → no overwrite).
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { PersistenceAdapter } from "../../persistence/port";
import type { PracticeProgress } from "../../../domain/progress/index";
import type { DiagnosticResult, StudyPlan } from "../../../domain/diagnostic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_PROGRESS: PracticeProgress = {
  attempts: [],
  accuracyBySkill: {},
  trendBySkill: {},
  lastPracticedBySkill: {},
  diagnosticResult: null,
  studyPlan: null,
};

function makeAdapter(
  loadProgressImpl: PersistenceAdapter["loadProgress"],
  loadDiagImpl: PersistenceAdapter["loadDiagnosticResult"],
  loadPlanImpl: PersistenceAdapter["loadStudyPlan"]
): PersistenceAdapter {
  return {
    loadProfiles: () => ({ profiles: [], activeStudentId: null }),
    saveProfiles: () => ({ ok: true, state: { profiles: [], activeStudentId: null } }),
    loadProgress: loadProgressImpl,
    saveProgress: () => ({ ok: true, value: undefined }),
    loadDiagnosticResult: loadDiagImpl,
    saveDiagnosticResult: () => ({ ok: true, value: undefined }),
    loadStudyPlan: loadPlanImpl,
    saveStudyPlan: () => ({ ok: true, value: undefined }),
  };
}

async function loadModule() {
  return import("../probe-remote");
}

beforeEach(() => {
  // No module-level state in probe-remote, but reset modules just in case.
});

// ---------------------------------------------------------------------------
// RED tests
// ---------------------------------------------------------------------------

describe("probeRemoteState()", () => {
  it("returns all false when adapter returns EMPTY_PROGRESS (no remote rows)", async () => {
    const adapter = makeAdapter(
      () => ({ ...EMPTY_PROGRESS }),
      () => null,
      () => null,
    );
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result).toEqual({
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: false,
    });
  });

  it("returns all false when adapter throws on every load", async () => {
    const adapter = makeAdapter(
      () => {
        throw new Error("network");
      },
      () => {
        throw new Error("network");
      },
      () => {
        throw new Error("network");
      },
    );
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result).toEqual({
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: false,
    });
  });

  it("returns all false when adapter rejects on every load", async () => {
    const adapter = makeAdapter(
      async () => {
        throw new Error("network");
      },
      async () => {
        throw new Error("network");
      },
      async () => {
        throw new Error("network");
      },
    );
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result).toEqual({
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: false,
    });
  });

  it("returns hasRemoteProgress=true when progress has non-empty attempts", async () => {
    const progress: PracticeProgress = {
      ...EMPTY_PROGRESS,
      attempts: [
        {
          exerciseId: "e1",
          skillId: "mat.u1.s1" as never,
          correct: true,
          answeredAt: "t1",
          timeMs: 0,
          attemptIndex: 1,
        },
      ],
    };
    const adapter = makeAdapter(() => progress, () => null, () => null);
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result).toEqual({
      hasRemoteProgress: true,
      hasDiagnostic: false,
      hasStudyPlan: false,
    });
  });

  it("returns hasDiagnostic=true when diagnostic exists", async () => {
    const diag: DiagnosticResult = {
      completedAt: "t1",
      estimates: [],
      suggestions: [],
      version: 1,
    };
    const adapter = makeAdapter(() => ({ ...EMPTY_PROGRESS }), () => diag, () => null);
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result).toEqual({
      hasRemoteProgress: false,
      hasDiagnostic: true,
      hasStudyPlan: false,
    });
  });

  it("returns hasStudyPlan=true when study plan exists", async () => {
    const plan = { steps: [] } as unknown as StudyPlan;
    const adapter = makeAdapter(() => ({ ...EMPTY_PROGRESS }), () => null, () => plan);
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result).toEqual({
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: true,
    });
  });

  it("returns all true when all three remote slots are populated", async () => {
    const progress: PracticeProgress = {
      ...EMPTY_PROGRESS,
      attempts: [
        {
          exerciseId: "e1",
          skillId: "mat.u1.s1" as never,
          correct: true,
          answeredAt: "t1",
          timeMs: 0,
          attemptIndex: 1,
        },
      ],
    };
    const diag: DiagnosticResult = {
      completedAt: "t1",
      estimates: [],
      suggestions: [],
      version: 1,
    };
    const plan = { steps: [] } as unknown as StudyPlan;
    const adapter = makeAdapter(() => progress, () => diag, () => plan);
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result).toEqual({
      hasRemoteProgress: true,
      hasDiagnostic: true,
      hasStudyPlan: true,
    });
  });

  it("awaits async adapter results", async () => {
    const progress: PracticeProgress = {
      ...EMPTY_PROGRESS,
      attempts: [
        {
          exerciseId: "e1",
          skillId: "mat.u1.s1" as never,
          correct: true,
          answeredAt: "t1",
          timeMs: 0,
          attemptIndex: 1,
        },
      ],
    };
    const adapter = makeAdapter(async () => progress, async () => null, async () => null);
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    expect(result.hasRemoteProgress).toBe(true);
  });

  it("collapses to all false when only one load throws (defensive)", async () => {
    const adapter = makeAdapter(
      async () => {
        throw new Error("boom");
      },
      async () => null,
      async () => null,
    );
    const { probeRemoteState } = await loadModule();
    const result = await probeRemoteState(adapter, "student-1");
    // Even a single thrown load → all false. The probe is all-or-nothing.
    expect(result).toEqual({
      hasRemoteProgress: false,
      hasDiagnostic: false,
      hasStudyPlan: false,
    });
  });
});
