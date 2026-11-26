-- Lesson 6: agent and admin permissions

-- 1. Helper: "what is MY role?"
--    security definer = it may read profiles even though RLS limits the caller.
create function private.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;
grant usage on schema private to authenticated;
revoke execute on function private.my_role() from public;
grant execute on function private.my_role() to authenticated;

-- 2. PROFILES
-- Admins can see every user.
create policy "admins read all profiles" on public.profiles
  for select to authenticated
  using (private.my_role() = 'admin');

-- Admins can change roles (only the role column).
grant update (role) on public.profiles to authenticated;
create policy "admins update profiles" on public.profiles
  for update to authenticated
  using (private.my_role() = 'admin')
  with check (private.my_role() = 'admin');

-- 3. TICKETS
-- Admins see all tickets. Agents see tickets assigned to them.
create policy "admins read all tickets" on public.tickets
  for select to authenticated
  using (private.my_role() = 'admin');

create policy "agents read assigned tickets" on public.tickets
  for select to authenticated
  using (private.my_role() = 'agent' and assigned_to = auth.uid());

-- Admins update any ticket; agents update only their assigned tickets.
grant update (status, priority, assigned_to) on public.tickets to authenticated;
create policy "staff update tickets" on public.tickets
  for update to authenticated
  using (private.my_role() = 'admin' or (private.my_role() = 'agent' and assigned_to = auth.uid()))
  with check (private.my_role() = 'admin' or (private.my_role() = 'agent' and assigned_to = auth.uid()));

-- 4. GUARDS: triggers that check every change, whatever sent it.
create function private.guard_ticket() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  -- Tickets can only be assigned to agents.
  if new.assigned_to is not null and new.assigned_to is distinct from old.assigned_to
     and not exists (select 1 from public.profiles where id = new.assigned_to and role = 'agent') then
    raise exception 'Tickets can only be assigned to agents';
  end if;
  -- Only admins can change who a ticket is assigned to.
  -- (auth.uid() is null when you run SQL yourself in the SQL Editor.)
  if auth.uid() is not null and new.assigned_to is distinct from old.assigned_to
     and private.my_role() is distinct from 'admin' then
    raise exception 'Only admins can assign tickets';
  end if;
  return new;
end $$;
create trigger guard_ticket before update on public.tickets
  for each row execute function private.guard_ticket();

create function private.guard_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Nobody can change their OWN role (so an admin cannot lock out by mistake,
  -- and nobody can promote themselves).
  if auth.uid() is not null and old.id = auth.uid() and new.role is distinct from old.role then
    raise exception 'You cannot change your own role';
  end if;
  return new;
end $$;
create trigger guard_profile before update on public.profiles
  for each row execute function private.guard_profile();

revoke execute on function private.guard_ticket(), private.guard_profile() from public;
