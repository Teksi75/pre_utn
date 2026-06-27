/**
 * Tests for src/lib/supabase/browser.ts
 *
 * Verifies:
 * - Returns null when env vars are missing (graceful fallback to local)
 * - Returns a Supabase client when env vars are present
 * - Forwards persistSession/autoRefreshToken/detectSessionInUrl = true
 * - Uses @supabase/ssr createBrowserClient factory
 * - Preserves singleton behavior (same client returned on repeat calls)
 *
 * Spec: REQ-AUTH-2 — "createBrowserClient MUST use @supabase/ssr with
 * cookie-based storage and auth toggles enabled."
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — declared before importing the SUT
// ---------------------------------------------------------------------------

const mockCreateBrowserClient = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (...args: unknown[]) => mockCreateBrowserClient(...args),
}));

beforeEach(() => {
  mockCreateBrowserClient.mockReset();
  vi.resetModules();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Import the SUT freshly after mocks/env are reset. */
async function loadSut() {
  return import("../browser");
}

/** Minimal fake client for assertion. */
function makeFakeClient(authOverrides: Record<string, unknown> = {}) {
  return {
    auth: {
      getSession: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      ...authOverrides,
    },
  };
}

// ---------------------------------------------------------------------------
// RED tests
// ---------------------------------------------------------------------------

describe("supabase browser factory — @supabase/ssr swap", () => {
  it("returns null when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");

    const { createBrowserClient: sut } = await loadSut();
    const result = sut();

    expect(result).toBeNull();
    expect(mockCreateBrowserClient).not.toHaveBeenCalled();
  });

  it("returns null when NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { createBrowserClient: sut } = await loadSut();
    const result = sut();

    expect(result).toBeNull();
    expect(mockCreateBrowserClient).not.toHaveBeenCalled();
  });

  it("calls @supabase/ssr createBrowserClient with env url + key when both are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key-123");

    const fake = makeFakeClient();
    mockCreateBrowserClient.mockReturnValue(fake);

    const { createBrowserClient: sut } = await loadSut();
    const result = sut();

    expect(result).toBe(fake);
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    const [url, key] = mockCreateBrowserClient.mock.calls[0]!;
    expect(url).toBe("https://test.supabase.co");
    expect(key).toBe("publishable-key-123");
  });

  it("configures auth toggles: persistSession=true, autoRefreshToken=true, detectSessionInUrl=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    const fake = makeFakeClient();
    mockCreateBrowserClient.mockReturnValue(fake);

    const { createBrowserClient: sut } = await loadSut();
    sut();

    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    const options = mockCreateBrowserClient.mock.calls[0]![2] as
      | { auth?: { persistSession?: boolean; autoRefreshToken?: boolean; detectSessionInUrl?: boolean } }
      | undefined;
    expect(options).toBeDefined();
    expect(options?.auth?.persistSession).toBe(true);
    expect(options?.auth?.autoRefreshToken).toBe(true);
    expect(options?.auth?.detectSessionInUrl).toBe(true);
  });

  it("preserves singleton behavior — returns same client on repeat calls", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    const fake = makeFakeClient();
    mockCreateBrowserClient.mockReturnValue(fake);

    const { createBrowserClient: sut } = await loadSut();

    const first = sut();
    const second = sut();
    const third = sut();

    expect(first).toBe(fake);
    expect(second).toBe(fake);
    expect(third).toBe(fake);
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
  });

  it("returns null when createBrowserClient throws (malformed URL/key)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");

    mockCreateBrowserClient.mockImplementation(() => {
      throw new Error("invalid URL");
    });

    const { createBrowserClient: sut } = await loadSut();
    const result = sut();

    expect(result).toBeNull();
  });

  it("returns the same null reference for repeat calls when env is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const { createBrowserClient: sut } = await loadSut();
    expect(sut()).toBeNull();
    expect(sut()).toBeNull();
    expect(mockCreateBrowserClient).not.toHaveBeenCalled();
  });
});