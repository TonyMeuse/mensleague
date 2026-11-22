-- Men's League database setup. Paste all of this into Supabase → SQL Editor → Run.
-- Safe to run more than once.

create extension if not exists pgcrypto with schema extensions;

-- Who is the admin (only one: the league organizer)
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

-- The admin's whole working data (roster, courses, settings, current week, history)
create table if not exists public.league_state (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz default now()
);

-- League password (stored scrambled, never readable)
create table if not exists public.league_secret (
  id int primary key default 1 check (id = 1),
  pw_hash text not null
);

-- Results the admin has published for golfers to see
create table if not exists public.published_weeks (
  week_date date primary key,
  data jsonb not null,
  published_at timestamptz default now()
);

-- Golfer names, so golfers can pick their own name
create table if not exists public.public_roster (
  id int primary key default 1 check (id = 1),
  data jsonb not null
);

-- Phones that turned on alerts, and which golfer each one belongs to
create table if not exists public.push_subs (
  endpoint text primary key,
  golfer_id text not null,
  sub jsonb not null,
  created_at timestamptz default now()
);

alter table public.admins          enable row level security;
alter table public.league_state    enable row level security;
alter table public.league_secret   enable row level security;
alter table public.published_weeks enable row level security;
alter table public.public_roster   enable row level security;
alter table public.push_subs       enable row level security;

-- Table access through the website (rules below still decide who sees what)
grant select, insert, update, delete on public.league_state, public.published_weeks, public.public_roster to authenticated;
grant select on public.push_subs to authenticated;
grant all on public.admins, public.league_state, public.league_secret, public.published_weeks, public.public_roster, public.push_subs to service_role;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- The first signed-in user to call this becomes the admin. After that, nobody else can.
create or replace function public.claim_admin() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if not exists (select 1 from public.admins) then
    insert into public.admins(user_id) values (auth.uid());
  end if;
  return exists (select 1 from public.admins where user_id = auth.uid());
end $$;

-- Admin-only access to the tables (golfers never touch tables directly)
drop policy if exists admin_all on public.league_state;
create policy admin_all on public.league_state for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.published_weeks;
create policy admin_all on public.published_weeks for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_all on public.public_roster;
create policy admin_all on public.public_roster for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists admin_read on public.push_subs;
create policy admin_read on public.push_subs for select to authenticated using (public.is_admin());

create or replace function public.set_league_password(pw text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  insert into public.league_secret(id, pw_hash) values (1, crypt(pw, gen_salt('bf')))
  on conflict (id) do update set pw_hash = excluded.pw_hash;
end $$;

create or replace function public.league_pw_ok(pw text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select exists (select 1 from public.league_secret where pw_hash = crypt(pw, pw_hash));
$$;
revoke execute on function public.league_pw_ok(text) from public, anon, authenticated;

-- What golfers get when they type the league password
create or replace function public.get_league_data(pw text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.league_pw_ok(pw) then raise exception 'wrong password' using errcode = '28P01'; end if;
  return jsonb_build_object(
    'roster', coalesce((select data from public.public_roster where id = 1), '[]'::jsonb),
    'weeks',  coalesce((select jsonb_agg(data order by week_date) from public.published_weeks), '[]'::jsonb)
  );
end $$;

-- A golfer's phone turns alerts on or off
create or replace function public.save_push_sub(pw text, golfer text, sub jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.league_pw_ok(pw) then raise exception 'wrong password' using errcode = '28P01'; end if;
  insert into public.push_subs(endpoint, golfer_id, sub) values (sub->>'endpoint', golfer, sub)
  on conflict (endpoint) do update set golfer_id = excluded.golfer_id, sub = excluded.sub;
end $$;

create or replace function public.remove_push_sub(pw text, endpoint text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.league_pw_ok(pw) then raise exception 'wrong password' using errcode = '28P01'; end if;
  delete from public.push_subs p where p.endpoint = remove_push_sub.endpoint;
end $$;

-- Who may run each function
grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_admin() to authenticated;
grant execute on function public.set_league_password(text) to authenticated;
grant execute on function public.get_league_data(text) to anon, authenticated;
grant execute on function public.save_push_sub(text, text, jsonb) to anon, authenticated;
grant execute on function public.remove_push_sub(text, text) to anon, authenticated;
