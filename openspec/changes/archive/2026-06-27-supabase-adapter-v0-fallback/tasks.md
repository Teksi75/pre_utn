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
- [x] 1.3 RED — `src/lib/__tests__/no-service-role-scan.test.ts` scans `src/lib/supabase/**`, `.env.example`, `package.json` for `SERVICE_ROLE`/`SUPABASE_SERVICE_ROLE_KEY`/`service_role`; asserts none *(PR 2)*
- [x] 1.4 GREEN — `src/lib/supabase/browser.ts` exports `createBrowserClient(url, publishableKey)`; JSDoc forbids service-role keys *(PR 2)*
- [x] 1.5 `pnpm add @supabase/supabase-js`; commit `package.json` + lockfile *(PR 2)*

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

- [x] 3.1 RED — `src/lib/__tests__/supabase-adapter-serialization.test.ts` round-trips `ProfilesState`, `PracticeProgress`, `DiagnosticResult`, `StudyPlan`; asserts lossless mapping
- [x] 3.2 GREEN — `src/lib/persistence/supabase-adapter.ts` implements `PersistenceAdapter`; scopes `eq("user_id", session.user.id)` + `eq("student_id", activeStudentId)`
- [x] 3.3 GREEN — Adapter treats `PGRST116`/network errors as recoverable: returns local value or `{ ok: false, reason: "missing-active-profile" }`; never throws
- [x] 3.4 RED — `src/lib/__tests__/active-student-isolation.test.ts` with two mocked students and fake client returning B's row when A active; asserts adapter filters by `studentId`

## Phase 4: Migration and Config

- [x] 4.1 `supabase/migrations/20260622_supabase_adapter_v0.sql` creates both tables, enables RLS, adds own-row `select`/`insert`/`update` policies per `design.md`; includes `(select auth.uid()) = user_id` + `unique(user_id, student_id)`
- [x] 4.2 `src/lib/__tests__/migration-rls-shape.test.ts` asserts migration text includes own-row policies
- [x] 4.3 `.env.example` documents only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; forbids service-role keys

## Phase 5: Wire and Verify

- [x] 5.1 Modify `src/lib/student-profile-storage.ts`: profile functions delegate to `selectPersistenceAdapter()`; signatures stable
- [x] 5.2 Modify `src/lib/practice-progress.ts`: progress functions delegate through adapter; preserve `PersistenceResult<T>` + v1→v2 migration
- [x] 5.3 Modify `src/lib/diagnostic-storage.ts`: diagnostic + study-plan functions delegate through adapter
- [x] 5.4 Verify: `pnpm run test`, `pnpm run typecheck`, `pnpm run build`
- [ ] 5.5 Manual smoke: unset env → localStorage; env + mock auth → Supabase; kill network → fallback; record in PR description *(deferred to user — all automated verification passed)*

## Phase 6: Review Fixes (post-review corrections)

- [x] R8 — `withLocalFallback()` detects resolved `{ ok: false }` from write operations and falls back to local adapter; `isFailedResult()` helper added. 6 new tests (4 resolved-failure + 2 triangulation)
- [x] R9 — `createBrowserClient()` wraps `createClient()` in try-catch; malformed URL/key returns null instead of crashing. 2 new tests
- [x] R10 — `getActiveStudentId()` validates active ID exists in profiles array; dangling/corrupt active ID returns null (fail closed). 2 new tests
- [x] R11 — Strengthened isolation test: added result validation assertion alongside query filter check
- [x] R12 — OpenSpec consistency: STATUS.json PR2 branch corrected to `feat/supabase-adapter-v0-fallback-remote`, tasks.md 5.5 unchecked (deferred to user)

## Phase 7: Second Fresh Review Fixes (BLOCKER/CRITICAL/WARNING findings)

