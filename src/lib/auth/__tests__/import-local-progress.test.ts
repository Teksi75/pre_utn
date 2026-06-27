/**
 * Tests for src/lib/auth/import-local-progress.ts — importLocalProgressToRemote()
 *
 * Verifies the non-destructive local-to-remote import helper that runs in
 * the `local has + remote empty` branch of the SIGNED_IN orchestrator.
 *
 * Contract (REQ-NEW-2c):
 * - Reads local raw state via loadProgressRaw/loadDiagnosticResultRaw/
 *   loadStudyPlanRaw (these are bound to the active profile).
 * - Calls remoteAdapter.saveProgress/saveDiagnosticResult/saveStudyPlan
 *   sequentially (avoids row contention on student_progress_snapshots).
 * - Each step is wrapped in its own try/catch; the function never throws.
 * - On partial success: importedFields lists what made it, error carries
 *   the first failure.
 * - All success: ok:true with all three fields.
 * - All failure: ok:false with empty importedFields and the first error.
 * - localStorage is never touched.
 *
 * Case (a) — all local null → ok:true, importedFields:[]
 * Case (b) — all 3 succeed → ok:true, all three fields
 * Case (c) — progress fails, others ok → ok:true, [diagnostic, studyPlan], error
 * Case (d) — all fail → ok:false, importedFields:[], error
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { PersistenceAdapter } from "../../persistence/port";
import type {
  PracticeProgress,
  PracticeAttempt,
} from "../../../domain/progress/index";
import type { DiagnosticResult, StudyPlan } from "../../../domain/diagnostic";
import { PROFILES_STORAGE_KEY } from "../../student-profile-storage";
import { PRACTICE_STORAGE_KEY } from "../../practice-progress";
import {
  DIAGNOSTIC_STORAGE_KEY,
  STUDY_PLAN_STORAGE_KEY,
} from "../../diagnostic-storage";

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
    get length() {
      return Object.keys(store).length;
    },
  };
})();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers — seed active profile + raw state maps
// ---------------------------------------------------------------------------

function setActiveProfile(studentId: string): void {
  localStorageMock.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      profiles: [
        {
          studentId,
          displayName: "Ana",
          createdAt: "t0",
          lastActiveAt: "t0",
        },
      ],
      activeStudentId: studentId,
    }),
  );
}

function setProgressFor(studentId: string, attempts: PracticeAttempt[]): void {
  const existing = localStorageMock.getItem(PRACTICE_STORAGE_KEY);
  const parsed: { students?: Record<string, unknown> } = existing
    ? JSON.parse(existing)
    : { students: {} };
  const map = {
    students: {
      ...(parsed.students ?? {}),
      [studentId]: {
        attempts,
        accuracyBySkill: {},
        trendBySkill: {},
        lastPracticedBySkill: {},
        diagnosticResult: null,
        studyPlan: null,
      },
    },
    activeStudentId: studentId,
  };
  localStorageMock.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(map));
}

function setDiagnosticFor(studentId: string, value: DiagnosticResult | null): void {
  const existing = localStorageMock.getItem(DIAGNOSTIC_STORAGE_KEY);
  const parsed: { students?: Record<string, unknown> } = existing
    ? JSON.parse(existing)
    : { students: {} };
  const map = {
    students: { ...(parsed.students ?? {}), [studentId]: value },
    activeStudentId: studentId,
  };
  localStorageMock.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(map));
}

function setStudyPlanFor(studentId: string, value: StudyPlan | null): void {
  const existing = localStorageMock.getItem(STUDY_PLAN_STORAGE_KEY);
  const parsed: { students?: Record<string, unknown> } = existing
    ? JSON.parse(existing)
    : { students: {} };
  const map = {
    students: { ...(parsed.students ?? {}), [studentId]: value },
    activeStudentId: studentId,
  };
  localStorageMock.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(map));
}

function makeAdapter(opts: {
  saveProgressImpl?: PersistenceAdapter["saveProgress"];
  saveDiagImpl?: PersistenceAdapter["saveDiagnosticResult"];
  savePlanImpl?: PersistenceAdapter["saveStudyPlan"];
}): PersistenceAdapter {
  return {
    loadProfiles: () => ({ profiles: [], activeStudentId: null }),
    saveProfiles: () => ({ ok: true, state: { profiles: [], activeStudentId: null } }),
    loadProgress: () => ({
      attempts: [],
      accuracyBySkill: {},
      trendBySkill: {},
      lastPracticedBySkill: {},
      diagnosticResult: null,
      studyPlan: null,
    }),
    saveProgress:
      opts.saveProgressImpl ??
      (() => ({ ok: true, value: undefined })),
    loadDiagnosticResult: () => null,
    saveDiagnosticResult:
      opts.saveDiagImpl ??
      (() => ({ ok: true, value: undefined })),
    loadStudyPlan: () => null,
    saveStudyPlan:
      opts.savePlanImpl ??
      (() => ({ ok: true, value: undefined })),
  };
}

async function loadModule() {
  return import("../import-local-progress");
}

// ---------------------------------------------------------------------------
// RED tests
// ---------------------------------------------------------------------------

describe("importLocalProgressToRemote()", () => {
  it("(a) returns ok:true, importedFields:[] when local state is empty", async () => {
    setActiveProfile("student-1");
    const adapter = makeAdapter({});
    const { importLocalProgressToRemote } = await loadModule();
    const result = await importLocalProgressToRemote(adapter, "student-1");
    expect(result).toEqual({ ok: true, importedFields: [] });
  });

  it("(b) imports all three fields when local state is full and all remote saves succeed", async () => {
    setActiveProfile("student-1");
    setProgressFor("student-1", [
      {
        exerciseId: "e1",
        skillId: "mat.u1.s1" as never,
        correct: true,
        answeredAt: "t1",
        timeMs: 0,
        attemptIndex: 1,
      },
    ]);
    setDiagnosticFor("student-1", {
      completedAt: "t1",
      estimates: [],
      suggestions: [],
      version: 1,
    });
    setStudyPlanFor("student-1", { steps: [] } as unknown as StudyPlan);

    const adapter = makeAdapter({});
    const { importLocalProgressToRemote } = await loadModule();
    const result = await importLocalProgressToRemote(adapter, "student-1");
    expect(result).toEqual({
      ok: true,
      importedFields: ["progress", "diagnostic", "studyPlan"],
    });
  });

  it("(c) returns ok:true with importedFields minus the failed one and an error", async () => {
    setActiveProfile("student-1");
    setProgressFor("student-1", [
      {
        exerciseId: "e1",
        skillId: "mat.u1.s1" as never,
        correct: true,
        answeredAt: "t1",
        timeMs: 0,
        attemptIndex: 1,
      },
    ]);
    setDiagnosticFor("student-1", {
      completedAt: "t1",
      estimates: [],
      suggestions: [],
      version: 1,
    });
    setStudyPlanFor("student-1", { steps: [] } as unknown as StudyPlan);

    const progressError = new Error("network-down");
    const adapter = makeAdapter({
      saveProgressImpl: () => ({ ok: false, reason: "missing-active-profile" }),
    });
    // Surface error via throw so the helper records it.
    adapter.saveProgress = async () => {
      throw progressError;
    };

    const { importLocalProgressToRemote } = await loadModule();
    const result = await importLocalProgressToRemote(adapter, "student-1");
    expect(result.ok).toBe(true);
    expect(result.importedFields).toEqual(["diagnostic", "studyPlan"]);
    expect(result.error).toBeDefined();
  });

  it("(d) returns ok:false, importedFields:[] when all remote saves fail", async () => {
    setActiveProfile("student-1");
    setProgressFor("student-1", [
      {
        exerciseId: "e1",
        skillId: "mat.u1.s1" as never,
        correct: true,
        answeredAt: "t1",
        timeMs: 0,
        attemptIndex: 1,
      },
    ]);
    setDiagnosticFor("student-1", {
      completedAt: "t1",
      estimates: [],
      suggestions: [],
      version: 1,
    });
    setStudyPlanFor("student-1", { steps: [] } as unknown as StudyPlan);

    const adapter = makeAdapter({
      saveProgressImpl: async () => {
        throw new Error("net1");
      },
      saveDiagImpl: async () => {
        throw new Error("net2");
      },
      savePlanImpl: async () => {
        throw new Error("net3");
      },
    });

    const { importLocalProgressToRemote } = await loadModule();
    const result = await importLocalProgressToRemote(adapter, "student-1");
    expect(result.ok).toBe(false);
    expect(result.importedFields).toEqual([]);
    expect(result.error).toBeInstanceOf(Error);
  });

  it("never throws — propagates errors as the `error` field", async () => {
    setActiveProfile("student-1");
    setProgressFor("student-1", [
      {
        exerciseId: "e1",
        skillId: "mat.u1.s1" as never,
        correct: true,
        answeredAt: "t1",
        timeMs: 0,
        attemptIndex: 1,
      },
    ]);
    const adapter = makeAdapter({
      saveProgressImpl: async () => {
        throw new Error("boom");
      },
    });
    const { importLocalProgressToRemote } = await loadModule();
    await expect(
      importLocalProgressToRemote(adapter, "student-1")
    ).resolves.toBeDefined();
  });

  it("does NOT mutate localStorage (writes go only to the remote adapter)", async () => {
    setActiveProfile("student-1");
    setProgressFor("student-1", [
      {
        exerciseId: "e1",
        skillId: "mat.u1.s1" as never,
        correct: true,
        answeredAt: "t1",
        timeMs: 0,
        attemptIndex: 1,
      },
    ]);
    const progressBefore = localStorageMock.getItem(PRACTICE_STORAGE_KEY);
    const adapter = makeAdapter({});
    const { importLocalProgressToRemote } = await loadModule();
    await importLocalProgressToRemote(adapter, "student-1");
    const progressAfter = localStorageMock.getItem(PRACTICE_STORAGE_KEY);
    expect(progressAfter).toBe(progressBefore);
  });

  it("calls remote save methods sequentially (not Promise.all)", async () => {
    setActiveProfile("student-1");
    setProgressFor("student-1", [
      {
        exerciseId: "e1",
        skillId: "mat.u1.s1" as never,
        correct: true,
        answeredAt: "t1",
        timeMs: 0,
        attemptIndex: 1,
      },
    ]);
    setDiagnosticFor("student-1", {
      completedAt: "t1",
      estimates: [],
      suggestions: [],
      version: 1,
    });
    setStudyPlanFor("student-1", { steps: [] } as unknown as StudyPlan);

    const callOrder: string[] = [];
    const adapter = makeAdapter({});
    const originalSaveProgress = adapter.saveProgress;
    const originalSaveDiag = adapter.saveDiagnosticResult;
    const originalSavePlan = adapter.saveStudyPlan;
    adapter.saveProgress = async (id, p) => {
      callOrder.push("progress");
      return originalSaveProgress(id, p);
    };
    adapter.saveDiagnosticResult = async (id, r) => {
      callOrder.push("diagnostic");
      return originalSaveDiag(id, r);
    };
    adapter.saveStudyPlan = async (id, pl) => {
      callOrder.push("studyPlan");
      return originalSavePlan(id, pl);
    };

    const { importLocalProgressToRemote } = await loadModule();
    await importLocalProgressToRemote(adapter, "student-1");
    expect(callOrder).toEqual(["progress", "diagnostic", "studyPlan"]);
  });
});
