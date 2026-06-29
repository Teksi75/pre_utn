/**
 * Behavioral tests for HomeNextStepClient fallback VM path.
 *
 * Goal: prove the dashboard never stays on a permanent skeleton
 * after the async load settles. Any rejection (remote-null,
 * thrown-promise, rejected-progress) MUST produce an actionable
 * view model — EMPTY_PROGRESS + null diagnostic — so the dashboard
 * renders the no-attempts local-fallback path.
 *
 * Strategy: the effect body is extracted into a pure async function
 * `runHomeLoader(deps)` that takes loaders + setters as deps. Tests
 * inject mock loaders that resolve/reject per scenario and assert
 * the captured `handleResults` invocations.
 */

import { describe, it, expect, vi } from "vitest";
import { runHomeLoader } from "@/components/home/HomeNextStepClient";
import { EMPTY_PROGRESS } from "@/lib/practice-progress";
import type { PracticeProgress } from "@/domain/progress/index";
import type { DiagnosticResult } from "@/domain/diagnostic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Loosely-typed loader factories — vi.fn's strict Mock<Procedure> type
// does not match the union signature, so we type the overrides loosely
// and cast at the boundary. The runtime behavior is what the tests
// assert.
type AnyProgressLoader = () => unknown;
type AnyDiagLoader = () => unknown;

function makeDeps(overrides: {
  loadProgress?: AnyProgressLoader;
  loadDiagnosticResult?: AnyDiagLoader;
} = {}) {
  return {
    loadProgress: (overrides.loadProgress ?? (() => EMPTY_PROGRESS)) as never,
    loadDiagnosticResult: (overrides.loadDiagnosticResult ?? (() => null)) as never,
  };
}

