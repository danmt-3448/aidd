-- notifications: per-user inbox entries.
-- Inserted ONLY by triggers (phase-03) or DEFINER RPCs — no client INSERT.
-- Client may SELECT own rows and UPDATE own rows (mark is_read=true).
-- ORDERING: this migration timestamp MUST precede phase-03's notify_on_kudo_insert trigger.
-- Rollback: drop table if exists public.notifications cascade;

create table if not exists public.notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  type       text,
  title      text,
  body       text,
  link       text,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Composite index: primary query pattern is "all unread for a user".
create index if not exists notifications_user_id_is_read_idx
  on public.notifications (user_id, is_read);

-- ============================================================
-- RLS
-- ============================================================

alter table public.notifications enable row level security;

-- SELECT own rows only.
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- UPDATE own rows only (is_read = mark-read; RLS still enforces row ownership).
create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No INSERT policy — only triggers/DEFINER functions may insert.

-- ============================================================
-- GRANTs
-- ============================================================

grant select, update on public.notifications to authenticated;
