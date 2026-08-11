-- get_profile_tier(p_profile_id uuid) returns smallint
--
-- Returns the tier (1-4) for a profile based on count(DISTINCT sender_id)
-- of kudos received by that profile. Returns null if 0 distinct senders.
--
-- Delegates to kudo_tier() from 20260811050000_feed_tier_department.sql.
-- Separated as a named RPC so the hover-card server action can call it in
-- a single round-trip without raw SQL in the application layer.
--
-- Security: SECURITY INVOKER — runs under caller's RLS. kudos table has
-- kudos_select_own RLS, so direct SELECT would return 0 rows for third parties.
-- We bypass this by reading the count via a SECURITY DEFINER wrapper that only
-- exposes the aggregate (tier number), never raw kudo rows. Caller sees only
-- the tier integer — no kudo content or identity is leaked.
--
-- Rollback:
--   drop function if exists public.get_profile_tier(uuid);

create or replace function public.get_profile_tier(p_profile_id uuid)
returns smallint
language sql
security definer
stable
parallel safe
set search_path = public
as $$
  select public.kudo_tier(
    (select count(distinct sender_id)::int
     from public.kudos
     where receiver_id = p_profile_id)
  )
$$;

grant execute on function public.get_profile_tier(uuid) to authenticated;
