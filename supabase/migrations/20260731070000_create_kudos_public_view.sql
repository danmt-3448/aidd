-- kudos_public: sender-masked read path for the kudo feed.
-- security_invoker = true → view runs under the caller's RLS context.
-- With kudos_select_own on the base table, a plain SELECT on kudos returns
-- only own/received rows. This view is granted broad SELECT to authenticated
-- so third parties can read the feed — but anon sender identity is masked here.
-- Rollback: drop view if exists public.kudos_public;

create or replace view public.kudos_public
  with (security_invoker = true)
as
select
  k.id,
  k.receiver_id,
  k.content_html,
  k.created_at,
  k.is_anonymous,
  -- sender masked for anonymous rows
  case when k.is_anonymous then null else k.sender_id end          as sender_id,
  case when k.is_anonymous
       then coalesce(k.anonymous_name, 'Ẩn danh')
       else sp.full_name end                                        as sender_name,
  case when k.is_anonymous then null else sp.avatar_url end         as sender_avatar_url,
  -- receiver ALWAYS visible (board / profile need the recipient)
  rp.full_name                                                      as receiver_name,
  rp.avatar_url                                                     as receiver_avatar_url
from public.kudos k
left join public.profiles sp on sp.id = k.sender_id
left join public.profiles rp on rp.id = k.receiver_id;

-- GRANT: broad SELECT so third parties read the feed through this mask.
-- The base-table RLS (kudos_select_own) is bypassed for the view because
-- security_invoker means the view runs as the caller; the GRANT on the view
-- itself is the gate for feed reads.
grant select on public.kudos_public to authenticated;
