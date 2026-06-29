/**
 * Tests for post-auth sync re-exports in src/lib/persistence/adapter-config.ts
 *
 * The adapter-config barrel exposes `waitForPostAuthSync()` and
 * `getPostAuthSyncStatus()` so persistence initialization and other
 * persistence consumers do not need to import from `src/lib/auth/`
 * directly. This keeps the layering clean: persistence depends on the
 * status surface, not on the orchestrator internals.
 *
 * Spec: REQ-AUTH-3 — "PersistenceInitializer MUST await
 * `waitForPostAuthSync()` before selecting remote adapter when a session
 * exists."
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

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

describe("adapter-config re-exports post-auth-sync surface", () => {
  it("exports waitForPostAuthSync", async () => {
    const mod = await import("../adapter-config");
    expect(typeof mod.waitForPostAuthSync).toBe("function");
  });

  it("exports getPostAuthSyncStatus", async () => {
    const mod = await import("../adapter-config");
    expect(typeof mod.getPostAuthSyncStatus).toBe("function");
  });

  it("exports beginPostAuthSync", async () => {
    const mod = await import("../adapter-config");
    expect(typeof mod.beginPostAuthSync).toBe("function");
  });

  it("exports clearPostAuthSyncStatus", async () => {
    const mod = await import("../adapter-config");
    expect(typeof mod.clearPostAuthSyncStatus).toBe("function");
  });

  it("getPostAuthSyncStatus() default is 'signed-out'", async () => {
    const mod = await import("../adapter-config");
    expect(mod.getPostAuthSyncStatus()).toBe("signed-out");
  });

  it("waitForPostAuthSync() returns null when no sync is in flight", async () => {
    const mod = await import("../adapter-config");
    expect(mod.waitForPostAuthSync()).toBeNull();
  });
});
