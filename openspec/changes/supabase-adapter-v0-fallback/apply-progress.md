# Apply Progress: Supabase Adapter v0 with Local Fallback (I-24)

## Status

- **Change**: `supabase-adapter-v0-fallback`
- **Mode**: Strict TDD
- **Branch**: `feat/supabase-adapter-v0-fallback-port`
- **Work Unit**: PR 1 / first stacked-to-main slice
- **Apply State**: ready → in-progress → review-fixes-applied → re-review-fixes-applied → final-review-fixes-applied

## Completed Tasks (PR 1 — original)

- [x] 1.1 RED — `src/lib/__tests__/persistence-port.test.ts` asserts `PersistenceAdapter` shape
- [x] 1.2 GREEN — `src/lib/persistence/port.ts` exports `PersistenceAdapter`, `ProfileSaveResult`, `PersistenceResult<T>`; re-exports domain types
- [x] 2.1 RED — `src/lib/__tests__/persistence-selector.test.ts` covers missing URL/key, no auth, healthy remote, remote-throws; matches fallback scenarios
- [x] 2.2 GREEN — `src/lib/persistence/local-adapter.ts` wraps storage modules into `PersistenceAdapter`; preserves `PersistenceResult<T>`
- [x] 2.3 GREEN — `src/lib/persistence/selector.ts` exports `selectPersistenceAdapter()` reading env vars + auth session; default = local
- [x] 2.4 REFACTOR — Selector only uses `getActiveProfileId()` + auth session; never reads `pre-utn.profiles.v1`

## Completed Tasks (PR 1 — review fixes)

- [x] F1 — Selector requires explicit `hasRemoteSession: true` for remote selection; local profile alone is NOT auth
- [x] F2 — `withLocalFallback()` wrapper catches remote-operation failures and delegates to local adapter
- [x] F3 — `createLocalStorageAdapter()` accepts injectable `LocalStorageOperations` to prevent future recursion when PR2 wires public modules through selector
- [x] F4 — Local adapter enforces studentId match against `getActiveProfileId()`; fail-closed on mismatch
- [x] F5 — Removed unused imports (`SelectorConfig` from test, stale RED-phase comments)
- [x] F6 — Verified `pnpm run test` (2525/2525), `pnpm run typecheck` (clean), `pnpm run build` (success)

## Completed Tasks (PR 1 — re-review fixes)

- [x] R1 — `withLocalFallback()` is now async-aware: catches both sync throws and async Promise rejections via `attempt()` helper. Port uses `MaybePromise<T>` return type. 5 new tests cover async rejected remote methods.
- [x] R2 — Local adapter `loadProgress()` allows legacy migration when no active profile exists: delegates to raw `loadProgress()` instead of returning `EMPTY_PROGRESS` when `getActiveProfileId()` is null. 1 new test covers the no-active-profile legacy path.
- [x] R3 — Injectable ops boundary tested: 4 new tests prove `createLocalStorageAdapter(customOps)` calls injected ops (loadProfiles, saveProgress, loadDiagnosticResult, saveStudyPlan) rather than default public modules.
- [x] R4 — SDD docs updated: design.md interface now includes `loadStudyPlan`/`saveStudyPlan` and `MaybePromise<T>`; proposal.md uses `src/lib/persistence/` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [x] R5 — Removed "Finding 3/4" process comments from local-adapter.ts JSDoc.
- [x] R6 — `withLocalFallback()` duplication reduced via `attempt()` helper (shared sync+async fallback logic per method).
- [x] R7 — Verified `pnpm run test:run` (2535/2535), `pnpm run typecheck` (clean), `pnpm run build` (success)

## Completed Tasks (PR 1 — final review fixes)

- [x] V1 — Strengthened legacy migration test: asserts actual migrated data (attempts, accuracyBySkill) and profile creation (Alumno local, activeStudentId) instead of allowing EMPTY_PROGRESS false-positive
- [x] V2 — Updated proposal.md: replaced stale `NEXT_PUBLIC_SUPABASE_ANON_KEY` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in risk mitigation row
- [x] V3 — Corrected STATUS.json PR1 summary: removed "no-service-role scan test" claim (deferred to PR2); updated to describe actual PR1 scope (async-aware fallback, injectable ops, studentId enforcement, legacy migration)
- [x] V4 — Removed remaining process comments: "Finding 2/3" from test describe names and section headers in persistence-selector.test.ts; removed unused `DiagnosticResult`/`StudyPlan` imports from persistence-port.test.ts
- [x] V5 — Verified `pnpm run test:run` (2535/2535), `pnpm run typecheck` (clean), `pnpm run build` (success)