- [x] S1 — BLOCKER: Production path wired through selector. Public functions (`loadProfiles`, `saveProfiles`, `loadProgress`, `saveProgress`, `loadDiagnosticResult`, `saveDiagnosticResult`, `loadStudyPlan`, `saveStudyPlan`) now delegate through `getConfiguredAdapter()`. Raw implementations exported separately for local adapter injection. `adapter-config.ts` module created. 3 new tests.
- [x] S2 — BLOCKER: No-session/expired-session reads fall back to local. Supabase adapter returns `createRemoteUnavailableSentinel()` for read methods when no auth session exists. `withLocalFallback()` detects sentinel via `isRemoteUnavailable()` and delegates to local adapter. 4 new tests using real Supabase adapter with no-session mock client.
- [x] S3 — CRITICAL: Observability hook. `SelectorConfig.onFallback` callback invoked on every fallback (throws, rejections, resolved failures, remote unavailable). Client-safe: no service-role or non-public env data passed. 3 new tests (throw, ok:false, no-callback-on-success).
- [x] S4 — WARNING: Strengthened serialization payload assertions. `saveProfiles` now verifies `upsertArgs.student_id` and `display_name`. `saveProgress` verifies `practice_progress.attempts` length and `accuracyBySkill` values. 2 assertions strengthened.
- [x] S5 — WARNING: Isolation test clarified. Mock doesn't simulate RLS filtering; key proof is the `eq()` call scoping. Comment updated to explain mock limitation.
- [x] S6 — WARNING: Consistency. `student-profile-storage.ts` comments updated to reflect adapter delegation. `tasks.md` updated with Phase 7. `verify-report.md` consistency deferred to next verify cycle.

## Phase 8: Final Fresh-Review Fixes (BLOCKER/WARNING findings)

- [x] T1 — BLOCKER: Production initialization wiring. `initializePersistence()` async function added to `adapter-config.ts`. Checks Supabase env vars → creates browser client → checks real Auth session → configures adapter with fallback. Without env or session, adapter stays null (local fallback). 4 new tests (env+session, no env, no session, malformed env).
- [x] T2 — BLOCKER: Async-aware public APIs. Removed `instanceof Promise` fallback pattern from all public storage functions (`loadProfiles`, `saveProfiles`, `loadProgress`, `saveProgress`, `loadDiagnosticResult`, `saveDiagnosticResult`, `loadStudyPlan`, `saveStudyPlan`). Functions now return `MaybePromise<T>` and propagate adapter results. Updated all callers (React components, tests) to handle async. 5 new tests.
- [x] T3 — BLOCKER: `addAttempt()` fires adapter save. After computing and persisting locally, `addAttempt()` now calls `adapter.saveProgress()` asynchronously when adapter is configured. Remote save is fire-and-forget (local save is authoritative). 1 new test.
- [x] T4 — WARNING: Safe auth options for v0. `createBrowserClient()` sets `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`. No token storage, no auth flow. 1 new test.
- [x] T5 — WARNING: Test quality improvements. Isolation test accurately describes mock limitation (query scoping verified, not data filtering). Serialization tests strengthen `saveDiagnosticResult` and `saveStudyPlan` payload assertions (verify `student_id`, `version`, `completedAt`, `createdAt`, `skillPriorities` fields).
- [x] T6 — WARNING: OpenSpec/verify-report consistency. tasks.md updated with Phase 8. verify-report.md deferred to next verify cycle.

## Phase 9: Ultimate Review Fixes (BLOCKER/CRITICAL/WARNING findings)

