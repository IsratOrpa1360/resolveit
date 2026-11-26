-- ResolveIT database. Run once in a NEW Supabase project (SQL Editor).
create type public.user_role as enum ('student', 'agent', 'admin');
create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.ticket_category as enum ('portal', 'network', 'facilities', 'academic', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 100),
  email text not null,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 5 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  category public.ticket_category not null,
  priority public.ticket_priority not null default 'medium',
  status public.ticket_status not null default 'open',
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  file_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 200),
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (file_path like ticket_id::text || '/%')
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.tickets (user_id);
create index on public.tickets (assigned_to);
create index on public.tickets (status);
create index on public.tickets (created_at desc);
create index on public.comments (ticket_id, created_at);
create index on public.attachments (ticket_id);
create index on public.notifications (user_id, created_at desc);

-- Helper functions live outside the public API.
create schema private;
grant usage on schema private to authenticated;

create function private.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;
create function private.can_access_ticket(tid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tickets t where t.id = tid and (
      t.user_id = auth.uid()
      or private.my_role() = 'admin'
      or (private.my_role() = 'agent' and t.assigned_to = auth.uid())
    ))
$$;
-- Owners may edit/delete only while the ticket is open and unassigned.
create function private.owns_editable_ticket(tid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tickets t where t.id = tid
    and t.user_id = auth.uid() and t.status = 'open' and t.assigned_to is null)
$$;
create function private.can_see_profile(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pid = auth.uid() or private.my_role() = 'admin' or exists (
    select 1 from public.tickets t
    where (t.user_id = auth.uid() or t.assigned_to = auth.uid())
      and private.can_access_ticket(t.id)
      and (t.user_id = pid or t.assigned_to = pid
        or exists (select 1 from public.comments c where c.ticket_id = t.id and c.user_id = pid)))
$$;
create function private.ticket_not_closed(tid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.tickets where id = tid and status <> 'closed')
$$;
-- Safe conversion: a malformed path gives NULL instead of an error.
create function private.path_ticket(path text) returns uuid
language sql immutable set search_path = '' as $$
  select case when split_part(path, '/', 1) ~ '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
    then split_part(path, '/', 1)::uuid end
$$;

-- New accounts are ALWAYS students; the role is never read from client data.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'New user'), 100),
    coalesce(new.email, ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- auth.uid() is null in the SQL Editor, which is how the first admin is made.
create function private.guard_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    if private.my_role() is distinct from 'admin'::public.user_role or old.id = auth.uid() then
      raise exception 'You cannot change this role';
    end if;
  end if;
  return new;
end $$;
create trigger guard_profile before update on public.profiles
  for each row execute function private.guard_profile();

create function private.guard_ticket() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.user_role := private.my_role();
begin
  new.updated_at := now();
  if new.assigned_to is not null and new.assigned_to is distinct from old.assigned_to
     and not exists (select 1 from public.profiles where id = new.assigned_to and role = 'agent') then
    raise exception 'Tickets can only be assigned to agents';
  end if;
  if auth.uid() is null or r = 'admin' then return new; end if;
  if new.assigned_to is distinct from old.assigned_to then
    raise exception 'Only admins can assign tickets';
  end if;
  if r = 'agent' and old.assigned_to = auth.uid() then
    if (new.title, new.description, new.category) is distinct from (old.title, old.description, old.category) then
      raise exception 'Agents cannot edit ticket content';
    end if;
  elsif new.status is distinct from old.status then
    raise exception 'Only support staff can change status';
  end if;
  return new;
end $$;
create trigger guard_ticket before update on public.tickets
  for each row execute function private.guard_ticket();

create function private.notify_ticket() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status and new.user_id is distinct from auth.uid() then
    insert into public.notifications (user_id, ticket_id, message)
    values (new.user_id, new.id, 'Status changed to ' || replace(new.status::text, '_', ' ') || ': ' || new.title);
  end if;
  if new.assigned_to is not null and new.assigned_to is distinct from old.assigned_to then
    insert into public.notifications (user_id, ticket_id, message)
    values (new.assigned_to, new.id, 'Ticket assigned to you: ' || new.title);
  end if;
  return null;
end $$;
create trigger notify_ticket after update on public.tickets
  for each row execute function private.notify_ticket();

create function private.notify_comment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, ticket_id, message)
  select distinct p, t.id, 'New comment on: ' || t.title
  from public.tickets t cross join lateral unnest(array[t.user_id, t.assigned_to]) p
  where t.id = new.ticket_id and p is not null and p <> new.user_id;
  return null;
