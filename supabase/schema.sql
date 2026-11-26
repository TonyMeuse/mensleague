-- League app database setup (supports several leagues, each with its own admin).
-- Paste all of this into Supabase → SQL Editor → Run.
-- WARNING: running it again ERASES all league data. Only run it on a new, empty project.

create extension if not exists pgcrypto with schema extensions;

-- Remove the earlier single-league setup, if present
drop table if exists public.course_directory, public.push_subs, public.public_roster, public.published_weeks,
  public.league_secret, public.league_state, public.admins, public.leagues cascade;
drop function if exists public.is_admin(), public.claim_admin(), public.admin_exists(),
  public.set_league_password(text), public.league_pw_ok(text), public.get_league_data(text),
  public.save_push_sub(text, text, jsonb), public.remove_push_sub(text, text);

-- One row per league. "owner" is the league's admin login.
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,              -- short code used in the golfers' link (?l=slug)
  name text not null,
  owner uuid not null references auth.users on delete cascade,
  pw_hash text,                           -- league password, scrambled
  created_at timestamptz default now()
);

-- The admin's working data for a league (roster, courses, settings, current week, history)
create table public.league_state (
  league_id uuid primary key references public.leagues on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Results the admin has published for golfers
create table public.published_weeks (
  league_id uuid references public.leagues on delete cascade,
  week_date date,
  data jsonb not null,
  published_at timestamptz default now(),
  primary key (league_id, week_date)
);

-- Golfer names, so golfers can pick their own name
create table public.public_roster (
  league_id uuid primary key references public.leagues on delete cascade,
  data jsonb not null
);

-- Course Directory: the course's full golfer list (admin only)
create table public.course_directory (
  league_id uuid primary key references public.leagues on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Phones that turned on alerts (a phone can follow more than one league)
create table public.push_subs (
  endpoint text,
  league_id uuid references public.leagues on delete cascade,
  golfer_id text not null,
  sub jsonb not null,
  created_at timestamptz default now(),
  primary key (endpoint, league_id)
);

alter table public.leagues         enable row level security;
alter table public.league_state    enable row level security;
alter table public.published_weeks enable row level security;
alter table public.public_roster   enable row level security;
alter table public.push_subs       enable row level security;
alter table public.course_directory enable row level security;

grant select (id, slug, name, owner, created_at), update (name) on public.leagues to authenticated;
grant select, insert, update, delete on public.league_state, public.published_weeks, public.public_roster, public.course_directory to authenticated;
grant select on public.push_subs to authenticated;
grant all on public.leagues, public.league_state, public.published_weeks, public.public_roster, public.push_subs, public.course_directory to service_role;

create function public.is_owner(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.leagues where id = lid and owner = auth.uid());
$$;

-- An admin only ever sees and changes their own leagues
create policy own_leagues on public.leagues for select to authenticated using (owner = auth.uid());
create policy rename_own on public.leagues for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy own_state on public.league_state for all to authenticated using (public.is_owner(league_id)) with check (public.is_owner(league_id));
create policy own_weeks on public.published_weeks for all to authenticated using (public.is_owner(league_id)) with check (public.is_owner(league_id));
create policy own_roster on public.public_roster for all to authenticated using (public.is_owner(league_id)) with check (public.is_owner(league_id));
create policy own_directory on public.course_directory for all to authenticated using (public.is_owner(league_id)) with check (public.is_owner(league_id));
create policy own_subs on public.push_subs for select to authenticated using (public.is_owner(league_id));

-- Create a new league owned by the signed-in admin
create function public.create_league(league_name text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare base text; s text; new_id uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if coalesce(trim(league_name), '') = '' then raise exception 'name required'; end if;
  base := trim(both '-' from regexp_replace(replace(lower(league_name), '''', ''), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'league'; end if;
  s := left(base, 24);
  while exists (select 1 from public.leagues where slug = s) loop
    s := left(base, 19) || '-' || substr(md5(random()::text), 1, 4);
  end loop;
  insert into public.leagues(slug, name, owner) values (s, trim(league_name), auth.uid()) returning id into new_id;
  return jsonb_build_object('id', new_id, 'slug', s, 'name', trim(league_name));
end $$;

create function public.set_league_password(lid uuid, pw text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_owner(lid) then raise exception 'not allowed'; end if;
  update public.leagues set pw_hash = crypt(pw, gen_salt('bf')) where id = lid;
end $$;

create function public.league_pw_ok(s text, pw text) returns uuid
language sql stable security definer set search_path = public, extensions as $$
  select id from public.leagues where slug = s and pw_hash is not null and pw_hash = crypt(pw, pw_hash);
$$;
revoke execute on function public.league_pw_ok(text, text) from public, anon, authenticated;

-- For the golfer app: list of leagues (names only) and one league's name
create function public.list_leagues() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('slug', slug, 'name', name) order by name), '[]'::jsonb) from public.leagues;
$$;
create function public.league_info(s text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('slug', slug, 'name', name) from public.leagues where slug = s;
$$;

-- What golfers get when they type the league password
create function public.get_league_data(s text, pw text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare lid uuid;
begin
  lid := public.league_pw_ok(s, pw);
  if lid is null then raise exception 'wrong password' using errcode = '28P01'; end if;
  return jsonb_build_object(
    'name',   (select name from public.leagues where id = lid),
    'roster', coalesce((select data from public.public_roster where league_id = lid), '[]'::jsonb),
    'weeks',  coalesce((select jsonb_agg(data order by week_date) from public.published_weeks where league_id = lid), '[]'::jsonb)
  );
end $$;

-- A golfer's phone turns alerts on or off for a league
create function public.save_push_sub(s text, pw text, golfer text, sub jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  lid := public.league_pw_ok(s, pw);
  if lid is null then raise exception 'wrong password' using errcode = '28P01'; end if;
  insert into public.push_subs(endpoint, league_id, golfer_id, sub) values (sub->>'endpoint', lid, golfer, sub)
  on conflict (endpoint, league_id) do update set golfer_id = excluded.golfer_id, sub = excluded.sub;
end $$;

create function public.remove_push_sub(s text, pw text, endpoint text) returns void
language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  lid := public.league_pw_ok(s, pw);
  if lid is null then raise exception 'wrong password' using errcode = '28P01'; end if;
  delete from public.push_subs p where p.endpoint = remove_push_sub.endpoint and p.league_id = lid;
end $$;

grant execute on function public.is_owner(uuid) to authenticated;
grant execute on function public.create_league(text) to authenticated;
grant execute on function public.set_league_password(uuid, text) to authenticated;
grant execute on function public.list_leagues() to anon, authenticated;
grant execute on function public.league_info(text) to anon, authenticated;
grant execute on function public.get_league_data(text, text) to anon, authenticated;
grant execute on function public.save_push_sub(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.remove_push_sub(text, text, text) to anon, authenticated;