- [x] U1 — BLOCKER: Production init wiring. Created `PersistenceInitializer` client component that calls `initializePersistence()` once on mount via useEffect. Mounted from `layout.tsx`. Renders null (no UI). 6 source-level tests.
- [x] U2 — CRITICAL: Production fallback sink. Created `fallback-sink.ts` with `createProductionFallbackSink()` that logs via `console.warn` without exposing secrets. `PersistenceInitializer` passes it as `onFallback` to `initializePersistence()`. 6 source-level tests.
- [x] U3 — CRITICAL: Isolation defense-in-depth. Supabase adapter validates returned `student_id` matches requested on `loadProgress`, `loadDiagnosticResult`, `loadStudyPlan`. Returns EMPTY_PROGRESS/null on mismatch. Updated `select()` to include `student_id`. Strengthened isolation test to assert B's payload is NOT returned.
- [x] U4 — WARNING: Serialization deep equality. Strengthened `loadProgress`, `loadDiagnosticResult`, `loadStudyPlan` tests to verify all domain fields (exerciseIds, errorTags, accuracyBySkill, estimates, skillPriorities, etc.) instead of just shape checks.
- [x] U5 — WARNING: OpenSpec consistency. `adapter-config.ts` derives `ConfiguredAdapter` from `PersistenceAdapter` (removed duplicate interface). Removed unused type imports. verify-report.md updated with final test count (2617/2617).

## Phase 10: Final Fix-Round (BLOCKER/CRITICAL/WARNING findings)

- [x] X1 — CRITICAL: Initialization race. Added `initializationPromise` tracking to `adapter-config.ts`. `getInitializationPromise()` exposes the promise for callers to chain on. `loadProgressWhenReady()` awaits initialization before delegating to loadProgress. Storage APIs can chain on init without blocking UI. 4 new tests.
- [x] X2 — CRITICAL: Remote FK/profile creation gap. `createProfileAndActivate()` now calls `adapter.saveProfiles()` when a remote adapter is configured. Remote save failures are caught — local save is authoritative. 4 new tests.
- [x] X3 — WARNING: Initializer unhandled rejection. `initializePersistence()` wrapped in try/catch. All errors degrade to local fallback and call `onFallback("initializePersistence", err)`. 3 new tests.
- [x] X4 — WARNING: Observability sink improvement. `fallback-sink.ts` now dispatches a `persistence:fallback` CustomEvent on `globalThis` with sanitized `{ method, errorSummary, timestamp }` payload. Console.warn still guarded. `PersistenceFallbackEventDetail` type exported. 7 new tests (3 source + 4 runtime).
- [x] X5 — WARNING: OpenSpec consistency. STATUS.json summary/test count updated to 2635. Removed stale BLOCKER/CRITICAL FIX process labels from code comments. Manual smoke deferred.

## Phase 11: Reliability Blocker Fixes (initialization race, FK ordering, verify-report wording)

- [x] Y1 — BLOCKER: Public storage functions initialization-aware. `loadProgress()`, `loadDiagnosticResult()`, `loadStudyPlan()`, and `loadProfiles()` now await `getInitializationPromise()` before checking the adapter. Returns Promise when init is pending, sync result when not. 5 new tests (loadProgress race, loadProgress sync, loadDiagnosticResult race, loadStudyPlan race, loadProfiles race).
- [x] Y2 — BLOCKER: Remote FK ordering boundary. `createProfileAndActivate()` now tracks pending remote profile save promise via `setPendingProfileSavePromise()`. `addAttempt()` waits for pending profile save before calling `adapter.saveProgress()`. New functions: `getPendingProfileSavePromise()`, `setPendingProfileSavePromise()`, `clearPendingProfileSavePromise()`. 1 new test proving saveProfiles completes before saveProgress.
- [x] Y3 — WARNING: Verify-report wording. Updated Safety Net row from "N/A (all new files)" to accurate description of existing test baseline and new tests added.

## Phase 12: Minimal Real Telemetry Sink

