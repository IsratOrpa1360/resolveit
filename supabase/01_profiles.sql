-- Lesson 3: profiles (one row per user, with their role)

-- 1. The only allowed roles.
create type public.user_role as enum ('student', 'agent', 'admin');

-- 2. The profiles table.
create table public.profiles (
  -- Primary key: the same id Supabase Auth gives the user.
  -- Foreign key: it must exist in auth.users; deleting the user deletes the profile.
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 100),
  email text not null,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- 3. Security: turn on Row Level Security (RLS).
--    With RLS on, nobody can read a row unless a policy allows it.
alter table public.profiles enable row level security;

-- Logged-in users may read ONLY their own profile.
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Users may not insert, update or delete profiles themselves,
-- so nobody can make themselves an admin.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- 4. Automatic profile: when someone registers, create their profile.
--    The role is ALWAYS 'student'. We never trust a role sent by the browser.
create schema if not exists private;

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'New user'), 100),
    coalesce(new.email, '')
  );
  return new;
end $$;

revoke execute on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 5. Give profiles to accounts that already exist.
insert into public.profiles (id, full_name, email)
select id,
  left(coalesce(nullif(btrim(raw_user_meta_data ->> 'full_name'), ''), 'New user'), 100),
  coalesce(email, '')
from auth.users
on conflict (id) do nothing;
