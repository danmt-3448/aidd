-- CORRECTION: kudos_public must NOT use security_invoker.
--
-- Why: security_invoker=true causes the base-table kudos RLS to apply under the
-- caller's identity. With kudos_select_own (sender OR receiver only), a third-party
-- user querying kudos_public gets 0 rows — the feed would be empty for everyone
-- except the sender/receiver. This breaks the board and profile feed use case.
--
-- Fix: drop security_invoker (PostgreSQL views default to security_definer semantics
-- for RLS — the view owner's privileges govern base-table access). The anon mask in
-- the projection is the enforced privacy boundary; the GRANT on this view is the
-- access gate. The base-table kudos_select_own policy remains correct — it blocks
-- direct SELECT on the kudos table for third parties, channelling all feed reads
-- through this masked view.
--
-- Rollback: recreate with (security_invoker = true) — but do not do so without
-- also removing kudos_select_own, as that combination makes the feed return 0 rows.

drop view if exists public.kudos_public;

create view public.kudos_public as
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

-- GRANT: broad SELECT — the view owner's access governs base-table reads;
-- the anon mask in the projection is the enforced privacy boundary.
grant select on public.kudos_public to authenticated;
