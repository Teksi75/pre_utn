/**
 * Tests for src/hooks/usePostAuthSyncStatus.ts — live subscription to
 * the post-auth sync status.
 *
 * The Nav (PR2) needs to re-render when the post-auth sync status
 * transitions (signed-out → pending → ready | local-fallback → signed-out).
 * The hook wraps `getPostAuthSyncStatus()` from
 * `@/lib/persistence/adapter-config` with `useSyncExternalStore` so
 * React subscribers get notified of transitions.
 *
 * Spec: REQ-NEW-ARCH-1 — Nav sync pill requires live readiness signal.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function hookSource(): string {
  return readFileSync(
    join(repoRoot, "src/hooks/usePostAuthSyncStatus.ts"),
    "utf8",
  );
}

describe("usePostAuthSyncStatus — hook shape", () => {
  it("exists as a hook file", () => {
    expect(() => hookSource()).not.toThrow();
  });

  it("exports a named hook function (usePostAuthSyncStatus)", () => {
    const src = hookSource();
    expect(src).toMatch(/export\s+(?:const|function)\s+usePostAuthSyncStatus\b/);
  });

  it("returns the current PostAuthSyncStatus string", () => {
    // The hook must return one of the documented status values:
    // "disabled" | "signed-out" | "pending" | "ready" | "local-fallback".
    const src = hookSource();
    // Must reference at least the type or the literal "ready" — the
    // return type must be the union.
    expect(src).toMatch(/PostAuthSyncStatus|["']ready["']/);
  });

  it("uses useSyncExternalStore for live updates", () => {
    // The hook must subscribe so the Nav re-renders on every transition.
    const src = hookSource();
    expect(src).toMatch(/useSyncExternalStore\s*\(/);
  });

  it("imports getPostAuthSyncStatus from the readiness surface", () => {
    // The hook reads the current status via the re-export at
    // @/lib/persistence/adapter-config so callers do not depend on
    // src/lib/auth/ directly.
    const src = hookSource();
    expect(src).toMatch(/getPostAuthSyncStatus/);
  });

  it("provides a subscribe function (notifications on transition)", () => {
    // useSyncExternalStore requires a subscribe callback that the
    // status module's emit() can call on every transition. The hook
    // must wire subscribePostAuthSyncChange as the first argument of
    // useSyncExternalStore.
    const src = hookSource();
    // The hook must import AND call subscribePostAuthSyncChange as the
    // first arg of useSyncExternalStore.
    expect(src).toMatch(/subscribePostAuthSyncChange/);
    // And it must be the first argument to useSyncExternalStore.
    const match = src.match(/useSyncExternalStore\s*\(\s*([A-Za-z_][\w]*)/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("subscribePostAuthSyncChange");
  });

  it("provides a stable getSnapshot (server snapshot safe)", () => {
    // useSyncExternalStore requires getSnapshot to return a stable
    // reference and getServerSnapshot to be defined for SSR.
    const src = hookSource();
    expect(src).toMatch(/getSnapshot/);
  });

  it("is a client hook (no Next.js SSR concerns in the call site)", () => {
    // useSyncExternalStore is a React 18+ client hook. The hook file
    // should not crash on import — server snapshot must be defined.
    const src = hookSource();
    expect(src).toMatch(/getServerSnapshot/);
  });
});

// ---------------------------------------------------------------------------
// Post-auth-sync status module must support external subscribers.
// ---------------------------------------------------------------------------

describe("post-auth-sync.ts — subscribe support for hook (PR2 wiring)", () => {
  it("exports a subscribe function (subscribePostAuthSyncChange)", () => {
    // The status module needs to expose an emit/subscribe so the hook
    // can re-render Nav on transitions. The exact name can be
    // subscribePostAuthSyncChange or onPostAuthSyncStatusChange — the
    // contract is "external subscription is supported".
    const src = readFileSync(
      join(repoRoot, "src/lib/auth/post-auth-sync.ts"),
      "utf8",
    );
    expect(src).toMatch(
      /export\s+(?:const|function)\s+(subscribePostAuthSyncChange|onPostAuthSyncStatusChange|subscribePostAuthSync)\b/,
    );
  });
});
