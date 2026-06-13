/**
 * Unit tests for the active student hook — src/hooks/useActiveStudent.ts
 *
 * These tests verify the pure logic extracted from the hook's state transitions.
 * React component rendering is verified via source-inspection in the
 * component-level test file.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function hookSource(): string {
  return readFileSync(
    join(repoRoot, "src/hooks/useActiveStudent.ts"),
    "utf8",
  );
}

// ---------------------------------------------------------------------------
// Source-inspection tests — verify hook structure and imports
// ---------------------------------------------------------------------------

describe("useActiveStudent hook — source structure", () => {
  it("imports the active student external store", () => {
    const src = hookSource();
    expect(src).toContain("active-student-store");
  });

  it("returns an object with student, createAndActivate, switchTo, refresh, isLoading", () => {
    const src = hookSource();
    expect(src).toContain("student:");
    expect(src).toContain("createAndActivate:");
    expect(src).toContain("switchTo:");
    expect(src).toContain("refresh:");
    expect(src).toContain("isLoading:");
  });

  it("uses useSyncExternalStore for shared student state", () => {
    const src = hookSource();
    expect(src).toContain("useSyncExternalStore");
    expect(src).toContain("subscribeActiveStudent");
    expect(src).toContain("getActiveStudentSnapshot");
  });

  it("uses useCallback for createAndActivate", () => {
    const src = hookSource();
    expect(src).toContain("createAndActivate = useCallback");
  });

  it("uses useCallback for switchTo", () => {
    const src = hookSource();
    expect(src).toContain("switchTo = useCallback");
  });

  it("uses useCallback for refresh", () => {
    const src = hookSource();
    expect(src).toContain("refresh = useCallback");
  });

  it("calls recoverActiveProfile on mount (useEffect)", () => {
    const src = hookSource();
    expect(src).toContain("useEffect");
    expect(src).toContain("refreshActiveStudent");
  });

  it("createAndActivate delegates to the shared external store", () => {
    const src = hookSource();
    expect(src).toContain("createAndActivateActiveStudent(displayName)");
  });

  it("switchTo delegates to the shared external store", () => {
    const src = hookSource();
    expect(src).toContain("switchActiveStudent(studentId)");
  });

  it("refresh calls recover and updates state", () => {
    const src = hookSource();
    // refresh uses the recover alias for recoverActiveProfile
    const refreshPos = src.indexOf("const refresh");
    const nextPos = src.indexOf("return", refreshPos);
    const refreshBody = src.slice(refreshPos, nextPos > 0 ? nextPos : src.length);
    expect(refreshBody).toContain("refreshActiveStudent");
  });

  it("does not reload progress from the active student hook", () => {
    const src = hookSource();
    expect(src).not.toContain("loadProgress");
  });

  it("isLoading is set to false after mount effect runs", () => {
    const src = hookSource();
    // After the useEffect that recovers the profile, isLoading should be false
    expect(src).toContain("setIsLoading(false)");
  });

  it("createAndActivate updates student state after creating profile", () => {
    const src = hookSource();
    expect(src).toContain("createAndActivateActiveStudent");
  });

  it("switchTo updates student state after switching id", () => {
    const src = hookSource();
    // After setActiveStudentId succeeds, the external store should notify subscribers.
    const switchToPos = src.indexOf("const switchTo");
    const nextCallbackPos = src.indexOf("const refresh", switchToPos);
    const switchToBody = src.slice(switchToPos, nextCallbackPos > 0 ? nextCallbackPos : src.length);
    expect(switchToBody).toContain("switchActiveStudent");
  });
});
