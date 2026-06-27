## Summary

PR 2 of `supabase-adapter-v0-fallback` introduces the Supabase-backed persistence adapter v0 with localStorage fallback. It defines a shared `PersistenceAdapter` contract (port + local + remote adapters), an env-aware selector with explicit `hasRemoteSession` gating, an async-aware `withLocalFallback()` wrapper that handles throws, rejections, resolved `{ ok: false }`, and remote-unavailable sentinel returns, plus a per-student row-level isolation boundary enforced via `(select auth.uid()) = user_id` RLS policies. The change adds a Supabase browser client/factory that only reads public env vars (with a malformed-env fail-closed path), a SQL migration creating `student_profiles` and `student_progress_snapshots` with own-row select/insert/update policies, an `initializePersistence()` production initializer mounted from `layout.tsx`, a `persistence:fallback` CustomEvent + `console.warn` + `navigator.sendBeacon` (with `fetch({ keepalive: true })` fallback) telemetry sink that POSTs sanitized events to a Next.js route handler at `/api/persistence/fallback`, and async-aware public storage APIs (loadProfiles, saveProfiles, loadProgress, saveProgress, loadDiagnosticResult, saveDiagnosticResult, loadStudyPlan, saveStudyPlan) that await initialization and delegate through the configured adapter. Includes all unit tests, RLS/migration shape scans, secret scan, typecheck, and a verified `pnpm run build` with 8/8 routes (incl. `ƒ /api/persistence/fallback`).

## Change
supabase-adapter-v0-fallback

## Why
The app needs optional remote persistence so progress can survive across devices once Supabase Auth is wired in a future change, without blocking any existing localStorage-only flow. PR 1 introduced the persistence port + local adapter + selector/fallback. PR 2 adds the real Supabase adapter behind that contract, scopes every read/write to the active student via RLS, and ensures the app degrades cleanly to local fallback on every failure mode (missing env, no auth session, malformed env, resolved `{ ok: false }`, network errors, expired sessions). The minimal real telemetry sink gives the maintainer observability into how often fallback fires without introducing a backend dependency.

## Linked issue
<!-- Orchestrator will fill -->

## Type
type:feature

## size:exception
Accepted for this PR. Rationale, compensating controls, high-risk areas, deferred smoke, and reviewer guidance are documented in `openspec/changes/supabase-adapter-v0-fallback/apply-progress.md` under "PR2 size:exception acceptance".

## Review-by-blocks guide

### Block 1 — Schema, migration, RLS
Files:
- `supabase/migrations/20260622_supabase_adapter_v0.sql`
- `.env.example`
- `src/lib/__tests__/migration-rls-shape.test.ts`
- `src/lib/__tests__/no-service-role-scan.test.ts`

