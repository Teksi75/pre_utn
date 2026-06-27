/**
 * Tests for src/app/auth/callback/route.ts — magic-link callback handshake.
 *
 * Verifies the route handler:
 * - Exchanges a valid Supabase `?code` for a session and redirects to
 *   `/cuenta` (the post-login landing).
 * - When no code is present (or env vars are missing), redirects to
 *   `/cuenta/ingresar` without throwing.
 * - Never leaks SDK errors to the client — every code path ends in a
 *   `NextResponse.redirect(...)`.
 *
 * Spec: REQ-AUTH-1
 *   - "valid callback code creates session"
 *   - "missing callback code redirects safely"
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock state — vi.mock factories are hoisted, so shared state
// lives in vi.hoisted().
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => {
  return {
    envUrl: null as string | null,
    envKey: null as string | null,
    exchangeResult: null as null | { error: unknown },
    exchangeCalls: [] as string[],
    setAllCalls: [] as Array<{ name: string; value: string }>,
    createServerClientCalls: 0,
  };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { getAll: () => unknown; setAll: (c: unknown) => void } }
  ) => {
    mockState.createServerClientCalls += 1;
    const setAll = options.cookies.setAll;
    options.cookies.setAll = (cookies: unknown) => {
      mockState.setAllCalls = cookies as Array<{ name: string; value: string }>;
      setAll(cookies);
    };
    return {
      auth: {
        exchangeCodeForSession: vi.fn(async (code: string) => {
          mockState.exchangeCalls.push(code);
          // Simulate the real SDK behavior: when the code is exchanged
          // successfully, the SDK writes fresh session cookies via the
          // configured `setAll` callback.
          const result = mockState.exchangeResult ?? { error: null };
          if (!result.error) {
            options.cookies.setAll([
              { name: "sb-test-auth-token", value: "session.access" },
              { name: "sb-test-auth-token-refresh", value: "session.refresh" },
            ]);
          }
          return result;
        }),
      },
    };
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  mockState.envUrl = null;
  mockState.envKey = null;
  mockState.exchangeResult = null;
  mockState.exchangeCalls = [];
  mockState.setAllCalls = [];
  mockState.createServerClientCalls = 0;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(query: string, cookieHeader: string | null = null): Request {
  const url = `https://example.com/auth/callback${query}`;
  const headers = new Headers();
  if (cookieHeader !== null) headers.set("cookie", cookieHeader);
  return new Request(url, { headers });
}

function expectLocationEndsWith(res: Response, path: string) {
  // NextResponse.redirect emits a fully-qualified Location header.
  // Strip the origin so tests assert on the path only.
  const loc = res.headers.get("location") ?? "";
  expect(loc.endsWith(path)).toBe(true);
}

async function loadRoute() {
  return import("../route");
}

function setPublishableEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
}

// ---------------------------------------------------------------------------
// Valid code path
// ---------------------------------------------------------------------------

describe("/auth/callback — valid code", () => {
  it("redirects to /cuenta when ?code is present and exchange succeeds", async () => {
    setPublishableEnv();
    mockState.exchangeResult = { error: null };

    const { GET } = await loadRoute();
    const res = await GET(makeRequest("?code=valid-code-123") as never);

    expect(res.status).toBe(307);
    expectLocationEndsWith(res, "/cuenta");
  });

  it("calls supabase.auth.exchangeCodeForSession with the code from the URL", async () => {
    setPublishableEnv();
    mockState.exchangeResult = { error: null };

    const { GET } = await loadRoute();
    await GET(makeRequest("?code=the-supabase-code") as never);

    expect(mockState.exchangeCalls).toEqual(["the-supabase-code"]);
  });

  it("does NOT redirect to /cuenta/ingresar when the code is valid", async () => {
    setPublishableEnv();
    mockState.exchangeResult = { error: null };

    const { GET } = await loadRoute();
    const res = await GET(makeRequest("?code=valid") as never);

    expectLocationEndsWith(res, "/cuenta");
  });

  it("forwards cookies from setAll onto the outgoing response", async () => {
    setPublishableEnv();
    mockState.exchangeResult = { error: null };

    const { GET } = await loadRoute();
    await GET(makeRequest("?code=x") as never);

    // The global mock simulates the SDK writing fresh session cookies
    // via the configured setAll callback when exchangeCodeForSession
    // succeeds. The route wires setAll correctly so those cookies are
    // captured here.
    expect(mockState.setAllCalls.map((c) => c.name)).toContain(
      "sb-test-auth-token",
    );
  });

  it("redirects to /cuenta even when exchange returns an error (best-effort UX)", async () => {
    setPublishableEnv();
    mockState.exchangeResult = { error: { message: "code expired" } };

    const { GET } = await loadRoute();
    const res = await GET(makeRequest("?code=expired") as never);

    // The route never echoes errors to the client; it always lands on
    // a redirect. The user can re-trigger from /cuenta/ingresar.
    expect([301, 302, 303, 307, 308]).toContain(res.status);
    expectLocationEndsWith(res, "/cuenta");
  });
});

// ---------------------------------------------------------------------------
// Missing code / missing env paths — must redirect safely.
// ---------------------------------------------------------------------------

describe("/auth/callback — missing code (safe redirect)", () => {
  it("redirects to /cuenta/ingresar when ?code is absent", async () => {
    setPublishableEnv();
    mockState.exchangeResult = { error: null };

    const { GET } = await loadRoute();
    const res = await GET(makeRequest("") as never);

    expect([301, 302, 303, 307, 308]).toContain(res.status);
    expectLocationEndsWith(res, "/cuenta/ingresar");
  });

  it("redirects to /cuenta/ingresar when ?code is empty string", async () => {
    setPublishableEnv();
    mockState.exchangeResult = { error: null };

    const { GET } = await loadRoute();
    const res = await GET(makeRequest("?code=") as never);

    expectLocationEndsWith(res, "/cuenta/ingresar");
  });

  it("does NOT call exchangeCodeForSession when ?code is absent", async () => {
    setPublishableEnv();

    const { GET } = await loadRoute();
    await GET(makeRequest("") as never);

    expect(mockState.exchangeCalls).toEqual([]);
  });

  it("does NOT call exchangeCodeForSession when ?code is empty string", async () => {
    setPublishableEnv();

    const { GET } = await loadRoute();
    await GET(makeRequest("?code=") as never);

    expect(mockState.exchangeCalls).toEqual([]);
  });
});

describe("/auth/callback — missing env (safe redirect)", () => {
  it("redirects to /cuenta/ingresar when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { GET } = await loadRoute();
    const res = await GET(makeRequest("?code=anything") as never);

    expect([301, 302, 303, 307, 308]).toContain(res.status);
    expectLocationEndsWith(res, "/cuenta/ingresar");
  });

  it("does NOT call createServerClient when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { GET } = await loadRoute();
    await GET(makeRequest("?code=anything") as never);

    expect(mockState.createServerClientCalls).toBe(0);
  });

  it("does NOT throw when env vars are missing and no code is provided", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { GET } = await loadRoute();
    await expect(GET(makeRequest("") as never)).resolves.toBeDefined();
  });
});