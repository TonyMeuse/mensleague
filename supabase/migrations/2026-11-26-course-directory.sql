-- Course Directory: the course's full golfer list (from the course spreadsheet), one record per league.
-- Private: only the league's own admin can read or change it. Golfers never see it.
-- Safe to run on a live database: it only adds a new table.
create table if not exists public.course_directory (
  league_id uuid primary key references public.leagues on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.course_directory enable row level security;
revoke all on public.course_directory from anon;
grant select, insert, update, delete on public.course_directory to authenticated;
grant all on public.course_directory to service_role;
drop policy if exists own_directory on public.course_directory;
create policy own_directory on public.course_directory for all to authenticated
  using (public.is_owner(league_id)) with check (public.is_owner(league_id));
