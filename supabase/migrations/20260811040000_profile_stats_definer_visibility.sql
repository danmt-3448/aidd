-- Fix F1: profile_stats.received = 0 when viewed by non-self.
-- Root cause: security_invoker = true made the count run under the VIEWER's RLS
-- (kudos_select_own: sender_id = uid OR receiver_id = uid), so when user A reads
-- user B's stats, kudos rows where receiver_id = B are invisible to A → count = 0.
-- The profile FEED had no bug because kudos_public is SECURITY DEFINER.
--
-- Fix: switch to security_invoker = false (view runs as owner = postgres, bypasses RLS)
-- so the aggregate sees all kudos rows. Then re-apply column-level privacy via CASE:
--   received         → public (no gate) — shown in board leaderboards + profile-other dropdown.
--   sent             → self-only  (CASE WHEN p.id = auth.uid())
--   hearts_received  → self-only  (CASE WHEN p.id = auth.uid()) — same WEIGHTED expr
--   boxes_opened     → self-only  (CASE WHEN p.id = auth.uid())
--   boxes_remaining  → self-only  (CASE WHEN p.id = auth.uid())
-- auth.uid() is evaluated at CALL time (caller's JWT) even with invoker=false.
--
-- Rollback: re-apply 20260811030000_weighted_hearts_received.sql (security_invoker = true).

create or replace view public.profile_stats
  with (security_invoker = false)
as
select
  p.id                                                                              as user_id,
  (select count(*) from public.kudos k where k.receiver_id = p.id)                 as received,
  case when p.id = auth.uid()
       then (select count(*) from public.kudos k where k.sender_id = p.id)
       else null end                                                                as sent,
  -- hearts_received: WEIGHTED — normal heart = 1, special-day heart = M.
  -- count(all) + special_count*(M-1) == normal*1 + special*M.
  -- hearts_received = tim mà các kudo NGƯỜI DÙNG GỬI nhận được (spec C.4.1: "tài khoản
  -- gửi kudo được cộng tim"; self-like bị cấm để chống tự-farm → tim thuộc về sender).
  -- WEIGHTED: heart thường = 1, special-day = M. NB: keep bigint (count) —
  -- create-or-replace view forbids changing column type.
  case when p.id = auth.uid()
       then (select count(h.kudo_id)
                  + count(h.kudo_id) filter (where h.is_special_day)
                    * (coalesce((select hearts_special_multiplier from public.event_config limit 1), 1) - 1)
               from public.hearts h
               join public.kudos k on k.id = h.kudo_id
               where k.sender_id = p.id)
       else null end                                                                as hearts_received,
  case when p.id = auth.uid()
       then (select count(*) from public.secret_box_badges b where b.user_id = p.id)
       else null end                                                                as boxes_opened,
  case when p.id = auth.uid()
       then coalesce(
         (select sb.unopened_box_count from public.secret_box sb where sb.user_id = p.id),
         0
       )
       else null end                                                                as boxes_remaining
from public.profiles p;

grant select on public.profile_stats to authenticated;
