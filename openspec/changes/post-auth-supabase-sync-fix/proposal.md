# Proposal: Fix post-auth Supabase sync for new and linking students

## Intent

Issue #66 activated Supabase Auth in production. After the magic-link callback, a student with existing local progress lands on a blank/skeleton Home because:

- `AuthBootstrap` ignores `INITIAL_SESSION`; only `SIGNED_IN` triggers `linkAndImportLocalProgress()`.
- `PersistenceInitializer` selects the remote adapter as soon as a session exists, before the FK profile row and local-progress import finish.
- The Nav badge says `Sincronizado como ...` based only on Auth session/email, not on verified remote readiness.
- `supabase-adapter` returns `EMPTY_PROGRESS` for a missing snapshot, and the selector/fallback does not recover the local slice when remote is empty.
- `HomeNextStepClient` has a final `.catch(() => {})` that can leave the dashboard in skeleton state.

We need the post-callback path to create the remote profile, safely import local progress, keep local progress visible when remote is empty, and render the Home dashboard reliably.

## Scope

### In Scope

- Make `INITIAL_SESSION` trigger the same link/import orchestration as `SIGNED_IN`, with a deduplication guard.
- Ensure `student_profiles` is upserted before any `student_progress_snapshots` write during sign-in/linking.
- Make the persistence selector/fallback prefer local progress when a session exists but the remote snapshot is empty and local data exists.
- Update Nav sync badge so it does not claim "Sincronizado" until profile link/import is complete.
- Fix `HomeNextStepClient` so an async failure falls back to a renderable state instead of a permanent skeleton.
- Add TDD tests for the invariants listed below.

### Out of Scope

- Supabase Dashboard, RLS, or Vercel env var changes.
- `Diagnóstico` menu visual clipping (separate minor issue).
- Conflict-resolution UI for local-has + remote-has.
- Teacher panel, profile deletion, or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Production rollback beyond `git revert`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `student-account-sync`: `AuthBootstrap` must react to `INITIAL_SESSION` and avoid duplicate import if `SIGNED_IN` follows.
- `supabase-adapter-v0`: remote-empty semantics must not hide existing local progress; `EMPTY_PROGRESS` must not be treated as canonical data.
- `student-local-identity`: local profile and progress must remain intact and readable while linking to a Supabase account.

## Approach

1. Add an idempotent per-session guard to `linkAndImportLocalProgress()` so the same Supabase user session cannot run the import twice.
2. In `AuthBootstrap`, handle `INITIAL_SESSION` exactly like `SIGNED_IN`: run the orchestrator, then `reinitializePersistence()`.
3. Introduce a readiness promise/lock in `adapter-config.ts` so `PersistenceInitializer` and public loaders can wait for the link/import orchestrator before treating remote as authoritative.
4. In `Nav`, derive the sync-complete pill from a new sync-status signal (remote profile exists + import/link finished) instead of raw session/email.
5. In `HomeNextStepClient`, replace the silent `.catch(() => {})` with explicit fallback to local progress and a non-skeleton render path.
6. In the selector/fallback wrapper, when the remote adapter returns empty progress and local progress exists, return the local slice and emit a fallback event.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/auth/AuthBootstrap.tsx` | Modified | Handle `INITIAL_SESSION`; dedupe vs `SIGNED_IN`. |
| `src/components/PersistenceInitializer.tsx` | Modified | Wait for link/import readiness before selecting remote. |
| `src/components/Nav.tsx` | Modified | Sync badge reflects verified remote readiness. |
| `src/components/home/HomeNextStepClient.tsx` | Modified | Remove silent catch; fallback from local progress. |
| `src/lib/auth/link-and-import.ts` | Modified | Idempotency guard; ordered FK upsert before snapshot writes. |
| `src/lib/persistence/adapter-config.ts` | Modified | Readiness promise/lock for post-auth initialization. |
| `src/lib/persistence/selector.ts` | Modified | Prefer local slice when remote empty + local exists. |
| `src/lib/persistence/supabase-adapter.ts` | Modified | Keep `EMPTY_PROGRESS` recoverable, not authoritative. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `INITIAL_SESSION` and `SIGNED_IN` both fire and duplicate import | Medium | Idempotency guard keyed to auth user id + session timestamp. |
| Remote progress snapshot written before FK profile row | Medium | Await profile upsert and hold a readiness lock before first remote write. |
| Nav falsely claims sync complete | Medium | Badge derives from explicit sync-status, not session alone. |
| Local progress still hidden after fix | Low | Tests assert local fallback for session + remote-empty + local-has. |

## Rollback Plan

`git revert` the feature branch commits. The app returns to the current behavior: local persistence works; remote sync after magic-link callback remains broken but no worse than today. No data deletion occurs.

## Dependencies

- Issue #66 Supabase Auth activation already complete in production.
- Magic link and `/auth/callback` already functional.

## Success Criteria

- [ ] `AuthBootstrap` runs sync on `INITIAL_SESSION`.
- [ ] `AuthBootstrap` does not duplicate import if `INITIAL_SESSION` and `SIGNED_IN` both arrive.
- [ ] `student_profiles` upsert occurs before `student_progress_snapshots` write.
- [ ] Session + remote empty + local progress preserves/falls back to local.
- [ ] Nav avoids misleading sync-complete state when sync is incomplete.
- [ ] Home post-callback does not stay in skeleton/blank state.
- [ ] New student can access Diagnostic and Practice after callback.
- [ ] Existing local-progress student links account without deleting local progress.
- [ ] Empty remote adapter does not destructively overwrite local state.
- [ ] `pnpm run test`, `pnpm run typecheck`, and `pnpm run build` pass.
