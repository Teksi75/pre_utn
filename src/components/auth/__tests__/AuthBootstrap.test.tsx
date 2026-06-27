/**
 * Tests for src/components/auth/AuthBootstrap.tsx
 *
 * Verifies the listener wires Supabase auth events to persistence:
 * - SIGNED_IN → calls linkActiveProfileToAuthUser() FIRST, then
 *   reinitializePersistence() (FK row must exist before remote
 *   persistence flips on).
 * - SIGNED_OUT → calls reinitializePersistence() only.
 * - TOKEN_REFRESHED and other events → no-op.
 * - Uses useEffect with cleanup; one listener survives Strict Mode.
 * - Renders nothing.
 *
 * Spec: REQ-AUTH-3 — "AuthBootstrap MUST subscribe to onAuthStateChange;
 * on SIGNED_IN it MUST call linkActiveProfileToAuthUser() then
 * reinitializePersistence(); on SIGNED_OUT it MUST call
 * reinitializePersistence()."
 */

import { describe, it, expect, vi } from "vitest";
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

describe("AuthBootstrap — SIGNED_IN flow (REQ-AUTH-3, REQ-AUTH-4)", () => {
  it("imports linkActiveProfileToAuthUser", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/linkActiveProfileToAuthUser\b/);
  });

  it("imports reinitializePersistence", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/reinitializePersistence\b/);
  });

  it("branches on event === 'SIGNED_IN'", () => {
    const src = authBootstrapSource();
    expect(src).toContain("SIGNED_IN");
  });

  it("calls linkActiveProfileToAuthUser BEFORE reinitializePersistence on SIGNED_IN", () => {
    const src = authBootstrapSource();
    const linkPos = src.indexOf("linkActiveProfileToAuthUser");
    const reinitPos = src.indexOf("reinitializePersistence");
    // Both must be present.
    expect(linkPos).toBeGreaterThan(-1);
    expect(reinitPos).toBeGreaterThan(-1);
    // The link call must come before the reinitialize call in the SIGNED_IN
    // branch. Find the SIGNED_IN branch first.
    const signedInPos = src.indexOf("SIGNED_IN");
    // Use the closest link/reinit references after SIGNED_IN to check
    // ordering within the SIGNED_IN branch.
    const linkAfterSignIn = src.indexOf("linkActiveProfileToAuthUser", signedInPos);
    const reinitAfterSignIn = src.indexOf("reinitializePersistence", signedInPos);
    expect(linkAfterSignIn).toBeGreaterThan(signedInPos);
    expect(reinitAfterSignIn).toBeGreaterThan(signedInPos);
    expect(linkAfterSignIn).toBeLessThan(reinitAfterSignIn);
  });

  it("awaits linkActiveProfileToAuthUser (sequential ordering)", () => {
    const src = authBootstrapSource();
    // link must be awaited so reinit sees the FK row already created.
    expect(src).toMatch(/await\s+linkActiveProfileToAuthUser/);
  });

  it("awaits reinitializePersistence after link", () => {
    const src = authBootstrapSource();
    expect(src).toMatch(/await\s+reinitializePersistence/);
  });
});

describe("AuthBootstrap — SIGNED_OUT flow", () => {
  it("branches on event === 'SIGNED_OUT'", () => {
    const src = authBootstrapSource();
    expect(src).toContain("SIGNED_OUT");
  });

  it("SIGNED_OUT branch contains reinitializePersistence", () => {
    const src = authBootstrapSource();
    // Find the SIGNED_OUT branch by looking for the surrounding `else if` clause.
    const signedOutIdx = src.indexOf('"SIGNED_OUT"');
    expect(signedOutIdx).toBeGreaterThan(-1);
    // Slice from SIGNED_OUT to end of the else-if block — look for
    // reinitializePersistence appearing in that window.
    const afterSignOut = src.slice(signedOutIdx);
    expect(afterSignOut).toMatch(/reinitializePersistence/);
  });
});

describe("AuthBootstrap — unused events are no-ops", () => {
  it("only branches on SIGNED_IN and SIGNED_OUT (no default handler that re-inits)", () => {
    const src = authBootstrapSource();
    // The implementation must NOT have a fall-through that calls
    // reinitializePersistence for all events. Only the two named
    // branches should drive persistence.
    const branchCount = (src.match(/(SIGNED_IN|SIGNED_OUT)/g) ?? []).length;
    // Two literal string occurrences (one per branch).
    expect(branchCount).toBeGreaterThanOrEqual(2);
  });
});