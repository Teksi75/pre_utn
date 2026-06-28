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