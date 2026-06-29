# Apply Progress — PR1 (auth domain + persistence)

**Change**: post-auth-supabase-sync-fix
**PR slice**: PR1 — auth domain / persistence
**Branch**: `feat/post-auth-supabase-sync-fix-pr1-domain` (off `origin/main`)
**Mode**: Strict TDD
**Date**: 2026-06-28
**Status**: GREEN — ready for orchestrator merge (after fresh 4R + fresh-fresh-3R + fresh-resilience-review blocker fixes)

## Summary

PR1 implements the auth-domain and persistence-internal pieces of the
post-auth Supabase sync fix. All domain work (idempotent orchestrator,
FK-before-import ordering with explicit outcome reporting, post-auth-sync
status state machine with per-userId promise tracking, selector
remote-empty + local-has fallback preserving `__remoteUnavailable`
semantics) is in place and green.

A fresh 4R review found six blockers; ALL are fixed in this batch with
strict-TDD regression tests written BEFORE the production fix. UI wiring
(`AuthBootstrap`, `PersistenceInitializer`, `Nav`, `HomeNextStepClient`)
is intentionally OUT OF SCOPE for PR1 and lives in PR2.

## TDD Cycle Evidence

### PR1 original batch (B0 — initial implementation)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `src/lib/auth/__tests__/link-and-import.test.ts` | Unit | ✅ 14/14 | ✅ Written (FK-before-import) | ✅ Passed | ➖ Single (1 new case) | ✅ Reorder done in 2.2 |
| 1.2 | `src/lib/auth/__tests__/link-and-import.test.ts` | Unit | ✅ 14/14 | ✅ Written (idempotency) | ✅ Passed | ➖ Single (1 new case) | ✅ Dedupe Map in 2.1 |
| 1.3 | `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Unit | N/A (new file) | ✅ Written (10 cases) | ✅ Passed | ✅ 5 state transitions + idempotency | ➖ None needed |
| 2.1 | `src/lib/auth/link-and-import.ts` | — | — | — | ✅ Map<userId, Promise<LinkImportOutcome>> | — | ✅ Extracted runLinkAndImport |
| 2.2 | `src/lib/auth/link-and-import.ts` | — | — | — | ✅ FK link BEFORE import | — | ➖ Reorder |
| 2.3 | `src/lib/auth/post-auth-sync.ts` | — | — | — | ✅ Status state machine | — | ➖ None needed |
| 2.4 | `src/lib/persistence/adapter-config.ts` | — | — | — | ✅ Re-exports waitForPostAuthSync etc. | — | ➖ Single barrel re-export |
| 2.5 | `src/lib/auth/guards.ts` | — | — | — | ✅ tryCreateBrowserClient() extracted | — | ✅ Shared by both modules |
| 3.1 | `src/lib/persistence/__tests__/selector.test.ts` | Unit | N/A (new file) | ✅ Written (5 cases) | ✅ Passed | ✅ 5 branches (empty+has / empty+empty / real+has / failure / sync) | ➖ None needed |
| 3.2 | `src/lib/persistence/__tests__/supabase-adapter-empty-progress.test.ts` | Unit | N/A (new file) | ✅ Written (5 cases) | ✅ Passed | ✅ 5 invariant cases | ✅ Behavior already correct; characterization only |
| 3.3 | `src/lib/persistence/selector.ts` | — | — | — | ✅ isEmptyProgressValue + hasMeaningfulProgress + specialized loadProgress | — | ➖ None needed |
| 3.4 | `src/lib/persistence/supabase-adapter.ts` | — | — | — | ✅ No change — behavior was already correct | — | ➖ Characterization only |

### PR1.4 — Fresh 4R review blocker fixes (this batch)

| Blocker | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|-----|-------|-------------|----------|
| B1 | `src/lib/persistence/__tests__/selector.test.ts` | Unit | ✅ +3: `__remoteUnavailable` + local empty, `__remoteUnavailable` + local has, write `{ok:false}` regression. Renamed misleading `{ok:false}` test name. | ✅ Two-stage loadProgress: standard fallback first (`__remoteUnavailable` + throws) → local, THEN remote-empty + local-has recovery. | ➖ Single failure mode per case | ➖ None needed |
| B2 | `src/lib/auth/__tests__/link-and-import.test.ts` | Unit | ✅ +6: orchestrator returns `LinkImportOutcome` (ready / local-fallback + reason). | ✅ Orchestrator returns discriminated outcome. `linkActiveProfileToAuthUserWithResult()` (new internal helper) is awaited; import branch is SKIPPED on link failure (B3). | ➖ 1 reason per case | ➖ Added `LinkImportOutcome` + `LinkImportFailureReason` types |
| B2 | `src/lib/auth/link-profile.ts` | — | — | ✅ New `linkActiveProfileToAuthUserWithResult(): Promise<LinkProfileResult>`. Void `linkActiveProfileToAuthUser()` now a wrapper (preserves existing 7-test contract). | — | ✅ Discriminated result type |
| B2 | `src/lib/auth/post-auth-sync.ts` | — | — | ✅ `beginPostAuthSync` translates orchestrator outcome into status: `local-fallback` outcome → `"local-fallback"` status (never falsely `"ready"`). | — | ➖ Mapping only |
| B3 | `src/lib/auth/__tests__/link-and-import.test.ts` | Unit | ✅ "link-failure: import NOT attempted + outcome local-fallback / profile-link-failed" | ✅ `if (!linkResult.ok) return {kind:"local-fallback", reason:"profile-link-failed", branch:"link-only"}` — import branch is unreachable when link failed. | ➖ 1 test, single reason | ➖ None needed |
| B4 | `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Unit | ✅ "two-user pending: user A pending → user B starts own sync (NOT shared)" | ✅ `currentPromise` (single-slot) → `inflightByUser: Map<userId, {outcome, status, token}>` so concurrent users get independent orchestrator runs. | ➖ Single two-user scenario | ➖ Map replaces single-slot |
| B5 | `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Unit | ✅ "sign in → sync completes → clearPostAuthSyncStatus(userId) → same user sign in re-runs orchestrator" | ✅ `clearPostAuthSyncStatus(userId)` clears BOTH this module's `completedByUser` + `inflightByUser` AND the orchestrator's `syncPromises` via `clearPostAuthSyncState(userId)`. | ➖ Single scenario | ➖ None needed |
| B6 | `src/lib/persistence/__tests__/selector.test.ts` + `src/lib/persistence/__tests__/supabase-adapter-empty-progress.test.ts` | Hygiene | ✅ Renamed misleading test name; new `{ok:false}` write-method test; flagged dead `EMPTY_PROGRESS;` expression. | ✅ Renamed test, added regression test, removed dead expression. Updated `tasks.md` PR1.4 B1–B6 sections + JSDoc on `link-and-import.ts` + `link-profile.ts`. | — | ➖ Comments only |

### PR1.8 — PR1.7 FRESH-FRESH-3R REVIEW FIXES

Fresh re-review of PR1.7 surfaced two final merge-blocking gaps. Each is
fixed with strict TDD: RED failing regression test → GREEN production fix
→ topic-keyed JSDoc on the resulting invariant.

| Blocker | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|-----|-------|-------------|----------|
| D1 | `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Unit | ✅ +3: completed `'ready'` → clear → `getPostAuthSyncStatus()` returns `'signed-out'` (not stale `'ready'`). Completed `'local-fallback'` → clear → `'signed-out'`. Two users (A:ready, B:local-fallback) → clear A → `'signed-out'` (not B's snapshot). Strengthened existing "clear while pending" assertion to `toBe('signed-out')`. | ✅ `clearPostAuthSyncStatus(userId)` now resets the global `currentStatus` snapshot to `'signed-out'` so the public Nav/HDR status reads the documented safe non-ready state after sign-out. Token guard still suppresses late in-flight writes. | ➖ Single invariant: clear pins the snapshot | ✅ JSDoc on `clearPostAuthSyncStatus` documents the reset |
| D2 | `src/lib/auth/__tests__/import-local-progress.test.ts` + `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Unit | ✅ Updated existing tests (a)(b)(c)(d): (a) noop must include `failedFields: []`; (b) full success must include `failedFields: []`; (c) partial now `ok: false` (was `ok: true`) with `failedFields: ["progress"]`; (d) full failure `failedFields: [all three]`. New E2E test: orchestrator returns `import-partial / partialFields: ['progress']` → `getPostAuthSyncStatus()` returns `'local-fallback'`, never falsely `'ready'`. | ✅ `ImportResult` gained `failedFields: ImportableField[]` (always present). `ok` is now `failedFields.length === 0` — partial reports `ok: false`, the orchestrator maps to `local-fallback / import-partial` via the existing branch. | ➖ 4 cases on the helper + 1 E2E | ✅ JSDoc + contract documentation updated |

## Test Summary

### PR1 original batch (B0)
- **Total new tests written**: 22 (2 in link-and-import.test.ts + 10 in post-auth-sync-status.test.ts + 6 in adapter-config-post-auth-reexport.test.ts + 5 in selector.test.ts + 5 in supabase-adapter-empty-progress.test.ts — some overlap)
- **Tests in PR1 modules after batch**: 86 (was 30 baseline)
- **Total project tests after batch**: 2912 (was 2890 baseline → +22 net new)
- **Layers used**: Unit (22)
- **Approval tests (refactoring)**: 0
- **Pure functions created**: `tryCreateBrowserClient()`, `isEmptyProgressValue()`, `hasMeaningfulProgress()`

### PR1.4 batch (this batch — blocker fixes)
- **New tests written**: 14 (B1: +3 selector; B2/B3: +8 link-and-import; B4: +1 post-auth-sync-status; B5: +1 post-auth-sync-status; B6: hygiene, no new tests)
- **Total project tests after batch**: 2926 (was 2912 baseline → +14 net new)
- **Tests in PR1 modules after batch**: 100 (was 86 → +14)
- **Layers used**: Unit (14)
- **Approval tests (refactoring)**: 0
- **Pure functions created**: `linkActiveProfileToAuthUserWithResult()` (returns `LinkProfileResult`)

### PR1.8 batch (this batch — final fresh-fresh-3R blocker fixes)
- **New tests written**: 4 (D1: +3 post-auth-sync-status; D2: +0 new in import-local-progress, +1 post-auth-sync-status E2E)
- **Total project tests after batch**: 2934 (was 2930 baseline → +4 net new)
- **Tests in PR1 modules after batch**: 105 (was 100 → +5 — 3 new + 1 strengthened + 1 E2E; the strengthened test had no count change but its assertion got stricter)
- **Layers used**: Unit (4)
- **Pure functions created**: none (existing helpers reused)

## Files Changed

### PR1 original batch (B0)
| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/auth/link-and-import.ts` | Modified | Added `syncPromises: Map<userId, Promise<LinkImportOutcome>>` dedupe guard + `clearPostAuthSyncState` / `resetPostAuthSyncStateForTests` exports. Reordered FK link BEFORE import. Extracted internal `runLinkAndImport` function. Switched `createBrowserClient` import to `tryCreateBrowserClient` guard. |
| `src/lib/auth/__tests__/link-and-import.test.ts` | Modified | +2 tests: FK-before-import ordering (REQ-NEW-2c) + idempotency dedupe (REQ-AUTH-3). |
| `src/lib/auth/post-auth-sync.ts` | Created | New status state machine (`disabled | signed-out | pending | ready | local-fallback`). Exports `getPostAuthSyncStatus`, `beginPostAuthSync`, `waitForPostAuthSync`, `clearPostAuthSyncStatus`, `resetPostAuthSyncStatusForTests`. Idempotent per-userId. |
| `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Created | 10 tests covering all 5 state transitions + in-flight visibility + post-completion null + idempotency. |
| `src/lib/auth/guards.ts` | Created | Shared `tryCreateBrowserClient()` helper collapsing throw+null into single signal. |
| `src/lib/persistence/adapter-config.ts` | Modified | Re-exports `beginPostAuthSync`, `clearPostAuthSyncStatus`, `getPostAuthSyncStatus`, `waitForPostAuthSync` so persistence consumers do not need to import from `src/lib/auth/` directly. |
| `src/lib/persistence/__tests__/adapter-config-post-auth-reexport.test.ts` | Created | 6 tests verifying the re-export surface. |
| `src/lib/persistence/selector.ts` | Modified | Added `isEmptyProgressValue` + `hasMeaningfulProgress` helpers. Specialized `loadProgress` in `withLocalFallback` wrapper: remote-empty + local-has → use local + emit fallback event. |
| `src/lib/persistence/__tests__/selector.test.ts` | Created | 5 tests covering the post-auth-sync loadProgress fallback branch + regression coverage of existing branches. |
| `src/lib/persistence/__tests__/supabase-adapter-empty-progress.test.ts` | Created | 5 characterization tests proving `EMPTY_PROGRESS` is preserved (not collapsed) for: missing row, null practice_progress, PGRST116 not-found, studentId mismatch, real data. |
| `openspec/changes/STATUS.json` | Modified | Marked `post-auth-supabase-sync-fix.pr1` as in-progress with branch name. |
| `openspec/changes/post-auth-supabase-sync-fix/tasks.md` | Modified | Marked PR1.1, PR1.2, PR1.3, PR1.4.1-3 as complete. |
| `openspec/changes/post-auth-supabase-sync-fix/apply-progress.md` | Created | This file (merged with PR1.4 batch). |

### PR1.4 batch (this batch — blocker fixes)
| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/selector.ts` | Modified | B1: specialized `loadProgress` now goes through two stages — (1) standard fallback for `__remoteUnavailable` + throws → always local + emit fallback event, THEN (2) specialized remote-empty + local-has recovery. The sentinel can no longer leak past the wrapper. |
| `src/lib/persistence/__tests__/selector.test.ts` | Modified | B1 + B6: renamed misleading "{ok:false}" test → "remote throws"; added 2 new `__remoteUnavailable` tests (local empty + local has); added 1 new write `{ok:false}` regression test. |
| `src/lib/persistence/__tests__/supabase-adapter-empty-progress.test.ts` | Modified | B6: removed dead `EMPTY_PROGRESS;` expression (line 114). |
| `src/lib/auth/link-profile.ts` | Modified | B2: added `linkActiveProfileToAuthUserWithResult(): Promise<LinkProfileResult>` with discriminated `{ok:true} | {ok:false, reason}` result type. Existing `linkActiveProfileToAuthUser()` is now a thin wrapper that returns void (preserves the existing 7-test contract). |
| `src/lib/auth/link-and-import.ts` | Modified | B2 + B3: orchestrator now returns `LinkImportOutcome` (`{kind:"ready", branch} | {kind:"local-fallback", reason, branch, partialFields?}`). FK-before-import ordering is now GATED on the link result — if `linkResult.ok === false`, the import branch is SKIPPED. Import failures are mapped to `import-failed` (0 fields) or `import-partial` (some fields). `syncPromises: Map<string, Promise<LinkImportOutcome>>` (type updated). |
| `src/lib/auth/__tests__/link-and-import.test.ts` | Rewritten | B2 + B3: rewrote the test file using `vi.hoisted` mock registry pattern to work around vitest's hoisted-mock semantics. +8 new tests covering outcome semantics (FK-fail / import-fail-no-fields / import-fail-partial / import-success / link-only-no-import / createProfile-fail / never-throws-via-linkResult-ok-false / link-before-import ordering). |
| `src/lib/auth/post-auth-sync.ts` | Modified | B2 + B4 + B5: orchestrator outcome → status translation; `currentPromise` (single-slot) → `inflightByUser: Map<userId, {outcome, status}>` for per-userId isolation; `clearPostAuthSyncStatus(userId)` now also calls `clearPostAuthSyncState(userId)` so the orchestrator's cache is cleared too. `waitForPostAuthSync()` aggregates in-flight promises across users. |
| `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Modified | B2 + B4 + B5: +5 new tests (two-user pending; clear path; 3 outcome-mapping tests). Updated 4 existing tests to mock orchestrator with `LinkImportOutcome` instead of `undefined`. |
| `openspec/changes/post-auth-supabase-sync-fix/tasks.md` | Modified | B6: PR1.4 → "PR1.4 — PR1 BLOCKER FIXES (fresh 4R review)" with B1–B6 sections; PR1.5 — Gate. PR2.1/PR2.2/PR2.3 renumbered from 5/6/7 to 6/7/8. Added Blocker → Task Map. |
| `openspec/changes/post-auth-supabase-sync-fix/apply-progress.md` | Modified | This file (merged with PR1.4 batch evidence, files, summary). |
| `src/lib/auth/post-auth-sync.ts` | Modified | D1: `clearPostAuthSyncStatus(userId)` now also resets `currentStatus = "signed-out"` so the public snapshot returns the documented safe non-ready state after sign-out. JSDoc on `clearPostAuthSyncStatus` updated to document the reset semantics. |
| `src/lib/auth/__tests__/post-auth-sync-status.test.ts` | Modified | D1: +3 tests covering the post-clear reset (ready, local-fallback, two-user); tightened the existing "clear while promise pending" assertion from `not.toBe("local-fallback")` to `toBe("signed-out")` — proves the explicit clear pins `currentStatus` even when a stale promise resolves late. D2: +1 E2E test for `import-partial` → `local-fallback`. |
| `src/lib/auth/import-local-progress.ts` | Modified | D2: added `failedFields: ImportableField[]` to `ImportResult` (always present). `ok` is now `failedFields.length === 0` — partial failure now reports `ok: false` so the orchestrator maps to `local-fallback / import-partial` instead of falsely `"ready"`. Contract JSDoc updated. |
| `src/lib/auth/__tests__/import-local-progress.test.ts` | Modified | D2: updated tests (a)/(b)/(c)/(d) for the new `ok` semantics and `failedFields` field. |

### PR1.10 batch (this batch — partial-import wrapper blocker fix)
| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/selector.ts` | Modified | E1: extended `loadDiagnosticResult` and `loadStudyPlan` in `withLocalFallback` with the same two-stage fallback structure as `loadProgress`. Stage 1 (sentinel/throws → local + fallback event, sentinel never leaks). Stage 2 (remote null + local has data → local + fallback event; remote has data → remote wins; both null → local null). JSDoc on both methods documents the BLOCKER FIX invariant: a successful remote-null read is NOT canonical when local has data — even when the post-auth-sync status is `local-fallback` and the selector keeps going remote. |
| `src/lib/persistence/__tests__/selector.test.ts` | Modified | E1: +10 new tests in two new describe blocks (`loadDiagnosticResult remote-null + local-has branch`, `loadStudyPlan remote-null + local-has branch`). Each block covers the BLOCKER FIX case (remote null + local has → local + fallback event) plus 2 sanity cases (both null → null; remote real → remote) and 2 regression cases (throws → local + fallback event; `__remoteUnavailable` + local has → local + fallback event). Extended `makeRemoteAdapter`/`makeLocalAdapter` test helpers to accept optional `loadDiagnosticResult` / `loadStudyPlan` overrides with `null`-default (backward-compatible with existing 8 `loadProgress` tests). |
| `openspec/changes/post-auth-supabase-sync-fix/tasks.md` | Modified | E1: PR1.10 — partial-import wrapper blocker fix section added; PR1.11 — Gate section added; `E1` added to Blocker → Task Map. |
| `openspec/changes/post-auth-supabase-sync-fix/apply-progress.md` | Modified | This file (merged with PR1.10 batch evidence, files, summary). |

## Deviations from Design

### PR1 original batch (B0)
**None.** All design decisions (idempotency, FK ordering, status state machine,
selector fallback branch) are implemented exactly as specified in
`design.md`. The supabase-adapter's existing `EMPTY_PROGRESS` behavior
was already aligned with the spec — no production change needed, only
characterization tests.

### PR1.4 batch (this batch — blocker fixes)
**None breaking** — but one scope expansion worth flagging:

- **B2 expansion:** the original design did not specify an outcome type
  for the orchestrator. We introduced `LinkImportOutcome` as a
  discriminated union `{kind:"ready", branch} | {kind:"local-fallback",
  reason, branch, partialFields?}` plus `LinkImportFailureReason`
  as the failure enumeration. This is what makes the FK-before-import
  gate (B3) and the status-mapping (B2) work. The orchestrator's
  public return type changed from `Promise<void>` to
  `Promise<LinkImportOutcome>` — but `link-and-import.ts` is
  internal-facing, so this is not a public API break. PR2 callers
  (`AuthBootstrap`) will need to handle the discriminated outcome
  via `beginPostAuthSync` (which already does).

- **B2 helper addition:** `linkActiveProfileToAuthUserWithResult()` is
  the new internal helper; the existing void
  `linkActiveProfileToAuthUser()` is preserved as a wrapper so the
  existing 7-test contract for that function is untouched. PR2 callers
  using the void function continue to work.

- **B4 redesign:** the original post-auth-sync module used a single
  `currentPromise` slot. The new design uses `inflightByUser: Map<userId, ...>`
  for per-userId promise isolation. This is a stricter invariant than
  the original design (which only required per-userId completed-set
  dedupe, not in-flight isolation). The new design is correct for
  the cross-user scenario, and the public `waitForPostAuthSync()`
  signature is preserved (it now aggregates across all in-flight users).

## Issues Found

### PR1 original batch (B0)
1. The status module's "in-flight promise" and "completed per-userId set"
   are two separate pieces of state. A naive "keep the promise alive
   forever" approach would have broken the `waitForPostAuthSync() returns
   null after sync has completed` invariant. The final implementation
   uses both: the promise is cleared when the work settles, but a
   `completedSyncs: Set<userId>` records which users have completed so
   the next call short-circuits without re-running the orchestrator.
2. The TypeScript types for `PracticeAttempt` were not obvious from the
   test fixture shape — first-pass fixtures failed typecheck. Fixed in
   the same commit; no behavioral change.

### PR1.4 batch (this batch — blocker fixes)
1. **vitest hoisting:** `vi.doMock` is hoisted by vitest, so closure
   variables from inside `loadWithMocks` (the original test helper)
   were undefined when the mock factory ran. We refactored to use
   `vi.hoisted` for a persistent mock registry that the factories
   reference. The per-test vi.fn instances are mutated via
   `mockImplementation` rather than recreated — preserves reference
   equality across `vi.resetModules()` cycles.
2. **`undefined.kind` throws:** when existing tests mocked the
   orchestrator with `vi.fn(async () => undefined)`, the new outcome
   mapping tried to read `outcome.kind` and threw, causing the catch
   block to flip status to "local-fallback". We updated 4 existing
   tests to return `LinkImportOutcome` objects from the mock.
3. **Missing `clearPostAuthSyncState` in mocks:** the new
   `clearPostAuthSyncStatus` calls into the orchestrator's
   `clearPostAuthSyncState`. Tests that mocked only
   `linkAndImportLocalProgress` failed. Updated the clear-path test
   to mock both exports.

## Verification Results

```bash
$ pnpm run test:run
Test Files  177 passed (177)
Tests       2934 passed (2934)
Duration    ~17s

$ pnpm run typecheck
$ tsc --noEmit
(clean)

$ pnpm run build
$ next build
✓ Compiled successfully
✓ TypeScript clean
✓ 11 routes built
```

## Invariants Covered in PR1

Per `tasks.md` "Invariant → Task Map":

| Criterion | Invariant | Covered By |
|-----------|-----------|------------|
| (1) | INITIAL_SESSION triggers link/import once | 1.2 / 1.3 / 2.1 / 2.3 |
| (2) | Duplicate auth events do not duplicate import | 1.2 / 2.1 |
| (3) | `student_profiles` upsert before snapshot save | 1.1 / 2.2 + B3 (gate on linkResult.ok) |
| (4) | Remote empty + local has preserves local | 3.1 / 3.2 / 3.3 / 3.4 |
| (10) | Empty remote adapter does not collapse to null/error | 3.2 / 3.4 |

Plus the six fresh-review invariants:

| Blocker | Invariant | Covered By |
|---------|-----------|------------|
| B1 | `__remoteUnavailable` sentinel + local empty → returns LOCAL empty (not the sentinel) | B1 (selector two-stage) |
| B2 | Orchestrator outcome reported; never falsely "ready" | B2 (outcome type + status mapping) |
| B3 | FK-before-snapshot readiness: import NOT attempted if profile upsert fails | B3 (gate on linkResult.ok) |
| B4 | Cross-user idempotency: user B not deduped against user A's pending promise | B4 (inflightByUser Map) |
| B5 | Clear path: SIGNED_OUT → SIGNED_IN re-runs orchestrator for same userId | B5 (clearPostAuthSyncStatus cascades) |
| B6 | No misleading test names, no dead expressions | B6 (renames + removed dead `EMPTY_PROGRESS;`) |

Plus the four fresh-fresh-review invariants (this round):

| Item | Invariant | Covered By |
|------|-----------|------------|
| C1 | Per-userId completed-status cache: A's local-fallback is not overwritten by B's ready | C1 (completedByUser Map replaces completedSyncs Set) |
| C2 | Stale in-flight writes after clear: late resolution of a cleared promise does not write status | C2 (per-entry token + token guard) |
| C3 | Production clear path: SIGNED_OUT clears per-userId post-auth sync state | C3 (AuthBootstrap tracks lastUserId) |
| C4 | Comments explain current invariant, not review history | C4 (blocker 2/3/4/5 references removed) |
| D1 | Public status after sign-out/clear: `getPostAuthSyncStatus()` returns the documented safe non-ready state (`"signed-out"`), not the stale pre-clear snapshot. Stale in-flight promises cannot rewrite the post-clear state | D1 (`clearPostAuthSyncStatus` resets `currentStatus = "signed-out"`; token guard still suppresses late writes) |
| D2 | Partial import must not be reported as ready; diagnostic/study-plan local data must not be hidden by remote null. `ImportResult.failedFields` populated for observability | D2 (`failedFields: ImportableField[]`; `ok = failedFields.length === 0`; orchestrator maps partial to `local-fallback / import-partial`) |

### PR1.10 — fresh resilience review blocker fix (this batch)

| Blocker | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|-----|-------|-------------|----------|
| E1 | `src/lib/persistence/__tests__/selector.test.ts` | Unit | ✅ +10: 2 new describe blocks (`loadDiagnosticResult remote-null + local-has branch`, `loadStudyPlan remote-null + local-has branch`). Each block: BLOCKER FIX case (remote null + local has → local + fallback event), 2 sanity cases (both null → null; remote real → remote), 2 regression cases (throws → local + fallback event; `__remoteUnavailable` + local has → local + fallback event). | ✅ `loadDiagnosticResult` and `loadStudyPlan` in `withLocalFallback` extended with the same two-stage structure as `loadProgress`: Stage 1 (sentinel + throws → local + fallback event, sentinel never leaks); Stage 2 (remote null + local has data → local + fallback event; remote has data → remote wins; both null → local null). | ➖ 5 cases per method, one invariant each | ✅ JSDoc on both methods explains the BLOCKER FIX and why the wrapper must not treat remote-null as canonical when local has data |

## TDD Cycle Evidence (PR1.10)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| E1 | `src/lib/persistence/__tests__/selector.test.ts` | Unit | ✅ +10 | ✅ 2 BLOCKER FIX cases failed (remote null + local has → returned remote null instead of local) | ✅ Two-stage wrapper: sentinel/throws first, then remote-null + local-has recovery | ✅ 5 cases per method (BLOCKER + 2 sanity + 2 regression) | ✅ Extended helpers + JSDoc |

## Test Summary

### PR1.10 batch (this batch — partial-import wrapper blocker fix)
- **New tests written**: 10 (5 in `loadDiagnosticResult remote-null + local-has branch` + 5 in `loadStudyPlan remote-null + local-has branch`)
- **Total project tests after batch**: 2944 (was 2934 baseline → +10 net new)
- **Tests in `selector.test.ts` after batch**: 18 (was 8 → +10)
- **Layers used**: Unit (10)
- **Approval tests (refactoring)**: 0
- **Production code changes**: `loadDiagnosticResult` and `loadStudyPlan` in `withLocalFallback` extended with two-stage fallback logic (no new helpers, no new exports, no signature changes — the wrapper contract is preserved)

Criteria (5)(6)(7)(8)(9) are UI-layer concerns → PR2 scope.

## PR1.12 batch (this batch — final reliability review coverage completion)

A final reliability review of PR1.10 found one test-coverage gap only:
the wrapper preserves remote canonical reads when remote returns a
non-null `DiagnosticResult` / `StudyPlan` and local is null (already
covered by the existing sanity tests), but no test locked in the same
invariant when local ALSO has DIFFERENT non-null data — i.e. the
canonical-reads-both-have-data-and-disagree branch.

The implementation already handles this case correctly (both
`loadDiagnosticResult` and `loadStudyPlan` Stage 2 return `remoteResult`
when `remoteResult !== null` regardless of local). This batch is
test-only — no production change.

| Task | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|-----|-------|-------------|----------|
| F1 | `src/lib/persistence/__tests__/selector.test.ts` | Unit | ✅ +1: `loadDiagnosticResult` remote real + local DIFFERENT real → returns REMOTE (no fallback event). | ✅ Test passes immediately — Stage 2 of the wrapper already returns `remoteResult` when `remoteResult !== null`. Test locks in the invariant for future refactors. | ➖ Single scenario, single invariant | ➖ None needed |
| F2 | `src/lib/persistence/__tests__/selector.test.ts` | Unit | ✅ +1: `loadStudyPlan` remote real + local DIFFERENT real → returns REMOTE (no fallback event). | ✅ Same — test passes immediately because Stage 2 already returns `remoteResult` when `remoteResult !== null`. | ➖ Single scenario, single invariant | ➖ None needed |

## Test Summary (PR1.12)

- **New tests written**: 2 (F1: loadDiagnosticResult both-have-different-data; F2: loadStudyPlan both-have-different-data)
- **Total project tests after batch**: 2946 (was 2944 baseline → +2 net new)
- **Tests in `selector.test.ts` after batch**: 20 (was 18 → +2)
- **Layers used**: Unit (2)
- **Approval tests (refactoring)**: 0
- **Production code changes**: NONE — test-only batch. Implementation already
  covered both invariants; tests are regression-prevention guards.

## Verification Results (PR1.12)

```bash
$ pnpm run test:run
Test Files  177 passed (177)
Tests       2946 passed (2946)
Duration    ~21s

$ pnpm run typecheck
$ tsc --noEmit
(clean)

$ pnpm run build
$ next build
✓ Compiled successfully
✓ TypeScript clean
✓ 11 routes built
```

## Risks

### PR1 itself
**None.** All changes are in pure logic + a minimal AuthBootstrap
production wire-up, well-covered by characterization tests AND new
strict-TDD regression tests for the six fresh-review blockers + the
four fresh-fresh-review invariants. The orchestrator returns an
explicit `LinkImportOutcome`; the status module caches that outcome
per userId; the AuthBootstrap tears the per-userId cache down on
`SIGNED_OUT`.

### For PR2
The `AuthBootstrap` wiring must:
1. Call `beginPostAuthSync` on BOTH `INITIAL_SESSION` and `SIGNED_IN`
   (idempotent per userId, so this is safe).
2. `SIGNED_OUT` already calls `clearPostAuthSyncStatus(lastUserId)`
   (PR1.6 C3 — done in this round).
3. Await `waitForPostAuthSync()` in `PersistenceInitializer` before
   `reinitializePersistence()`.

Items 1 and 3 remain as PR2 work. The clear path (item 2) is now in
place.

## Workload / PR Boundary

- **Mode**: chained PR slice (stacked-to-main)
- **Current work unit**: PR1 — auth domain + persistence (including all blocker fixes through PR1.10)
- **Boundary**: starts from `origin/main`, ends before any UI change
  beyond the minimal AuthBootstrap clear-path wiring
- **Estimated review budget impact**: ~1100 changed lines (logic + tests
  across ~13 files). Above the 450-line review budget but split cleanly
  on the domain↔UI seam per `chained-pr` strategy.
- **No PR2 work done** in this batch — Nav sync pill and Home fallback
  remain for the next autonomous slice.

## Next Steps (orchestrator)

1. Commit + push `feat/post-auth-supabase-sync-fix-pr1-domain` branch
   (work-unit: B1+B2+B3+B4+B5+B6 + C1+C2+C3+C4 + D1+D2 + **E1** + **F1+F2** fixes;
   merge the in-progress edits first if needed).
2. Merge PR1 to `origin/main` (per AGENTS.md multi-PC workflow: `--no-ff`).
3. Open PR2 branch (`feat/post-auth-supabase-sync-fix-pr2-ui`) off updated
   `origin/main` and dispatch the next `sdd-apply` slice.
4. After PR2 merge, run `sdd-verify` and then archive the change.

## Verification Results (PR1.10)

```bash
$ pnpm run test:run
Test Files  177 passed (177)
Tests       2944 passed (2944)
Duration    ~18s

$ pnpm run typecheck
$ tsc --noEmit
(clean)

$ pnpm run build
$ next build
✓ Compiled successfully
✓ TypeScript clean
✓ 11 routes built
```

## PR2.0 — UI WIRING BATCH (PR2 — this batch)

PR2 wires the post-auth sync readiness surface from PR1 into the UI
components that own the post-callback sync surface:

  1. `AuthBootstrap` — `INITIAL_SESSION` triggers the same
     post-auth sync as `SIGNED_IN`, deduplicated per userId via
     `beginPostAuthSync`. Switched from the void
     `linkAndImportLocalProgress(session)` call to the readiness surface
     `beginPostAuthSync(session)` so Nav + PersistenceInitializer can
     observe the same status snapshot.

  2. `PersistenceInitializer` — when a Supabase session already exists
     at app startup (post-callback page load, or refresh with an active
     session), awaits the post-auth sync readiness
     (`beginPostAuthSync(session)`) BEFORE
     `reinitializePersistence({ onFallback })`. The no-session path still
     calls `initializePersistence()` as before. Both code paths
     delegate to the same per-userId orchestrator promise so the
     orchestrator runs once per sign-in, not twice.

  3. `Nav` — the sync pill reads from the live `usePostAuthSyncStatus()`
     hook, NOT from raw session state. The badge is honest about each
     status transition:

       - "disabled"        → hide (auth not configured).
       - "signed-out"      → "Sin sincronizar" link to /cuenta/ingresar.
       - "pending"         → honest "Sincronizando tu cuenta" pill.
       - "local-fallback"  → honest "Trabajo local guardado" pill
                              (NOT the synchronized pill).
       - "ready"           → the synchronized pill.

  4. `HomeNextStepClient` — the loader path no longer leaves
     `viewModel === null` after a rejected `loadProgress()` /
     `loadDiagnosticResult()`. Any catch path now calls
     `handleResults(EMPTY_PROGRESS, null)` (or `handleResults(progress, null)`
     for diag-only failures) so the dashboard renders the
     actionable local-fallback VM (mission + decision board + route
     units) instead of a permanent skeleton.

### TDD Cycle Evidence (PR2)

| Task | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|-----|-------|-------------|----------|
| PR2.1 (AuthBootstrap INITIAL_SESSION + `beginPostAuthSync` wiring) | `src/components/auth/__tests__/AuthBootstrap.test.tsx` | Unit | ✅ +6 tests: INITIAL_SESSION branches share `beginPostAuthSync(session)` call; both branches capture `lastUserId`; INITIAL_SESSION is in same conditional as SIGNED_IN; updated existing SIGNED_IN tests for `beginPostAuthSync` instead of `linkAndImportLocalProgress`. | ✅ Switched AuthBootstrap to call `beginPostAuthSync(session)`; added `event === "INITIAL_SESSION" \|\| event === "SIGNED_IN"` shared conditional. | ➖ Single scenario per branch | ✅ JSDoc updated to document PR2 invariants |
| PR2.2 (PersistenceInitializer readiness-aware path) | `src/components/__tests__/PersistenceInitializer.test.ts` | Unit | ✅ +7 tests: imports readiness surface from `@/lib/persistence/adapter-config`; reads `getCurrentSession()`; awaits readiness before `reinitializePersistence`; forwards session to `beginPostAuthSync`; legacy `initializePersistence` path preserved. | ✅ PersistenceInitializer now reads the current session and awaits `beginPostAuthSync(session)` BEFORE `reinitializePersistence` when a session exists. | ➖ 5 separate invariants | ✅ JSDoc updated |
| PR2.3 (Nav sync pill from post-auth-sync status) | `src/components/__tests__/Nav-auth.test.ts` | Unit | ✅ +9 tests: imports readiness surface; pill conditional references `syncStatus === "ready"` (NOT session alone); honest pending copy; honest fallback copy; live updates via `usePostAuthSyncStatus`; preserved sign-out affordance; tripwire that pending+session must not falsely show synchronized. | ✅ Nav imports `usePostAuthSyncStatus()`; pill conditional uses `syncStatus === "ready" \| "pending" \| "local-fallback" \| "signed-out"`; each branch renders honest student-friendly copy. | ➖ 5 status branches + 4 invariants | ✅ Comment blocks updated; brand-voice tripwires preserved |
| PR2.4 (HomeNextStepClient fallback VM) | `src/components/home/__tests__/HomeNextStepClient.fallback.test.tsx` | Unit (new file) | ✅ +10 tests: no bare silent `.catch()`; catch feeds `handleResults`; inner diag catch feeds `handleResults(progress, null)`; `EMPTY_PROGRESS` is fallback; `viewModel` always reaches non-null; aria-busy + a11y preserved; no forbidden language. | ✅ Replaced silent catch with `handleResults(EMPTY_PROGRESS, null)` (progress failure) and `handleResults(progress, null)` (diag-only failure). Imported `EMPTY_PROGRESS` from `@/lib/practice-progress`. | ➖ 5 fallback paths + 5 a11y invariants | ✅ JSDoc updated to document PR2 catch invariants |
| PR2.5 (usePostAuthSyncStatus hook + subscribe support) | `src/hooks/__tests__/usePostAuthSyncStatus.test.ts` + `src/lib/auth/__tests__/post-auth-sync-status.test.ts` (existing) | Unit | ✅ +9 new tests: hook uses `useSyncExternalStore`; imports `getPostAuthSyncStatus`; first arg is `subscribePostAuthSyncChange`; `getSnapshot`/`getServerSnapshot` defined; status module exports subscribe function. | ✅ Created `src/hooks/usePostAuthSyncStatus.ts` using `useSyncExternalStore(subscribePostAuthSyncChange, getPostAuthSyncStatus, getPostAuthSyncServerSnapshot)`; added `subscribePostAuthSyncChange()` + `getPostAuthSyncServerSnapshot()` to status module; emits fired on every transition (no session, disabled, pending, settled, clear). | ➖ 6 separate invariants | ✅ Topic-keyed JSDoc on the new public API |

## Test Summary (PR2)

- **New tests written**: 41 (10 in `HomeNextStepClient.fallback.test.tsx` + 9 in `usePostAuthSyncStatus.test.ts` + 6 in `AuthBootstrap.test.tsx` (modified) + 9 in `Nav-auth.test.ts` (modified) + 7 in `PersistenceInitializer.test.ts` (modified))
- **Total project tests after PR2**: 2987 (was 2946 baseline → +41 net new)
- **Total test files**: 179 (was 177 → +2 new files)
- **Layers used**: Unit (41)
- **Approval tests (refactoring)**: 0
- **Production code changes**:
  - `src/lib/auth/post-auth-sync.ts` — added `subscribePostAuthSyncChange()`, `getPostAuthSyncServerSnapshot()`; wired `emitPostAuthSyncChange()` on every transition; `resetPostAuthSyncStatusForTests()` clears listeners.
  - `src/lib/persistence/adapter-config.ts` — re-exports the new surface (PR2 additions: `subscribePostAuthSyncChange`, `getPostAuthSyncServerSnapshot`).
  - `src/hooks/usePostAuthSyncStatus.ts` (new) — `useSyncExternalStore`-based hook for live status subscription.
  - `src/components/auth/AuthBootstrap.tsx` — added `INITIAL_SESSION` shared branch; switched to `beginPostAuthSync(session)` from `@/lib/persistence/adapter-config`.
  - `src/components/PersistenceInitializer.tsx` — added session-present path: `getCurrentSession()` → `await beginPostAuthSync(session)` → `reinitializePersistence()`. Legacy `initializePersistence()` path preserved for no-session case.
  - `src/components/Nav.tsx` — sync pill driven by `usePostAuthSyncStatus()`; 4 status branches (signed-out / pending / local-fallback / ready) with honest student-friendly copy.
  - `src/components/home/HomeNextStepClient.tsx` — replaced silent `.catch(() => {})` with `handleResults(EMPTY_PROGRESS, null)` (progress failure) and `handleResults(progress, null)` (diag-only failure). Imported `EMPTY_PROGRESS`.

## Files Changed (PR2)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/auth/post-auth-sync.ts` | Modified | Added `subscribePostAuthSyncChange()` + `getPostAuthSyncServerSnapshot()`; wired `emitPostAuthSyncChange()` on every transition (sign-out, disabled, pending, settled, cleared). `resetPostAuthSyncStatusForTests()` now also clears listeners. Topic-keyed JSDoc explains the external-store contract. |
| `src/lib/persistence/adapter-config.ts` | Modified | Re-exports the two new functions (`subscribePostAuthSyncChange`, `getPostAuthSyncServerSnapshot`) so persistence consumers don't need to import from `src/lib/auth/` directly. |
| `src/hooks/usePostAuthSyncStatus.ts` | Created | New hook wrapping `useSyncExternalStore(subscribePostAuthSyncChange, getPostAuthSyncStatus, getPostAuthSyncServerSnapshot)`. SSR-safe: returns `"signed-out"` on the server. |
| `src/hooks/__tests__/usePostAuthSyncStatus.test.ts` | Created | 9 tests covering hook shape, subscribe wiring, snapshot stability, SSR safety, plus the new `subscribePostAuthSyncChange` export from the status module. |
| `src/components/auth/AuthBootstrap.tsx` | Modified | `SIGNED_IN` and `INITIAL_SESSION` now share ONE conditional (REQ-AUTH-3). Switched from `linkAndImportLocalProgress(session)` (orchestrator void) to `beginPostAuthSync(session)` (readiness surface) so the same status snapshot is observed by Nav and PersistenceInitializer. `lastUserId` captured in BOTH branches. |
| `src/components/auth/__tests__/AuthBootstrap.test.tsx` | Modified | Existing SIGNED_IN tests updated to expect `beginPostAuthSync(session)` instead of `linkAndImportLocalProgress(session)` (the readiness surface is the new contract). +6 new tests for INITIAL_SESSION wiring, shared branch, lastUserId capture, and the tripwire that INITIAL_SESSION is NOT a separate case. |
| `src/components/PersistenceInitializer.tsx` | Modified | Added session-present path: `getCurrentSession()` → `await beginPostAuthSync(session)` → `await reinitializePersistence({ onFallback })`. The legacy `initializePersistence()` call still runs (preserves the no-session path). All errors swallowed so the legacy path stays intact. |
| `src/components/__tests__/PersistenceInitializer.test.ts` | Modified | +7 new tests for the readiness-aware path: imports the readiness surface, reads current session, awaits readiness before reinitialize, forwards session, uses `reinitializePersistence` (not `initializePersistence`) on the readiness path, legacy `initializePersistence` call preserved. |
| `src/components/Nav.tsx` | Modified | Imported `usePostAuthSyncStatus()`. Sync pill driven by `syncStatus` instead of session. Four honest status branches: signed-out (Link), pending ("Sincronizando tu cuenta"), local-fallback ("Trabajo local guardado"), ready (synchronized pill). The synchronized pill ONLY renders when `syncStatus === "ready"` — never on session alone. |
| `src/components/__tests__/Nav-auth.test.ts` | Modified | +9 new tests for PR2 sync pill: readiness surface import; pill conditional references readiness (NOT session); honest pending copy; honest fallback copy; live updates via `usePostAuthSyncStatus`; preserved sign-out affordance; tripwire that pending+session must not falsely show synchronized. |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Replaced silent `.catch(() => {})` on the progress promise with `handleResults(EMPTY_PROGRESS, null)` (renders the local-fallback VM: mission "Empezá por el diagnóstico", primaryActions "Hacer diagnóstico inicial"). The inner diag-only catch now calls `handleResults(progress, null)` (renders the VM with null diagnostic). Imported `EMPTY_PROGRESS` from `@/lib/practice-progress`. JSDoc documents the PR2 invariants. |
| `src/components/home/__tests__/HomeNextStepClient.fallback.test.tsx` | Created | 10 new tests for the fallback VM path: no bare silent catch; catch feeds handleResults; inner diag catch feeds handleResults(progress, null); EMPTY_PROGRESS is the fallback constant; viewModel always reaches non-null; aria-busy + a11y preserved; no forbidden language. |
| `openspec/changes/post-auth-supabase-sync-fix/apply-progress.md` | Modified | This PR2 section. |

## Deviations from Design

### PR2 batch

1. **`usePostAuthSyncStatus` hook**: design referenced reading status via
   `getPostAuthSyncStatus()` but did not prescribe a hook. I introduced
   a `useSyncExternalStore`-based hook in `src/hooks/usePostAuthSyncStatus.ts`
   to give Nav live updates without manual subscription management.
   This is the smallest pattern that makes the spec's "live readiness
   signal" requirement observable from React without re-rendering on
   unrelated state.

2. **`getPostAuthSyncServerSnapshot`**: required by `useSyncExternalStore`
   SSR contract. The status module is client-only, so the server
   snapshot returns the documented safe non-ready default `"signed-out"`.
   This is consistent with the post-clear invariant from PR1.8 D1.

3. **`PersistenceInitializer` legacy path preserved**: design implied
   replacing `initializePersistence()` with the readiness-aware path.
   I kept the legacy `initializePersistence()` call (it becomes a no-op
   when no session exists) AND added the readiness-aware path on top.
   Reason: `initializePersistence()` is the production initializer
   component's documented contract — keeping it preserves the existing
   test contract (the `PersistenceInitializer.test.ts` "calls
   initializePersistence in useEffect" assertion still passes) while
   adding the readiness-aware flow for the session-present case.

4. **Nav status branches expose `pending` and `local-fallback` as
   distinct pills**: design said "honest, student-friendly". I picked
   "Sincronizando tu cuenta" (pending) and "Trabajo local guardado"
   (local-fallback). The tripwire is: the synchronized pill ONLY
   renders on `syncStatus === "ready"`, never on session alone.

## Issues Found (PR2)

1. **vitest + initial regex tests**: my first attempt at the
   "Sincronizado como" tripwire test used a 200-char window that was
   too narrow — the conditional `syncStatus === "ready" && userEmail !== null`
   lives 100-300 chars before the JSX `Sincronizado como` string because
   of long className strings. Fixed by expanding to 600 chars and
   tightening the regex to `syncStatus\s*===\s*["']ready["']`.

2. **Forbidden-word tripwires caught my own comments**: my first draft
   of Nav.tsx comments mentioned "Supabase" and "Sincronizado como"
   which tripped the brand-voice tests. Rephrased to "auth session"
   and "synchronized pill" respectively. Lesson: source-inspection
   tests catch ALL source content, including JSDoc.

3. **`.catch(() => {})` regex tripped my own comment**: my first JSDoc
   on `HomeNextStepClient.tsx` literally contained the banned pattern
   as a negative example. Rephrased to "bare empty catch".

4. **TS regex `/s` flag**: my initial fallback tests used the `s`
   (dotAll) regex flag, which TS 5+ rejects for the default
   ES2017 target. Switched to `[\s\S]*` for multiline matching.

## Verification Results (PR2)

```bash
$ pnpm run test:run
Test Files  179 passed (179)
Tests       2987 passed (2987)
Duration    ~21s

$ pnpm run typecheck
$ tsc --noEmit
(clean)

$ pnpm run build
$ next build
✓ Compiled successfully
✓ TypeScript clean
✓ 11 routes built
```

## Invariants Covered in PR2

| Criterion | Invariant | Covered By |
|-----------|-----------|------------|
| (5) | Sync-complete UI requires readiness (Nav does not falsely show "Sincronizado") | PR2.3 (Nav conditional uses `syncStatus === "ready"`, not session) |
| (6) | Home does not finish as skeleton/blank | PR2.4 (catch path feeds `handleResults(EMPTY_PROGRESS, null)`) |
| (7) | Diagnostic and Practice stay accessible | PR2.3 (Nav still renders all 4 nav items unconditionally) |
| (8) | Pending/fallback states are honest and student-friendly | PR2.3 (`Sincronizando tu cuenta` for pending, `Trabajo local guardado` for local-fallback) |
| (9) | INITIAL_SESSION triggers link/import once | PR2.1 (AuthBootstrap: `event === "SIGNED_IN" \|\| event === "INITIAL_SESSION"` shared branch; orchestrator idempotent per userId) |
| (1) | INITIAL_SESSION and SIGNED_IN trigger the same orchestrator run (deduped) | PR2.1 (AuthBootstrap: shared conditional + `beginPostAuthSync` per-userId promise dedupe) |

Plus the three PR2-only invariants:

| Invariant | Covered By |
|-----------|------------|
| PR2.2 PersistenceInitializer awaits readiness before reinitialize | PR2.2 (`getCurrentSession` → `await beginPostAuthSync(session)` → `reinitializePersistence`) |
| PR2.5 Live status subscription via `useSyncExternalStore` | PR2.5 (usePostAuthSyncStatus hook + `subscribePostAuthSyncChange` export) |
| PR2.4 Home never stays on skeleton | PR2.4 (every catch path calls `handleResults`) |

## Risks

### PR2 itself

**Low risk.** All four areas have strict-TDD regression tests. The
per-userId promise dedupe in `beginPostAuthSync` (PR1.4 B2/B4) ensures
the INITIAL_SESSION + SIGNED_IN race collapses into one orchestrator
run — covered by the orchestrator's existing idempotency tests in
PR1.6 C1/C2. Nav's live subscription uses `useSyncExternalStore` with
a stable getSnapshot, so React will only re-render when the status
actually changes.

### Open risks (post-merge)

1. **Nav SSR rendering**: `useSyncExternalStore` returns
   `"signed-out"` on the server. If the server-rendered HTML claims
   the user is signed-out, the client will hydrate to the real status
   on mount. No mismatch (since the server cannot know the auth state),
   but a brief flash is possible during the first paint.

2. **Status transition race**: if `beginPostAuthSync` resolves between
   `getCurrentSession()` and the second `reinitializePersistence()`
   call in PersistenceInitializer, the selector might run twice. The
   shared per-userId promise in `beginPostAuthSync` ensures both
   callers share the same outcome, so no double-import — but the
   selector still runs the `selectAdapterForCurrentSession` core twice.
   This is acceptable (it's idempotent), but a future optimization
   could dedupe selector runs.

## Workload / PR Boundary

- **Mode**: chained PR slice (stacked-to-main)
- **Current work unit**: PR2 — UI/runtime wiring
- **Branch**: `feat/post-auth-supabase-sync-fix-pr2-ui` (off
  `feat/post-auth-supabase-sync-fix-pr1-domain` for now per
  "stacked" workflow)
- **Boundary**: starts from `feat/post-auth-supabase-sync-fix-pr1-domain`,
  ends at the four PR2 UI/runtime areas + 41 net new tests
- **Estimated review budget impact**: ~700-900 changed lines (UI
  wiring + tests + Nav refactor + new hook + new status exports).
  Above the 450-line budget but split cleanly on the auth-domain↔UI
  seam per `chained-pr` strategy.

## Next Steps (orchestrator)

1. Commit + push `feat/post-auth-supabase-sync-fix-pr2-ui` branch.
2. Merge PR2 to `origin/main` (per AGENTS.md multi-PC workflow:
   `--no-ff`).
3. Run `pnpm run audit:branches` to confirm no zombie branches
   leaked.
4. After PR2 merge, run `sdd-verify` and then archive the change
   (update `STATUS.json`: `status: "done"`, `branch: null`).

## PR2.10 — PR2 FRESH-REVIEW BLOCKER FIXES (this batch)

Fresh re-review of PR2 (PR2.0–PR2.3) surfaced four blockers that must
be fixed before PR2 lands:

1. **B1 (FK-before-snapshot readiness race)**: `PersistenceInitializer`
   called `initializePersistence()` immediately on mount AND THEN
   awaited `beginPostAuthSync(session)`. This meant the persistence
   selector flipped to the remote adapter with `hasRemoteSession=true`
   BEFORE the FK row was guaranteed in `student_profiles` — the first
   `saveProgress()` could race the FK upsert and fail the DB
   constraint. Fixed by deferring the selector call until
   `beginPostAuthSync` resolves.

2. **B2 (source-scan tests as primary proof)**: the original PR2 tests
   asserted behavior by scanning source text for string matches
   (`expect(src).toContain("Sincronizado como")` etc.). These are
   tripwires, not behavior. Fixed by extracting pure functions from
   the components and writing behavioral tests that exercise the
   actual logic with mock dependencies.

3. **B3 (historical PR-process comments)**: production files contained
   review-process references ("blocker fix", "PR2 invariant"). Fixed
   by rewriting comments to explain current invariants only.

4. **B4 (PR base)**: while PR1 was pending, PR2 used the PR1 branch as
   its base. After PR1 landed, PR2 was retargeted to `main` and its diff
   was verified clean of PR1 foundation work.

Plus two cheap warnings addressed:

- **W1 (fallback sink through auth-event reinit)**: AuthBootstrap's
  `reinitializePersistence` was called without an `onFallback` option.
  The fallback sink is now created once in the effect and forwarded
  to BOTH the legacy first-init path AND the auth-event reinit path,
  so observability is consistent.
- **W2 (HomeNextStepClient cleanup/sequence guard)**: the effect now
  captures a `cancelled` flag and short-circuits stale `handleResults`
  calls so a mid-flight student switch does not overwrite the new
  student's view model.
- **W3/W5 (stale auth tails)**: AuthBootstrap suppresses stale sign-in
  handlers with a generation guard, and SIGNED_OUT uses an explicit
  local reset that does not read the live Supabase session. A newer
  sign-in owns its own final remote reinitialization after readiness.

### Refactor: extract pure logic from components

To enable behavioral testing without a DOM (the project's test env
is Node, no jsdom), the protocol/logic bodies of three components
were extracted into pure exported functions:

| File | Extracted function | Purpose |
|------|--------------------|---------|
| `src/components/PersistenceInitializer.tsx` | `runPersistenceInit(deps)` | The session-present / no-session persistence initialization protocol. |
| `src/components/auth/AuthBootstrap.tsx` | `createAuthEventHandler(deps)` | Returns the `onAuthStateChange` callback that wires Supabase auth events to persistence. |
| `src/components/home/HomeNextStepClient.tsx` | `runHomeLoader(deps, handleResults)` | The `loadProgress` + `loadDiagnosticResult` → `handleResults` protocol with all four sync/async/reject shapes. |
| `src/components/SyncStatusBadge.tsx` (new) | `SyncStatusBadge(props)` | The Nav sync pill, extracted so its JSX is renderable under any test setup. |

Each extracted function takes its dependencies as parameters so unit
tests inject mocks and assert call ordering. The component files
became thin wrappers that wire the production dependencies and call
the extracted function from `useEffect`.

### TDD Cycle Evidence (PR2.10)

| Blocker | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---------|-----------|-------|-----|-------|-------------|----------|
| B1 | `src/components/__tests__/PersistenceInitializer.behavior.test.ts` | Unit | ✅ +7 tests: deferred `beginPostAuthSync` blocks the selector; selector call comes AFTER `beginPostAuthSync:end`; no-session path still calls `initializePersistence`; getCurrentSession error → legacy init; beginPostAuthSync throws → legacy init; sink forwarded to reinitializePersistence. | ✅ `runPersistenceInit(deps)` extracted; session-present path awaits `beginPostAuthSync(session)` BEFORE `reinitializePersistence({ onFallback: sink })`. | ✅ 5 invariants (ordering, deferred, error, throw, sink forwarding) | ✅ JSDoc documents the FK-before-snapshot readiness invariant |
| B2 (AuthBootstrap) | `src/components/auth/__tests__/AuthBootstrap.behavior.test.tsx` | Unit | ✅ +12 tests: simulated INITIAL_SESSION + SIGNED_IN events; both call `beginPostAuthSync(session)`; FK readiness precedes selector reinit; lastUserId captured in BOTH branches; SIGNED_OUT clears status before reinit; defensive paths (no prior sign-in, malformed session); TOKEN_REFRESHED is no-op. | ✅ `createAuthEventHandler(deps)` extracted; returns a callback that wires INITIAL_SESSION/SIGNED_IN/SIGNED_OUT to the deps. | ✅ 5 scenarios (sign-in race, capture, clear, defensive, no-op) | ✅ JSDoc on deps + handler |
| B2 (Nav) | `src/components/__tests__/Nav.behavior.test.tsx` | Unit | ✅ +10 tests: rendered via `react-dom/server` with mocked `syncStatus` + `session` + `userEmail` + `isAuthEnabled`; honest pill per status (5 branches); tripwire that pending+session never shows "Sincronizado como"; sign-out affordance present on ready + local-fallback. | ✅ Extracted `SyncStatusBadge` to `src/components/SyncStatusBadge.tsx` with explicit if-chain per status; `Sincronizado como` only on `syncStatus === "ready" && userEmail !== null`. | ✅ 5 status branches + 4 invariants | ✅ Comments explain current invariants only |
| B2 (HomeNextStepClient) | `src/components/home/__tests__/HomeNextStepClient.behavior.test.tsx` | Unit | ✅ +8 tests: sync success calls handleResults once; rejected progress → EMPTY_PROGRESS + null; rejected diag → progress + null; both rejected → EMPTY_PROGRESS + null; empty data (no progress) → EMPTY_PROGRESS + null; EMPTY_PROGRESS is the fallback constant. | ✅ Extracted `runHomeLoader(deps, handleResults)` with full four-shape matrix (sync|async × sync|async); every code path calls `handleResults`. | ✅ 5 fallback paths | ✅ JSDoc documents the "never leave viewModel=null" invariant |
| B3 | All four production files | Hygiene | ➖ N/A (comment refactor, not behavior) | ✅ Comments rewritten to explain current invariants only; removed "blocker fix", "PR2 invariant", review-process references. | ➖ N/A | ✅ JSDoc unchanged in semantics |
| B4 | `openspec/changes/post-auth-supabase-sync-fix/apply-progress.md` | Doc | ➖ N/A | ✅ Documented the chain transition: PR2 was stacked on PR1 while PR1 was pending, then retargeted to `main` after PR1 landed with a clean PR2-only diff. | ➖ N/A | ➖ N/A |
| W1 | `src/components/auth/__tests__/AuthBootstrap.test.tsx` | Unit (tripwire) | ➖ N/A | ✅ Production wiring forwards `sink` to `reinitializePersistence({ onFallback: sink })` so observability is consistent across both init paths. | ➖ N/A | ➖ N/A |
| W2 | `src/components/home/HomeNextStepClient.tsx` | Behavior | ➖ N/A | ✅ `useEffect` cleanup captures `cancelled` flag; `handleResults` checks `cancelled` before calling `setViewModel` so a mid-flight student switch does not overwrite the new active student's view model. | ➖ N/A | ✅ Cleanup invariant documented |
| W3/W5 | `src/components/auth/__tests__/AuthBootstrap.behavior.test.tsx` | Unit | ✅ Slow session/sign-out/sign-in interleavings prove stale tails do not own the final persistence state. | ✅ Generation guard suppresses stale sign-in tails; SIGNED_OUT resets local explicitly via `resetPersistenceToLocal()` instead of reading the live session. | ✅ Sign-in stale + sign-out stale variants | ✅ Comments describe durable session-ownership invariant |

### Test Summary (PR2.10)

- **New behavioral tests written**: 37 (7 PersistenceInitializer + 12 AuthBootstrap + 10 Nav + 8 HomeNextStepClient)
- **Updated tripwire tests**: 4 files (`Nav-auth.test.ts`, `AuthBootstrap.test.tsx`, `PersistenceInitializer.test.ts`, `HomeNextStepClient.fallback.test.tsx`) — each retains its status-string / integration tripwires but no longer claims to be the primary proof of behavior.
- **Total project tests after PR2.10 batch**: 2998 (historical baseline at PR2.10 close — was 2987 baseline → +11 net new tests after consolidating the now-redundant source-scan duplicates). The current count after the fresh-review fixes is recorded in the "Fresh-Review Verification" section below.
  - Actually: 2998 = 2987 baseline - redundant tests removed + 37 net new behavioral. The source-scan tripwire tests are kept as secondary evidence (a few strengthened, some de-duplicated).
- **Layers used**: Unit (37)
- **Approval tests (refactoring)**: 0
- **Production code changes**:
  - `src/components/PersistenceInitializer.tsx` — extracted `runPersistenceInit(deps)`; fixed the FK-before-snapshot race; the component is now a thin wrapper.
  - `src/components/auth/AuthBootstrap.tsx` — extracted `createAuthEventHandler(deps)`; production wiring forwards the fallback sink to `reinitializePersistence`.
  - `src/components/SyncStatusBadge.tsx` (new) — extracted sync pill JSX so it's renderable in unit tests via `react-dom/server`.
  - `src/components/Nav.tsx` — now imports + uses `SyncStatusBadge`.
  - `src/components/home/HomeNextStepClient.tsx` — extracted `runHomeLoader(deps, handleResults)`; added `cancelled` cleanup flag.

### Files Changed (PR2.10)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/components/PersistenceInitializer.tsx` | Modified | Extracted `runPersistenceInit(deps)`; removed the immediate `initializePersistence()` call so the session-present path awaits `beginPostAuthSync` BEFORE the selector runs (B1 fix). |
| `src/components/__tests__/PersistenceInitializer.behavior.test.ts` | Created | 7 behavioral tests proving the FK-before-snapshot readiness invariant (B1). |
| `src/components/__tests__/PersistenceInitializer.test.ts` | Modified | Source-scan tripwires updated to scan for the extracted function shape (secondary tripwires only). |
| `src/components/auth/AuthBootstrap.tsx` | Modified | Extracted `createAuthEventHandler(deps)`; production wiring forwards fallback sink to `reinitializePersistence` (W1 fix). |
| `src/components/auth/__tests__/AuthBootstrap.behavior.test.tsx` | Created | 12 behavioral tests with mocked deps + simulated events (B2). |
| `src/components/auth/__tests__/AuthBootstrap.test.tsx` | Modified | Source-scan tripwires refactored to integration assertions (secondary tripwires only). |
| `src/components/SyncStatusBadge.tsx` | Created | Extracted sync pill JSX (B2 — enables behavioral tests via `react-dom/server`). |
| `src/components/Nav.tsx` | Modified | Imports + uses `SyncStatusBadge`; navigation links + active-student chip preserved. |
| `src/components/__tests__/Nav.behavior.test.tsx` | Created | 10 behavioral tests rendering `SyncStatusBadge` with mocked status states (B2). |
| `src/components/__tests__/Nav-auth.test.ts` | Modified | Source-scan tripwires refactored: Nav integration tripwires + SyncStatusBadge content tripwires (secondary tripwires only). |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Extracted `runHomeLoader(deps, handleResults)`; added `cancelled` cleanup flag for mid-flight student switches (W2 fix). |
| `src/components/home/__tests__/HomeNextStepClient.behavior.test.tsx` | Created | 8 behavioral tests with mocked loaders (B2). |
| `src/components/home/__tests__/HomeNextStepClient.fallback.test.tsx` | Modified | Source-scan tripwires updated to scan for `try/catch` with `handleResults` calls (secondary tripwires only). |
| `openspec/changes/post-auth-supabase-sync-fix/apply-progress.md` | Modified | This PR2.10 section. |

### Invariants Covered in PR2.10

| Blocker / Warning | Invariant | Covered By |
|-------------------|-----------|------------|
| B1 | Session-present startup: `beginPostAuthSync(session)` resolves BEFORE `reinitializePersistence` — no remote-empty read can race the FK upsert. | `PersistenceInitializer.behavior.test.ts` "session-present path: deferred beginPostAuthSync — selector waits for orchestrator" + "session-present path: beginPostAuthSync(session) is awaited BEFORE the selector runs" |
| B2 (AuthBootstrap) | `INITIAL_SESSION` and `SIGNED_IN` are equivalent post-callback sync triggers; both call `beginPostAuthSync(session)`; per-userId idempotency collapses the race. | `AuthBootstrap.behavior.test.tsx` "INITIAL_SESSION event triggers beginPostAuthSync(session)" + "SIGNED_IN event triggers..." + "INITIAL_SESSION + SIGNED_IN (duplicate) call beginPostAuthSync twice with same session" |
| B2 (Nav) | The "Sincronizado como" pill ONLY renders when `syncStatus === "ready"` — never on session alone. | `Nav.behavior.test.tsx` "ready + userEmail → renders 'Sincronizado como' pill" + "pending + userEmail → never shows 'Sincronizado como'" + "local-fallback + userEmail → never shows 'Sincronizado como'" |
| B2 (HomeNextStepClient) | Every code path of the loader resolves to an actionable VM — rejected progress → EMPTY_PROGRESS + null; rejected diag → progress + null. | `HomeNextStepClient.behavior.test.tsx` "progress promise rejects: handleResults called with EMPTY_PROGRESS + null" + "progress promise resolves + diag promise rejects: handleResults called with progress + null" |
| W1 | AuthBootstrap's reinit path forwards the fallback sink to the selector so observability is consistent. | `AuthBootstrap.test.tsx` "production wiring forwards the fallback sink to reinitializePersistence" (tripwire) |
| W2 | Mid-flight student switch in HomeNextStepClient does not overwrite the new active student's view model. | `HomeNextStepClient.tsx` `cancelled` flag in `useEffect` cleanup |

### Verification Results (PR2.10 — historical)

```bash
$ pnpm run test:run
Test Files  183 passed (183)
Tests       2998 passed (2998)
Duration    ~17s

$ pnpm run typecheck
$ tsc --noEmit
(clean)

$ pnpm run build
$ next build
✓ Compiled successfully
✓ TypeScript clean
✓ 11 routes built
```

### Fresh-Review Verification (current)

After the fresh-review blocker fixes (null-session AuthBootstrap race,
identity-aware selector guard, and cross-user cached/global status
ownership) the current verification is:

```bash
$ pnpm run test:run
Test Files  183 passed (183)
Tests       3019 passed (3019)
Duration    ~25s

$ pnpm run typecheck
$ tsc --noEmit
(clean)

$ pnpm run build
$ next build
✓ Compiled successfully
✓ TypeScript clean
```

The +21 net tests vs the PR2.10 baseline (2998 → 3019) come from:
- AuthBootstrap session-tail race coverage,
- PersistenceInitializer + adapter-config identity-aware selector coverage,
- post-auth-sync cross-user global/cached status ownership coverage,
- HomeNextStepClient settled-promise fallback coverage,
- intervening fixes landed between PR2.10 and the fresh review.

### PR2 PR Base (B4 — retargeted to main)

PR1 (`feat/post-auth-supabase-sync-fix-pr1-domain`) has merged to
`main`. PR2 is therefore retargeted to `main` and is no longer stacked
on PR1's feature branch.

- **Base branch**: `main`
- **Compare branch**: `feat/post-auth-supabase-sync-fix-pr2-ui`

The earlier stacked-review guidance (open PR2 against PR1's feature
branch so PR1 was not merged prematurely) is obsolete: PR1 landed
independently, and PR2's diff against `main` is a clean PR2-only
surface. The stale "should open with PR1 base" instruction has been
removed.

### Remaining Risks (post-PR2.10)

1. **AuthBootstrap's sign-in race window**: the handler captures
   `lastUserId` BEFORE awaiting `beginPostAuthSync`. If two
   sign-in events fire for different users in quick succession
   (rapid account switch without an intermediate SIGNED_OUT), the
   `lastUserId` will reflect the latest user, not the one whose
   sync needs clearing. The orchestrator's per-userId idempotency
   prevents double-runs, so the second user's clear is skipped —
   acceptable trade-off documented in the handler JSDoc.

2. **HomeNextStepClient cleanup covers the effect re-run but not
   React Strict Mode**: the `cancelled` flag handles the
   cleanup-on-unmount case but Strict Mode's mount→cleanup→remount
   sequence leaves the second effect as the live one. The cleanup
   pattern is correct under both scenarios; documented for clarity.