## Deferred to PR 2

- [ ] 1.3 RED — `src/lib/__tests__/no-service-role-scan.test.ts`
- [ ] 1.4 GREEN — `src/lib/supabase/browser.ts`
- [ ] 1.5 `pnpm add @supabase/supabase-js`
- [ ] 3.1–3.4 Supabase adapter
- [ ] 4.1–4.3 Migration and config
- [ ] 5.1–5.5 Wire and verify

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `src/lib/__tests__/persistence-port.test.ts` | Unit | N/A (new) | ✅ Written | ✅ 7/7 pass | ✅ 3 conforming + 3 non-conforming | ✅ Clean |
| 2.1 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | N/A (new) | ✅ Written | ✅ 8/8 pass | ✅ 10/10 (added remote selection + env-missing) | ✅ Clean |
| 2.2 | `src/lib/persistence/local-adapter.ts` | Unit | N/A (new) | Covered by 2.1 | ✅ Passes via selector | ➖ Single impl | ✅ Clean |
| 2.3 | `src/lib/persistence/selector.ts` | Unit | N/A (new) | Covered by 2.1 | ✅ Passes via selector | ✅ 10 cases | ✅ Clean |
| 2.4 | (refactor only) | — | — | — | — | — | ✅ Uses getActiveProfileId() only |
| F1 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 10/10 | ✅ 2 new tests RED (hasRemoteSession false/omitted) | ✅ 15/15 pass | ✅ 2 cases | ✅ Clean |
| F2 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 12/13 | ✅ 3 new tests RED (remote throws loadProfiles/saveProgress/loadProgress) | ✅ 15/15 pass | ✅ 3 cases | ✅ Clean |
| F3 | `src/lib/persistence/local-adapter.ts` | Unit | ✅ 15/15 | N/A (structural) | ✅ Injectable ops with defaults | ➖ Single pattern | ✅ Clean |
| F4 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 13/15 | ✅ 2 new tests RED (studentId mismatch save/load) | ✅ 15/15 pass | ✅ 2 cases | ✅ Clean |
| F5 | (cleanup only) | — | — | — | — | — | ✅ Removed unused imports + stale comments |
| F6 | (verification) | — | ✅ 2525/2525 pass | — | — | — | ✅ typecheck clean, build success |
| R1 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 20/20 | ✅ 5 new tests RED (async rejected Promise: loadProfiles, saveProgress, loadProgress, loadDiagnosticResult, saveStudyPlan) | ✅ 25/25 pass | ✅ 5 cases | ✅ Extracted `attempt()` helper |
| R2 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 25/25 | ✅ 1 new test RED (no-active-profile legacy migration) | ✅ 26/26 pass | ➖ Single path | ✅ Clean |
| R3 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 26/26 | ✅ 4 new tests RED (injected ops: loadProfiles, saveProgress, loadDiagnosticResult, saveStudyPlan) | ✅ 30/30 pass | ✅ 4 cases | ✅ Clean |
| R4 | (docs only) | — | — | — | — | — | ✅ Updated design.md + proposal.md |
| R5 | (cleanup only) | — | — | — | — | — | ✅ Removed process comments |
| R6 | (refactor only) | — | — | — | — | — | ✅ `attempt()` helper reduces duplication |
| R7 | (verification) | — | ✅ 2535/2535 pass | — | — | — | ✅ typecheck clean, build success |
| V1 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 25/25 | ✅ Strengthened legacy migration assertions (RED: test fails if EMPTY_PROGRESS returned) | ✅ 25/25 pass | ✅ Migrated data + profile creation | ✅ Clean |
| V2 | (docs only) | — | — | — | — | — | ✅ Fixed stale ANON_KEY reference |
| V3 | (docs only) | — | — | — | — | — | ✅ Corrected PR1 scope in STATUS.json |
| V4 | (cleanup only) | — | — | — | — | — | ✅ Removed process comments + unused imports |
| V5 | (verification) | — | ✅ 2535/2535 pass | — | — | — | ✅ typecheck clean, build success |

