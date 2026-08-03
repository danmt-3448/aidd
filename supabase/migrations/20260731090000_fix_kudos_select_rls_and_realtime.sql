-- M3 security fix: close the anonymous sender leak on the kudos base table.
--
-- BEFORE: kudos_select_authenticated USING(true) — any authenticated user could
--         SELECT all kudos rows, including sender_id of anonymous kudos.
-- AFTER:  kudos_select_own — only sender or receiver may read the base row.
--         Third-party feed reads go through kudos_public (masked view).
--
-- Realtime fix (C-RT): restrict the supabase_realtime publication for kudos to
-- (id, created_at) only — an invalidation signal. sender_id/content_html never
-- cross the wire. Consumers (phase-03/04) re-fetch via kudos_public on signal.
--
-- Rollback:
--   drop policy if exists "kudos_select_own" on public.kudos;
--   create policy "kudos_select_authenticated" on public.kudos
--     for select to authenticated using (true);
--   alter publication supabase_realtime set table public.kudos;   -- all cols
--   alter publication supabase_realtime drop table public.hearts;
--   alter publication supabase_realtime drop table public.notifications;

-- ============================================================
-- 1. Replace kudos SELECT policy
-- ============================================================

drop policy if exists "kudos_select_authenticated" on public.kudos;

create policy "kudos_select_own"
  on public.kudos
  for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- ============================================================
-- 2. Realtime publication — strip identity columns from kudos broadcast
--    and add hearts + notifications as invalidation channels.
-- ============================================================

-- Restrict kudos to non-identifying columns only.
alter publication supabase_realtime set table public.kudos (id, created_at);

-- Add hearts (user_id + kudo_id broadcast; no sender info).
alter publication supabase_realtime add table public.hearts;

-- Add notifications (consumer filters on user_id client-side).
alter publication supabase_realtime add table public.notifications;