describe("HomeNextStepClient — fallback VM (behavioral)", () => {
  it("sync success path: handleResults is called with the loaded progress + diag", async () => {
    const handleResults = vi.fn();
    const progress = { ...EMPTY_PROGRESS, totalAttempts: 5 };
    const diag = { topic: "sets", createdAt: "2025-01-01" };
    const deps = makeDeps({
      loadProgress: vi.fn(() => progress),
      loadDiagnosticResult: vi.fn(() => diag),
    });

    await runHomeLoader(deps, handleResults);

    expect(handleResults).toHaveBeenCalledTimes(1);
    expect(handleResults).toHaveBeenCalledWith(progress, diag);
  });

  it("sync null progress + null diag: handleResults called (no skeleton)", async () => {
    const handleResults = vi.fn();
    const deps = makeDeps({
      loadProgress: vi.fn(() => EMPTY_PROGRESS),
      loadDiagnosticResult: vi.fn(() => null),
    });

    await runHomeLoader(deps, handleResults);

    expect(handleResults).toHaveBeenCalledTimes(1);
    expect(handleResults).toHaveBeenCalledWith(EMPTY_PROGRESS, null);
  });

  it("progress promise rejects: handleResults called with EMPTY_PROGRESS + null (no skeleton)", async () => {
    // Blocker scenario: loadProgress throws (network blip, remote
    // null + local empty). The dashboard must still render the
    // actionable fallback VM.
    const handleResults = vi.fn();
    const deps = makeDeps({
      loadProgress: vi.fn(() => Promise.reject(new Error("remote-null"))),
      loadDiagnosticResult: vi.fn(() => null),
    });

    await runHomeLoader(deps, handleResults);

    expect(handleResults).toHaveBeenCalledTimes(1);
    expect(handleResults).toHaveBeenCalledWith(EMPTY_PROGRESS, null);
  });

  it("progress promise resolves + diag promise rejects: handleResults called with progress + null", async () => {
    // Diag-only failure: progress is real, diag fails. The dashboard
    // must still render with the loaded progress and null diagnostic.
    const handleResults = vi.fn();
    const progress = { ...EMPTY_PROGRESS, totalAttempts: 7 };
    const deps = makeDeps({
      loadProgress: vi.fn(() => Promise.resolve(progress)),
      loadDiagnosticResult: vi.fn(() => Promise.reject(new Error("diag-fetch-failed"))),
    });

    await runHomeLoader(deps, handleResults);

    expect(handleResults).toHaveBeenCalledTimes(1);
    expect(handleResults).toHaveBeenCalledWith(progress, null);
  });

  it("both progress and diag reject: handleResults called with EMPTY_PROGRESS + null", async () => {
    // Both loaders throw — the dashboard must still render the
    // actionable fallback VM, not stay on skeleton.
    const handleResults = vi.fn();
    const deps = makeDeps({
      loadProgress: vi.fn(() => Promise.reject(new Error("progress-down"))),
      loadDiagnosticResult: vi.fn(() => Promise.reject(new Error("diag-down"))),
    });

    await runHomeLoader(deps, handleResults);

    expect(handleResults).toHaveBeenCalledTimes(1);
    expect(handleResults).toHaveBeenCalledWith(EMPTY_PROGRESS, null);
  });

  it("progress rejects first and delayed diagnostic rejection is observed", async () => {
    const unhandled = vi.fn();
    const onUnhandled = (reason: unknown) => {
      unhandled(reason);
    };
    process.on("unhandledRejection", onUnhandled);

    let rejectDiagnostic!: (reason?: unknown) => void;
    const diagnosticPromise = new Promise<DiagnosticResult | null>((_resolve, reject) => {
      rejectDiagnostic = reject;
    });
    const handleResults = vi.fn();
    const deps = makeDeps({
      loadProgress: vi.fn(() => Promise.reject(new Error("progress-down"))),
      loadDiagnosticResult: vi.fn(() => diagnosticPromise),
    });

    try {
      const loader = runHomeLoader(deps, handleResults);
      await Promise.resolve();
      rejectDiagnostic(new Error("diag-down"));
      await loader;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handleResults).toHaveBeenCalledTimes(1);
      expect(handleResults).toHaveBeenCalledWith(EMPTY_PROGRESS, null);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  it("sync empty data (progress returns EMPTY_PROGRESS, diag returns null): handleResults called once", async () => {
    // Empty-data scenario: progress is EMPTY_PROGRESS, diag is null.
    // The dashboard must still produce a view model — the
    // "Empezá por el diagnóstico inicial" mission is rendered.
    const handleResults = vi.fn();
    const deps = makeDeps({
      loadProgress: vi.fn(() => EMPTY_PROGRESS),
      loadDiagnosticResult: vi.fn(() => null),
    });

    await runHomeLoader(deps, handleResults);

    expect(handleResults).toHaveBeenCalledTimes(1);
    expect(handleResults).toHaveBeenCalledWith(EMPTY_PROGRESS, null);
  });

  it("EMPTY_PROGRESS is the fallback constant — the dashboard renders the empty-state VM", async () => {
    // The fallback path must use the EMPTY_PROGRESS constant, NOT an
    // empty object or undefined, so the VM builder downstream has a
    // well-typed input.
    const handleResults = vi.fn();
    const deps = makeDeps({
      loadProgress: vi.fn(() => Promise.reject(new Error("remote-null"))),
      loadDiagnosticResult: vi.fn(() => Promise.reject(new Error("remote-null"))),
    });

    await runHomeLoader(deps, handleResults);

    const [progressArg] = handleResults.mock.calls[0];
    expect(progressArg).toBe(EMPTY_PROGRESS);
  });

  it("sync null diag + sync null progress (no errors): handleResults called with progress + null", async () => {
    // New student scenario: no progress yet, no diagnostic yet. Both
    // loaders return null/empty. The VM is built from the empty inputs.
    const handleResults = vi.fn();
    const deps = makeDeps({
      loadProgress: vi.fn(() => EMPTY_PROGRESS),
      loadDiagnosticResult: vi.fn(() => null),
    });

    await runHomeLoader(deps, handleResults);

    expect(handleResults).toHaveBeenCalledTimes(1);
    const [progressArg, diagArg] = handleResults.mock.calls[0];
    expect(progressArg).toBe(EMPTY_PROGRESS);
    expect(diagArg).toBeNull();
  });
});
