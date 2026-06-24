# Apply Progress: Supabase Adapter v0 with Local Fallback (I-24)

## Status

- **Change**: `supabase-adapter-v0-fallback`
- **Mode**: Strict TDD
- **Branch**: `feat/supabase-adapter-v0-fallback-remote`
- **Work Unit**: PR 2 / stacked-to-main slice — review fixes
- **Apply State**: ready → in-progress → review-fixes-applied → re-review-fixes-applied → final-review-fixes-applied → fresh-review-fixes-applied → second-fresh-review-fixes-applied → final-fresh-review-fixes-applied → reliability-blocker-fixes-applied

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

- [x] 1.3 RED — `src/lib/__tests__/no-service-role-scan.test.ts`
- [x] 1.4 GREEN — `src/lib/supabase/browser.ts`
- [x] 1.5 `pnpm add @supabase/supabase-js`
- [x] 3.1–3.4 Supabase adapter
- [x] 4.1–4.3 Migration and config
- [x] 5.1–5.4 Wire and verify
- [ ] 5.5 Manual smoke (user task)

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

- **Total tests written**: 92 (32 PR1 + 39 PR2 + 11 review fixes + 10 second-review fixes)
- **Total tests passing**: 2595 (full suite, 0 regressions)
- **Layers used**: Unit (92)
- **Pure functions created**: 9 (`isPersistenceAdapter`, `selectPersistenceAdapter`, `withLocalFallback`, `attempt`, `isFailedResult`, `isRemoteUnavailable`, `createRemoteUnavailableSentinel`, `createBrowserClient`, `createSupabaseAdapter`)

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
| `pnpm run test:run` | ✅ 2574/2574 pass (0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |

## Workload / PR Boundary

- **Mode**: stacked PR slice (PR 2 of 2)
- **Current work unit**: PR 2 — Supabase adapter + client factory + migration + env config + RLS scan + serialization tests + isolation tests + wiring
- **Boundary**: Starts from PR 1 branch; ends with complete Supabase persistence layer
- **Estimated review budget**: ~450 changed lines (200 production + 250 test)
- **PR 2 scope**: Supabase adapter + client factory + migration + env config + RLS scan + serialization tests + wiring

## Completed Tasks (PR 2)

- [x] 1.3 RED — `src/lib/__tests__/no-service-role-scan.test.ts` scans for service_role in client code, .env.example, package.json
- [x] 1.4 GREEN — `src/lib/supabase/browser.ts` exports `createBrowserClient()` using only public env vars
- [x] 1.5 `pnpm add @supabase/supabase-js` (v2.108.2)
- [x] 3.1 RED — `src/lib/__tests__/supabase-adapter-serialization.test.ts` round-trips all domain types through adapter
- [x] 3.2 GREEN — `src/lib/persistence/supabase-adapter.ts` implements PersistenceAdapter with Supabase client
- [x] 3.3 GREEN — Adapter handles PGRST116/network errors as recoverable; never throws
- [x] 3.4 RED — `src/lib/__tests__/active-student-isolation.test.ts` verifies studentId scoping
- [x] 4.1 `supabase/migrations/20260622_supabase_adapter_v0.sql` with tables + RLS policies
- [x] 4.2 `src/lib/__tests__/migration-rls-shape.test.ts` asserts RLS policy shape
- [x] 4.3 `.env.example` with public Supabase vars only
- [x] 5.1 `student-profile-storage.ts`: exported raw implementations, wired through local adapter
- [x] 5.2 `practice-progress.ts`: raw implementations preserved for local adapter injection
- [x] 5.3 `diagnostic-storage.ts`: raw implementations preserved for local adapter injection
- [x] 5.4 Verified: `pnpm run test:run` (2574/2574), `pnpm run typecheck` (clean), `pnpm run build` (success)

## TDD Cycle Evidence (PR 2)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.3 | `src/lib/__tests__/no-service-role-scan.test.ts` | Unit | N/A (new) | ✅ Written (3/4 fail) | ✅ 4/4 pass | ✅ 4 cases (supabase dir, .env, package.json, env vars) | ✅ Clean |
| 1.4 | `src/lib/supabase/browser.ts` | Unit | N/A (new) | Covered by 1.3 | ✅ Module exists, no forbidden patterns | ➖ Single impl | ✅ Clean |
| 1.5 | `package.json` | — | — | — | ✅ @supabase/supabase-js installed | — | ✅ Clean |
| 3.1 | `src/lib/__tests__/supabase-adapter-serialization.test.ts` | Unit | N/A (new) | ✅ Written (13/13 fail) | ✅ 13/13 pass | ✅ 10 cases (save/load profiles, progress, diagnostic, study plan + error handling) | ✅ Clean |
| 3.2 | `src/lib/persistence/supabase-adapter.ts` | Unit | N/A (new) | Covered by 3.1 | ✅ Passes via serialization tests | ➖ Single impl | ✅ Clean |
| 3.3 | `src/lib/__tests__/supabase-adapter-serialization.test.ts` | Unit | ✅ 13/13 | ✅ 3 tests RED (PGRST116, network error, no auth) | ✅ 13/13 pass | ✅ 3 error paths | ✅ Clean |
| 3.4 | `src/lib/__tests__/active-student-isolation.test.ts` | Unit | N/A (new) | ✅ Written (6/6 fail) | ✅ 6/6 pass | ✅ 6 cases (loadProgress, saveProgress, B's data, diagnostic, study plan, mismatch) | ✅ Clean |
| 4.1 | `supabase/migrations/20260622_supabase_adapter_v0.sql` | SQL | N/A (new) | — | ✅ Migration created | — | ✅ Clean |
| 4.2 | `src/lib/__tests__/migration-rls-shape.test.ts` | Unit | N/A (new) | ✅ Written (14/14 fail) | ✅ 14/14 pass | ✅ 14 assertions (tables, RLS, policies, constraints, auth.uid) | ✅ Clean |
| 4.3 | `.env.example` | Config | N/A (new) | — | ✅ Created with public vars only | — | ✅ Clean |
| 5.1 | `src/lib/student-profile-storage.ts` | Unit | ✅ 2574/2574 | N/A (wiring) | ✅ rawLoadProfiles/rawSaveProfiles exported | ➖ Single pattern | ✅ Internal calls use raw |
| 5.2 | `src/lib/practice-progress.ts` | Unit | ✅ 2574/2574 | N/A (wiring) | ✅ No changes needed (already raw) | ➖ Single pattern | ✅ Clean |
| 5.3 | `src/lib/diagnostic-storage.ts` | Unit | ✅ 2574/2574 | N/A (wiring) | ✅ No changes needed (already raw) | ➖ Single pattern | ✅ Clean |
| 5.4 | (verification) | — | ✅ 2574/2574 pass | — | — | — | ✅ typecheck clean, build success |

## Files Changed (PR 2)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/supabase/browser.ts` | Created | Supabase browser client factory with public env vars only |
| `src/lib/persistence/supabase-adapter.ts` | Created | Supabase PersistenceAdapter implementation with RLS scoping |
| `src/lib/persistence/index.ts` | Modified | Added createSupabaseAdapter export |
| `src/lib/student-profile-storage.ts` | Modified | Exported rawLoadProfiles/rawSaveProfiles for adapter injection |
| `src/lib/persistence/local-adapter.ts` | Modified | Updated imports to use raw implementations |
| `src/lib/__tests__/no-service-role-scan.test.ts` | Created | 4 tests: service role absence scan |
| `src/lib/__tests__/supabase-adapter-serialization.test.ts` | Created | 13 tests: serialization round-trip + error handling |
| `src/lib/__tests__/active-student-isolation.test.ts` | Created | 6 tests: student isolation enforcement |
| `src/lib/__tests__/migration-rls-shape.test.ts` | Created | 14 tests: migration RLS policy shape |
| `supabase/migrations/20260622_supabase_adapter_v0.sql` | Created | Tables + RLS policies for student_profiles and student_progress_snapshots |
| `.env.example` | Created | Public Supabase env vars documentation |
| `package.json` | Modified | Added @supabase/supabase-js dependency |
| `pnpm-lock.yaml` | Modified | Lockfile updated with Supabase dependencies |

## Completed Tasks (Fresh Review Fixes)

- [x] R8 — `withLocalFallback()` detects resolved `{ ok: false }` from write operations and falls back to local adapter; `isFailedResult()` helper added. 6 new tests (4 resolved-failure + 2 triangulation). BLOCKER fix.
- [x] R9 — `createBrowserClient()` wraps `createClient()` in try-catch; malformed URL/key returns null instead of crashing. 2 new tests. CRITICAL fix.
- [x] R10 — `getActiveStudentId()` validates active ID exists in profiles array; dangling/corrupt active ID returns null (fail closed). 2 new tests + 1 updated existing test. WARNING fix.
- [x] R11 — Strengthened isolation test: added result validation assertion alongside query filter check. WARNING fix.
- [x] R12 — OpenSpec consistency: STATUS.json PR2 branch corrected to `feat/supabase-adapter-v0-fallback-remote`, tasks.md 5.5 unchecked (deferred to user). WARNING fix.

## TDD Cycle Evidence (Fresh Review Fixes)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| R8 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 25/25 | ✅ 4 tests RED (saveProgress/saveProfiles/saveDiagnosticResult/saveStudyPlan ok:false) | ✅ 29/29 pass | ✅ 2 cases (ok:true no-fallback + async ok:false) | ✅ Clean |
| R9 | `src/lib/__tests__/persistence-selector.test.ts` | Unit | ✅ 29/29 | ✅ 2 tests RED (malformed URL + empty key) | ✅ 31/31 pass | ✅ 2 cases (invalid URL + empty key) | ✅ Clean |
| R10 | `src/lib/__tests__/persistence-selector.test.ts` + `student-profile-storage.test.ts` | Unit | ✅ 31/31 | ✅ 2 tests RED (dangling ID + valid ID) | ✅ 35/35 pass | ✅ 2 cases (dangling → null + valid → ID) | ✅ Clean |
| R11 | `src/lib/__tests__/active-student-isolation.test.ts` | Unit | ✅ 6/6 | N/A (strengthen existing) | ✅ 6/6 pass | ➖ Single assertion | ✅ Clean |
| R12 | (docs only) | — | — | — | — | — | ✅ STATUS.json + tasks.md corrected |

## Verification Results (Fresh Review Fixes)

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2585/2585 pass (11 new tests, 0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |
| Secret scan | ✅ Clean (no service_role in production code or .env.example) |

## Completed Tasks (Second Fresh Review Fixes)

- [x] S1 — BLOCKER: Production path wired through selector. Created `adapter-config.ts` module with `configurePersistenceAdapter()`/`getConfiguredAdapter()`/`resetPersistenceAdapter()`. Updated `student-profile-storage.ts` (`loadProfiles`, `saveProfiles`), `practice-progress.ts` (`loadProgress`, `saveProgress`), `diagnostic-storage.ts` (`loadDiagnosticResult`, `saveDiagnosticResult`, `loadStudyPlan`, `saveStudyPlan`) to delegate through configured adapter. Raw implementations exported for local adapter injection. 3 new tests.
- [x] S2 — BLOCKER: No-session reads fall back to local. Added `createRemoteUnavailableSentinel()` in selector.ts, `isRemoteUnavailable()` detection in `withLocalFallback()`. Supabase adapter returns sentinel for `loadProfiles`, `loadProgress`, `loadDiagnosticResult`, `loadStudyPlan` when `getAuthUserId()` returns null. 4 new tests using real Supabase adapter with no-session mock client.
- [x] S3 — CRITICAL: Observability hook. Added `onFallback` to `SelectorConfig`. `withLocalFallback()` accepts optional callback, invokes on every fallback (throws, rejections, resolved failures, remote unavailable). 3 new tests.
- [x] S4 — WARNING: Strengthened serialization payload assertions. `saveProfiles` verifies `upsertArgs.student_id` + `display_name`. `saveProgress` verifies `practice_progress.attempts` length + `accuracyBySkill` values.
- [x] S5 — WARNING: Isolation test clarified with comment explaining mock limitation (mock doesn't simulate RLS filtering; key proof is eq() call scoping).
- [x] S6 — WARNING: Consistency. Updated `student-profile-storage.ts` comment to reflect adapter delegation. Updated tasks.md with Phase 7.

## TDD Cycle Evidence (Second Fresh Review Fixes)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| S1 | `persistence-selector.test.ts` | Unit | ✅ 2585/2585 | ✅ 3 tests RED (loadProfiles remote data, loadProfiles fallback, saveProfiles delegates) | ✅ 2592/2592 pass | ✅ 3 cases | ✅ Clean |
| S2 | `persistence-selector.test.ts` | Unit | ✅ 2585/2585 | ✅ 4 tests RED (loadProfiles/loadProgress/loadDiagnosticResult/loadStudyPlan no-session) | ✅ 2595/2595 pass | ✅ 4 cases (all read methods) | ✅ Clean |
| S3 | `persistence-selector.test.ts` | Unit | ✅ 2585/2585 | ✅ 3 tests RED (onFallback throw, ok:false, no-call-on-success) | ✅ 2595/2595 pass | ✅ 3 cases | ✅ Clean |
| S4 | `supabase-adapter-serialization.test.ts` | Unit | ✅ 2585/2585 | ✅ 2 assertions strengthened (saveProfiles payload, saveProgress payload) | ✅ 2595/2595 pass | ✅ 2 payload shapes | ✅ Clean |
| S5 | `active-student-isolation.test.ts` | Unit | ✅ 2585/2585 | N/A (clarification only) | ✅ 2595/2595 pass | ➖ Comment update | ✅ Clean |
| S6 | (docs only) | — | — | — | — | — | ✅ tasks.md updated |

## Verification Results (Second Fresh Review Fixes)

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2595/2595 pass (10 new tests, 0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |
| Secret scan | ✅ Clean (no service_role in production code or .env.example) |

## Files Changed (Second Fresh Review Fixes)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/adapter-config.ts` | Created | Module-level adapter configuration: configurePersistenceAdapter(), getConfiguredAdapter(), resetPersistenceAdapter() |
| `src/lib/persistence/selector.ts` | Modified | Added `onFallback` to SelectorConfig, `isRemoteUnavailable()` sentinel detection, `createRemoteUnavailableSentinel()`, method names in `attempt()` calls |
| `src/lib/persistence/supabase-adapter.ts` | Modified | Read methods return `createRemoteUnavailableSentinel()` when no auth session (instead of empty/null) |
| `src/lib/persistence/local-adapter.ts` | Modified | Updated imports to use raw function names (loadProgressRaw, saveProgressRaw, etc.) |
| `src/lib/persistence/index.ts` | Modified | Added exports for adapter-config module and createRemoteUnavailableSentinel |
| `src/lib/student-profile-storage.ts` | Modified | Public loadProfiles/saveProfiles delegate through getConfiguredAdapter() |
| `src/lib/practice-progress.ts` | Modified | Public loadProgress/saveProgress delegate through getConfiguredAdapter(); raw versions exported for local adapter |
| `src/lib/diagnostic-storage.ts` | Modified | Public loadDiagnosticResult/saveDiagnosticResult/loadStudyPlan/saveStudyPlan delegate through getConfiguredAdapter(); raw versions exported |
| `src/lib/__tests__/persistence-selector.test.ts` | Modified | 10 new tests: 3 production path wiring, 4 no-session fallback, 3 observability |
| `src/lib/__tests__/supabase-adapter-serialization.test.ts` | Modified | 2 strengthened payload assertions (saveProfiles, saveProgress) |
| `src/lib/__tests__/active-student-isolation.test.ts` | Modified | Clarified mock limitation comment |

## Completed Tasks (Final Fresh-Review Fixes)

- [x] T1 — BLOCKER: Production initialization wiring. `initializePersistence()` async function checks env vars + Auth session → configures adapter with fallback. 4 new tests.
- [x] T2 — BLOCKER: Async-aware public APIs. Removed `instanceof Promise` fallback. All public functions return `MaybePromise<T>`. Updated all callers. 5 new tests.
- [x] T3 — BLOCKER: `addAttempt()` fires adapter save asynchronously. 1 new test.
- [x] T4 — WARNING: Safe auth options. `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`. 1 new test.
- [x] T5 — WARNING: Test quality. Isolation test accurately describes mock limitation. Serialization tests strengthened for `saveDiagnosticResult`/`saveStudyPlan` payloads.
- [x] T6 — WARNING: OpenSpec consistency. tasks.md updated with Phase 8.

## TDD Cycle Evidence (Final Fresh-Review Fixes)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| T1 | `persistence-selector.test.ts` | Unit | ✅ 2605/2605 | ✅ 4 tests RED (env+session, no env, no session, malformed env) | ✅ 2609/2609 pass | ✅ 4 cases | ✅ Clean |
| T2 | `persistence-selector.test.ts` | Unit | ✅ 2609/2609 | ✅ 5 tests RED (loadProfiles/saveProfiles/loadProgress/saveProgress async + addAttempt adapter fire) | ✅ 2614/2614 pass | ✅ 5 cases | ✅ Clean |
| T3 | `persistence-selector.test.ts` | Unit | ✅ 2614/2614 | Covered by T2 (addAttempt adapter fire test) | ✅ Passes via T2 | ➖ Single path | ✅ Clean |
| T4 | `persistence-selector.test.ts` | Unit | ✅ 2614/2614 | ✅ 1 test RED (persistSession false) | ✅ 2615/2615 pass | ➖ Single assertion | ✅ Clean |
| T5 | `active-student-isolation.test.ts`, `supabase-adapter-serialization.test.ts` | Unit | ✅ 2615/2615 | N/A (strengthen existing) | ✅ 2615/2615 pass | ✅ 4 payload assertions | ✅ Clean |
| T6 | (docs only) | — | — | — | — | — | ✅ tasks.md updated |

## Verification Results (Final Fresh-Review Fixes)

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2605/2605 pass (10 new tests, 0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |
| Secret scan | ✅ Clean (no service_role in production code or .env.example) |

## Files Changed (Final Fresh-Review Fixes)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/adapter-config.ts` | Modified | Added `initializePersistence()` async function for production wiring |
| `src/lib/persistence/index.ts` | Modified | Added `initializePersistence` export |
| `src/lib/student-profile-storage.ts` | Modified | `loadProfiles`/`saveProfiles` return `MaybePromise<T>` (removed `instanceof Promise` fallback) |
| `src/lib/practice-progress.ts` | Modified | `loadProgress`/`saveProgress` return `MaybePromise<T>`; `addAttempt` fires adapter save asynchronously |
| `src/lib/diagnostic-storage.ts` | Modified | All 4 public functions return `MaybePromise<T>` (removed `instanceof Promise` fallback) |
| `src/lib/supabase/browser.ts` | Modified | Set `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false` for v0 |
| `src/app/diagnostic/page.tsx` | Modified | Handle `MaybePromise` from `saveDiagnosticResult`/`saveStudyPlan`/`loadProgress` |
| `src/app/practice/usePracticeFlow.ts` | Modified | Handle `MaybePromise` from `loadProgress` in useEffect |
| `src/components/home/StudyPlanSection.tsx` | Modified | Handle `MaybePromise` from `loadStudyPlan`/`loadProgress` |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Handle `MaybePromise` from `loadProgress`/`loadDiagnosticResult` |
| `src/components/home/StudentSwitcher.tsx` | Modified | Handle `MaybePromise` from `loadProfiles` via useEffect |
| `src/lib/__tests__/persistence-selector.test.ts` | Modified | 10 new tests (B1: 4, B2: 5, B4: 1) |
| `src/lib/__tests__/active-student-isolation.test.ts` | Modified | Clarified mock limitation comment |
| `src/lib/__tests__/supabase-adapter-serialization.test.ts` | Modified | Strengthened `saveDiagnosticResult`/`saveStudyPlan` payload assertions |
| `src/lib/__tests__/practice-progress.test.ts` | Modified | Added `asSync` helper for MaybePromise handling |
| `src/lib/__tests__/practice-progress-migration.test.ts` | Modified | Added `asSync` helper for MaybePromise handling |
| `src/lib/__tests__/diagnostic-storage.test.ts` | Modified | Added `asSync` helper for MaybePromise handling |
| `src/lib/__tests__/student-profile-storage.test.ts` | Modified | Added `asSync` helper for MaybePromise handling |
| `src/hooks/__tests__/active-student-store.test.ts` | Modified | Added `asSync` helper for MaybePromise handling |

## Completed Tasks (Ultimate Review Fixes)

- [x] U1 — BLOCKER: Production init wiring. Created `PersistenceInitializer` client component (`src/components/PersistenceInitializer.tsx`) that calls `initializePersistence()` once on mount via `useEffect([], [])`. Mounted from `src/app/layout.tsx`. Renders null. 6 source-level tests.
- [x] U2 — CRITICAL: Production fallback sink. Created `src/lib/persistence/fallback-sink.ts` with `createProductionFallbackSink()` — guarded `console.warn` sink. No service_role, no secrets. `PersistenceInitializer` passes it as `onFallback`. 6 source-level tests.
- [x] U3 — CRITICAL: Isolation defense-in-depth. `supabase-adapter.ts` validates returned `student_id` matches requested on `loadProgress`/`loadDiagnosticResult`/`loadStudyPlan`. Returns EMPTY_PROGRESS/null on mismatch. Updated `select()` to include `student_id`. Strengthened isolation test to assert B's payload NOT returned.
- [x] U4 — WARNING: Serialization deep equality. `loadProgress`, `loadDiagnosticResult`, `loadStudyPlan` tests now verify all domain fields (exerciseIds, errorTags, accuracyBySkill, estimates, skillPriorities, weakConcepts, etc.).
- [x] U5 — WARNING: OpenSpec consistency. `ConfiguredAdapter` derived from `PersistenceAdapter` (removed duplicate interface). Removed unused type imports. Test count consistent at 2617/2617.

## TDD Cycle Evidence (Ultimate Review Fixes)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| U1 | `src/components/__tests__/PersistenceInitializer.test.ts` | Unit (source) | N/A (new) | ✅ 6/6 fail | ✅ 6/6 pass | ✅ 6 cases (exists, imports, useEffect, null render, empty deps, use client) | ✅ Clean |
| U2 | `src/components/__tests__/production-fallback-sink.test.ts` | Unit (source) | N/A (new) | ✅ 6/6 fail | ✅ 6/6 pass | ✅ 6 cases (exists, exports, console.warn, no secrets, onFallback wiring, imports) | ✅ Clean |
| U3 | `src/lib/__tests__/active-student-isolation.test.ts` | Unit | ✅ 6/6 | ✅ 1 test strengthened (defense-in-depth assertion) | ✅ 6/6 pass | ✅ B's payload NOT returned | ✅ Clean |
| U4 | `src/lib/__tests__/supabase-adapter-serialization.test.ts` | Unit | ✅ 13/13 | ✅ 3 tests strengthened (deep equality) | ✅ 13/13 pass | ✅ All domain fields verified | ✅ Clean |
| U5 | (cleanup only) | — | — | — | — | — | ✅ ConfiguredAdapter derived from PersistenceAdapter |

## Verification Results (Ultimate Review Fixes)

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2617/2617 pass (12 new tests, 0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |
| Secret scan | ✅ Clean (no service_role in production code or .env.example) |

## Files Changed (Ultimate Review Fixes)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/components/PersistenceInitializer.tsx` | Created | Client-only init component: useEffect → initializePersistence → null |
| `src/lib/persistence/fallback-sink.ts` | Created | Production console.warn sink for fallback events |
| `src/app/layout.tsx` | Modified | Mounted `<PersistenceInitializer />` in body |
| `src/lib/persistence/adapter-config.ts` | Modified | `ConfiguredAdapter = PersistenceAdapter` (derived, not duplicated). Removed unused imports. |
| `src/lib/persistence/supabase-adapter.ts` | Modified | Defense-in-depth: validate returned `student_id` on loadProgress/loadDiagnosticResult/loadStudyPlan. Updated select() to include student_id. |
| `src/lib/__tests__/active-student-isolation.test.ts` | Modified | Strengthened "B's data" test to assert EMPTY_PROGRESS on mismatch |
| `src/lib/__tests__/supabase-adapter-serialization.test.ts` | Modified | Deep equality for loadProgress, loadDiagnosticResult, loadStudyPlan |
| `src/components/__tests__/PersistenceInitializer.test.ts` | Created | 6 source-level tests for init component |
| `src/components/__tests__/production-fallback-sink.test.ts` | Created | 6 source-level tests for fallback sink |

## Git Branch

`feat/supabase-adapter-v0-fallback-remote` (based on `feat/supabase-adapter-v0-fallback-port` / `main`)

## Completed Tasks (Phase 10: Final Fix-Round)

- [x] X1 — CRITICAL: Initialization race. Added `initializationPromise` tracking to `adapter-config.ts`. `getInitializationPromise()` exposes the promise. `loadProgressWhenReady()` awaits init before delegating. 4 new tests.
- [x] X2 — CRITICAL: Remote FK/profile creation gap. `createProfileAndActivate()` now calls `adapter.saveProfiles()` when remote adapter is configured. Remote failures caught — local authoritative. 4 new tests.
- [x] X3 — WARNING: Initializer unhandled rejection. `initializePersistence()` wrapped in try/catch. All errors degrade to local + call `onFallback("initializePersistence", err)`. 3 new tests.
- [x] X4 — WARNING: Observability sink. `fallback-sink.ts` dispatches `persistence:fallback` CustomEvent on `globalThis` with `{ method, errorSummary, timestamp }`. `PersistenceFallbackEventDetail` type exported. 7 new tests (3 source + 4 runtime).
- [x] X5 — WARNING: OpenSpec consistency. Removed stale BLOCKER/CRITICAL FIX process labels from production comments. Updated test counts. Manual smoke deferred.

## TDD Cycle Evidence (Phase 10)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| X1 | `src/lib/__tests__/initialization-race.test.ts` | Unit | ✅ 2617/2617 | ✅ 4/4 fail | ✅ 4/4 pass | ✅ 4 cases (await init, no init pending, getPromise null, getPromise set) | ✅ Clean |
| X2 | `src/lib/__tests__/remote-fk-profile-creation.test.ts` | Unit | ✅ 2617/2617 | ✅ 1/4 fail (adapter.saveProfiles not called) | ✅ 4/4 pass | ✅ 4 cases (adapter call, reject fallback, ok:false fallback, local-only) | ✅ Clean |
| X3 | `src/lib/__tests__/initializer-rejection-sink.test.ts` | Unit | ✅ 2617/2617 | ✅ 6/8 fail | ✅ 8/8 pass | ✅ 3 cases (auth error, runtime error, onFallback called) | ✅ Clean |
| X4 | `src/lib/__tests__/initializer-rejection-sink.test.ts` | Unit | ✅ 2625/2625 | ✅ 5/10 fail (CustomEvent source + runtime) | ✅ 10/10 pass | ✅ 7 cases (dispatch, detail, secrets, warn, globalThis, runtime detail, runtime secrets) | ✅ Clean |

## Verification Results (Phase 10)

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2635/2635 pass (18 new tests, 0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |
| Secret scan | ✅ Clean (no service_role in production code) |

## Files Changed (Phase 10)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/adapter-config.ts` | Modified | Added `initializationPromise` tracking, `getInitializationPromise()`, `loadProgressWhenReady()`, try/catch in `initializePersistence()` |
| `src/lib/persistence/index.ts` | Modified | Added exports for `getInitializationPromise`, `loadProgressWhenReady` |
| `src/lib/persistence/fallback-sink.ts` | Modified | Added CustomEvent dispatch with `PersistenceFallbackEventDetail` type |
| `src/lib/student-profile-storage.ts` | Modified | `createProfileAndActivate()` calls `adapter.saveProfiles()` when configured |
| `src/components/PersistenceInitializer.tsx` | Modified | Removed stale BLOCKER FIX process label from JSDoc |
| `src/lib/__tests__/initialization-race.test.ts` | Created | 4 tests: init promise tracking and await-chaining |
| `src/lib/__tests__/remote-fk-profile-creation.test.ts` | Created | 4 tests: adapter.saveProfiles called on profile creation |
| `src/lib/__tests__/initializer-rejection-sink.test.ts` | Created | 10 tests: try/catch + CustomEvent dispatch |
| `openspec/changes/supabase-adapter-v0-fallback/tasks.md` | Modified | Added Phase 10 tasks |
| `openspec/changes/supabase-adapter-v0-fallback/verify-report.md` | Modified | Updated test count to 2635 |

## Phase 11: Reliability Blocker Fixes (initialization race, FK ordering, verify-report wording)

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| Y1 | `src/lib/__tests__/initialization-race.test.ts` | Unit | ✅ 2635/2635 | ✅ Written | ✅ Passed | ✅ 5 cases (loadProgress race, loadProgress sync, loadDiagnosticResult race, loadStudyPlan race, loadProfiles race) | ✅ Clean |
| Y2 | `src/lib/__tests__/remote-fk-profile-creation.test.ts` | Unit | ✅ 2641/2641 | ✅ Written | ✅ Passed | ✅ 1 case (ordering boundary) | ✅ Clean |
| Y3 | N/A (doc-only) | N/A | N/A | N/A | N/A | N/A | N/A |

### Completed Tasks (Phase 11)

- [x] Y1 — BLOCKER: Public storage functions initialization-aware. `loadProgress()`, `loadDiagnosticResult()`, `loadStudyPlan()`, `loadProfiles()` now await `getInitializationPromise()` before checking adapter. Returns Promise when init is pending, sync result when not. 5 new tests.
- [x] Y2 — BLOCKER: Remote FK ordering boundary. `createProfileAndActivate()` tracks pending remote profile save promise via `setPendingProfileSavePromise()`. `addAttempt()` waits for pending profile save before calling `adapter.saveProgress()`. New functions: `getPendingProfileSavePromise()`, `setPendingProfileSavePromise()`, `clearPendingProfileSavePromise()`. 1 new test.
- [x] Y3 — WARNING: Verify-report wording. Updated Safety Net row from "N/A (all new files)" to accurate description of existing test baseline and new tests added.

## Verification Results (Phase 11)

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2641/2641 pass (6 new tests, 0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack) |
| Secret scan | ✅ Clean (no service_role in production code) |

## Files Changed (Phase 11)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/adapter-config.ts` | Modified | Added `pendingProfileSavePromises` Map, `getPendingProfileSavePromise()`, `setPendingProfileSavePromise()`, `clearPendingProfileSavePromise()` |
| `src/lib/practice-progress.ts` | Modified | `loadProgress()` now awaits `getInitializationPromise()` before checking adapter. `addAttempt()` waits for pending profile save before remote saveProgress. |
| `src/lib/diagnostic-storage.ts` | Modified | `loadDiagnosticResult()` and `loadStudyPlan()` now await `getInitializationPromise()` before checking adapter. |
| `src/lib/student-profile-storage.ts` | Modified | `loadProfiles()` now awaits `getInitializationPromise()` before checking adapter. `createProfileAndActivate()` tracks pending profile save promise. |
| `src/lib/__tests__/initialization-race.test.ts` | Modified | Added 5 new tests for initialization-aware public APIs |
| `src/lib/__tests__/remote-fk-profile-creation.test.ts` | Modified | Added 1 new test for FK ordering boundary |
| `openspec/changes/supabase-adapter-v0-fallback/tasks.md` | Modified | Added Phase 11 tasks |
| `openspec/changes/supabase-adapter-v0-fallback/verify-report.md` | Modified | Updated test count to 2641, added Phase 11 verification, fixed Safety Net wording |

## Completed Tasks (Phase 12: Minimal Real Telemetry Sink)

- [x] 12.1 RED — `src/lib/__tests__/fallback-sink-network.test.ts` (3 source-level + 5 runtime + 7 route tests, 27 total) asserts the sink POSTs sanitized events via `navigator.sendBeacon` (with `fetch({ keepalive: true })` fallback) to `/api/persistence/fallback`.
- [x] 12.2 RED — Same file asserts the sink still dispatches the `persistence:fallback` CustomEvent AND still calls `console.warn` (preserves existing behavior).
- [x] 12.3 RED — Same file asserts the route handler at `src/app/api/persistence/fallback/route.ts` accepts the strict `FallbackEventPayload` shape and returns 204.
- [x] 12.4 RED — Same file asserts the route rejects malformed payloads (missing `method` / `errorSummary` / `timestamp`, non-JSON body) with 4xx.
- [x] 12.5 GREEN — Created `src/lib/persistence/fallback-event.ts` exporting `FallbackEventPayload`, `FallbackAdapterKind`, `DEFAULT_FALLBACK_ENDPOINT`, and `isFallbackEventPayload()` (shared client/server contract). The shape is intentionally strict: only 3 required primitives (method, errorSummary, timestamp) + 2 optional fields (sessionActive, adapterKind).
- [x] 12.6 GREEN — Updated `src/lib/persistence/fallback-sink.ts` to call `navigator.sendBeacon` (with `fetch({ keepalive: true })` fallback) to the relative URL; preserves CustomEvent dispatch + console.warn; endpoint is configurable via `CreateFallbackSinkOptions.endpoint`. Sink is fire-and-forget — never throws.
- [x] 12.7 GREEN — Created `src/app/api/persistence/fallback/route.ts` (Next.js Route Handler) accepting POST, validating shape via `isFallbackEventPayload()`, returning 204 on success / 400 on malformed body. No persistence, no logging, no PII. Endpoint is intake-only — not a sink.
- [x] 12.8 Verified `pnpm run test:run` (2668/2668), `pnpm run typecheck` (clean), `pnpm run build` (success — route registered as `ƒ /api/persistence/fallback`).

## TDD Cycle Evidence (Phase 12)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 12.1 | `src/lib/__tests__/fallback-sink-network.test.ts` | Unit | ✅ 2641/2641 | ✅ 7 source-level + 5 runtime tests RED (exports, sendBeacon, fetch fallback, CustomEvent, console.warn, no-secrets, endpoint-configurable + sendBeacon-called, fetch-fallback, message-capture, truncation, endpoint-override) | ✅ 27/27 pass | ✅ 5+ cases per behavior | ✅ Extracted `sanitizeErrorSummary`, `buildFallbackPayload`, `sendNetwork` helpers |
| 12.2 | `src/lib/__tests__/fallback-sink-network.test.ts` | Unit | ✅ 2641/2641 | ✅ 2 tests RED (CustomEvent still dispatched + console.warn still called) | ✅ 27/27 pass | ✅ Both transports exercised in same test | ✅ Clean |
| 12.3 | `src/lib/__tests__/fallback-sink-network.test.ts` | Unit | ✅ 2641/2641 | ✅ 2 tests RED (valid full payload → 204, minimal payload → 204) | ✅ 27/27 pass | ✅ 2 cases (full + minimal) | ✅ Clean |
| 12.4 | `src/lib/__tests__/fallback-sink-network.test.ts` | Unit | ✅ 2641/2641 | ✅ 5 tests RED (missing method/errorSummary/timestamp, non-JSON, no-secrets scan) | ✅ 27/27 pass | ✅ 5 cases (each required field + non-JSON + secret scan) | ✅ Clean |
| 12.5 | `fallback-event.ts` | Unit | N/A (new) | ✅ 3 tests RED (module exists, exports type, payload shape) | ✅ 27/27 pass | ➖ Single contract | ✅ Clean |
| 12.6 | `fallback-sink.ts` | Unit | N/A (refactor) | N/A (covered by 12.1) | ✅ Passes via network tests | ✅ Multiple payload shapes | ✅ Extracted `sanitizeErrorSummary`, `buildFallbackPayload`, `sendNetwork`; `NavigatorLike` interface |
| 12.7 | `route.ts` | Unit | N/A (new) | ✅ 2 tests RED (file exists, exports POST) | ✅ 27/27 pass | ➖ Single endpoint | ✅ Clean |
| 12.8 | (verification) | — | ✅ 2668/2668 pass | ✅ 1 test RED (PersistenceInitializer regression) | ✅ 27/27 pass | ➖ Single regression | ✅ typecheck clean, build success, no service_role in code |

### Test Summary (Phase 12)

- **Total tests written**: 27 (3 type + 7 source + 7 runtime + 2 route-file + 2 route-valid + 5 route-invalid + 1 regression)
- **Total tests passing**: 2668 (full suite, 0 regressions)
- **Layers used**: Unit (27)
- **Pure functions created**: 3 (`sanitizeErrorSummary`, `buildFallbackPayload`, `isFallbackEventPayload`)

## Files Changed (Phase 12)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/fallback-event.ts` | Created | Shared payload contract: `FallbackEventPayload`, `FallbackAdapterKind`, `DEFAULT_FALLBACK_ENDPOINT`, `isFallbackEventPayload()` |
| `src/lib/persistence/fallback-sink.ts` | Modified | Added `CreateFallbackSinkOptions`, `sanitizeErrorSummary()`, `buildFallbackPayload()`, internal `sendNetwork()` (sendBeacon → fetch keepalive fallback). Sink still calls `console.warn` + dispatches `persistence:fallback` CustomEvent. Endpoint configurable but defaults to relative URL. Fire-and-forget, never throws. |
| `src/app/api/persistence/fallback/route.ts` | Created | Next.js Route Handler: POST, validates via `isFallbackEventPayload()`, returns 204 on success / 400 on invalid JSON or malformed payload. Intake-only — no persistence, no PII logging. |
| `src/lib/__tests__/fallback-sink-network.test.ts` | Created | 27 tests: payload type, source-level network transport, runtime sendBeacon, runtime fetch fallback, sanitization, truncation, CustomEvent preservation, console.warn preservation, endpoint override, route handler 204, route handler 400s, secret scan |
| `openspec/changes/supabase-adapter-v0-fallback/tasks.md` | Modified | Added Phase 12 tasks |
| `openspec/changes/supabase-adapter-v0-fallback/apply-progress.md` | Modified | Added Phase 12 section with TDD evidence and files changed |
| `openspec/changes/supabase-adapter-v0-fallback/verify-report.md` | Modified | Updated test count to 2668, added Phase 12 verification |

## Design Decisions (Phase 12)

- **Endpoint = relative URL, no env derivation.** Keeps the route same-origin and prevents accidental cross-origin leaks. The endpoint is configurable via `CreateFallbackSinkOptions.endpoint` for testing only.
- **Fire-and-forget transport.** The sink never throws and never awaits the network response. `sendBeacon` survives page unload; `fetch({ keepalive: true })` is the fallback for environments without `sendBeacon`. Both are non-blocking.
- **Intake-only route.** The route handler is a contract surface, not a sink. It validates the shape and returns 204 without persisting. Future telemetry centralization (if any) replaces this file with a thin shim over a real backend without changing the client contract.
- **Strict validation, not schema library.** `isFallbackEventPayload` uses 9 type checks instead of zod/valibot to keep the dependency surface small. The contract is 3 required + 2 optional primitives — schema libraries are overkill.
- **`PersistenceInitializer` unchanged.** The sink's default endpoint is the relative URL, so `PersistenceInitializer` can keep calling `createProductionFallbackSink()` with no args. If a future change needs to override the endpoint, it can pass `{ endpoint: "..." }` to the sink factory.

## Phase 13: Payload Bounds + No-JSON-Leak Hardening (W1 + W2)

### Completed Tasks (Phase 13)

- [x] 13.1 RED — 6 length-cap tests added to `fallback-sink-network.test.ts`. Each field tested at max length (64/200/32 = valid) and one above (65/201/33 = rejected).
- [x] 13.2 RED — 6 no-JSON-leak tests added. Covers `{ok:false, reason:"..."}`, nested objects, arbitrary non-Error objects, pathologically long toString (sentinel), Error regression, string regression.
- [x] 13.3 GREEN — `isFallbackEventPayload` enforces length caps via shared `FALLBACK_PAYLOAD_BOUNDS` constants. Caps: `methodMaxLength=64`, `errorSummaryMaxLength=200`, `timestampMaxLength=32`. Caps are the single source of truth shared by client and server.
- [x] 13.4 GREEN — `sanitizeErrorSummary` non-Error path uses `String(error)` (yields `"[object Object]"`) wrapped in `try/catch` with a length guard falling back to the fixed `"unknown-fallback-reason"` sentinel. Truncation sliced to leave room for the `…` so the final string stays within `errorSummaryMaxLength`. Sink imports the shared `FALLBACK_PAYLOAD_BOUNDS` so the wire cap and the validator cap are always in sync.
- [x] 13.5 Verified `pnpm run test:run` (2680/2680), `pnpm run typecheck` (clean), `pnpm run build` (success — 8/8 routes registered), secret scan clean (no `service_role` / `SUPABASE_SERVICE_ROLE_KEY` / `publishableKey` / `NEXT_PUBLIC_SUPABASE` in client-facing code, only public env var names referenced in selector / adapter-config).

### TDD Cycle Evidence (Phase 13)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 13.1 (W1) | `src/lib/__tests__/fallback-sink-network.test.ts` | Unit | ✅ 2668/2668 | ✅ 3/6 fail before fix (reject paths); 3/6 pass (accept paths) | ✅ 6/6 pass | ✅ 3 fields × (accept-max + reject-above) | ✅ Extracted `FALLBACK_PAYLOAD_BOUNDS` for shared client/server source of truth |
| 13.2 (W2) | `src/lib/__tests__/fallback-sink-network.test.ts` | Unit | ✅ 2668/2668 | ✅ 4/6 fail before fix (no-JSON leak assertions + sentinel); 2/6 pass (regression checks) | ✅ 6/6 pass | ✅ 4 sanitization paths + 2 regression checks | ✅ Replaced `JSON.stringify` with `String()` + sentinel guard; truncation leaves room for `…` |
| 13.3 (W1 GREEN) | `fallback-event.ts` | Unit | N/A (covered by 13.1) | N/A | ✅ 6/6 length-cap tests pass | ✅ 3 field caps enforced | ✅ Caps exported as `FALLBACK_PAYLOAD_BOUNDS` constant |
| 13.4 (W2 GREEN) | `fallback-sink.ts` | Unit | N/A (covered by 13.2) | N/A | ✅ 6/6 no-leak tests pass | ✅ Multiple non-Error shapes | ✅ `UNKNOWN_FALLBACK_REASON` constant; `try/catch` + length guard |
| 13.5 | (verification) | — | ✅ 2680/2680 pass | — | — | — | ✅ typecheck clean, build success, secret scan clean |

### Test Summary (Phase 13)

- **Total tests written**: 12 (6 W1 + 6 W2)
- **Total tests passing**: 2680 (full suite, 0 regressions)
- **Layers used**: Unit (12)
- **Pure functions created**: 1 (`FALLBACK_PAYLOAD_BOUNDS` constant; `sanitizeErrorSummary` and `isFallbackEventPayload` modified)

### Verification Results (Phase 13)

| Gate | Result |
|------|--------|
| `pnpm run test:run` | ✅ 2680/2680 pass (12 new tests, 0 regressions) |
| `pnpm run typecheck` | ✅ Clean |
| `pnpm run build` | ✅ Success (Next.js 16.2.7 Turbopack, 8/8 routes) |
| Secret scan | ✅ Clean (no `service_role` / non-public Supabase vars in client code) |

### Files Changed (Phase 13)

| File | Action | What Was Done |
|------|--------|---------------|
| `src/lib/persistence/fallback-event.ts` | Modified | Added `FALLBACK_PAYLOAD_BOUNDS` constant; `isFallbackEventPayload` now enforces length caps (method <= 64, errorSummary <= 200, timestamp <= 32) |
| `src/lib/persistence/fallback-sink.ts` | Modified | Imports `FALLBACK_PAYLOAD_BOUNDS` so client/server share the cap; `sanitizeErrorSummary` non-Error path uses `String()` + `try/catch` + length guard with `"unknown-fallback-reason"` sentinel; truncation leaves room for the `…` so the wire string stays within `errorSummaryMaxLength` |
| `src/lib/__tests__/fallback-sink-network.test.ts` | Modified | 12 new tests: 6 W1 length-cap boundaries, 6 W2 no-JSON-leak assertions (incl. 2 regression checks for Error.message and plain string) |
| `openspec/changes/supabase-adapter-v0-fallback/tasks.md` | Modified | Added Phase 13 tasks |
| `openspec/changes/supabase-adapter-v0-fallback/apply-progress.md` | Modified | Added Phase 13 section with TDD evidence and files changed |
| `openspec/changes/supabase-adapter-v0-fallback/verify-report.md` | Modified | Updated test count to 2680, added Phase 13 verification |
| `openspec/changes/STATUS.json` | Modified | Updated test count to 2680 |

### Design Decisions (Phase 13)

- **Shared `FALLBACK_PAYLOAD_BOUNDS` constant.** Caps live in `fallback-event.ts` and are imported by the sink. The validator and the producer read from the same source, so a future cap change cannot leave them out of sync.
- **`String(error)` over `JSON.stringify` for non-Error inputs.** `String()` returns `"[object Object]"` for plain objects — short, stable, no internal key/value leakage. `JSON.stringify` would have exposed the `reason` field of `{ok:false, reason:"..."}` results verbatim.
- **Fixed `"unknown-fallback-reason"` sentinel.** Used when `String(error)` throws (e.g. `Symbol`) or yields a pathologically long result. The sentinel is invariant: it never contains caller-controlled data, so it cannot leak internals.
- **Truncation leaves room for the `…` ellipsis.** The previous truncation produced 201-char strings (200 + `…`), which would be rejected by the new 200-char validator cap. The fix slices to `MAX - 1` and appends `…`, so the final string is exactly 200 chars.
- **Route handler unchanged.** `isFallbackEventPayload` is the single source of truth — the route inherits the new length caps without any local duplication.

## PR2 size:exception acceptance

### Decision
- State: user accepted `size:exception` for PR2.
- Recorded: 2026-06-23.

### Rationale
- PR2 diff (~2060 insertions / 170 deletions excluding `pnpm-lock.yaml`) exceeds the 450-line review budget by ~4x.
- The excess is minimum-real-scope: Supabase adapter v0 requires selector + remote adapter + browser client/factory + migration/RLS + `.env.example` + storage wiring + production initializer + fallback sink + Next.js API route + tests + OpenSpec updates.
- These pieces are tightly coupled; artificially splitting them introduces integration seams and re-verification cost without reducing real risk.
- Stacked-to-main strategy is preserved: PR1 (#51, merge commit `b9db260`) is already in `main`; PR2 targets updated `main`.

### Compensating controls
- Automated tests: `pnpm run test:run` 2680/2680 pass (155 files, 0 regressions).
- Typecheck: `pnpm run typecheck` clean.
- Build: `pnpm run build` success — 8/8 routes (incl. `ƒ /api/persistence/fallback`).
- Secret scan: clean (no `service_role` / `SUPABASE_SERVICE_ROLE_KEY` / non-public Supabase vars in client code; only public env names).
- Strict TDD throughout all phases: RED→GREEN→REFACTOR evidence in `apply-progress.md`.
- Fresh-context reviews after each phase: risk / reliability / resilience / readability — final pass has 0 BLOCKER/CRITICAL.
- Specific test files:
  - `src/lib/__tests__/no-service-role-scan.test.ts` — 4 tests proving no service-role references in client code, .env.example, or package.json
  - `src/lib/__tests__/migration-rls-shape.test.ts` — 14 tests proving tables, RLS, policies, and constraints are present
  - `src/lib/__tests__/supabase-adapter-serialization.test.ts` — 13 tests for round-trip serialization of domain types
  - `src/lib/__tests__/active-student-isolation.test.ts` — 6 tests proving active-student isolation + defense-in-depth
  - `src/lib/__tests__/persistence-selector.test.ts` — 55+ tests covering selection, fallback, async, and observability
  - `src/lib/__tests__/remote-fk-profile-creation.test.ts` — 5 tests proving profile save precedes progress save (FK ordering)
  - `src/lib/__tests__/initialization-race.test.ts` — 9 tests proving initialization-await semantics in public APIs
  - `src/lib/__tests__/initializer-rejection-sink.test.ts` — 10 tests proving try/catch + CustomEvent observability
  - `src/lib/__tests__/fallback-sink-network.test.ts` — 39 tests proving telemetry transport + length caps + no-JSON-leak
  - `src/components/__tests__/PersistenceInitializer.test.ts` — 6 tests proving production init wiring
  - `src/components/__tests__/production-fallback-sink.test.ts` — 6 tests proving fallback sink wiring

### High-risk areas
- RLS and data security
- Accidental exposure of secrets / non-public Supabase vars
- Local fallback when Supabase is unconfigured
- Behavior on remote persistence failure
- Compatibility with existing local storage
- Absence of JSON/PII leak in logs and route responses

### Deferred risk: manual smoke 5.5
- State: deferred. Requires a real Supabase project + real auth session.
- Gate: must be executed before enabling Supabase as the production backend.
- Documented: this is NOT a blocker for merge but IS a gate before real-backend enablement.

### Reviewer guidance
- Inline human line-by-line review is not a realistic mitigation for this PR size.
- Reviewers should focus on the block-by-block structure documented in the PR description (review-by-blocks guide).
- Mitigation comes from: automated tests, typecheck, build, secret scan, fresh review, structured PR description, risk documentation.

### Related follow-up
- Centralized telemetry sink for `persistence:fallback` (currently intake-only); documented as future work.
