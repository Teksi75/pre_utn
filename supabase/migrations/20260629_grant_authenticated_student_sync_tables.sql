grant usage on schema public to authenticated;

grant select, insert, update
on table public.student_profiles
to authenticated;

grant select, insert, update
on table public.student_progress_snapshots
to authenticated;
