-- Weighted hearts_received: a special-day like counts as the configured multiplier
-- (spec C.4.1 Hearts: "ngày đặc biệt → +2 tim"), a normal like counts 1.
-- Before: profile_stats.hearts_received = count(*) — flat, ignored special-day → the
-- sidebar "Số tim bạn nhận được" (D.1.4) was wrong on special days.
-- After: count + special_count * (M-1), M = event_config.hearts_special_multiplier.
-- Unlike auto-corrects (query-time recompute — deleting a heart removes its weight).
-- Multiplier source of truth for ACCOUNT hearts = event_config.hearts_special_multiplier
-- (global). special_day_config still drives is_special_day stamping + carousel ranking.
-- Body copied verbatim from 20260731080000; ONLY hearts_received changed.
-- Rollback: re-apply 20260731080000 (count(*) form) + reset multiplier to 1.

-- Set the event's special-day multiplier to 2 (spec: special like = +2 hearts).
update public.event_config set hearts_special_multiplier = 2;

create or replace view public.profile_stats
  with (security_invoker = true)
as
select
  p.id                                                                              as user_id,
  (select count(*) from public.kudos k where k.receiver_id = p.id)                 as received,
  case when p.id = auth.uid()
       then (select count(*) from public.kudos k where k.sender_id = p.id)
       else null end                                                                as sent,
  -- hearts_received: WEIGHTED — normal heart = 1, special-day heart = M.
  -- count(all) + special_count*(M-1) == normal*1 + special*M.
  -- NB: keep bigint (count) — create-or-replace view forbids changing column type.
  (select count(h.kudo_id)
        + count(h.kudo_id) filter (where h.is_special_day)
          * (coalesce((select hearts_special_multiplier from public.event_config limit 1), 1) - 1)
     from public.hearts h
     join public.kudos k on k.id = h.kudo_id
     where k.receiver_id = p.id)                                                    as hearts_received,
  (select count(*) from public.secret_box_badges b where b.user_id = p.id)          as boxes_opened,
  coalesce(
    (select sb.unopened_box_count from public.secret_box sb where sb.user_id = p.id),
    0
  )                                                                                  as boxes_remaining
from public.profiles p;

grant select on public.profile_stats to authenticated;