end $$;
create trigger notify_comment after insert on public.comments
  for each row execute function private.notify_comment();

revoke execute on all functions in schema private from public;
grant execute on function private.my_role(), private.can_access_ticket(uuid),
  private.owns_editable_ticket(uuid), private.can_see_profile(uuid),
  private.ticket_not_closed(uuid), private.path_ticket(text) to authenticated;

-- Privileges: start from nothing and allow only what is needed, by column.
revoke all on public.profiles, public.tickets, public.comments, public.attachments, public.notifications from anon, authenticated;
grant select on public.profiles, public.tickets, public.comments, public.attachments, public.notifications to authenticated;
grant update (full_name, role) on public.profiles to authenticated;
grant insert (title, description, category, priority, user_id) on public.tickets to authenticated;
grant update (title, description, category, priority, status, assigned_to) on public.tickets to authenticated;
grant delete on public.tickets to authenticated;
grant insert (ticket_id, user_id, message) on public.comments to authenticated;
grant insert (ticket_id, file_path, file_name, uploaded_by) on public.attachments to authenticated;
grant update (read_at) on public.notifications to authenticated;

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.notifications enable row level security;

create policy "see relevant profiles" on public.profiles for select to authenticated using (private.can_see_profile(id));
create policy "update own profile or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or private.my_role() = 'admin') with check (id = auth.uid() or private.my_role() = 'admin');

-- Written inline so INSERT ... RETURNING can see the new row.
create policy "see permitted tickets" on public.tickets for select to authenticated using (
  user_id = auth.uid() or private.my_role() = 'admin'
  or (private.my_role() = 'agent' and assigned_to = auth.uid()));
create policy "create own tickets" on public.tickets for insert to authenticated with check (
  user_id = auth.uid() and private.my_role() = 'student');
create policy "update permitted tickets" on public.tickets for update to authenticated using (
  (user_id = auth.uid() and status = 'open' and assigned_to is null)
  or private.my_role() = 'admin'
  or (private.my_role() = 'agent' and assigned_to = auth.uid())
) with check (
  user_id = auth.uid() or private.my_role() = 'admin'
  or (private.my_role() = 'agent' and assigned_to = auth.uid()));
create policy "delete own open tickets or admin" on public.tickets for delete to authenticated using (
  (user_id = auth.uid() and status = 'open' and assigned_to is null) or private.my_role() = 'admin');

create policy "see comments" on public.comments for select to authenticated using (private.can_access_ticket(ticket_id));
create policy "add comments" on public.comments for insert to authenticated with check (
  user_id = auth.uid() and private.can_access_ticket(ticket_id) and private.ticket_not_closed(ticket_id));
create policy "see attachments" on public.attachments for select to authenticated using (private.can_access_ticket(ticket_id));
create policy "add attachments" on public.attachments for insert to authenticated with check (
  uploaded_by = auth.uid() and private.can_access_ticket(ticket_id) and private.ticket_not_closed(ticket_id));
create policy "see own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Private file storage: 3 MB, PNG/JPEG/PDF. Path: <ticket id>/<random name>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attachments', 'attachments', false, 3145728, array['image/png', 'image/jpeg', 'application/pdf']);

create policy "read ticket files" on storage.objects for select to authenticated using (
  bucket_id = 'attachments' and private.can_access_ticket(private.path_ticket(name)));
create policy "upload ticket files" on storage.objects for insert to authenticated with check (
  bucket_id = 'attachments' and private.can_access_ticket(private.path_ticket(name))
  and private.ticket_not_closed(private.path_ticket(name)));
create policy "delete ticket files" on storage.objects for delete to authenticated using (
  bucket_id = 'attachments' and (
    (owner_id = auth.uid()::text and private.can_access_ticket(private.path_ticket(name)))
    or private.owns_editable_ticket(private.path_ticket(name))
    or private.my_role() = 'admin'));
