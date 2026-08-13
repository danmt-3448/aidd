-- ============================================================
-- Spotlight recent activity RPC
-- Date: 2026-08-12
-- Backlog: BOARD-SPOTLIGHT-WS1
-- ============================================================

-- ============================================================
-- list_recent_activity(p_limit int default 6)
--
-- Returns the N most-recently created kudos for the Spotlight
-- activity feed (bottom-left of the Spotlight box).
-- Reads from kudos_public (security-definer view, sender masking
-- always applied). Only receiver identity is returned — no sender
-- fields — so no privacy leak even when sender is anonymous.
--
-- security definer: needed to read kudos_public (security-definer
-- view; see 20260731100000_fix_kudos_public_view_security.sql).
--
-- Grant: authenticated only — board is an authed-only screen.
-- anon is intentionally excluded (unlike get_spotlight_aggregation).
-- ============================================================

create or replace function public.list_recent_activity(
  p_limit int default 6
)
returns table (
  receiver_id   uuid,
  receiver_name text,
  created_at    timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    kp.receiver_id,
    kp.receiver_name,
    kp.created_at
  from public.kudos_public kp
  order by kp.created_at desc
  limit least(p_limit, 50);
$$;

-- Revoke the default PUBLIC execute grant so anon role cannot call this RPC.
-- Board is authed-only; anon must not see the activity feed.
revoke execute on function public.list_recent_activity(int) from public;
grant execute on function public.list_recent_activity(int) to authenticated;