What to verify:
- tables `student_profiles`, `student_progress_snapshots` exist
- RLS enabled and FORCEd
- `(select auth.uid()) = user_id` for own-row select/insert/update
- no service_role / non-public env vars in client code
- `.env.example` only lists `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Block 2 — Supabase browser client/factory
Files:
- `src/lib/supabase/browser.ts`
- `src/lib/__tests__/no-service-role-scan.test.ts`

What to verify:
- `createBrowserClient()` reads only public env vars
- malformed env fails closed (returns null, no crash)
- safe auth options: `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false`

### Block 3 — Remote adapter
Files:
- `src/lib/persistence/supabase-adapter.ts`
- `src/lib/persistence/local-adapter.ts`
- `src/lib/persistence/port.ts`
- `src/lib/__tests__/supabase-adapter-serialization.test.ts`
- `src/lib/__tests__/active-student-isolation.test.ts`
- `src/lib/__tests__/remote-fk-profile-creation.test.ts`

What to verify:
- adapter implements the `PersistenceAdapter` contract
- serialization round-trips domain types (deep equality in tests)
- active-student isolation enforced; defense-in-depth `student_id` validation on read
- remote profile save ordered before remote progress save for new profile (FK constraint)

### Block 4 — Persistence selector + adapter config
Files:
- `src/lib/persistence/selector.ts`
- `src/lib/persistence/adapter-config.ts`
- `src/lib/persistence/index.ts`
- `src/lib/__tests__/persistence-selector.test.ts`
- `src/lib/__tests__/initialization-race.test.ts`

What to verify:
- remote selection requires explicit `hasRemoteSession: true`
- local active profile is NOT remote auth
- local fallback when: no Supabase env, no remote session, malformed env, resolved `{ error }`/`{ ok:false }`, expired session
- initialization race handled: public storage functions await initialization promise
- `getActiveProfileId()` remains the local identity boundary

### Block 5 — Initializer + env wiring
Files:
- `src/components/PersistenceInitializer.tsx`
- `src/app/layout.tsx`
- `src/components/__tests__/PersistenceInitializer.test.ts`
- `src/lib/__tests__/initializer-rejection-sink.test.ts`

What to verify:
- `PersistenceInitializer` mounts from layout, renders null
- unhandled rejection guarded with try/catch and degraded-local fallback event
- no UX changes

### Block 6 — Fallback sink + API route
Files:
- `src/lib/persistence/fallback-sink.ts`
- `src/lib/persistence/fallback-event.ts`
- `src/app/api/persistence/fallback/route.ts`
- `src/lib/__tests__/fallback-sink-network.test.ts`
- `src/components/__tests__/production-fallback-sink.test.ts`

What to verify:
- payload sanitization: no secrets, no PII, no JSON-leak
- length caps enforced server-side: `method ≤ 64`, `errorSummary ≤ 200`, `timestamp ≤ 32`
- transport order: `navigator.sendBeacon` → `fetch({ keepalive: true })`
- POST `/api/persistence/fallback` validates and returns 204 on valid, 400 on invalid
- intake-only, no server-side persistence, no PII logging

### Block 7 — Async storage APIs (UI integration)
Files:
- `src/lib/student-profile-storage.ts`
- `src/lib/practice-progress.ts`
- `src/lib/diagnostic-storage.ts`
- `src/app/diagnostic/page.tsx`
- `src/app/practice/usePracticeFlow.ts`
- `src/components/home/HomeNextStepClient.tsx`
- `src/components/home/StudyPlanSection.tsx`
- `src/components/home/StudentSwitcher.tsx`
- `src/lib/__tests__/practice-progress.test.ts`
- `src/lib/__tests__/practice-progress-migration.test.ts`
- `src/lib/__tests__/diagnostic-storage.test.ts`
- `src/lib/__tests__/student-profile-storage.test.ts`
- `src/hooks/__tests__/active-student-store.test.ts`

What to verify:
- public storage functions await initialization when needed
- `addAttempt()` writes through the configured adapter (when present)
- `createProfileAndActivate()` persists remote profile before remote progress (FK)
- `instanceof Promise` handling at UI boundary does not silently discard remote results

### Block 8 — Tests + OpenSpec evidence
Files:
- `src/lib/__tests__/*` and `src/components/__tests__/*` (all PR2 test files)
- `openspec/changes/supabase-adapter-v0-fallback/{proposal,specs,design,tasks,apply-progress,verify-report}.md`
- `openspec/changes/STATUS.json`

What to verify:
- `pnpm run test:run` → 2680/2680 pass (155 files, 0 regressions)
- `pnpm run typecheck` → clean
- `pnpm run build` → 8/8 routes
- secret scan → clean
- OpenSpec artifacts reflect PR2 branch `feat/supabase-adapter-v0-fallback-remote`

## High-risk areas
- **RLS and data security**: review migration `supabase/migrations/20260622_supabase_adapter_v0.sql` carefully; ensure `auth.uid()` is the only auth predicate and policies are forced.
- **Accidental exposure of secrets / non-public Supabase vars**: review `src/lib/supabase/browser.ts` and `.env.example`; ensure no `SUPABASE_SERVICE_ROLE_KEY` or `publishableKey` is ever read in client.
- **Local fallback when Supabase is unconfigured**: review `src/lib/persistence/selector.ts` + `src/lib/persistence/adapter-config.ts`; localStorage must remain full fallback.
- **Behavior on remote persistence failure**: review selector `withLocalFallback()` and `isFailedResult()`; must handle throws, rejections, resolved `{ error }`/`{ ok:false }`, and remote-unavailable sentinel.
- **Compatibility with existing local storage**: review `src/lib/student-profile-storage.ts`, `src/lib/practice-progress.ts`, `src/lib/diagnostic-storage.ts`; raw functions retained for internal local adapter; public functions delegate through configured adapter.
- **Absence of JSON/PII leak in logs and route responses**: review `src/lib/persistence/fallback-sink.ts` `sanitizeErrorSummary` and `src/app/api/persistence/fallback/route.ts`; no stack traces, no `JSON.stringify` of arbitrary errors, no PII.

## Compensating controls (already executed)
- Automated tests: `pnpm run test:run` 2680/2680 pass (155 files).
- Typecheck: `pnpm run typecheck` clean.
- Build: `pnpm run build` 8/8 routes.
- Secret scan: clean.
- Strict TDD throughout (RED→GREEN→REFACTOR).
- Fresh-context reviews (risk / reliability / resilience / readability) — final pass 0 BLOCKER/CRITICAL.
- Structured PR description (this document).
- Risk documentation in `apply-progress.md`.

## Deferred risk: manual smoke 5.5
- Status: deferred (requires real Supabase project + auth session).
- Gate: must be executed before enabling Supabase as the production backend.
- Documented: not a blocker for merge; a gate for real-backend enablement.

## Out of scope (PR2)
- `/docente`, docente panel
- multi-track, deep trackId/subjectId work
- I-19/I-20
- new UI
- Auth UI
- session/auth flow creation
- service role key in client
- automatic local→remote migration
- realtime
- conflict merge

## Verification evidence
See `openspec/changes/supabase-adapter-v0-fallback/verify-report.md`.
