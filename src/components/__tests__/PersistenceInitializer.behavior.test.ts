/**
 * Behavioral tests for src/components/PersistenceInitializer.tsx
 *
 * PR2 (post-auth-supabase-sync-fix) — fresh-review blocker fix.
 *
 * Goal: prove that when a Supabase Auth session already exists at app
 * startup, the post-auth sync readiness surface (`beginPostAuthSync`)
 * resolves BEFORE the persistence selector is invoked with
 * `hasRemoteSession=true`. Otherwise the first saveProgress() call
 * could race the FK upsert in `student_profiles` and fail the DB
 * constraint.
 *
 * Strategy: the component delegates to an extracted pure function
 * `runPersistenceInit(deps)`. Tests inject mock dependencies and
 * assert call ordering against the production protocol — no DOM,
 * no React renderToStaticMarkup, no module-mocking gymnastics.
 */

import { describe, it, expect, vi } from "vitest";
import { runPersistenceInit } from "@/components/PersistenceInitializer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void } {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeSink() {
  return vi.fn();
}

describe("PersistenceInitializer — PR2 blocker fix (behavioral)", () => {
  it("no-session path: initializePersistence() runs immediately (legacy contract)", async () => {
    // Baseline: when no session exists, the initializer must still call
    // initializePersistence() so the local adapter is wired. PR2 must
    // NOT regress this case.
    const initializePersistence = vi.fn(async () => undefined);
    const reinitializePersistence = vi.fn(async () => undefined);
    const beginPostAuthSync = vi.fn(async () => "signed-out" as const);
    const getCurrentSession = vi.fn(async () => ({
      session: null,
      error: null,
    }));

    await runPersistenceInit({
      getCurrentSession: getCurrentSession as never,
      beginPostAuthSync: beginPostAuthSync as never,
      initializePersistence: initializePersistence as never,
      reinitializePersistence: reinitializePersistence as never,
      sink: makeSink() as never,
    });

    expect(getCurrentSession).toHaveBeenCalledTimes(1);
    expect(initializePersistence).toHaveBeenCalledTimes(1);
    expect(reinitializePersistence).not.toHaveBeenCalled();
    expect(beginPostAuthSync).not.toHaveBeenCalled();
  });

  it("session-present path: beginPostAuthSync(session) is awaited BEFORE the selector runs", async () => {
    // Blocker fix: when a session exists, the FK row must be guaranteed
    // (via the orchestrator) BEFORE the selector flips to remote. So
    // beginPostAuthSync MUST resolve before the selector is invoked.
    // The previous behavior called initializePersistence immediately,
    // then awaited the orchestrator — wrong order.
    //
    // The selector may be `initializePersistence` OR
    // `reinitializePersistence` (design intent: reinitialize on the
    // session-present path). The test checks "selector ran AFTER
    // beginPostAuthSync", independent of which selector was used.
    const order: string[] = [];
    const initializePersistence = vi.fn(async () => {
      order.push("initializePersistence");
    });
    const reinitializePersistence = vi.fn(async () => {
      order.push("reinitializePersistence");
    });
    const beginPostAuthSync = vi.fn(async () => {
      order.push("beginPostAuthSync:start");
      // yield to microtask queue so callers see "started"
      await Promise.resolve();
      order.push("beginPostAuthSync:end");
      return "ready" as const;
    });
    const session = { user: { id: "auth-user-1" }, access_token: "t" };
    const getCurrentSession = vi.fn(async () => ({
      session,
      error: null,
    }));

    await runPersistenceInit({
      getCurrentSession: getCurrentSession as never,
      beginPostAuthSync: beginPostAuthSync as never,
      initializePersistence: initializePersistence as never,
      reinitializePersistence: reinitializePersistence as never,
      sink: makeSink() as never,
    });

    // beginPostAuthSync must complete BEFORE the selector runs.
    expect(beginPostAuthSync).toHaveBeenCalledTimes(1);
    expect(beginPostAuthSync).toHaveBeenCalledWith(session);
    const beginIdx = order.indexOf("beginPostAuthSync:end");
    const selectorIdx = Math.max(
      order.indexOf("initializePersistence"),
      order.indexOf("reinitializePersistence"),
    );
    expect(beginIdx).toBeGreaterThanOrEqual(0);
    expect(selectorIdx).toBeGreaterThan(beginIdx);
  });

  it("session-present path: deferred beginPostAuthSync — selector waits for orchestrator", async () => {
    // Stronger version: a slow orchestrator must still block the
    // selector call. The selector (initializePersistence or
    // reinitializePersistence) must not run until the orchestrator
    // settles.
    const dBegin = deferred<"ready">();
    const initializePersistence = vi.fn(async () => undefined);
    const reinitializePersistence = vi.fn(async () => undefined);
    const beginPostAuthSync = vi.fn(() => dBegin.promise);
    const session = { user: { id: "auth-user-1" }, access_token: "t" };
    const getCurrentSession = vi.fn(async () => ({ session, error: null }));

    const run = runPersistenceInit({
      getCurrentSession: getCurrentSession as never,
      beginPostAuthSync: beginPostAuthSync as never,
      initializePersistence: initializePersistence as never,
      reinitializePersistence: reinitializePersistence as never,
      sink: makeSink() as never,
    });

    // While the orchestrator is pending, neither selector must have run.
    await new Promise((r) => setTimeout(r, 0));
    expect(initializePersistence).not.toHaveBeenCalled();
    expect(reinitializePersistence).not.toHaveBeenCalled();

    // Resolve the orchestrator — now the session-present selector
    // (reinitializePersistence) must run.
    dBegin.resolve("ready");
    await run;

    expect(beginPostAuthSync).toHaveBeenCalledTimes(1);
    // The session-present path uses reinitializePersistence (not
    // initializePersistence) — design intent: this is a re-run.
    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(initializePersistence).not.toHaveBeenCalled();
  });

  it("session-present path: reinitializePersistence is preferred over initializePersistence when both available", async () => {
    // The design intent is "re-run the selector after readiness", not
    // "first-init the adapter again". When both are available, the
    // session-present path must use reinitializePersistence to make
    // intent explicit (this is a re-run, not a first init).
    const initializePersistence = vi.fn(async () => undefined);
    const reinitializePersistence = vi.fn(async () => undefined);
    const beginPostAuthSync = vi.fn(async () => "ready" as const);
    const session = { user: { id: "auth-user-1" }, access_token: "t" };
    const getCurrentSession = vi.fn(async () => ({ session, error: null }));

    await runPersistenceInit({
      getCurrentSession: getCurrentSession as never,
      beginPostAuthSync: beginPostAuthSync as never,
      initializePersistence: initializePersistence as never,
      reinitializePersistence: reinitializePersistence as never,
      sink: makeSink() as never,
    });

    expect(reinitializePersistence).toHaveBeenCalledTimes(1);
    expect(initializePersistence).not.toHaveBeenCalled();
  });

  it("getCurrentSession error: legacy initializePersistence still runs (no-throw contract)", async () => {
    // If getCurrentSession throws (network blip, race), the initializer
    // must still initialize the legacy local path so the app remains
    // usable. The error must not propagate.
    const initializePersistence = vi.fn(async () => undefined);
    const reinitializePersistence = vi.fn(async () => undefined);
    const beginPostAuthSync = vi.fn(async () => "ready" as const);
    const getCurrentSession = vi.fn(async () => {
      throw new Error("network-down");
    });

    await expect(
      runPersistenceInit({
        getCurrentSession: getCurrentSession as never,
        beginPostAuthSync: beginPostAuthSync as never,
        initializePersistence: initializePersistence as never,
        reinitializePersistence: reinitializePersistence as never,
        sink: makeSink() as never,
      })
    ).resolves.toBeUndefined();

    expect(initializePersistence).toHaveBeenCalledTimes(1);
    expect(reinitializePersistence).not.toHaveBeenCalled();
    expect(beginPostAuthSync).not.toHaveBeenCalled();
  });

  it("beginPostAuthSync throws: error is swallowed (legacy local init still works)", async () => {
    // If the orchestrator throws (regression), the user must still get
    // the local adapter wired. The error must not propagate.
    const initializePersistence = vi.fn(async () => undefined);
    const reinitializePersistence = vi.fn(async () => undefined);
    const beginPostAuthSync = vi.fn(async () => {
      throw new Error("orchestrator-failed");
    });
    const session = { user: { id: "auth-user-1" }, access_token: "t" };
    const getCurrentSession = vi.fn(async () => ({ session, error: null }));

    await expect(
      runPersistenceInit({
        getCurrentSession: getCurrentSession as never,
        beginPostAuthSync: beginPostAuthSync as never,
        initializePersistence: initializePersistence as never,
        reinitializePersistence: reinitializePersistence as never,
        sink: makeSink() as never,
      })
    ).resolves.toBeUndefined();

    // In the throwing-orchestrator path, the no-session-style fallback
    // must still wire the local adapter via initializePersistence.
    expect(initializePersistence).toHaveBeenCalledTimes(1);
  });

  it("fallback sink is forwarded to reinitializePersistence (session-present path)", async () => {
    // The production sink is the observability channel for fallback
    // events. The selector call (reinitializePersistence on the
    // session-present path) must receive the same sink so the
    // observability contract is preserved.
    const sink = makeSink();
    const initializePersistence = vi.fn(async () => undefined);
    const reinitializePersistence = vi.fn(async () => undefined);

    // Session-present path
    const beginPostAuthSync = vi.fn(async () => "ready" as const);
    const session = { user: { id: "auth-user-1" }, access_token: "t" };
    const getCurrentSession = vi.fn(async () => ({ session, error: null }));

    await runPersistenceInit({
      getCurrentSession: getCurrentSession as never,
      beginPostAuthSync: beginPostAuthSync as never,
      initializePersistence: initializePersistence as never,
      reinitializePersistence: reinitializePersistence as never,
      sink: sink as never,
    });

    expect(reinitializePersistence).toHaveBeenCalledWith({ onFallback: sink });
    expect(initializePersistence).not.toHaveBeenCalled();
  });
});