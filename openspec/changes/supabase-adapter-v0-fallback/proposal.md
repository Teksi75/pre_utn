# Proposal: Supabase adapter v0 with local fallback (I-24)

## Intent

Introduce a remote persistence adapter backed by Supabase so student identity and progress can be stored server-side when configured, while preserving the existing localStorage fallback so the app keeps working when Supabase is unavailable or unconfigured. This is the M1 data bridge that enables future `/docente` v0 without exposing service keys in the client.

## Scope

### In Scope
- Define a persistence port/adapter boundary in the domain that existing local adapters and a new Supabase adapter both implement.
- Implement a Supabase client factory using only the anon/public key (no service role key in client).
- Implement remote read/write for profiles and progress data behind the port.
- Implement a selector/fallback that defaults to localStorage when Supabase env vars are missing or remote calls fail.
- Preserve the `getActiveProfileId()` boundary; no direct `localStorage.getItem("pre-utn.profiles.v1")` outside the approved boundary.
- Minimal Supabase schema design (tables, columns, RLS policies, env vars, migration) as part of sdd-design.

### Out of Scope
- Authentication, email/password, social login, real-time sync, cross-device merge.
- `/docente` panel, multi-track support, deep `trackId`/`subjectId` modeling (I-19/I-20).
- Content changes, new exercise types, new evaluators, UI redesign.
- Data migration from local to remote (remote starts empty for v0).

## Capabilities

### New Capabilities
- `supabase-adapter-v0`: Remote persistence adapter using Supabase anon key + RLS; covers profile and progress tables and fallback behavior.

### Modified Capabilities
- `student-local-identity`: Extend with the persistence adapter port/contract so local adapters implement the same interface as the Supabase adapter. Add fallback-selection requirement.

## Approach

Add a `PersistenceAdapter` port in `src/lib/persistence/` with operations for profile, progress, diagnostic result, and study plan read/write. Refactor current localStorage adapters into a `localStoragePersistenceAdapter` implementation of that port. Add a `supabasePersistenceAdapter` backed by `@supabase/supabase-js` browser client. A factory reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; if either is missing it returns the local adapter. Existing public adapter functions (`loadProgress`, `addAttempt`, etc.) delegate to the selected adapter, keeping call sites unchanged. RLS policies ensure a student can read/write only rows matching their `studentId`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/persistence/` | New | Adapter port interfaces, result types, local adapter, selector, fallback |
| `src/lib/persistence/` | New | Local adapter wrapper, Supabase adapter, selector |
| `src/lib/supabase/` | New | Browser client factory (anon key only) |
| `src/lib/practice-progress.ts` | Modified | Delegate to selected adapter behind port |
| `src/lib/diagnostic-storage.ts` | Modified | Delegate to selected adapter behind port |
| `src/lib/student-profile-storage.ts` | Modified | Implement/delegate behind port |
| `supabase/migrations/` | New | SQL migration for tables/RLS |
| `.env.example` | Modified | Add Supabase public env vars |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Service role key leaked to client | Low | CI/lint scan; only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` used; RLS enforced |
| Remote/local shape drift | Med | Shared domain types; serialization tests |
| Fallback not triggered when Supabase down | Low | Selector checks env + health/ping; defaults to local |
| RLS misconfig exposes cross-student data | Med | Design phase defines policies; add row-level isolation tests |
| Change exceeds review budget | Med | Slice to profiles + progress only; defer challenges/diagnostic tables if needed |

## Rollback Plan

1. Remove or unset `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. App reverts to localStorage adapter automatically.
3. Optional: drop remote rows/tables via migration revert if deployed.

## Dependencies

- Supabase project with anon key; no service role key required in client.

## Success Criteria

- [ ] App works with no Supabase config (pure localStorage fallback).
- [ ] With Supabase config, reads/writes use remote tables via anon key.
- [ ] No service role key present in client bundle or env example.
- [ ] `getActiveProfileId()` remains the only identity boundary.
- [ ] `pnpm run test`, `pnpm run typecheck`, `pnpm run build` pass.
