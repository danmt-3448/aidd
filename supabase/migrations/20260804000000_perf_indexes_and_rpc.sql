-- ============================================================
-- Performance migration: indexes, RLS auth.uid() hoisting, get_highlight_kudos RPC
-- Date: 2026-08-04
-- Audit: plans/reports/debugger-260804-1316-be-performance-audit.md
-- ============================================================

-- ============================================================
-- 1. INDEXES
-- ============================================================

-- 1a. kudos.sender_id — profile sent feed, profile_stats sent subplan,
--     hearts_insert_own RLS subquery, kudo_hashtags RLS subquery.
create index if not exists idx_kudos_sender_id
  on public.kudos (sender_id);

-- 1b. secret_box_badges composite (user_id, opened_at DESC) —
--     covers user_id filter + opened_at sort used by getSecretBoxState
--     and profile_stats SubPlan 4.  Supersedes a plain user_id index.
create index if not exists idx_secret_box_badges_user_opened
  on public.secret_box_badges (user_id, opened_at desc);

-- 1c. profiles full_name trigram — enables ILIKE '%…%' autocomplete.
--     pg_trgm is bundled with Postgres; safe on Supabase free tier.
create extension if not exists pg_trgm;
create index if not exists idx_profiles_full_name_trgm
  on public.profiles using gin (full_name gin_trgm_ops);

-- 1d. kudos composite keyset — covers (created_at DESC, id DESC) for
--     board and profile feeds.  The existing single-column kudos_created_at_idx
--     is left in place; retire it in a follow-up migration after verifying plans.
create index if not exists idx_kudos_created_at_id
  on public.kudos (created_at desc, id desc);

-- 1e. notifications list sort — covers user_id filter + created_at sort
--     for listNotifications.  The existing (user_id, is_read) index is kept
--     for getUnreadCount (already Index Only Scan — do not drop it).
create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- ============================================================
-- 2. RLS auth.uid() HOISTING
-- Wrap bare auth.uid() in (select auth.uid()) so the planner evaluates
-- it once per statement rather than once per row.
-- Logic is byte-for-byte identical to the current policies — only the
-- auth.uid() call site is wrapped.  Verified against live pg_policies output.
-- ============================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Current: USING (auth.uid() = id)  WITH CHECK (auth.uid() = id)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using  ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ── kudos ─────────────────────────────────────────────────────────────────────
-- Current INSERT: WITH CHECK (auth.uid() = sender_id)
drop policy if exists "kudos_insert_own" on public.kudos;
create policy "kudos_insert_own"
  on public.kudos for insert to authenticated
  with check ((select auth.uid()) = sender_id);

-- Current SELECT: USING (sender_id = auth.uid() OR receiver_id = auth.uid())
drop policy if exists "kudos_select_own" on public.kudos;
create policy "kudos_select_own"
  on public.kudos for select to authenticated
  using (
    sender_id   = (select auth.uid())
    or receiver_id = (select auth.uid())
  );

-- ── hearts ────────────────────────────────────────────────────────────────────
-- Current INSERT WITH CHECK:
--   auth.uid() = user_id
--   AND NOT EXISTS (SELECT 1 FROM kudos k WHERE k.id = kudo_id AND k.sender_id = auth.uid())
-- The idx_kudos_sender_id added above means the k.sender_id filter is now indexed.
drop policy if exists "hearts_insert_own" on public.hearts;
create policy "hearts_insert_own"
  on public.hearts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.kudos k
      where k.id = kudo_id
        and k.sender_id = (select auth.uid())
    )
  );

-- Current DELETE: USING (auth.uid() = user_id)
drop policy if exists "hearts_delete_own" on public.hearts;
create policy "hearts_delete_own"
  on public.hearts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ── notifications ─────────────────────────────────────────────────────────────
-- Current SELECT: USING (auth.uid() = user_id)
-- Current UPDATE: USING (auth.uid() = user_id)  WITH CHECK (auth.uid() = user_id)
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using  ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── secret_box ────────────────────────────────────────────────────────────────
-- Current SELECT: USING (auth.uid() = user_id)
drop policy if exists "secret_box_select_own" on public.secret_box;
create policy "secret_box_select_own"
  on public.secret_box for select to authenticated
  using ((select auth.uid()) = user_id);

-- Current SELECT: USING (auth.uid() = user_id)
drop policy if exists "secret_box_badges_select_own" on public.secret_box_badges;
create policy "secret_box_badges_select_own"
  on public.secret_box_badges for select to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- 3. RPC: get_highlight_kudos(p_today date, p_multiplier int)
--
-- Replaces the 2000-row JS-side ranking in getHighlightKudos.
-- Returns the top-5 kudos by weighted heart score in one server-side query.
--
-- Weighted score = count(hearts) + count(special-day hearts) * (multiplier - 1)
-- This is identical to the JS formula:
--   hearts.length + specialCount * (multiplier - 1)
--
-- Anonymous sender masking replicates kudos_public view logic exactly:
--   sender_id        → null when is_anonymous
--   sender_name      → anonymous_name ?? 'Ẩn danh' when is_anonymous
--   sender_avatar_url → null when is_anonymous
--
-- liked_by_me is computed server-side via bool_or so the caller gets the
-- same value the old JS computed with hearts.some(h => h.user_id === uid).
-- For unauthenticated callers auth.uid() is null, so liked_by_me = false.
--
-- Tiebreak: weighted_score DESC, k.created_at DESC (same as JS .sort() which
-- is stable on created_at order since the source query ordered by created_at DESC).
--
-- security definer: runs as the function owner, bypassing kudos_select_own RLS
-- (same access level as kudos_public view which is security definer by default).
-- ============================================================

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
  receiver_name       text,
  receiver_avatar_url text,
  heart_count         bigint,
  weighted_score      bigint,
  liked_by_me         boolean
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
    -- anonymous sender masking (mirrors kudos_public view)
    case when k.is_anonymous then null::uuid
         else k.sender_id end                                              as sender_id,
    case when k.is_anonymous
         then coalesce(k.anonymous_name, 'Ẩn danh')
         else sp.full_name end                                             as sender_name,
    case when k.is_anonymous then null::text
         else sp.avatar_url end                                            as sender_avatar_url,
    rp.full_name                                                           as receiver_name,
    rp.avatar_url                                                          as receiver_avatar_url,
    count(h.kudo_id)                                                       as heart_count,
    -- weighted score: plain hearts + bonus for special-day hearts
    count(h.kudo_id)
      + count(h.kudo_id) filter (where h.is_special_day)
        * greatest(p_multiplier - 1, 0)                                    as weighted_score,
    -- liked_by_me: true if the calling user has a heart on this kudo
    coalesce(
      bool_or(h.user_id = (select auth.uid())),
      false
    )                                                                       as liked_by_me
  from public.kudos k
  left join public.profiles sp on sp.id = k.sender_id
  left join public.profiles rp on rp.id = k.receiver_id
  left join public.hearts   h  on h.kudo_id = k.id
  group by
    k.id, k.is_anonymous, k.anonymous_name,
    k.sender_id, sp.full_name, sp.avatar_url,
    rp.full_name, rp.avatar_url
  order by weighted_score desc, k.created_at desc
  limit 5;
$$;

grant execute on function public.get_highlight_kudos(date, int) to authenticated;
