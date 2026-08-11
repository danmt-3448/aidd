-- T1 + T2: Extend kudos_public with tier, department, danh_hieu.
--
-- Tier definition (spec §1) — metric = count(DISTINCT sender_id) per receiver:
--   0          → null (no badge)
--   1–4        → 1  New Hero
--   5–9        → 2  Rising Hero
--   10–20      → 3  Super Hero
--   > 20       → 4  Legend Hero
--
-- Implementation strategy:
--   A SQL helper function public.kudo_tier(int) makes the CASE reusable and
--   testable. The view computes distinct-sender counts via correlated subqueries
--   (cheap at feed scale — 20 rows per page). An index on kudos.receiver_id
--   already exists (kudos_receiver_id_idx); kudos.sender_id index exists too.
--
-- Department:
--   departments.name (short code e.g. "CEVC10") via profiles.department_ref.
--   Full org-path is NOT in DB — only the short name is available.
--   Limitation noted in feed query comment and handback report.
--
-- Anonymous kudos masking:
--   sender_department and sender_tier are null when is_anonymous=true,
--   consistent with the existing sender_id / sender_name / sender_avatar_url mask.
--
-- Rollback:
--   drop view if exists public.kudos_public;
--   (recreate from 20260731100000 — the prior definition is reproduced below in comments)
--   drop function if exists public.kudo_tier(int);
--   grant select on public.kudos_public to authenticated;

-- ============================================================
-- 1. Helper function: public.kudo_tier(distinct_senders int)
--    Returns smallint tier 1-4 or null.
-- ============================================================

create or replace function public.kudo_tier(distinct_senders int)
returns smallint
language sql
immutable
parallel safe
set search_path = public
as $$
  select case
    when distinct_senders >= 1  and distinct_senders <= 4  then 1::smallint
    when distinct_senders >= 5  and distinct_senders <= 9  then 2::smallint
    when distinct_senders >= 10 and distinct_senders <= 20 then 3::smallint
    when distinct_senders > 20                              then 4::smallint
    else null
  end
$$;

-- ============================================================
-- 2. Rebuild kudos_public with tier + department + danh_hieu
--    (drop-and-recreate because CREATE OR REPLACE cannot add columns)
-- ============================================================

drop view if exists public.kudos_public;

create view public.kudos_public as
select
  k.id,
  k.receiver_id,
  k.content_html,
  k.created_at,
  k.is_anonymous,
  k.danh_hieu,

  -- ── Sender fields (masked when anonymous) ─────────────────────────────
  case when k.is_anonymous then null else k.sender_id          end as sender_id,
  case when k.is_anonymous
       then coalesce(k.anonymous_name, 'Ẩn danh')
       else sp.full_name                                        end as sender_name,
  case when k.is_anonymous then null else sp.avatar_url         end as sender_avatar_url,
  case when k.is_anonymous then null
       else d_s.name                                            end as sender_department,
  -- Sender tier: distinct senders who sent to the sender (how popular the sender is).
  -- Masked null when anonymous.
  case when k.is_anonymous then null
       else public.kudo_tier(
         (select count(distinct ki.sender_id)::int
          from public.kudos ki
          where ki.receiver_id = k.sender_id)
       )
  end                                                               as sender_tier,

  -- ── Receiver fields (always visible) ──────────────────────────────────
  rp.full_name                                                      as receiver_name,
  rp.avatar_url                                                     as receiver_avatar_url,
  d_r.name                                                          as receiver_department,
  public.kudo_tier(
    (select count(distinct ki.sender_id)::int
     from public.kudos ki
     where ki.receiver_id = k.receiver_id)
  )                                                                 as receiver_tier

from public.kudos k
left join public.profiles sp on sp.id = k.sender_id
left join public.profiles rp on rp.id = k.receiver_id
left join public.departments d_s on d_s.id = sp.department_ref
left join public.departments d_r on d_r.id = rp.department_ref;

-- ============================================================
-- 3. Re-apply the broad SELECT grant (dropped with the view)
-- ============================================================

grant select on public.kudos_public to authenticated;

-- ============================================================
-- 4. Index hint (already exists from previous migrations)
--    kudos_receiver_id_idx and idx_kudos_sender_id are present —
--    the correlated subqueries above will use them.
-- ============================================================
