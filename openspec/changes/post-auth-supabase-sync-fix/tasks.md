# Tasks: post-auth-supabase-sync-fix

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
450-line budget risk: High
Estimated changed lines: ~600-750 (logic + characterization tests across 9 files)
Delivery strategy: auto-chain

Work units (both start from `origin/main`, PR1 merges first):
- **PR1 — auth domain**: idempotent orchestrator + FK-first + remote-empty fallback + readiness API in `src/lib/auth/` + `src/lib/persistence/`. No UI.
- **PR2 — UI wiring**: `AuthBootstrap` INITIAL_SESSION, `PersistenceInitializer` awaits readiness, `Nav` sync-status, `Home` non-skeleton fallback. Depends on PR1.

## PR1.1 — Auth Domain RED

- [x] 1.1 RED `src/lib/auth/__tests__/link-and-import.test.ts`: `linkActiveProfileToAuthUser` awaited BEFORE `importLocalProgressToRemote` (REQ-NEW-2c).
- [x] 1.2 RED same file: 2 calls same `user.id` run import/upsert branch once (REQ-AUTH-3 dedupe).
- [x] 1.3 RED new `src/lib/auth/__tests__/post-auth-sync-status.test.ts`: `pending | ready | local-fallback`.

## PR1.2 — Auth Domain GREEN

- [x] 2.1 GREEN `src/lib/auth/link-and-import.ts`: `Map<userId, Promise<LinkImportOutcome>>` guard; bail + clear on completion.
- [x] 2.2 GREEN same file: FK link BEFORE import writes in `link-and-import` branch.
- [x] 2.3 GREEN new `src/lib/auth/post-auth-sync.ts`: export status + begin/get/wait.
- [x] 2.4 GREEN `src/lib/persistence/adapter-config.ts`: re-export readiness + `waitForPostAuthSync()`.
- [x] 2.5 REFACTOR extract shared session/auth guard.

## PR1.3 — Selector + Adapter

- [x] 3.1 RED new `src/lib/persistence/__tests__/selector.test.ts`: remote-empty + local-has → local slice + `persistence.fallback` event.
- [x] 3.2 RED new `src/lib/persistence/__tests__/supabase-adapter-empty-progress.test.ts`: `EMPTY_PROGRESS` NOT canonical.
- [x] 3.3 GREEN `src/lib/persistence/selector.ts`: detect remote-empty + local-has → local slice + fallback event.
- [x] 3.4 GREEN `src/lib/persistence/supabase-adapter.ts`: keep `EMPTY_PROGRESS` as sentinel; do not collapse.

## PR1.4 — PR1 BLOCKER FIXES (fresh 4R review)

Fresh review of PR1 found six auth-domain/persistence blockers. These tasks
fix each blocker with TDD: RED failing regression test → GREEN production fix.

