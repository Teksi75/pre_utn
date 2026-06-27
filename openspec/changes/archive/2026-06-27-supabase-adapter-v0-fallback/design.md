# Design: Supabase Adapter v0 with Local Fallback

## Technical Approach

Add a browser-only Supabase adapter behind existing storage functions, keeping `src/domain/` pure and localStorage as the safe default. The selector uses remote persistence only when public Supabase env vars exist **and** a browser Supabase Auth session exists; otherwise current local behavior remains unchanged. `getActiveProfileId()` stays the active student boundary.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Adapter boundary | Create a small persistence port in `src/lib/persistence/` used by current storage modules. | Put Supabase calls directly in `practice-progress.ts`/`diagnostic-storage.ts`. | Keeps callers adapter-agnostic and avoids Supabase imports in domain. |
| Auth-less v0 behavior | Require an existing Supabase Auth session before selecting remote. | Use local `studentId` alone with anon RLS. | RLS policies based on `(select auth.uid())` deny anonymous sessions; local fallback is the honest behavior until Auth is wired. |
| Minimal remote model | Store profile rows plus one progress snapshot row per active student. | Normalize attempts, diagnostics, study plans into many tables. | Small reviewable v0; avoids I-19/I-20 track/subject migration. |
| Keys | Use `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. | Service role key in frontend. | Public keys are browser-safe by design; service role bypasses RLS and is forbidden in client. |

## Data Flow

```text
storage API ──→ selectedPersistenceAdapter()
    │              ├─ missing env/no auth/remote failure ─→ localStorage adapter
    │              └─ env + Auth session ─→ Supabase adapter (RLS)
    └─ getActiveProfileId() supplies active studentId
```

Remote failures fall back to local or return the existing recoverable result; cross-student access fails closed through RLS.

## Supabase configuration

### Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy anon key value is acceptable)
- Do **not** add `SERVICE_ROLE`, `SUPABASE_SERVICE_ROLE_KEY`, or any non-public key to client env or `.env.example`.

### Minimal tables and columns

```sql
create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id text not null,
  display_name text not null,
  created_at timestamptz not null,
  last_active_at timestamptz not null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, student_id)
);

create table public.student_progress_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id text not null,
  practice_progress jsonb not null default '{"attempts":[],"accuracyBySkill":{},"trendBySkill":{},"lastPracticedBySkill":{},"diagnosticResult":null,"studyPlan":null}',
  diagnostic_result jsonb,
  study_plan jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, student_id),
  foreign key (user_id, student_id)
    references public.student_profiles(user_id, student_id) on delete cascade
);

alter table public.student_profiles enable row level security;
alter table public.student_progress_snapshots enable row level security;

create policy "profiles_select_own" on public.student_profiles
  for select using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.student_profiles
  for insert with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.student_profiles
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "progress_select_own" on public.student_progress_snapshots
  for select using ((select auth.uid()) = user_id);
create policy "progress_insert_own" on public.student_progress_snapshots
  for insert with check ((select auth.uid()) = user_id);
create policy "progress_update_own" on public.student_progress_snapshots
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

`UPDATE` requires a matching `SELECT` policy; otherwise Supabase may affect 0 rows silently.

### Out of scope

Auth UI/session creation, service-role/admin access, `/docente`, multi-track, `trackId`/`subjectId`, local-to-remote migration, realtime sync, conflict merge, advanced progress remote storage.

## File Changes

| File | Action | Description |
|---|---|---|
| `package.json` / lockfile | Modify | Add Supabase browser client dependency used by `createBrowserClient`. |
| `.env.example` | Create | Document only public Supabase env vars. |
| `supabase/migrations/*_supabase_adapter_v0.sql` | Create | Tables and RLS above. |
| `src/lib/supabase/browser.ts` | Create | `createBrowserClient(url, publishableKey)` factory; no service role. |
| `src/lib/persistence/*` | Create | Port, local adapter wrapper, Supabase adapter, selector. |
| `src/lib/{student-profile-storage,practice-progress,diagnostic-storage}.ts` | Modify | Delegate through selected adapter; preserve APIs and fallback. |
| `src/lib/__tests__/*supabase*.test.ts` | Create | Env selection, no-service-role scan, RLS query scoping serialization tests. |

## Interfaces / Contracts

```ts
/** A value that may be synchronous or a Promise. */
type MaybePromise<T> = T | Promise<T>;

type PersistenceAdapter = {
  loadProfiles(): MaybePromise<ProfilesState>;
  saveProfiles(state: ProfilesState): MaybePromise<ProfileSaveResult>;
  loadProgress(studentId: string): MaybePromise<PracticeProgress>;
  saveProgress(studentId: string, progress: PracticeProgress): MaybePromise<PersistenceResult<void>>;
  loadDiagnosticResult(studentId: string): MaybePromise<DiagnosticResult | null>;
  saveDiagnosticResult(studentId: string, result: DiagnosticResult): MaybePromise<PersistenceResult<void>>;
  loadStudyPlan(studentId: string): MaybePromise<StudyPlan | null>;
  saveStudyPlan(studentId: string, plan: StudyPlan): MaybePromise<PersistenceResult<void>>;
};
```

The `MaybePromise<T>` return type lets the local adapter stay sync-compatible while the Supabase adapter (PR2) can return Promises. `withLocalFallback()` detects and handles both paths.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Adapter selection and local fallback | Vitest with env/session/client mocks. |
| Unit | Serialization preserves current shapes | Round-trip profile, practice, diagnostic, study plan fixtures. |
| Security | No service role in client/env example | Source scan test. |
| SQL | RLS migration includes own-row policies | Migration text assertions; manual Supabase verification later. |

## Migration / Rollout

No local data migration. Without env vars or Auth session, behavior is local-only. Roll back by unsetting public env vars.

## Open Questions

- [ ] Which future Auth SDD will create the browser session required for remote writes?
