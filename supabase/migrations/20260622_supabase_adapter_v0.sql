-- Supabase Adapter v0 — Student profiles and progress snapshots
--
-- Spec: "Minimal tables and columns" for remote persistence.
-- RLS: "(select auth.uid()) = user_id" — students can only read/write their own rows.
--
-- Tables:
--   student_profiles — one row per (user, student) combination
--   student_progress_snapshots — one row per (user, student) with JSONB payloads
--
-- Policies: select/insert/update own rows only.
-- No service role required in client. No delete policy (data retention).

-- ---------------------------------------------------------------------------
-- student_profiles
-- ---------------------------------------------------------------------------

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

alter table public.student_profiles enable row level security;

create policy "profiles_select_own" on public.student_profiles
  for select using ((select auth.uid()) = user_id);

create policy "profiles_insert_own" on public.student_profiles
  for insert with check ((select auth.uid()) = user_id);

create policy "profiles_update_own" on public.student_profiles
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- student_progress_snapshots
-- ---------------------------------------------------------------------------

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

alter table public.student_progress_snapshots enable row level security;

create policy "progress_select_own" on public.student_progress_snapshots
  for select using ((select auth.uid()) = user_id);

create policy "progress_insert_own" on public.student_progress_snapshots
  for insert with check ((select auth.uid()) = user_id);

create policy "progress_update_own" on public.student_progress_snapshots
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
