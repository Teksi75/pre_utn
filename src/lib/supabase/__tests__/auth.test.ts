/**
 * Tests for src/lib/supabase/auth.ts
 *
 * Verifies the auth helper wrappers around the singleton browser client:
 * - signInWithMagicLink: passes emailRedirectTo: "/auth/callback" to signInWithOtp
 * - getCurrentSession: forwards to client.auth.getSession()
 * - signOut: forwards to client.auth.signOut()
 * - onAuthStateChange: forwards and exposes unsubscribe()
 *
 * Spec: REQ-AUTH-1 — "signInWithOtp with emailRedirectTo set to /auth/callback"
 * Spec: REQ-AUTH-5 — "signOut MUST clear the Supabase session"
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock state — vi.mock factories are hoisted, so we need vi.hoisted()
// to share state between the factory and the test body.
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => {
  return {
    client: null as null | {
      auth: {
        signInWithOtp: ReturnType<typeof vi.fn>;
        getSession: ReturnType<typeof vi.fn>;
        signOut: ReturnType<typeof vi.fn>;
        onAuthStateChange: ReturnType<typeof vi.fn>;
      };
    },
  };
});

vi.mock("../browser", () => ({
  createBrowserClient: () => mockState.client,
}));

function makeMockClient() {
  return {
    auth: {
      signInWithOtp: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  };
}

function setMockClient() {
  mockState.client = makeMockClient();
}

beforeEach(() => {
  setMockClient();
});

async function loadSut() {
  return import("../auth");
}

function client() {
  if (!mockState.client) throw new Error("mockState.client not set");
  return mockState.client;
}

// ---------------------------------------------------------------------------
// signInWithMagicLink
// ---------------------------------------------------------------------------

describe("signInWithMagicLink", () => {
  it("calls supabase.auth.signInWithOtp with the email", async () => {
    client().auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const { signInWithMagicLink } = await loadSut();
    await signInWithMagicLink("alumno@example.com");

    expect(client().auth.signInWithOtp).toHaveBeenCalledTimes(1);
    const args = client().auth.signInWithOtp.mock.calls[0]!;
    expect(args[0]).toMatchObject({ email: "alumno@example.com" });
  });

  it("passes emailRedirectTo: '/auth/callback' inside options", async () => {
    client().auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    const { signInWithMagicLink } = await loadSut();
    await signInWithMagicLink("alumno@example.com");

    expect(client().auth.signInWithOtp).toHaveBeenCalledTimes(1);
    const args = client().auth.signInWithOtp.mock.calls[0]!;
    expect(args[0]).toMatchObject({
      email: "alumno@example.com",
      options: { emailRedirectTo: "/auth/callback" },
    });
  });

  it("returns the supabase data verbatim on success", async () => {
    const supabaseData = { user: null, session: null };
    client().auth.signInWithOtp.mockResolvedValue({
      data: supabaseData,
      error: null,
    });

    const { signInWithMagicLink } = await loadSut();
    const result = await signInWithMagicLink("alumno@example.com");

    expect(result.data).toBe(supabaseData);
    expect(result.error).toBeNull();
  });

  it("returns the supabase error verbatim on failure", async () => {
    const supabaseError = { message: "Rate limit exceeded", status: 429 };
    client().auth.signInWithOtp.mockResolvedValue({
      data: {},
      error: supabaseError,
    });

    const { signInWithMagicLink } = await loadSut();
    const result = await signInWithMagicLink("alumno@example.com");

    expect(result.error).toBe(supabaseError);
  });
});

// ---------------------------------------------------------------------------
// getCurrentSession
// ---------------------------------------------------------------------------

describe("getCurrentSession", () => {
  it("forwards to client.auth.getSession and returns its result", async () => {
    const fakeSession = {
      access_token: "token",
      user: { id: "user-1", email: "a@b.co" },
    };
    client().auth.getSession.mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    const { getCurrentSession } = await loadSut();
    const result = await getCurrentSession();

    expect(client().auth.getSession).toHaveBeenCalledTimes(1);
    expect(result.session).toBe(fakeSession);
    expect(result.error).toBeNull();
  });

  it("returns error from supabase getSession", async () => {
    const supabaseError = { message: "Token expired" };
    client().auth.getSession.mockResolvedValue({
      data: { session: null },
      error: supabaseError,
    });

    const { getCurrentSession } = await loadSut();
    const result = await getCurrentSession();

    expect(result.session).toBeNull();
    expect(result.error).toBe(supabaseError);
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------

describe("signOut", () => {
  it("forwards to client.auth.signOut", async () => {
    client().auth.signOut.mockResolvedValue({ error: null });

    const { signOut } = await loadSut();
    const result = await signOut();

    expect(client().auth.signOut).toHaveBeenCalledTimes(1);
    expect(result.error).toBeNull();
  });

  it("returns supabase error on sign-out failure", async () => {
    const supabaseError = { message: "Network error" };
    client().auth.signOut.mockResolvedValue({ error: supabaseError });

    const { signOut } = await loadSut();
    const result = await signOut();

    expect(result.error).toBe(supabaseError);
  });
});

// ---------------------------------------------------------------------------
// onAuthStateChange
// ---------------------------------------------------------------------------

describe("onAuthStateChange", () => {
  it("forwards the callback to client.auth.onAuthStateChange", async () => {
    const fakeSubscription = { unsubscribe: vi.fn() };
    client().auth.onAuthStateChange.mockReturnValue({
      data: { subscription: fakeSubscription },
    });
    const callback = vi.fn();

    const { onAuthStateChange } = await loadSut();
    const handle = onAuthStateChange(callback);

    expect(client().auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(client().auth.onAuthStateChange).toHaveBeenCalledWith(callback);
    expect(handle).toBeDefined();
  });

  it("exposes unsubscribe() that calls the supabase subscription's unsubscribe", async () => {
    const fakeUnsubscribe = vi.fn();
    client().auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: fakeUnsubscribe } },
    });

    const { onAuthStateChange } = await loadSut();
    const handle = onAuthStateChange(() => {});

    expect(handle.unsubscribe).toBe(fakeUnsubscribe);
    handle.unsubscribe();
    expect(fakeUnsubscribe).toHaveBeenCalledTimes(1);
  });
});