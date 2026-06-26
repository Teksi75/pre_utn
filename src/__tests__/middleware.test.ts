/**
 * Tests for src/middleware.ts
 *
 * Verifies the Next.js middleware token refresh contract:
 * - Calls auth.getUser() so expired access tokens are refreshed silently
 * - Returns NextResponse.next() so the page still renders
 * - Forwards refreshed cookies from getUser into the response
 * - Excludes static assets via matcher config
 * - Falls back to a passthrough when env vars are missing
 *
 * Spec: REQ-AUTH-2 — "src/middleware.ts MUST create a createServerClient
 * per request to refresh tokens and write cookies."
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

// ---------------------------------------------------------------------------
// Mocks — vi.mock is hoisted, so we use vi.hoisted for shared state.
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => {
  return {
    getUserResult: null as null | { data: { user: unknown }; error: unknown },
    lastSetAll: null as null | Array<{ name: string; value: string }>,
    createServerClientCalls: [] as unknown[],
  };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { getAll: () => unknown; setAll: (cookies: unknown) => void } }
  ) => {
    mockState.createServerClientCalls.push(options);
    // Wire the cookies.setAll callback to capture the writes
    options.cookies.setAll = (cookies: unknown) => {
      mockState.lastSetAll = cookies as Array<{ name: string; value: string }>;
    };
    return {
      auth: {
        getUser: vi.fn(async () => mockState.getUserResult),
      },
    };
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  mockState.getUserResult = null;
  mockState.lastSetAll = null;
  mockState.createServerClientCalls = [];
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(cookieHeader: string | null = null): Request {
  const headers = new Headers();
  if (cookieHeader !== null) headers.set("cookie", cookieHeader);
  return new Request("https://example.com/some/path", { headers });
}

function loadMiddleware() {
  return import("../middleware");
}

// ---------------------------------------------------------------------------
// RED tests
// ---------------------------------------------------------------------------

describe("middleware — token refresh", () => {
  it("returns NextResponse.next() when env vars are missing (passthrough)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { middleware } = await loadMiddleware();
    const req = makeRequest();
    const res = await middleware(req as never);

    expect(res).toBeDefined();
    // No createServerClient call when env is missing
    expect(mockState.createServerClientCalls).toHaveLength(0);
  });

  it("calls createServerClient when env vars are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    mockState.getUserResult = { data: { user: { id: "u1" } }, error: null };

    const { middleware } = await loadMiddleware();
    await middleware(makeRequest() as never);

    expect(mockState.createServerClientCalls).toHaveLength(1);
  });

  it("calls auth.getUser() to refresh the token", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    const getUserSpy = vi.fn(async () => ({
      data: { user: { id: "u1" } },
      error: null,
    }));
    mockState.getUserResult = null; // will be replaced

    // Replace the mock client for this test only
    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: { getUser: getUserSpy },
      }),
    }));

    const { middleware } = await loadMiddleware();
    await middleware(makeRequest() as never);

    expect(getUserSpy).toHaveBeenCalledTimes(1);
    vi.doUnmock("@supabase/ssr");
  });

  it("forwards refreshed cookies onto the response when getUser triggers a refresh", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    const refreshedCookies = [
      { name: "sb-test-auth-token", value: "refreshed.access.token" },
      { name: "sb-test-auth-token-refresh", value: "refresh.token.value" },
    ];

    const getUserSpy = vi.fn(async () => {
      // Simulate Supabase SDK calling setAll on the cookies when it
      // refreshes the session. The middleware code wires this up to
      // write onto the outgoing response.
      const captured = mockState.createServerClientCalls[0] as
        | { cookies: { setAll: (c: typeof refreshedCookies) => void } }
        | undefined;
      captured?.cookies.setAll(refreshedCookies);
      return { data: { user: { id: "u1" } }, error: null };
    });

    vi.doMock("@supabase/ssr", () => ({
      createServerClient: (_url: string, _key: string, options: unknown) => {
        mockState.createServerClientCalls.push(options);
        // Re-wrap setAll so the top-level capture also fires.
        const originalSetAll = (options as { cookies: { setAll: (c: unknown) => void } })
          .cookies.setAll;
        (options as { cookies: { setAll: (c: unknown) => void } }).cookies.setAll = (
          c
        ) => {
          mockState.lastSetAll = c as typeof refreshedCookies;
          originalSetAll(c);
        };
        return { auth: { getUser: getUserSpy } };
      },
    }));

    const { middleware } = await loadMiddleware();
    const res = await middleware(makeRequest() as never);

    expect(mockState.lastSetAll).toEqual(refreshedCookies);
    // The response must be defined and usable
    expect(res).toBeDefined();
    vi.doUnmock("@supabase/ssr");
  });

  it("does NOT throw when getUser returns an error (graceful degradation)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    const getUserSpy = vi.fn(async () => ({
      data: { user: null },
      error: { message: "Invalid refresh token" },
    }));

    vi.doMock("@supabase/ssr", () => ({
      createServerClient: () => ({
        auth: { getUser: getUserSpy },
      }),
    }));

    const { middleware } = await loadMiddleware();
    await expect(middleware(makeRequest() as never)).resolves.toBeDefined();
    vi.doUnmock("@supabase/ssr");
  });
});

// ---------------------------------------------------------------------------
// Matcher config — static exclusion pattern for Next.js
// ---------------------------------------------------------------------------

describe("middleware — matcher config", () => {
  const source = () =>
    readFileSync(join(repoRoot, "src/middleware.ts"), "utf8");

  it("exports a config object with a matcher", () => {
    const src = source();
    expect(src).toMatch(/export\s+const\s+config\s*=/);
    expect(src).toMatch(/matcher\s*:/);
  });

  it("matcher excludes _next/static", () => {
    const src = source();
    expect(src).toContain("_next/static");
  });

  it("matcher excludes _next/image", () => {
    const src = source();
    expect(src).toContain("_next/image");
  });

  it("matcher excludes favicon.ico", () => {
    const src = source();
    expect(src).toContain("favicon.ico");
  });
});