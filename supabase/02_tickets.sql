-- Lesson 5: tickets (students report problems)

-- 1. Allowed values. The database rejects anything else.
create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.ticket_category as enum ('portal', 'network', 'facilities', 'academic', 'other');

-- 2. The tickets table.
create table public.tickets (
  id uuid primary key default gen_random_uuid(),   -- a random unique id
  title text not null check (char_length(btrim(title)) between 5 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 5000),
  category public.ticket_category not null,
  priority public.ticket_priority not null default 'medium',
  status public.ticket_status not null default 'open',
  -- Foreign keys: who created it, and (later) which agent handles it.
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Indexes make "find tickets of this user" fast.
create index tickets_user_id_idx on public.tickets (user_id);
create index tickets_assigned_to_idx on public.tickets (assigned_to);

-- 4. Security.
alter table public.tickets enable row level security;

-- Students see only THEIR OWN tickets.
create policy "read own tickets" on public.tickets
  for select to authenticated
  using (user_id = auth.uid());

-- Students can create tickets only for THEMSELVES.
create policy "create own tickets" on public.tickets
  for insert to authenticated
  with check (user_id = auth.uid());

-- Users may only fill these columns when creating a ticket.
-- They cannot set status or assigned_to; those keep their defaults.
revoke all on public.tickets from anon, authenticated;
grant select on public.tickets to authenticated;
grant insert (title, description, category, priority, user_id) on public.tickets to authenticated;
