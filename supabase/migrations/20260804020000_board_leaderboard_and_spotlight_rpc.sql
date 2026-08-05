-- ============================================================
-- Board leaderboard + spotlight RPCs
-- Date: 2026-08-04
-- Backlog: BOARD-3, BOARD-4, BOARD-5
-- ============================================================

-- ============================================================
-- BOARD-3: get_ranking_leaderboard()
--
-- Top-10 sunners ranked by kudos received (count from public.kudos,
-- not kudos_public, so masking has no effect on receiver-side data).
-- security definer: resolves profiles join without per-row RLS cost.
-- Masking note: only receiver identity is exposed — sender identity
-- is never returned. Safe to expose as a leaderboard.
-- ============================================================

create or replace function public.get_ranking_leaderboard()
returns table (
  rank       bigint,
  user_id    uuid,
  name       text,
  avatar_url text,
  score      bigint
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (order by count(*) desc)  as rank,
    k.receiver_id                               as user_id,
    p.full_name                                 as name,
    p.avatar_url                                as avatar_url,
    count(*)                                    as score
  from public.kudos k
  join public.profiles p on p.id = k.receiver_id
  group by k.receiver_id, p.full_name, p.avatar_url
  order by score desc
  limit 10;
$$;

grant execute on function public.get_ranking_leaderboard() to authenticated, anon;

-- ============================================================
-- BOARD-4: get_gift_leaderboard()
--
-- Top-10 sunners ranked by secret boxes opened (count from secret_box_badges).
-- security definer: resolves profiles join without per-row RLS cost.
-- Masking note: only recipient identity is exposed. Safe to expose as leaderboard.
-- ============================================================

create or replace function public.get_gift_leaderboard()
returns table (
  rank       bigint,
  user_id    uuid,
  name       text,
  avatar_url text,
  score      bigint
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (order by count(*) desc)  as rank,
    b.user_id,
    p.full_name                                 as name,
    p.avatar_url                                as avatar_url,
    count(*)                                    as score
  from public.secret_box_badges b
  join public.profiles p on p.id = b.user_id
  group by b.user_id, p.full_name, p.avatar_url
  order by score desc
  limit 10;
$$;

grant execute on function public.get_gift_leaderboard() to authenticated, anon;

-- ============================================================
-- BOARD-5: get_spotlight_aggregation(p_hashtag_id uuid)
--
-- Server-side GROUP BY to replace the client-side aggregation in
-- getSpotlightAggregation. Replaces pulling ≤1000 rows and grouping in JS.
-- Reads from kudos_public (sender masking always applied).
-- Optional hashtag filter: when p_hashtag_id is null, no hashtag filter applied.
-- security definer: needed to read kudos_public which is a security-definer view.
-- ============================================================

create or replace function public.get_spotlight_aggregation(
  p_hashtag_id uuid default null
)
returns table (
  receiver_id    uuid,
  receiver_name  text,
  avatar_url     text,
  kudo_count     bigint
)
language sql
security definer
set search_path = public
as $$
  select
    kp.receiver_id,
    kp.receiver_name                            as receiver_name,
    kp.receiver_avatar_url                      as avatar_url,
    count(*)                                    as kudo_count
  from public.kudos_public kp
  where
    p_hashtag_id is null
    or exists (
      select 1 from public.kudo_hashtags kh
      where kh.kudo_id = kp.id
        and kh.hashtag_id = p_hashtag_id
    )
  group by kp.receiver_id, kp.receiver_name, kp.receiver_avatar_url
  order by kudo_count desc;
$$;

grant execute on function public.get_spotlight_aggregation(uuid) to authenticated, anon;