- [x] B1 RED selector.test.ts: `__remoteUnavailable` sentinel + local empty → returns LOCAL empty (NOT the sentinel). Also: write `{ok:false}` regression test. Renamed misleading `{ok:false}` test name.
- [x] B1 GREEN `src/lib/persistence/selector.ts`: specialized `loadProgress` delegates through standard fallback (`__remoteUnavailable` + throws) BEFORE applying the remote-empty/local-has recovery branch.
- [x] B2/B3 RED link-and-import.test.ts: orchestrator returns explicit `LinkImportOutcome` `{kind:"ready"} | {kind:"local-fallback", reason, branch, partialFields?}`. Specifically: profile-link-fails → import NOT attempted + outcome `local-fallback / profile-link-failed`; import-fail-no-fields → `import-failed`; import-fail-partial → `import-partial`; import-success → `ready`.
- [x] B2/B3 GREEN `src/lib/auth/link-and-import.ts`: orchestrator returns discriminated outcome. `linkActiveProfileToAuthUserWithResult` (new internal) is awaited; if `{ok:false}`, import branch is SKIPPED. Import result `{ok:false}` is mapped to `import-failed` (0 fields) or `import-partial` (some fields).
- [x] B2 GREEN `src/lib/auth/link-profile.ts`: `linkActiveProfileToAuthUserWithResult()` returns `Promise<LinkProfileResult>` (discriminated `{ok:true} | {ok:false, reason}`). The void `linkActiveProfileToAuthUser()` remains as a thin wrapper for fire-and-forget callers (preserves the existing 7-test contract).
- [x] B2 GREEN `src/lib/auth/post-auth-sync.ts`: `beginPostAuthSync` translates orchestrator outcome into `PostAuthSyncStatus` — `outcome.kind === "local-fallback"` → status `"local-fallback"` (never falsely `"ready"`).
- [x] B4 RED post-auth-sync-status.test.ts: cross-user pending — user A pending → user B starts own sync (NOT shared via single-slot `currentPromise`).
- [x] B4 GREEN `src/lib/auth/post-auth-sync.ts`: `currentPromise` → `inflightByUser: Map<userId, ...>` so concurrent users get independent orchestrator runs.
- [x] B5 RED post-auth-sync-status.test.ts: sign in → sync completes → clearPostAuthSyncStatus(userId) → same user sign in re-runs orchestrator.
- [x] B5 GREEN `src/lib/auth/post-auth-sync.ts`: `clearPostAuthSyncStatus(userId)` clears BOTH this module's `completedSyncs` + `inflightByUser` AND the orchestrator's `syncPromises` via `clearPostAuthSyncState(userId)`. Single source of truth for the SIGNED_OUT → SIGNED_IN cycle.
- [x] B6 RED hygiene: misleading `{ok:false}` test name → renamed to "remote throws → returns LOCAL + emits fallback event"; new dedicated test for write `{ok:false}` semantics; dead `EMPTY_PROGRESS;` expression removed from `supabase-adapter-empty-progress.test.ts`.
- [x] B6 GREEN hygiene: JSDoc in `link-and-import.ts` and `link-profile.ts` updated to reflect `linkActiveProfileToAuthUserWithResult` + `LinkImportOutcome`; `tasks.md` PR1.4 added with B1–B6 sections; stale comments removed.

## PR1.5 — Gate

- [x] 5.1 `pnpm run test` — PR1 green, no regressions. (2926/2926 tests pass — +14 vs PR1.4 baseline 2912.)
- [x] 5.2 `pnpm run typecheck` clean.
- [x] 5.3 `pnpm run build` clean. (11 routes built.)
- [ ] 5.4 Merge PR1 to `origin/main`. (Orchestrator responsibility per `apply` instruction: do not commit/push in this batch.)

## PR1.6 — PR1.5 FRESH-FRESH-REVIEW FIXES

Fresh review of PR1.5 surfaced two new blockers + a hygiene round.
These tasks fix each item with strict TDD: RED failing regression test
→ GREEN production fix → topic-keyed JSDoc on the resulting invariant.

- [x] C1 RED `src/lib/auth/__tests__/post-auth-sync-status.test.ts`: A completes `local-fallback`, B completes `ready`, calling A again returns `local-fallback` (not the global `currentStatus` snapshot which is now `ready`).
- [x] C1 GREEN `src/lib/auth/post-auth-sync.ts`: `completedSyncs: Set<userId>` → `completedByUser: Map<userId, PostAuthSyncStatus>`. `beginPostAuthSync` short-circuits to the per-userId cached status when present; global `currentStatus` remains as a snapshot of the latest transition for components reading `getPostAuthSyncStatus()`.
- [x] C2 RED `src/lib/auth/__tests__/post-auth-sync-status.test.ts`: `clearPostAuthSyncStatus(userId)` while a sync is pending → resolving the old promise must NOT overwrite `currentStatus` or repopulate the per-userId cache.
- [x] C2 GREEN `src/lib/auth/post-auth-sync.ts`: each in-flight entry carries a monotonic `token`. Late resolutions compare the captured token against the current entry's token — mismatch (entry cleared or replaced) suppresses the write.
- [x] C3 RED `src/components/auth/__tests__/AuthBootstrap.test.tsx`: production SIGNED_OUT path must call `clearPostAuthSyncStatus(userId)` and capture `lastUserId` from the SIGNED_IN branch.
- [x] C3 GREEN `src/components/auth/AuthBootstrap.tsx`: closure variable `lastUserId` is set on `SIGNED_IN` and forwarded to `clearPostAuthSyncStatus` on `SIGNED_OUT`. Existing `reinitializePersistence()` call preserved.
- [x] C4 hygiene: removed review-process `blocker 2/3/4/5` references from production + tests; replaced with topic-keyed JSDoc explaining the current invariant.

