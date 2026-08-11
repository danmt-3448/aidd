-- Extend get_highlight_kudos RPC with tier, department, danh_hieu, hashtags.
--
-- Problem: highlight cards lacked tier badge, department label, danh_hieu title,
-- and hashtag filter data because the original RPC (20260804000000) was written
-- before the feed-tier-department migration (20260811050000).
--
-- Strategy:
--   • Add department join (profiles → departments) for both sender and receiver.
--   • Add sender_tier / receiver_tier using public.kudo_tier() — same formula
--     as kudos_public view (count(distinct sender_id) per receiver).
--   • Add danh_hieu directly from kudos.danh_hieu.
--   • Add hashtags as text[] using array_agg over kudo_hashtags → hashtags join.
--   • Anonymous sender masking: sender_department and sender_tier are null when
--     is_anonymous = true (mirrors kudos_public view convention).
--   • Existing weighted-score ORDER BY is preserved unchanged.
--   • GROUP BY gains d_s.name, d_r.name, k.danh_hieu, rp.department_ref to keep
--     the aggregate valid; hashtag names collapse via array_agg.
--
-- Rollback:
--   Restore original function body from 20260804000000_perf_indexes_and_rpc.sql.

-- DROP first because CREATE OR REPLACE cannot change OUT parameter types.
drop function if exists public.get_highlight_kudos(date, int);

create or replace function public.get_highlight_kudos(
  p_today      date,
  p_multiplier int default 1
)
returns table (
  id                  uuid,
  receiver_id         uuid,
  content_html        text,
  created_at          timestamptz,
  is_anonymous        boolean,
  sender_id           uuid,
  sender_name         text,
  sender_avatar_url   text,
  sender_department   text,
  sender_tier         smallint,
  receiver_name       text,
  receiver_avatar_url text,
  receiver_department text,
  receiver_tier       smallint,
  heart_count         bigint,
  weighted_score      bigint,
  liked_by_me         boolean,
  danh_hieu           text,
  hashtags            text[]
)
language sql
security definer
set search_path = public
as $$
  select
    k.id,
    k.receiver_id,
    k.content_html,
    k.created_at,
    k.is_anonymous,

    -- ── Sender (masked when anonymous) ─────────────────────────────────────
    case when k.is_anonymous then null::uuid
         else k.sender_id end                                              as sender_id,
    case when k.is_anonymous
         then coalesce(k.anonymous_name, 'Ẩn danh')
         else sp.full_name end                                             as sender_name,
    case when k.is_anonymous then null::text
         else sp.avatar_url end                                            as sender_avatar_url,
    case when k.is_anonymous then null::text
         else d_s.name end                                                 as sender_department,
    -- Sender tier: distinct senders who sent kudos TO the sender.
    case when k.is_anonymous then null::smallint
         else public.kudo_tier(
           (select count(distinct ki.sender_id)::int
            from public.kudos ki
            where ki.receiver_id = k.sender_id)
         )
    end                                                                    as sender_tier,

    -- ── Receiver (always visible) ───────────────────────────────────────────
    rp.full_name                                                           as receiver_name,
    rp.avatar_url                                                          as receiver_avatar_url,
    d_r.name                                                               as receiver_department,
    public.kudo_tier(
      (select count(distinct ki.sender_id)::int
       from public.kudos ki
       where ki.receiver_id = k.receiver_id)
    )                                                                      as receiver_tier,

    -- ── Heart aggregates ────────────────────────────────────────────────────
    count(h.kudo_id)                                                       as heart_count,
    count(h.kudo_id)
      + count(h.kudo_id) filter (where h.is_special_day)
        * greatest(p_multiplier - 1, 0)                                    as weighted_score,
    coalesce(
      bool_or(h.user_id = (select auth.uid())),
      false
    )                                                                      as liked_by_me,

    -- ── Kudo metadata ───────────────────────────────────────────────────────
    k.danh_hieu                                                            as danh_hieu,
    -- Collapse all hashtag names into a text array; null entries filtered out.
    array_remove(
      array_agg(distinct ht.name order by ht.name),
      null
    )                                                                      as hashtags

  from public.kudos k
  left join public.profiles   sp  on sp.id  = k.sender_id
  left join public.profiles   rp  on rp.id  = k.receiver_id
  left join public.departments d_s on d_s.id = sp.department_ref
  left join public.departments d_r on d_r.id = rp.department_ref
  left join public.hearts      h   on h.kudo_id = k.id
  left join public.kudo_hashtags kh on kh.kudo_id = k.id
  left join public.hashtags    ht  on ht.id = kh.hashtag_id

  group by
    k.id, k.is_anonymous, k.anonymous_name,
    k.sender_id, sp.full_name, sp.avatar_url,
    d_s.name,
    rp.full_name, rp.avatar_url, rp.department_ref,
    d_r.name,
    k.danh_hieu

  order by weighted_score desc, k.created_at desc
  limit 5;
$$;

grant execute on function public.get_highlight_kudos(date, int) to authenticated;