### Test Summary

- **Total tests written**: 32 (7 port + 25 selector)
- **Total tests passing**: 2535 (full suite, 0 regressions)
- **Layers used**: Unit (32)
- **Pure functions created**: 4 (`isPersistenceAdapter`, `selectPersistenceAdapter`, `withLocalFallback`, `attempt`)

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/port.ts` | Created→Modified | PersistenceAdapter interface, ProfileSaveResult, PersistenceResult<T>, MaybePromise<T>, isPersistenceAdapter guard, domain type re-exports |
| `src/lib/persistence/local-adapter.ts` | Created→Modified | createLocalStorageAdapter() with injectable LocalStorageOperations, studentId fail-closed enforcement, legacy migration passthrough when no active profile |
| `src/lib/persistence/selector.ts` | Created→Modified | selectPersistenceAdapter() with hasRemoteSession gate, withLocalFallback() async-aware wrapper via attempt() helper |
| `src/lib/persistence/index.ts` | Created→Modified | Barrel export for persistence module (added LocalStorageOperations, withLocalFallback, MaybePromise) |
| `src/lib/__tests__/persistence-port.test.ts` | Created→Modified | 7 tests: contract shape, result types, isPersistenceAdapter guard |
| `src/lib/__tests__/persistence-selector.test.ts` | Created→Modified | 25 tests: missing env, no profile, hasRemoteSession gate, sync fallback, async fallback, studentId enforcement, legacy migration (strengthened), injectable ops |
| `src/lib/__tests__/persistence-port.test.ts` | Created→Modified | 7 tests: contract shape, result types, isPersistenceAdapter guard (unused imports removed) |
| `openspec/changes/supabase-adapter-v0-fallback/design.md` | Modified | Updated interface to include loadStudyPlan/saveStudyPlan and MaybePromise<T> |
| `openspec/changes/supabase-adapter-v0-fallback/proposal.md` | Modified | Fixed path to src/lib/persistence/, fixed key name to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY |
| `openspec/changes/supabase-adapter-v0-fallback/tasks.md` | Modified | Marked PR 1 tasks [x], added Phase 2b review fixes, annotated PR 2 deferrals |
| `openspec/changes/STATUS.json` | Modified | Added branch tracking for I-24 |

## Design Deviations

**Minor deviation — `withLocalFallback` wrapper scope**:
The design's data flow diagram says "remote failures fall back to local or return the existing recoverable result." The implementation wraps the entire remote adapter in `withLocalFallback()` so every operation falls back individually. This is MORE granular than a selection-time fallback but matches the spec's intent: "If a remote read or write fails because Supabase is unreachable... the app MUST keep the student workflow usable through local fallback." The wrapper is a pure function, easy to test, and doesn't change the selection contract.

**Minor deviation — `hasRemoteSession` config field**:
The design says "Require an existing Supabase Auth session before selecting remote" but didn't specify the exact mechanism. The implementation adds `hasRemoteSession?: boolean` to `SelectorConfig` instead of importing Supabase Auth directly. This keeps PR1 Supabase-free while making the auth gate explicit and testable.

**Minor deviation — `MaybePromise<T>` return type**:
The original design specified sync return types. The re-review identified that real Supabase failures will be async Promise rejections, so the port now uses `MaybePromise<T>`. The local adapter stays sync-compatible (returns `T` directly, which is assignable to `T | Promise<T>`). This is a necessary evolution, not a scope creep.

## Issues Found

None.

## Verification Results

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2535/2535 pass (0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |

## Workload / PR Boundary

- **Mode**: stacked PR slice (PR 1 of 2)
- **Current work unit**: PR 1 — Port + selector + local adapter + async-aware fallback + selection/fallback/studentId/legacy/injectable tests
- **Boundary**: Starts from `main`; ends with self-contained persistence port/selector/local-adapter/fallback slice
- **Estimated review budget**: ~750 changed lines (350 production + 400 test) — above 400-line budget but within acceptable range for a port+adapter+fallback slice with full TDD coverage
- **PR 2 scope**: Supabase adapter + client factory + migration + env config + RLS scan + serialization tests + wiring

## Git Branch

`feat/supabase-adapter-v0-fallback-port` (based on `main`)
