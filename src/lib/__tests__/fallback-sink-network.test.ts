/**
 * Production fallback sink network transport — proves the sink sends a
 * sanitized fallback event to the internal Next.js Route Handler endpoint
 * via `navigator.sendBeacon` (with `fetch({ keepalive: true })` fallback).
 *
 * CRITICAL: the sink must be observable in production. This file covers
 * the new network transport layer (separate from the existing CustomEvent
 * dispatch and console.warn guarded log).
 *
 * Hard rules:
 * - Use only relative URLs (e.g. /api/persistence/fallback) — no env-derived
 *   endpoints, no external services.
 * - Sanitize payload: no secrets, no student PII, no full payloads.
 *   Keep { method, errorSummary, timestamp, sessionActive, adapterKind } or
 *   a subset.
 * - Preserve CustomEvent dispatch + console.warn guarded/sanitized.
 * - No service-role or non-public env vars on the wire.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function sinkSource(): string {
  return readFileSync(
    join(repoRoot, "src/lib/persistence/fallback-sink.ts"),
    "utf8"
  );
}

function eventTypeSource(): string {
  return readFileSync(
    join(repoRoot, "src/lib/persistence/fallback-event.ts"),
    "utf8"
  );
}

function routeSource(): string {
  return readFileSync(
    join(repoRoot, "src/app/api/persistence/fallback/route.ts"),
    "utf8"
  );
}

function initializerSource(): string {
  return readFileSync(
    join(repoRoot, "src/components/PersistenceInitializer.tsx"),
    "utf8"
  );
}

// ---------------------------------------------------------------------------
// localStorage mock (kept for parity with existing sink tests)
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
  vi.restoreAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// RED: payload type module exists
// ---------------------------------------------------------------------------

describe("fallback-event shared type module", () => {
  it("exists at src/lib/persistence/fallback-event.ts", () => {
    expect(() => eventTypeSource()).not.toThrow();
  });

  it("exports a FallbackEventPayload type or interface", () => {
    const src = eventTypeSource();
    expect(src).toMatch(
      /export\s+(type|interface)\s+FallbackEventPayload/
    );
  });

  it("payload shape includes method, errorSummary, timestamp, sessionActive, adapterKind", () => {
    const src = eventTypeSource();
    expect(src).toContain("method");
    expect(src).toContain("errorSummary");
    expect(src).toContain("timestamp");
    expect(src).toContain("sessionActive");
    expect(src).toContain("adapterKind");
  });
});

// ---------------------------------------------------------------------------
// RED: sink source must include network transport
// ---------------------------------------------------------------------------

describe("fallback-sink network transport (source-level)", () => {
  it("exports createProductionFallbackSink and a default endpoint constant", () => {
    const src = sinkSource();
    expect(src).toMatch(
      /export\s+(function|const)\s+createProductionFallbackSink/
    );
    // Default endpoint must be the relative Next.js route — not env-derived
    expect(src).toContain("/api/persistence/fallback");
  });

  it("uses navigator.sendBeacon when available", () => {
    const src = sinkSource();
    expect(src).toContain("navigator");
    expect(src).toContain("sendBeacon");
  });

  it("falls back to fetch with keepalive:true when sendBeacon is unavailable", () => {
    const src = sinkSource();
    expect(src).toContain("fetch");
    expect(src).toContain("keepalive");
  });

  it("still dispatches CustomEvent persistence:fallback on globalThis", () => {
    const src = sinkSource();
    expect(src).toContain("CustomEvent");
    expect(src).toContain("persistence:fallback");
  });

  it("still has console.warn guarded/sanitized", () => {
    const src = sinkSource();
    expect(src).toContain("console.warn");
  });

  it("does NOT include service_role or non-public Supabase env data on the wire", () => {
    const src = sinkSource();
    const codeOnly = src
      .replace(/\/\*\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(codeOnly).not.toContain("service_role");
    expect(codeOnly).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(codeOnly).not.toContain("publishableKey");
    expect(codeOnly).not.toContain("NEXT_PUBLIC_SUPABASE");
  });

  it("endpoint is configurable but defaults to relative URL", () => {
    const src = sinkSource();
    // Must accept endpoint override (allow override for tests)
    expect(src).toMatch(/endpoint/);
  });
});

// ---------------------------------------------------------------------------
// RED: sink runtime — sendBeacon is invoked with sanitized payload
// ---------------------------------------------------------------------------

describe("fallback-sink runtime: sendBeacon transport", () => {
  it("calls navigator.sendBeacon with sanitized payload to default endpoint", async () => {
    const sendBeaconMock = vi.fn((_url: string, _data: string) => true);
    const fetchMock = vi.fn(async () => ({ ok: true, status: 204 }));

    const navigatorMock = { sendBeacon: sendBeaconMock };
    vi.stubGlobal("navigator", navigatorMock);
    vi.stubGlobal("fetch", fetchMock);

    const { createProductionFallbackSink } = await import(
      "../persistence/fallback-sink"
    );
    const sink = createProductionFallbackSink();

    sink("loadProfiles", new Error("Network timeout"));

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, payload] = sendBeaconMock.mock.calls[0] as [string, string];
    expect(url).toBe("/api/persistence/fallback");
    expect(typeof payload).toBe("string");

    const parsed = JSON.parse(payload);
    expect(parsed.method).toBe("loadProfiles");
    expect(parsed.errorSummary).toBe("Network timeout");
    expect(parsed.timestamp).toBeTruthy();
    // No secrets/PII in payload
    const flat = JSON.stringify(parsed);
    expect(flat).not.toContain("service_role");
    expect(flat).not.toContain("publishableKey");
  });

  it("falls back to fetch({ keepalive: true }) when sendBeacon is unavailable", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => ({
        ok: true,
        status: 204,
      })
    );
    // navigator.sendBeacon intentionally missing
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("fetch", fetchMock);

    const { createProductionFallbackSink } = await import(
      "../persistence/fallback-sink"
    );
    const sink = createProductionFallbackSink();

    sink("saveProgress", new Error("FK violation"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/persistence/fallback");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json"
    );

    const body = JSON.parse(init.body as string);
    expect(body.method).toBe("saveProgress");
    expect(body.errorSummary).toBe("FK violation");
  });

  it("captures only the error message (no full stack trace)", async () => {
    const sendBeaconMock = vi.fn((_url: string, _data: string) => true);
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconMock });
    vi.stubGlobal("fetch", vi.fn());

    const { createProductionFallbackSink } = await import(
      "../persistence/fallback-sink"
    );
    const sink = createProductionFallbackSink();

    const error = new Error("Network timeout");
    sink("loadProgress", error);

    const [, payload] = sendBeaconMock.mock.calls[0] as [string, string];
    const parsed = JSON.parse(payload);
    // Summary is a string (not the Error object)
    expect(typeof parsed.errorSummary).toBe("string");
    expect(parsed.errorSummary).toBe("Network timeout");
    // No stack trace in payload
    const flat = JSON.stringify(parsed);
    expect(flat).not.toContain("at Object");
    expect(flat).not.toContain("at Function");
  });

  it("truncates very long error messages to a safe length", async () => {
    const sendBeaconMock = vi.fn((_url: string, _data: string) => true);
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconMock });
    vi.stubGlobal("fetch", vi.fn());

    const { createProductionFallbackSink } = await import(
      "../persistence/fallback-sink"
    );
    const sink = createProductionFallbackSink();

    const longMessage = "x".repeat(2000);
    sink("loadProgress", new Error(longMessage));

    const [, payload] = sendBeaconMock.mock.calls[0] as [string, string];
    const parsed = JSON.parse(payload);
    expect(parsed.errorSummary.length).toBeLessThanOrEqual(500);
  });

  it("still dispatches CustomEvent persistence:fallback when network transport is called", async () => {
    const dispatched: Array<{ type: string; detail: unknown }> = [];
    const originalDispatch = globalThis.dispatchEvent;
    globalThis.dispatchEvent = (event: Event) => {
      if (event instanceof CustomEvent) {
        dispatched.push({ type: event.type, detail: event.detail });
      }
      return true;
    };

    const sendBeaconMock = vi.fn((_url: string, _data: string) => true);
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconMock });
    vi.stubGlobal("fetch", vi.fn());

    try {
      const { createProductionFallbackSink } = await import(
        "../persistence/fallback-sink"
      );
      const sink = createProductionFallbackSink();

      sink("loadProfiles", new Error("Boom"));

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0].type).toBe("persistence:fallback");
    } finally {
      globalThis.dispatchEvent = originalDispatch;
    }
  });

  it("still calls console.warn guarded/sanitized", async () => {
    const sendBeaconMock = vi.fn((_url: string, _data: string) => true);
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconMock });
    vi.stubGlobal("fetch", vi.fn());
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const { createProductionFallbackSink } = await import(
      "../persistence/fallback-sink"
    );
    const sink = createProductionFallbackSink();

    sink("loadProfiles", new Error("Boom"));

    expect(warnSpy).toHaveBeenCalled();
    const message = String((warnSpy.mock.calls[0] as unknown[])[0]);
    expect(message).toContain("loadProfiles");
    expect(message).toContain("Boom");
  });

  it("accepts a custom endpoint override (testability)", async () => {
    const sendBeaconMock = vi.fn((_url: string, _data: string) => true);
    vi.stubGlobal("navigator", { sendBeacon: sendBeaconMock });
    vi.stubGlobal("fetch", vi.fn());

    const { createProductionFallbackSink } = await import(
      "../persistence/fallback-sink"
    );
    const sink = createProductionFallbackSink({ endpoint: "/custom/path" });

    sink("saveProfiles", new Error("nope"));

    const call = sendBeaconMock.mock.calls[0] as [string, string];
    expect(call[0]).toBe("/custom/path");
  });
});

// ---------------------------------------------------------------------------
// RED: server route handler — accepts valid shape, rejects malformed
// ---------------------------------------------------------------------------

describe("POST /api/persistence/fallback — route handler", () => {
  it("route file exists at src/app/api/persistence/fallback/route.ts", () => {
    expect(() => routeSource()).not.toThrow();
  });

  it("exports a POST handler", () => {
    const src = routeSource();
    expect(src).toMatch(/export\s+(async\s+)?function\s+POST/);
  });

  it("route handler returns 204 on valid payload", async () => {
    const validPayload = {
      method: "loadProfiles",
      errorSummary: "Network timeout",
      timestamp: new Date().toISOString(),
      sessionActive: true,
      adapterKind: "supabase",
    };
    const { POST } = await import(
      "../../app/api/persistence/fallback/route"
    );
    const response = await POST({
      json: async () => validPayload,
    } as unknown as Request);
    expect(response.status).toBe(204);
  });

  it("route handler accepts minimal payload (method + errorSummary + timestamp)", async () => {
    const minimalPayload = {
      method: "saveProgress",
      errorSummary: "FK violation",
      timestamp: new Date().toISOString(),
    };
    const { POST } = await import(
      "../../app/api/persistence/fallback/route"
    );
    const response = await POST({
      json: async () => minimalPayload,
    } as unknown as Request);
    expect(response.status).toBe(204);
  });

  it("route handler rejects payload missing method (4xx)", async () => {
    const { POST } = await import(
      "../../app/api/persistence/fallback/route"
    );
    const response = await POST({
      json: async () => ({
        errorSummary: "boom",
        timestamp: new Date().toISOString(),
      }),
    } as unknown as Request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("route handler rejects payload missing errorSummary (4xx)", async () => {
    const { POST } = await import(
      "../../app/api/persistence/fallback/route"
    );
    const response = await POST({
      json: async () => ({
        method: "loadProfiles",
        timestamp: new Date().toISOString(),
      }),
    } as unknown as Request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("route handler rejects payload missing timestamp (4xx)", async () => {
    const { POST } = await import(
      "../../app/api/persistence/fallback/route"
    );
    const response = await POST({
      json: async () => ({
        method: "loadProfiles",
        errorSummary: "boom",
      }),
    } as unknown as Request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("route handler rejects non-JSON body (4xx)", async () => {
    const { POST } = await import(
      "../../app/api/persistence/fallback/route"
    );
    const response = await POST({
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Request);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it("route handler does not log secrets or PII", async () => {
    const { POST } = await import(
      "../../app/api/persistence/fallback/route"
    );
    const src = routeSource();
    const codeOnly = src
      .replace(/\/\*\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(codeOnly).not.toContain("service_role");
    expect(codeOnly).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(codeOnly).not.toContain("publishableKey");
  });
});

// ---------------------------------------------------------------------------
// RED: PersistenceInitializer stays minimal (no UI changes)
// ---------------------------------------------------------------------------

describe("PersistenceInitializer does not regress", () => {
  it("still passes onFallback to initializePersistence", () => {
    const src = initializerSource();
    expect(src).toMatch(/initializePersistence\s*\(\s*\{[\s\S]*onFallback/);
  });
});

// ---------------------------------------------------------------------------
// W1: isFallbackEventPayload length caps
// ---------------------------------------------------------------------------
//
// The route validator must bound method / errorSummary / timestamp to a
// maximum length so a malicious or accidental huge payload cannot reach the
// downstream sink. Bounds: method <= 64, errorSummary <= 200, timestamp <= 32.

describe("isFallbackEventPayload length caps (W1)", () => {
  it("accepts method at the maximum length (64)", async () => {
    const { isFallbackEventPayload } = await import(
      "../persistence/fallback-event"
    );
    const payload = {
      method: "m".repeat(64),
      errorSummary: "ok",
      timestamp: "2026-06-23T00:00:00.000Z",
    };
    expect(isFallbackEventPayload(payload)).toBe(true);
  });

  it("rejects method above the maximum length (65)", async () => {
    const { isFallbackEventPayload } = await import(
      "../persistence/fallback-event"
    );
    const payload = {
      method: "m".repeat(65),
      errorSummary: "ok",
      timestamp: "2026-06-23T00:00:00.000Z",
    };
    expect(isFallbackEventPayload(payload)).toBe(false);
  });

  it("accepts errorSummary at the maximum length (200)", async () => {
    const { isFallbackEventPayload } = await import(
      "../persistence/fallback-event"
    );
    const payload = {
      method: "loadProfiles",
      errorSummary: "e".repeat(200),
      timestamp: "2026-06-23T00:00:00.000Z",
    };
    expect(isFallbackEventPayload(payload)).toBe(true);
  });

  it("rejects errorSummary above the maximum length (201)", async () => {
    const { isFallbackEventPayload } = await import(
      "../persistence/fallback-event"
    );
    const payload = {
      method: "loadProfiles",
      errorSummary: "e".repeat(201),
      timestamp: "2026-06-23T00:00:00.000Z",
    };
    expect(isFallbackEventPayload(payload)).toBe(false);
  });

  it("accepts timestamp at the maximum length (32)", async () => {
    const { isFallbackEventPayload } = await import(
      "../persistence/fallback-event"
    );
    const payload = {
      method: "loadProfiles",
      errorSummary: "ok",
      timestamp: "t".repeat(32),
    };
    expect(isFallbackEventPayload(payload)).toBe(true);
  });

  it("rejects timestamp above the maximum length (33)", async () => {
    const { isFallbackEventPayload } = await import(
      "../persistence/fallback-event"
    );
    const payload = {
      method: "loadProfiles",
      errorSummary: "ok",
      timestamp: "t".repeat(33),
    };
    expect(isFallbackEventPayload(payload)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// W2: sanitizeErrorSummary must not leak JSON for non-Error inputs
// ---------------------------------------------------------------------------
//
// When the selector falls back to the local adapter it may pass objects like
// { ok: false, reason: "..." } directly to onFallback. The current
// implementation runs JSON.stringify on these and ships the result to the
// route handler — which leaks the object's internal structure onto the wire.
// The fix: for non-Error inputs, use String(error) (yields "[object Object]")
// when finite/short, or the fixed sentinel "unknown-fallback-reason" otherwise.
// JSON.stringify must never appear in the output.

describe("sanitizeErrorSummary does not leak JSON (W2)", () => {
  it("returns a fixed short string for {ok:false, reason:'...'} — no JSON leak", async () => {
    const { sanitizeErrorSummary } = await import(
      "../persistence/fallback-sink"
    );
    const result = sanitizeErrorSummary({
      ok: false,
      reason: "internal-rls-denial",
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeLessThanOrEqual(200);
    // No internal key/value leakage
    expect(result).not.toContain("internal-rls-denial");
    expect(result).not.toContain("ok");
    expect(result).not.toContain("reason");
    // No JSON markers
    expect(result).not.toContain("{");
    expect(result).not.toContain("}");
    expect(result).not.toContain('"');
  });

  it("returns a fixed short string for nested objects — no key/value leak", async () => {
    const { sanitizeErrorSummary } = await import(
      "../persistence/fallback-sink"
    );
    const result = sanitizeErrorSummary({
      error: { code: 42, message: "very-private" },
    });
    expect(typeof result).toBe("string");
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result).not.toContain("very-private");
    expect(result).not.toContain("code");
    expect(result).not.toContain("42");
    expect(result).not.toContain("{");
    expect(result).not.toContain("}");
  });

  it("does not produce a JSON-stringified output for arbitrary non-Error values", async () => {
    const { sanitizeErrorSummary } = await import(
      "../persistence/fallback-sink"
    );
    const result = sanitizeErrorSummary({ a: 1, b: 2 });
    expect(result.startsWith("{")).toBe(false);
    expect(result.endsWith("}")).toBe(false);
  });

  it("returns the fixed sentinel for non-Error inputs that exceed the length cap", async () => {
    const { sanitizeErrorSummary } = await import(
      "../persistence/fallback-sink"
    );
    // A custom toString that returns something pathologically long
    const longObject = {
      toString() {
        return "L".repeat(5000);
      },
    };
    const result = sanitizeErrorSummary(longObject);
    expect(result).toBe("unknown-fallback-reason");
  });

  it("still preserves Error.message for Error instances (regression check)", async () => {
    const { sanitizeErrorSummary } = await import(
      "../persistence/fallback-sink"
    );
    expect(sanitizeErrorSummary(new Error("boom"))).toBe("boom");
  });

  it("still preserves plain string input (regression check)", async () => {
    const { sanitizeErrorSummary } = await import(
      "../persistence/fallback-sink"
    );
    expect(sanitizeErrorSummary("string-error")).toBe("string-error");
  });
});
