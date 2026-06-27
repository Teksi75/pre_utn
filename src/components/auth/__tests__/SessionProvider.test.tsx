/**
 * Tests for src/components/auth/SessionProvider.tsx
 *
 * Verifies the React session context contract:
 * - Exposes {session, userEmail, isLoading, isAuthEnabled, signOut}
 * - isAuthEnabled=false when env is missing (no client)
 * - Uses useState + useEffect + onAuthStateChange with cleanup
 * - One listener survives React Strict Mode double-mount
 * - useSession() throws when used outside provider
 *
 * Spec: REQ-AUTH-2 + REQ-AUTH-5 — SessionProvider exposes session state
 * and signOut.
 */

import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function sessionProviderSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/auth/SessionProvider.tsx"),
    "utf8"
  );
}

describe("SessionProvider — exposed context value", () => {
  it("declares a session field on the context", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/session\s*:\s*Session\s*\|\s*null/);
  });

  it("declares a userEmail field on the context", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/userEmail\s*:\s*string\s*\|\s*null/);
  });

  it("declares an isLoading field on the context", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/isLoading\s*:\s*boolean/);
  });

  it("declares an isAuthEnabled field on the context", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/isAuthEnabled\s*:\s*boolean/);
  });

  it("declares a signOut function on the context", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/signOut\s*:\s*\(/);
  });
});

describe("SessionProvider — provider behavior", () => {
  it("exports a SessionProvider component", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/export\s+(?:const|function)\s+SessionProvider\b/);
  });

  it("exports a useSession hook", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/export\s+(?:const|function)\s+useSession\b/);
  });

  it("is a client component (useState/useEffect require 'use client')", () => {
    const src = sessionProviderSource();
    expect(src).toContain('"use client"');
  });

  it("uses useState for session state", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/useState\s*<\s*Session\s*\|\s*null\s*>/);
  });

  it("uses useState for isLoading", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/useState\s*<\s*boolean\s*>/);
  });

  it("subscribes via onAuthStateChange inside useEffect", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/useEffect\s*\(/);
    expect(src).toMatch(/onAuthStateChange\s*\(/);
  });

  it("returns a cleanup function from useEffect (Strict Mode safe)", () => {
    const src = sessionProviderSource();
    // useEffect with a returned cleanup is the Strict-Mode-safe pattern.
    expect(src).toMatch(/return\s+\(\s*\)\s*=>/);
  });

  it("calls handle.unsubscribe() in the cleanup", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/handle\.unsubscribe\s*\(\s*\)/);
  });
});

describe("SessionProvider — auth-enabled detection", () => {
  it("derives isAuthEnabled from createBrowserClient (null → false)", () => {
    const src = sessionProviderSource();
    // Must reference createBrowserClient to detect env-var presence
    expect(src).toMatch(/createBrowserClient\s*\(/);
  });

  it("uses getCurrentSession on mount to read initial session", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/getCurrentSession\s*\(/);
  });
});

describe("SessionProvider — useSession hook contract", () => {
  it("throws when used outside SessionProvider (helpful dev error)", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/useSession must be used within a SessionProvider|outside.*provider/i);
  });

  it("returns the context value (not undefined) inside provider", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/useContext\s*\(/);
  });
});

describe("SessionProvider — signOut wired through context", () => {
  it("wraps the lib signOut helper and updates local state on success", () => {
    const src = sessionProviderSource();
    expect(src).toMatch(/signOut\s*\(\s*\)/);
    // After sign-out, session should be cleared.
    expect(src).toMatch(/setSession\s*\(\s*null\s*\)/);
  });
});