/**
 * PersistenceInitializer — proves the production initializer component
 * (a) calls initializePersistence() once on mount, AND
 * (b) when an existing Supabase Auth session is present, awaits the
 *     post-auth-sync readiness (beginPostAuthSync / waitForPostAuthSync)
 *     BEFORE reinitializing the adapter so the FK row is guaranteed
 *     before the selector flips to the remote adapter.
 *
 * Renders nothing.
 *
 * PR2 (post-auth-supabase-sync-fix): the no-session case still calls
 * initializePersistence() (which becomes a no-op when there is no
 * session). The session-present case branches into a readiness-aware
 * path that defers reinitialization until the orchestrator completes.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function source(): string {
  return readFileSync(join(repoRoot, "src/components/PersistenceInitializer.tsx"), "utf8");
}

describe("PersistenceInitializer", () => {
  it("exists as a component file", () => {
    expect(() => source()).not.toThrow();
  });

  it("imports initializePersistence from @/lib/persistence", () => {
    const src = source();
    expect(src).toContain("initializePersistence");
    expect(src).toContain("@/lib/persistence");
  });

  it("calls initializePersistence in useEffect", () => {
    const src = source();
    // Must use useEffect for one-time initialization
    expect(src).toContain("useEffect");
    expect(src).toMatch(/initializePersistence\s*\(/);
  });

  it("renders null (no UI)", () => {
    const src = source();
    // Must return null from the component body
    expect(src).toMatch(/return\s+null/);
  });

  it("uses empty dependency array for one-time call", () => {
    const src = source();
    // useEffect with [] ensures it runs once on mount
    expect(src).toMatch(/useEffect\(/);
    expect(src).toMatch(/\[\s*\]/);
  });

  it("is a client component (required for useEffect)", () => {
    const src = source();
    expect(src).toContain('"use client"');
  });
});

// ---------------------------------------------------------------------------
// PR2 — readiness-aware persistence initialization.
//
// When a Supabase Auth session already exists at app startup (the
// magic-link callback landed, or the user refreshed with an active
// session), the post-auth sync orchestrator must complete (FK row
// upserted, import branch settled) BEFORE the persistence selector
// flips to the remote adapter. Otherwise the first saveProgress() call
// could race the FK upsert and fail the DB constraint.
//
// The component awaits the readiness surface (beginPostAuthSync or
// waitForPostAuthSync) before calling reinitializePersistence().
// ---------------------------------------------------------------------------

describe("PersistenceInitializer — PR2 readiness-aware path", () => {
  it("imports the readiness surface from @/lib/persistence/adapter-config", () => {
    // The re-exports live in adapter-config.ts so the initializer does
    // not depend on src/lib/auth/ directly.
    const src = source();
    const importsAdapterConfig = /from\s+["']@\/lib\/persistence\/adapter-config["']/.test(src);
    expect(importsAdapterConfig).toBe(true);
  });

  it("imports a readiness function (beginPostAuthSync or waitForPostAuthSync)", () => {
    const src = source();
    expect(src).toMatch(/beginPostAuthSync|waitForPostAuthSync/);
  });

  it("reads the current Supabase session before deciding the readiness path", () => {
    // The initializer must read `getCurrentSession()` (or equivalent)
    // so it knows whether to await readiness. Without an existing
    // session, awaiting readiness would deadlock until the user signs
    // in (which AuthBootstrap handles separately).
    const src = source();
    expect(src).toMatch(/getCurrentSession/);
  });

  it("awaits the readiness surface before reinitializePersistence when a session exists", () => {
    // The session-present path MUST:
    //   1. await the readiness surface (beginPostAuthSync / waitForPostAuthSync)
    //   2. then call reinitializePersistence()
    // so the FK row is guaranteed before the selector flips.
    //
    // The handler logic was extracted to `runPersistenceInit(deps)` —
    // the tripwire scans for `deps.beginPostAuthSync(session)` inside
    // the extracted function so the ordering invariant is locked in.
    const src = source();
    const readinessMatch = src.match(
      /await\s+(beginPostAuthSync|deps\.beginPostAuthSync|waitForPostAuthSync|deps\.waitForPostAuthSync)\s*\(/,
    );
    expect(readinessMatch).not.toBeNull();
    const readinessIdx = src.indexOf(readinessMatch![0]);
    const reinitIdx = src.indexOf("reinitializePersistence", readinessIdx);
    expect(reinitIdx).toBeGreaterThan(readinessIdx);
  });

  it("forwards the session object to beginPostAuthSync when a session exists", () => {
    // The orchestrator is per-userId; forwarding the session ensures
    // the same per-userId promise AuthBootstrap owns is shared, so the
    // orchestrator is not run twice for the same user on the same
    // page load.
    const src = source();
    // Either `await beginPostAuthSync(session)` directly or after a
    // getCurrentSession() resolution — match either form.
    expect(src).toMatch(/beginPostAuthSync\s*\(\s*session\s*\)/);
  });

  it("still calls initializePersistence() (legacy / no-session path)", () => {
    // The component must preserve the legacy initializePersistence()
    // call for the no-session / auth-disabled code path. PR2 adds a
    // readiness-aware branch on top, it does NOT replace the
    // initialize path.
    const src = source();
    expect(src).toMatch(/initializePersistence\s*\(/);
  });

  it("uses reinitializePersistence() (not initializePersistence) on the session-present path", () => {
    // The readiness path explicitly re-runs the selector against the
    // current session state — initializePersistence is the first-call
    // entrypoint and uses the same shared `selectAdapterForCurrentSession`
    // core, but reinitializePersistence makes the intent explicit
    // (this is a re-run, not a first init).
    const src = source();
    expect(src).toMatch(/reinitializePersistence\s*\(/);
  });
});
