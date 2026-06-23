# Tasks: Supabase Adapter v0 with Local Fallback (I-24)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Work Units

| Unit | Goal | PR | Base |
|------|------|----|------|
| 1 | Port + selector + local adapter + selection/fallback tests. | PR 1 | `main` |
| 2 | Supabase adapter + factory + migration + env + RLS scan + serialization + isolation + delegation. | PR 2 | PR 1 branch or stacked |

## Phase 1: Port and Client

- [x] 1.1 RED — `src/lib/__tests__/persistence-port.test.ts` asserts `PersistenceAdapter` shape
- [x] 1.2 GREEN — `src/lib/persistence/port.ts` exports `PersistenceAdapter`, `ProfileSaveResult`, `PersistenceResult<T>`; re-exports domain types
- [ ] 1.3 RED — `src/lib/__tests__/no-service-role-scan.test.ts` scans `src/lib/supabase/**`, `.env.example`, `package.json` for `SERVICE_ROLE`/`SUPABASE_SERVICE_ROLE_KEY`/`service_role`; asserts none *(PR 2)*
- [ ] 1.4 GREEN — `src/lib/supabase/browser.ts` exports `createBrowserClient(url, publishableKey)`; JSDoc forbids service-role keys *(PR 2)*
- [ ] 1.5 `pnpm add @supabase/supabase-js`; commit `package.json` + lockfile *(PR 2)*

## Phase 2: Local Adapter and Selector

- [x] 2.1 RED — `src/lib/__tests__/persistence-selector.test.ts` covers missing URL/key, no auth, healthy remote, remote-throws; matches fallback scenarios
- [x] 2.2 GREEN — `src/lib/persistence/local-adapter.ts` wraps storage modules into `PersistenceAdapter`; preserves `PersistenceResult<T>`
- [x] 2.3 GREEN — `src/lib/persistence/selector.ts` exports `selectPersistenceAdapter()` reading env vars + auth session; default = local
- [x] 2.4 REFACTOR — Selector only uses `getActiveProfileId()` + auth session; never reads `pre-utn.profiles.v1`

## Phase 2b: Review Fixes (post-review corrections)

- [x] F1 — Selector requires explicit `hasRemoteSession: true` for remote selection; local profile alone is NOT auth
- [x] F2 — `withLocalFallback()` wrapper catches remote-operation failures and delegates to local adapter
- [x] F3 — `createLocalStorageAdapter()` accepts injectable `LocalStorageOperations` to prevent future recursion when PR2 wires public modules through selector
- [x] F4 — Local adapter enforces studentId match against `getActiveProfileId()`; fail-closed on mismatch
- [x] F5 — Removed unused imports (`SelectorConfig` from test, stale RED-phase comments)
- [x] F6 — Verified `pnpm run test` (2525/2525), `pnpm run typecheck` (clean), `pnpm run build` (success)

## Phase 2c: Re-Review Fixes (post-re-review corrections)

- [x] R1 — `withLocalFallback()` async-aware: catches sync throws + async Promise rejections via `attempt()` helper; port uses `MaybePromise<T>`; 5 new async fallback tests
- [x] R2 — Local adapter `loadProgress()` allows legacy migration when no active profile exists; 1 new test for no-active-profile path
- [x] R3 — Injectable ops boundary tested: 4 new tests prove `createLocalStorageAdapter(customOps)` calls injected ops
- [x] R4 — SDD docs updated: design.md interface includes `loadStudyPlan`/`saveStudyPlan` + `MaybePromise<T>`; proposal.md uses correct paths and key names
- [x] R5 — Removed "Finding 3/4" process comments from production code
- [x] R6 — `withLocalFallback()` duplication reduced via `attempt()` helper
- [x] R7 — Verified `pnpm run test:run` (2535/2535), `pnpm run typecheck` (clean), `pnpm run build` (success)

## Phase 2d: Final Review Fixes (warning/suggestion findings)

- [x] V1 — Strengthened legacy migration test: asserts actual migrated data + profile creation instead of EMPTY_PROGRESS false-positive
- [x] V2 — proposal.md: replaced stale `NEXT_PUBLIC_SUPABASE_ANON_KEY` with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [x] V3 — STATUS.json: corrected PR1 summary (removed "no-service-role scan test" claim, updated scope description)
- [x] V4 — Removed remaining process comments from test files + unused imports from persistence-port.test.ts
- [x] V5 — Verified `pnpm run test:run` (2535/2535), `pnpm run typecheck` (clean), `pnpm run build` (success)

## Phase 3: Supabase Adapter

- [ ] 3.1 RED — `src/lib/__tests__/supabase-adapter-serialization.test.ts` round-trips `ProfilesState`, `PracticeProgress`, `DiagnosticResult`, `StudyPlan`; asserts lossless mapping
- [ ] 3.2 GREEN — `src/lib/persistence/supabase-adapter.ts` implements `PersistenceAdapter`; scopes `eq("user_id", session.user.id)` + `eq("student_id", activeStudentId)`
- [ ] 3.3 GREEN — Adapter treats `PGRST116`/network errors as recoverable: returns local value or `{ ok: false, reason: "missing-active-profile" }`; never throws
- [ ] 3.4 RED — `src/lib/__tests__/active-student-isolation.test.ts` with two mocked students and fake client returning B's row when A active; asserts adapter filters by `studentId`

## Phase 4: Migration and Config

- [ ] 4.1 `supabase/migrations/20260622_supabase_adapter_v0.sql` creates both tables, enables RLS, adds own-row `select`/`insert`/`update` policies per `design.md`; includes `(select auth.uid()) = user_id` + `unique(user_id, student_id)`
- [ ] 4.2 `supabase/migrations/__tests__/migration-rls-shape.test.ts` asserts migration text includes own-row policies
- [ ] 4.3 `.env.example` documents only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; forbids service-role keys

## Phase 5: Wire and Verify

- [ ] 5.1 Modify `src/lib/student-profile-storage.ts`: profile functions delegate to `selectPersistenceAdapter()`; signatures stable
- [ ] 5.2 Modify `src/lib/practice-progress.ts`: progress functions delegate through adapter; preserve `PersistenceResult<T>` + v1→v2 migration
- [ ] 5.3 Modify `src/lib/diagnostic-storage.ts`: diagnostic + study-plan functions delegate through adapter
- [ ] 5.4 Verify: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`
- [ ] 5.5 Manual smoke: unset env → localStorage; env + mock auth → Supabase; kill network → fallback; record in PR description

## Out of Scope

No auth UI, no `/docente`, no multi-track, no I-19/I-20 deep `trackId`/`subjectId`, no content/evaluator/UI changes, no local-to-remote migration.
