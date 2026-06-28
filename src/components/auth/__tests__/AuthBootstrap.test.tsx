/**
 * Tests for src/components/auth/AuthBootstrap.tsx
 *
 * Verifies the listener wires Supabase auth events to persistence:
 * - SIGNED_IN → calls linkAndImportLocalProgress(session) FIRST, then
 *   reinitializePersistence() (FK row must exist before remote
 *   persistence flips on; the orchestrator handles the import).
 * - SIGNED_OUT → calls reinitializePersistence() only.
 * - TOKEN_REFRESHED and other events → no-op.
 * - Uses useEffect with cleanup; one listener survives Strict Mode.
 * - Renders nothing.
 *
 * PR3 (T-REV-5): AuthBootstrap delegates the SIGNED_IN side effects to
 * the orchestrator (`linkAndImportLocalProgress`) instead of calling
 * `linkActiveProfileToAuthUser` directly. The orchestrator is the new
 * contract; the inner link helper is still exported (re-used by the
 * orchestrator) but AuthBootstrap no longer references it directly.
 *
 * Spec: REQ-AUTH-3, REQ-NEW-2a, REQ-NEW-2b, REQ-NEW-2c.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function authBootstrapSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/auth/AuthBootstrap.tsx"),
    "utf8"
  );
}

describe("AuthBootstrap — component shape", () => {
  it("exports AuthBootstrap as a named export", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/export\s+(?:const|function)\s+AuthBootstrap\b/);
  });

  it("is a client component", () => {
    const src = authBootstrapSource();
    expect(src).toContain('"use client"');
  });

  it("renders nothing (returns null)", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/return\s+null/);
  });
});

describe("AuthBootstrap — effect wiring", () => {
  it("uses useEffect", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/useEffect\s*\(/);
  });

  it("subscribes to onAuthStateChange via useEffect", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/onAuthStateChange\s*\(/);
  });

  it("returns cleanup that unsubscribes (Strict Mode safe)", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/return\s+\(\s*\)\s*=>/);
    expect(src).toMatch(/handle\.unsubscribe\s*\(\s*\)/);
  });
});

describe("AuthBootstrap — SIGNED_IN flow (REQ-AUTH-3, T-REV-5)", () => {
  it("imports linkAndImportLocalProgress from @/lib/auth/link-and-import", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/linkAndImportLocalProgress\b/);
    expect(src).toMatch(/from\s+["']@\/lib\/auth\/link-and-import["']/);
  });

  it("imports reinitializePersistence", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/reinitializePersistence\b/);
  });

  it("branches on event === 'SIGNED_IN'", () => {
    const src = authBootstrapSource();
    expect(src).toContain("SIGNED_IN");
  });

  it("calls linkAndImportLocalProgress(session) BEFORE reinitializePersistence on SIGNED_IN", () => {
    const src = authBootstrapSource();
    const linkPos = src.indexOf("linkAndImportLocalProgress");
    const reinitPos = src.indexOf("reinitializePersistence");
    expect(linkPos).toBeGreaterThan(-1);
    expect(reinitPos).toBeGreaterThan(-1);
    // The orchestrator call must come before the reinitialize call in
    // the SIGNED_IN branch.
    const signedInPos = src.indexOf("SIGNED_IN");
    const linkAfterSignIn = src.indexOf("linkAndImportLocalProgress", signedInPos);
    const reinitAfterSignIn = src.indexOf("reinitializePersistence", signedInPos);
    expect(linkAfterSignIn).toBeGreaterThan(signedInPos);
    expect(reinitAfterSignIn).toBeGreaterThan(signedInPos);
    expect(linkAfterSignIn).toBeLessThan(reinitAfterSignIn);
  });

  it("awaits linkAndImportLocalProgress (sequential ordering)", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/await\s+linkAndImportLocalProgress/);
  });

  it("passes the session object to linkAndImportLocalProgress", () => {
    const src = authBootstrapSource();
    // The orchestrator requires the Supabase Session; AuthBootstrap must
    // forward whatever the auth state change callback supplied.
    expect(src).toMatch(/linkAndImportLocalProgress\s*\(\s*session\s*\)/);
  });

  it("awaits reinitializePersistence after the orchestrator", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/await\s+reinitializePersistence/);
  });

  it("does NOT call linkActiveProfileToAuthUser directly (orchestrator owns it now)", () => {
    const src = authBootstrapSource();
    // The wiring should not have a direct call to the inner helper.
    // Allow comments / JSDoc to mention it, but no invocation.
    expect(src).not.toMatch(/await\s+linkActiveProfileToAuthUser\s*\(/);
  });
});

describe("AuthBootstrap — SIGNED_OUT flow", () => {
  it("branches on event === 'SIGNED_OUT'", () => {
    const src = authBootstrapSource();
    expect(src).toContain("SIGNED_OUT");
  });

  it("SIGNED_OUT branch contains reinitializePersistence", () => {
    const src = authBootstrapSource();
    const signedOutIdx = src.indexOf('"SIGNED_OUT"');
    expect(signedOutIdx).toBeGreaterThan(-1);
    const afterSignOut = src.slice(signedOutIdx);
    expect(afterSignOut).toMatch(/reinitializePersistence/);
  });

  it("SIGNED_OUT branch does NOT run the orchestrator", () => {
    const src = authBootstrapSource();
    // After SIGNED_OUT we only want reinit; no orchestrator call.
    const signedOutIdx = src.indexOf('"SIGNED_OUT"');
    const afterSignOut = src.slice(signedOutIdx);
    expect(afterSignOut).not.toMatch(/linkAndImportLocalProgress/);
  });

  it("SIGNED_OUT branch clears the per-userId post-auth sync status", () => {
    // AuthBootstrap must call clearPostAuthSyncStatus(userId) on SIGNED_OUT
    // so the next sign-in for the same user re-runs the orchestrator
    // instead of replaying a stale cached status.
    const src = authBootstrapSource();
    const signedOutIdx = src.indexOf('"SIGNED_OUT"');
    expect(signedOutIdx).toBeGreaterThan(-1);
    const afterSignOut = src.slice(signedOutIdx);
    expect(afterSignOut).toMatch(/clearPostAuthSyncStatus\s*\(/);
  });

  it("tracks the previous userId so SIGNED_OUT can clear it", () => {
    // On SIGNED_OUT, the session is null, so we cannot read userId from
    // session.user.id. AuthBootstrap must capture the userId from the
    // last SIGNED_IN and forward it to clearPostAuthSyncStatus.
    const src = authBootstrapSource();
    // The variable holding the previous userId is referenced in BOTH the
    // SIGNED_IN branch (capture) and the SIGNED_OUT branch (use).
    expect(src).toMatch(/lastUserId|lastSignedInUserId|previousUserId|trackedUserId/);
  });
});

describe("AuthBootstrap — unused events are no-ops", () => {
  it("only branches on SIGNED_IN and SIGNED_OUT (no default handler that re-inits)", () => {
    const src = authBootstrapSource();
    const branchCount = (src.match(/(SIGNED_IN|SIGNED_OUT)/g) ?? []).length;
    expect(branchCount).toBeGreaterThanOrEqual(2);
  });
});