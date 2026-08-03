-- profile_stats: caller-scoped stats VIEW.
-- security_invoker = true → runs under caller's RLS.
-- sent column: null for cross-user queries (privacy guard).
-- hearts_received: live count from hearts table (not the denormalized profiles col).
-- boxes_opened / boxes_remaining: live from secret_box / secret_box_badges.
-- Rollback: drop view if exists public.profile_stats;

create or replace view public.profile_stats
  with (security_invoker = true)
as
select
  p.id                                                                              as user_id,
  (select count(*) from public.kudos k where k.receiver_id = p.id)                 as received,
  case when p.id = auth.uid()
       then (select count(*) from public.kudos k where k.sender_id = p.id)
       else null end                                                                as sent,
  -- hearts_received: live count — never trusts the denormalized profiles.hearts_received col
  (select count(*) from public.hearts h
     join public.kudos k on k.id = h.kudo_id
     where k.receiver_id = p.id)                                                    as hearts_received,
  (select count(*) from public.secret_box_badges b where b.user_id = p.id)          as boxes_opened,
  coalesce(
    (select sb.unopened_box_count from public.secret_box sb where sb.user_id = p.id),
    0
  )                                                                                  as boxes_remaining
from public.profiles p;

-- GRANT: authenticated may query profile stats; RLS on base tables still governs row visibility.
grant select on public.profile_stats to authenticated;
