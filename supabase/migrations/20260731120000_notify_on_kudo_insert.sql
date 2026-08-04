-- Phase 03: trigger that creates a notifications row on every kudo insert.
-- Security: SECURITY DEFINER + locked search_path so the function can insert
-- into notifications (which has no client INSERT policy) without needing a
-- service-role call from the app layer.
--
-- Anon-safe: the function branches on NEW.is_anonymous BEFORE joining profiles,
-- so the sender's name never touches the title for anonymous kudos.
--
-- Rollback:
--   drop trigger if exists notify_on_kudo_insert on public.kudos;
--   drop function if exists public.notify_on_kudo_insert();

-- ============================================================
-- 1. Trigger function
-- ============================================================

create or replace function public.notify_on_kudo_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_sender_name text;
begin
  -- Branch on anonymity BEFORE any sender lookup to prevent identity leak.
  if NEW.is_anonymous then
    v_title := 'Bạn nhận được một Kudo ẩn danh';
  else
    -- Fetch sender full_name only for non-anonymous kudos.
    select full_name
      into v_sender_name
      from public.profiles
     where id = NEW.sender_id;

    v_title := coalesce(v_sender_name, 'Ai đó') || ' đã gửi cho bạn một Kudo';
  end if;

  insert into public.notifications (user_id, type, title, link)
  values (NEW.receiver_id, 'kudo_received', v_title, '/kudos');

  return NEW;
end;
$$;

-- ============================================================
-- 2. Trigger
-- ============================================================

drop trigger if exists notify_on_kudo_insert on public.kudos;

create trigger notify_on_kudo_insert
  after insert on public.kudos
  for each row
  execute function public.notify_on_kudo_insert();

-- ============================================================
-- 3. Realtime publication
-- Already added by 20260731090000_fix_kudos_select_rls_and_realtime.sql.
-- Guard here so re-running this migration on a clean DB is safe.
-- ============================================================

do $$
begin
  if not exists (
    select 1
      from pg_publication_tables
     where pubname = 'supabase_realtime'
       and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- ============================================================
-- 4. RLS guard — phase-01 already created these policies;
-- create them only if missing (idempotent re-run safety).
-- ============================================================

do $$
begin
  -- SELECT own rows
  if not exists (
    select 1 from pg_policies
     where tablename = 'notifications'
       and policyname = 'notifications_select_own'
  ) then
    create policy "notifications_select_own"
      on public.notifications
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  -- UPDATE own rows
  if not exists (
    select 1 from pg_policies
     where tablename = 'notifications'
       and policyname = 'notifications_update_own'
  ) then
    create policy "notifications_update_own"
      on public.notifications
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end;
$$;