- [x] 12.1 RED — `src/lib/__tests__/fallback-sink-network.test.ts` asserts the sink POSTs sanitized events via `navigator.sendBeacon` (with `fetch({ keepalive: true })` fallback) to `/api/persistence/fallback`
- [x] 12.2 RED — Same file asserts the sink still dispatches the `persistence:fallback` CustomEvent AND still calls `console.warn` (preserves existing behavior)
- [x] 12.3 RED — Same file asserts the route handler at `src/app/api/persistence/fallback/route.ts` accepts the strict `FallbackEventPayload` shape and returns 204
- [x] 12.4 RED — Same file asserts the route rejects malformed payloads (missing `method` / `errorSummary` / `timestamp`, non-JSON body) with 4xx
- [x] 12.5 GREEN — `src/lib/persistence/fallback-event.ts` exports `FallbackEventPayload`, `FallbackAdapterKind`, `DEFAULT_FALLBACK_ENDPOINT`, and `isFallbackEventPayload()` (shared client/server contract)
- [x] 12.6 GREEN — Updated `src/lib/persistence/fallback-sink.ts` to call `navigator.sendBeacon` (with `fetch({ keepalive: true })` fallback) to the relative URL; preserves CustomEvent dispatch + console.warn; endpoint is configurable
- [x] 12.7 GREEN — Created `src/app/api/persistence/fallback/route.ts` (Next.js Route Handler) accepting POST, validating shape, returning 204 on success / 400 on malformed body
- [x] 12.8 Verified `pnpm run test:run` (2668/2668), `pnpm run typecheck` (clean), `pnpm run build` (success — route registered as `ƒ /api/persistence/fallback`)

## Phase 13: Payload Bounds + No-JSON-Leak Hardening (W1 + W2)

Resolve the W1 and W2 findings surfaced after Phase 12:

- **W1 — Route validator accepts unbounded string lengths.** `isFallbackEventPayload` did not bound `method` or `errorSummary` or `timestamp` length. A malicious or accidental huge payload could reach the route. Apply explicit length caps: `method <= 64`, `errorSummary <= 200`, `timestamp <= 32`. Update tests to cover the new caps (valid at max length and invalid above).
- **W2 — `sanitizeErrorSummary` can leak internal strings from `{ok:false}` results.** The selector passes `{ok:false, reason: "..."}` shapes directly to `onFallback`. The current implementation calls `JSON.stringify(error)` on non-Error inputs and ships the result to the wire. Tighten so non-Error inputs return a stable sentinel string (`String(error)` if finite/short, otherwise the fixed `"unknown-fallback-reason"`). Do not return `JSON.stringify`. Add tests proving `{ok:false, reason: "..."}` results are normalized to a fixed short string and never leak JSON.

- [x] 13.1 RED — `isFallbackEventPayload` length-cap tests (6 new): accept method=64 / errorSummary=200 / timestamp=32; reject method=65 / errorSummary=201 / timestamp=33
- [x] 13.2 RED — `sanitizeErrorSummary` no-JSON-leak tests (6 new): `{ok:false,reason}` / nested objects / arbitrary objects / long toString / Error regression / string regression
- [x] 13.3 GREEN — `isFallbackEventPayload` enforces length caps via shared `FALLBACK_PAYLOAD_BOUNDS` (methodMaxLength=64, errorSummaryMaxLength=200, timestampMaxLength=32)
- [x] 13.4 GREEN — `sanitizeErrorSummary` non-Error path uses `String(error)` (yields `"[object Object]"`), with a `try/catch` and length-cap guard falling back to the fixed `"unknown-fallback-reason"` sentinel. Truncation now leaves room for the `…` so the final string stays within `errorSummaryMaxLength`. Sink imports the shared `FALLBACK_PAYLOAD_BOUNDS` so client and server share the same source of truth
- [x] 13.5 Verified `pnpm run test:run` (2680/2680), `pnpm run typecheck` (clean), `pnpm run build` (success — 8/8 routes registered), secret scan clean

## Out of Scope

No auth UI, no `/docente`, no multi-track, no I-19/I-20 deep `trackId`/`subjectId`, no content/evaluator/UI changes, no local-to-remote migration. Telemetry centralization beyond the internal Next.js route deferred — the route is an intake-only contract surface, not a sink.
