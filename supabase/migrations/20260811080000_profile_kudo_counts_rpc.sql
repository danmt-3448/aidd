-- get_profile_kudo_counts(p_profile_id uuid)
--   returns table(received int, sent int)
--
-- Returns the total kudos received AND sent for any profile, bypassing RLS.
-- Used by the hover card to show the real sent count even when the viewer
-- is NOT the profile being viewed.
--
-- Why SECURITY DEFINER:
--   profile_stats.sent is only readable by the profile owner (RLS on the view
--   restricts sent to auth.uid() = user_id). For the hover card we want to show
--   the real sent count to ANY authenticated viewer — user decision 2026-08-11
--   (spec §3, Decisions block). SECURITY DEFINER lets us count directly on
--   public.kudos (which has a broad SELECT policy) without touching the RLS-gated
--   profile_stats view.
--
-- Privacy note:
--   sent count includes anonymous sends (accepted by user, overrides SEC_001).
--   The function exposes only aggregate counts — no kudo content, no identities.
--
-- Rollback:
--   drop function if exists public.get_profile_kudo_counts(uuid);

create or replace function public.get_profile_kudo_counts(p_profile_id uuid)
returns table(received int, sent int)
language sql
security definer
stable
parallel safe
set search_path = public
as $$
  select
    (select count(*)::int from public.kudos where receiver_id = p_profile_id) as received,
    (select count(*)::int from public.kudos where sender_id  = p_profile_id) as sent;
$$;

grant execute on function public.get_profile_kudo_counts(uuid) to authenticated;