## PR1.7 — Gate

- [x] 6.1 `pnpm run test` — PR1 green, no regressions. (2930/2930 tests pass — +4 vs PR1.5 baseline 2926.)
- [x] 6.2 `pnpm run typecheck` clean.
- [x] 6.3 `pnpm run build` clean. (11 routes built.)
- [ ] 6.4 Merge PR1 to `origin/main`. (Orchestrator responsibility per `apply` instruction: do not commit/push in this batch.)

## PR1.8 — PR1.7 FRESH-FRESH-3R REVIEW FIXES

Fresh re-review of PR1.7 surfaced two final merge-blocking gaps. These
tasks fix each with strict TDD: RED failing regression test → GREEN
production fix → topic-keyed JSDoc on the resulting invariant.

- [x] D1 RED `src/lib/auth/__tests__/post-auth-sync-status.test.ts`: after a completed `'ready'` sync, `clearPostAuthSyncStatus(userId)` must reset the global `currentStatus` snapshot to `'signed-out'` so a later `getPostAuthSyncStatus()` call (the public API Nav reads) does not see the stale `'ready'`. Same test for `'local-fallback'` completed status. Same test with two users (A:ready, B:local-fallback, clear A → 'signed-out', not B's snapshot).
- [x] D1 RED `src/lib/auth/__tests__/post-auth-sync-status.test.ts` (strengthened): existing "clear while promise pending" assertion tightened from `not.toBe('local-fallback')` to `toBe('signed-out')` — proves the token guard plus the explicit clear both keep `currentStatus` pinned to the safe non-ready state even when a stale promise resolves late.
- [x] D1 GREEN `src/lib/auth/post-auth-sync.ts`: `clearPostAuthSyncStatus(userId)` now also resets `currentStatus = "signed-out"`. JSDoc updated to document that `currentStatus` is part of the public snapshot and resets on clear.
- [x] D2 RED `src/lib/auth/__tests__/import-local-progress.test.ts`: (a) noop must report `failedFields: []`; (b) full success must report `failedFields: []`; (c) partial failure must report `ok: false` (was `ok: true`) with `failedFields: ["progress"]`; (d) full failure must report `failedFields: [all three]`. Contract JSDoc updated.
- [x] D2 RED `src/lib/auth/__tests__/post-auth-sync-status.test.ts`: E2E through status — orchestrator returns `{kind:'local-fallback', reason:'import-partial', partialFields:['progress']}` → `getPostAuthSyncStatus()` returns `'local-fallback'`, never falsely `'ready'`. Regression guard.
- [x] D2 GREEN `src/lib/auth/import-local-progress.ts`: added `failedFields: ImportableField[]` to `ImportResult` (always present); tracks failure on every field; `ok` is now `failedFields.length === 0` so partial failure reports `ok: false` and the orchestrator maps to `local-fallback / import-partial` via the existing branch.

## PR1.9 — Gate

- [x] 7.1 `pnpm run test:run` — PR1 green, no regressions. (2934/2934 tests pass — +4 vs PR1.7 baseline 2930.)
- [x] 7.2 `pnpm run typecheck` clean.
- [x] 7.3 `pnpm run build` clean. (11 routes built.)
- [ ] 7.4 Merge PR1 to `origin/main`. (Orchestrator responsibility per `apply` instruction: do not commit/push in this batch.)

## PR1.10 — PARTIAL-IMPORT WRAPPER BLOCKER FIX (fresh resilience review)

A fresh resilience review of the PR1 baseline found that the
`local-fallback` post-auth-sync status alone was not enough to keep
local diagnostic and study-plan data visible: even when status was
`local-fallback`, the persistence adapter selector could still go
remote (because `hasRemoteSession` is set independently by the UI),
and the wrapper for `loadDiagnosticResult`/`loadStudyPlan` used the
plain `attempt()` helper, which treats a successful remote `null`
read as authoritative. That hid any local diagnostic or study plan
the student had completed.

The `loadProgress` branch already had the right structure (specialized
two-stage recovery that recovers local on remote-empty). This task
applies the same invariant to the nullable READ methods.

- [x] E1 RED `src/lib/persistence/__tests__/selector.test.ts`: 10 new tests across two new describe blocks — `loadDiagnosticResult remote-null + local-has branch` and `loadStudyPlan remote-null + local-has branch`. Each block covers: (1) BLOCKER FIX remote null + local has → local + fallback event; (2) sanity remote null + local null → null (no event); (3) sanity remote real + local null → remote (no event); (4) regression remote throws → local + fallback event; (5) regression remote `__remoteUnavailable` + local has → local + fallback event.
- [x] E1 GREEN `src/lib/persistence/selector.ts`: extended `withLocalFallback.loadDiagnosticResult` and `withLocalFallback.loadStudyPlan` with the same two-stage structure as `loadProgress` — Stage 1 (sentinel + throws → local + fallback event, sentinel never leaks) then Stage 2 (remote `null` + local has data → local + fallback event; remote has data → remote wins; both `null` → local `null`).
- [x] E1 hygiene: extended `makeRemoteAdapter` / `makeLocalAdapter` test helpers to accept optional `loadDiagnosticResult` / `loadStudyPlan` overrides with `null`-default (backward-compatible with existing 8 `loadProgress` tests).

## PR1.11 — Gate

- [x] 8.1 `pnpm run test:run` — PR1 green, no regressions. (2944/2944 tests pass — +10 vs PR1.9 baseline 2934.)
- [x] 8.2 `pnpm run typecheck` clean.
- [x] 8.3 `pnpm run build` clean. (11 routes built.)
- [ ] 8.4 Merge PR1 to `origin/main`. (Orchestrator responsibility per `apply` instruction: do not commit/push in this batch.)

## PR1.12 — FINAL RELIABILITY REVIEW COVERAGE COMPLETION

A final reliability review of PR1.10/E1 found one test-coverage gap only:
the BLOCKER FIX matrix proves the wrapper preserves remote canonical reads
when remote returns a non-null `DiagnosticResult` / `StudyPlan` and local is
null, but does NOT prove the same invariant when local also has DIFFERENT
non-null data. The implementation already handles this case correctly
(both `loadDiagnosticResult` and `loadStudyPlan` Stage 2 return `remoteResult`
when `remoteResult !== null` regardless of local), but no test locked in
that branch.

This batch is test-only — no production change. Strict TDD: RED test
written first; GREEN immediately because the implementation already
covers the case. The new tests are regression-prevention guards for the
"remote canonical when both have data and disagree" invariant.

- [x] F1 RED `src/lib/persistence/__tests__/selector.test.ts`: `loadDiagnosticResult` — remote non-null + local DIFFERENT non-null → returns REMOTE (remote wins, no fallback event). LOCKED IN.
- [x] F2 RED `src/lib/persistence/__tests__/selector.test.ts`: `loadStudyPlan` — remote non-null + local DIFFERENT non-null → returns REMOTE (remote wins, no fallback event). LOCKED IN.
- [x] F3 `pnpm run test:run` — 2946/2946 tests pass (+2 vs PR1.10 baseline 2944). `pnpm run typecheck` clean. `pnpm run build` clean (11 routes).

## PR2.1 — UI Wiring RED

- [x] 7.1 RED `src/components/auth/__tests__/AuthBootstrap.test.tsx`: `INITIAL_SESSION` triggers orchestrator once even if `SIGNED_IN` follows. (+6 tests: shared branch with `beginPostAuthSync`, lastUserId capture in both branches, no separate case.)
- [x] 7.2 RED new `src/components/home/__tests__/HomeNextStepClient.fallback.test.tsx`: pending/rejected → actionable VM, no skeleton. (10 tests: no silent catch, EMPTY_PROGRESS fallback, viewModel always non-null, a11y preserved.)
- [x] 7.3 RED `src/components/__tests__/Nav-auth.test.ts`: `pending` → no sync pill; Diagnostic + Practice remain. (+9 tests: pill gated on `syncStatus === "ready"` not session, honest pending/fallback copy, live updates via `usePostAuthSyncStatus`.)
- [x] 7.4 RED `src/components/__tests__/PersistenceInitializer.test.ts`: session-aware readiness path. (+7 tests: imports readiness surface, reads `getCurrentSession()`, awaits `beginPostAuthSync` before `reinitializePersistence`, forwards session, legacy `initializePersistence` preserved.)
- [x] 7.5 RED new `src/hooks/__tests__/usePostAuthSyncStatus.test.ts`: live status subscription hook. (9 tests: `useSyncExternalStore` shape, `subscribePostAuthSyncChange` as first arg, `getSnapshot`/`getServerSnapshot`, SSR safety.)

## PR2.2 — UI Wiring GREEN

- [x] 8.1 GREEN `src/components/auth/AuthBootstrap.tsx`: branch `INITIAL_SESSION` to same orchestrator flow as `SIGNED_IN` (shared `event === "SIGNED_IN" || event === "INITIAL_SESSION"` conditional; switched to `beginPostAuthSync(session)` from `@/lib/persistence/adapter-config`).
- [x] 8.2 GREEN `src/components/PersistenceInitializer.tsx`: `getCurrentSession()` → `await beginPostAuthSync(session)` → `await reinitializePersistence()` when session exists. Legacy `initializePersistence()` path preserved.
- [x] 8.3 GREEN `src/components/Nav.tsx`: sync pill from `usePostAuthSyncStatus()`, not session alone. Four honest status branches: signed-out (Link to /cuenta/ingresar), pending ("Sincronizando tu cuenta"), local-fallback ("Trabajo local guardado"), ready (synchronized pill).
- [x] 8.4 GREEN `src/components/home/HomeNextStepClient.tsx`: replace silent `.catch(() => {})` with `handleResults(EMPTY_PROGRESS, null)` for progress failures and `handleResults(progress, null)` for diag-only failures. Imported `EMPTY_PROGRESS`.
- [x] 8.5 GREEN new `src/hooks/usePostAuthSyncStatus.ts`: `useSyncExternalStore(subscribePostAuthSyncChange, getPostAuthSyncStatus, getPostAuthSyncServerSnapshot)` hook for live status subscription.
- [x] 8.6 GREEN `src/lib/auth/post-auth-sync.ts`: added `subscribePostAuthSyncChange()` + `getPostAuthSyncServerSnapshot()` exports; wired `emitPostAuthSyncChange()` on every transition (sign-out, disabled, pending, settled, cleared).
- [x] 8.7 GREEN `src/lib/persistence/adapter-config.ts`: re-exports the new surface (`subscribePostAuthSyncChange`, `getPostAuthSyncServerSnapshot`).

## PR2.3 — Gate

- [x] 9.1 `pnpm run test:run` green incl. 5 new PR2 suites. (2987/2987 tests pass — +41 vs PR1.12 baseline 2946.)
- [x] 9.2 `pnpm run typecheck` clean.
- [x] 9.3 `pnpm run build` clean (11 routes built).
- [ ] 9.4 GGA pre-commit pass. (Orchestrator responsibility per `apply` instruction: do not commit/push in this batch.)
- [ ] 9.5 Fresh review: re-run 10 criteria vs PR2 + `origin/main`. (Orchestrator responsibility per `apply` instruction: do not commit/push in this batch.)
- [ ] 9.6 Merge PR2 to `origin/main`. (Orchestrator responsibility per `apply` instruction: do not commit/push in this batch.)

## Archive

- [ ] 10.1 Update `STATUS.json`: `status: "done"`, `branch: null`.
- [ ] 10.2 `pnpm run audit:branches` — no zombies.
- [ ] 10.3 Delete feature branches local + remote.
- [ ] 10.4 Hand off `sdd-verify` → `sdd-archive`.

## Invariant → Task Map

All 10 criteria covered: (1)(2)→1.2/7.1/2.1/8.1 · (3)→1.1/2.2 · (4)→3.1–3.4 · (5)→7.3/8.3 · (6)→7.2/8.4 · (7)(8)→8.4/9.1 · (9)→1.1/3.1 · (10)→3.2/3.4.

Blocker → Task Map:
- B1 (selector remote-failure bypass): PR1.4 B1
- B2 (sync-failure swallowed → ready): PR1.4 B2
- B3 (FK-before-snapshot readiness): PR1.4 B2/B3 (linkResult.ok gate)
- B4 (cross-user idempotency): PR1.4 B4
- B5 (clear path): PR1.4 B5
- B6 (readability hygiene): PR1.4 B6
- C1 (per-userId completed-status cache): PR1.6 C1
- C2 (stale in-flight writes after clear): PR1.6 C2
- C3 (production AuthBootstrap SIGNED_OUT wiring): PR1.6 C3
- C4 (review-process comments → invariant JSDoc): PR1.6 C4
- D1 (public status reset on clear): PR1.8 D1
- D2 (partial import semantics + observability): PR1.8 D2
- E1 (wrapper hides local diagnostic/study-plan when remote is null): PR1.10 E1
- F1 (test-coverage gap: remote canonical when both adapters have different data — diagnostic): PR1.12 F1
- F2 (test-coverage gap: remote canonical when both adapters have different data — study plan): PR1.12 F2

## PR2.10 — PR2 FRESH-REVIEW BLOCKER FIXES

A fresh 4R review of PR2 surfaced four blockers that must be fixed
before PR2 can be merged:

- [x] B1 RED `src/components/__tests__/PersistenceInitializer.behavior.test.ts`: 7 behavioral tests proving the FK-before-snapshot readiness invariant (session-present path awaits `beginPostAuthSync(session)` BEFORE `reinitializePersistence`).
- [x] B1 GREEN `src/components/PersistenceInitializer.tsx`: extracted `runPersistenceInit(deps)`; session-present path now awaits the orchestrator BEFORE the selector runs (no remote-empty read can race the FK upsert). The no-session path still calls `initializePersistence` for the legacy contract.
- [x] B2 (AuthBootstrap) RED `src/components/auth/__tests__/AuthBootstrap.behavior.test.tsx`: behavioral tests with mocked deps simulating INITIAL_SESSION + SIGNED_IN events; asserts dedupe, FK-before-snapshot ordering, lastUserId capture, clear path, defensive paths, no-op events, and stale session-change suppression.
- [x] B2 (AuthBootstrap) GREEN `src/components/auth/AuthBootstrap.tsx`: extracted `createAuthEventHandler(deps)` returning the `onAuthStateChange` callback. Component is a thin wrapper wiring the production deps.
- [x] B2 (Nav) RED `src/components/__tests__/Nav.behavior.test.tsx`: 10 behavioral tests rendering `SyncStatusBadge` with mocked status states via `react-dom/server`.
- [x] B2 (Nav) GREEN `src/components/SyncStatusBadge.tsx`: NEW file extracting the sync pill JSX. `src/components/Nav.tsx` now imports + uses it.
- [x] B2 (HomeNextStepClient) RED `src/components/home/__tests__/HomeNextStepClient.behavior.test.tsx`: behavioral tests with mocked `loadProgress` + `loadDiagnosticResult` covering the sync/async/reject matrix, including progress failing before a delayed diagnostic rejection.
- [x] B2 (HomeNextStepClient) GREEN `src/components/home/HomeNextStepClient.tsx`: extracted `runHomeLoader(deps, handleResults)` and settled both loaders explicitly. Every code path calls `handleResults` and no loader promise is left floating.
- [x] B3 hygiene: rewrote production comments to explain current invariants only. Removed "blocker fix", "PR2 invariant", and other review-process references from PersistenceInitializer, AuthBootstrap, Nav, HomeNextStepClient.
- [x] B4 doc: noted in `apply-progress.md` PR2.10 section that PR2 PR base should be `feat/post-auth-supabase-sync-fix-pr1-domain` (not `origin/main`) until PR1 lands. Addresses stacked review surface without merging PR1 prematurely.
- [x] W1 (fallback sink) `src/components/auth/AuthBootstrap.tsx`: production wiring forwards the fallback sink to `reinitializePersistence({ onFallback: sink })` so observability is consistent across legacy first-init + auth-event reinit paths.
- [x] W2 (HomeNextStepClient cleanup) `src/components/home/HomeNextStepClient.tsx`: `useEffect` captures `cancelled` flag in cleanup; `handleResults` checks `cancelled` before calling `setViewModel` so a mid-flight student switch does not overwrite the new active student's view model.
- [x] W3 (AuthBootstrap stale handler guard) `src/components/auth/AuthBootstrap.tsx`: session-changing auth events increment a generation guard; stale sign-in handlers abort before `reinitializePersistence()` if sign-out/sign-in changed the active session while their sync awaited.
- [x] W4 (HomeNextStepClient promise handling) `src/components/home/HomeNextStepClient.tsx`: `runHomeLoader()` uses `Promise.allSettled` so a diagnostic rejection cannot float when progress fails first.
- [x] W5 (AuthBootstrap sign-out local reset) `src/lib/persistence/adapter-config.ts` + `src/components/auth/AuthBootstrap.tsx`: SIGNED_OUT now resets persistence explicitly to local without reading the live Supabase session, so a concurrent/new sign-in cannot be selected by a stale sign-out tail.

## PR2.11 — Gate (PR2.10 batch)

- [x] 11.1 `pnpm run test:run` — PR2 green, no regressions.
- [x] 11.2 `pnpm run typecheck` clean.
- [x] 11.3 `pnpm run build` clean (11 routes built).
- [x] 11.4 PR2 opened and later retargeted to `main` after PR1 landed.
- [x] 11.5 PR2 diff verified clean against `main` after PR1 merge.
- [x] 11.6 Fresh review against PR2 + `main` completed; blocker fixes tracked in W3/W4 and PR metadata.
- [ ] 11.7 GGA pre-commit pass. (Orchestrator responsibility.)

## Blocker → Task Map (PR2.10)

- B1 (FK-before-snapshot readiness race): PR2.10 B1
- B2 (source-scan tests as primary proof): PR2.10 B2 (AuthBootstrap / Nav / HomeNextStepClient)
- B3 (review-process comments in production): PR2.10 B3
- B4 (PR base for stacked review): PR2.10 B4
- W1 (fallback sink through reinit): PR2.10 W1
- W2 (HomeNextStepClient cleanup/sequence guard): PR2.10 W2
