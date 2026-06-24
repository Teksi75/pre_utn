/**
 * Initializer unhandled rejection + CustomEvent observability sink.
 *
 * Design: "Add try/catch to initializePersistence() and record
 * degraded-local fallback event without crashing."
 * Design: "Dispatch a client-side `persistence:fallback` CustomEvent
 * with sanitized payload so production hosts can subscribe."
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function sinkSource(): string {
  return readFileSync(join(repoRoot, "src/lib/persistence/fallback-sink.ts"), "utf8");
}

function adapterConfigSource(): string {
  return readFileSync(join(repoRoot, "src/lib/persistence/adapter-config.ts"), "utf8");
}

// ---------------------------------------------------------------------------
// localStorage mock
// ---------------------------------------------------------------------------

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
  };
})();

beforeEach(() => {
  vi.stubGlobal("localStorage", localStorageMock);
  localStorageMock.clear();
  vi.restoreAllMocks();
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// RED: initializePersistence catches errors gracefully
// ---------------------------------------------------------------------------

describe("initializer unhandled rejection: try/catch protection", () => {
  it("initializePersistence catches auth.getSession errors and sets adapter to null", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");

    const mockClient = {
      auth: {
        getSession: vi.fn(async () => {
          throw new Error("Auth service unavailable");
        }),
      },
    };

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    const { initializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await import("../persistence/adapter-config");

    // Must NOT throw — catches the error and degrades to local
    await expect(initializePersistence()).resolves.toBeUndefined();

    // Adapter must be null (local fallback)
    expect(getConfiguredAdapter()).toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  it("initializePersistence catches createBrowserClient runtime errors", async () => {
    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => {
        throw new Error("Unexpected runtime error");
      },
    }));

    const { initializePersistence, getConfiguredAdapter, resetPersistenceAdapter } =
      await import("../persistence/adapter-config");

    // Must NOT throw
    await expect(initializePersistence()).resolves.toBeUndefined();

    // Adapter must be null (local fallback)
    expect(getConfiguredAdapter()).toBeNull();

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });

  it("initializePersistence calls onFallback with degraded-local info when error occurs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");

    const mockClient = {
      auth: {
        getSession: vi.fn(async () => {
          throw new Error("Auth service unavailable");
        }),
      },
    };

    vi.doMock("../supabase/browser", () => ({
      createBrowserClient: () => mockClient,
    }));

    const fallbackCalls: Array<{ method: string; error: unknown }> = [];

    const { initializePersistence, resetPersistenceAdapter } =
      await import("../persistence/adapter-config");

    await initializePersistence({
      onFallback: (method, error) => {
        fallbackCalls.push({ method, error });
      },
    });

    // onFallback must have been called with the initialization error
    expect(fallbackCalls).toHaveLength(1);
    expect(fallbackCalls[0].method).toBe("initializePersistence");
    expect(fallbackCalls[0].error).toBeInstanceOf(Error);

    resetPersistenceAdapter();
    vi.doUnmock("../supabase/browser");
  });
});

// ---------------------------------------------------------------------------
// RED: CustomEvent observability sink
// ---------------------------------------------------------------------------

describe("observability: CustomEvent persistence:fallback dispatch", () => {
  it("fallback-sink dispatches CustomEvent 'persistence:fallback' with sanitized payload", () => {
    const src = sinkSource();
    // Must dispatch a CustomEvent
    expect(src).toContain("CustomEvent");
    expect(src).toContain("persistence:fallback");
  });

  it("fallback-sink CustomEvent includes method and error summary in detail", () => {
    const src = sinkSource();
    // Must include detail with method and errorSummary (or equivalent)
    expect(src).toContain("method");
    expect(src).toContain("errorSummary");
    expect(src).toContain("detail");
  });

  it("fallback-sink CustomEvent does NOT include secrets in detail", () => {
    const src = sinkSource();
    const codeOnly = src.replace(/\/\*\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(codeOnly).not.toContain("service_role");
    expect(codeOnly).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(codeOnly).not.toContain("publishableKey");
  });

  it("fallback-sink still has console.warn guarded/sanitized", () => {
    const src = sinkSource();
    expect(src).toContain("console.warn");
  });

  it("fallback-sink uses dispatchEvent on globalThis or window", () => {
    const src = sinkSource();
    // Must use some form of dispatchEvent
    expect(src).toMatch(/dispatchEvent|globalThis|window/);
  });
});

// ---------------------------------------------------------------------------
// RED: CustomEvent runtime behavior
// ---------------------------------------------------------------------------

describe("observability: CustomEvent runtime dispatch", () => {
  it("createProductionFallbackSink dispatches CustomEvent with correct detail", async () => {
    // Mock globalThis.dispatchEvent since it's not available in Node test env
    const dispatched: Array<{ type: string; detail: unknown }> = [];
    const originalDispatch = globalThis.dispatchEvent;
    globalThis.dispatchEvent = (event: Event) => {
      if (event instanceof CustomEvent) {
        dispatched.push({ type: event.type, detail: event.detail });
      }
      return true;
    };

    try {
      const { createProductionFallbackSink } = await import("../persistence/fallback-sink");
      const sink = createProductionFallbackSink();

      // Trigger a fallback event
      sink("loadProfiles", new Error("Network timeout"));

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0].type).toBe("persistence:fallback");

      const detail = dispatched[0].detail as {
        method: string;
        errorSummary: string;
        timestamp: string;
      };
      expect(detail.method).toBe("loadProfiles");
      expect(detail.errorSummary).toBe("Network timeout");
      expect(detail.timestamp).toBeTruthy();
      // Timestamp should be ISO format
      expect(new Date(detail.timestamp).toISOString()).toBe(detail.timestamp);
    } finally {
      globalThis.dispatchEvent = originalDispatch;
    }
  });

  it("createProductionFallbackSink CustomEvent does not expose secrets in detail", async () => {
    const dispatched: Array<{ detail: unknown }> = [];
    const originalDispatch = globalThis.dispatchEvent;
    globalThis.dispatchEvent = (event: Event) => {
      if (event instanceof CustomEvent) {
        dispatched.push({ detail: event.detail });
      }
      return true;
    };

    try {
      const { createProductionFallbackSink } = await import("../persistence/fallback-sink");
      const sink = createProductionFallbackSink();

      // Trigger with a generic error
      sink("saveProgress", { message: "FK violation" });

      expect(dispatched).toHaveLength(1);
      const detail = JSON.stringify(dispatched[0].detail);
      expect(detail).not.toContain("service_role");
      expect(detail).not.toContain("SUPABASE_SERVICE_ROLE");
      expect(detail).not.toContain("publishableKey");
    } finally {
      globalThis.dispatchEvent = originalDispatch;
    }
  });
});
