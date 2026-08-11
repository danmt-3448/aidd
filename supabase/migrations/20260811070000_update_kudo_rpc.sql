-- update_kudo(p_kudo_id, p_content_html, p_danh_hieu, p_hashtag_ids, p_image_paths)
--
-- Allows the ORIGINAL SENDER to edit their own kudo — content, danh_hieu,
-- hashtags, and images — atomically. Receiver and anonymity cannot change.
--
-- Security model:
--   SECURITY DEFINER so the function can bypass RLS for the UPDATE and the
--   cascading DELETE/INSERT on child tables (kudo_hashtags, kudo_images).
--   The ownership check (sender_id = auth.uid()) is the first thing the body
--   does, so a malicious caller cannot touch another user's kudo.
--
-- Errcode catalogue (mirrors create_kudo's P-series):
--   P0001  caller not authenticated
--   P0003  hashtag_ids count out of 1–5 range
--   P0004  one or more hashtag UUIDs do not exist
--   P0005  image_paths count > 5
--   P0009  caller is not the sender of this kudo (new, update-specific)
--
-- Input sanitization:
--   content_html is sanitized in kudo-actions.ts BEFORE the RPC is called,
--   consistent with create_kudo. The RPC stores the value as-is.
--
-- Rollback:
--   drop function if exists public.update_kudo(uuid, text, text, uuid[], text[]);
--   alter table public.kudos drop column if exists updated_at;

-- ============================================================
-- 1. Add updated_at column (nullable; null means never edited)
-- ============================================================

alter table public.kudos
  add column if not exists updated_at timestamptz;

-- ============================================================
-- 2. update_kudo RPC
-- ============================================================

create or replace function public.update_kudo(
  p_kudo_id      uuid,
  p_content_html text,
  p_danh_hieu    text,
  p_hashtag_ids  uuid[],
  p_image_paths  text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id  uuid;
  v_tag_count  int;
  v_img_count  int;
  i            int;
begin
  -- 1. Caller must be authenticated.
  v_caller_id := auth.uid();
  if v_caller_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  -- 2. Caller must own this kudo (owner check — primary guard).
  if not exists (
    select 1 from public.kudos
    where id = p_kudo_id
      and sender_id = v_caller_id
  ) then
    raise exception 'not your kudo' using errcode = 'P0009';
  end if;

  -- 3. Validate hashtag_ids count 1–5.
  v_tag_count := coalesce(array_length(p_hashtag_ids, 1), 0);
  if v_tag_count < 1 or v_tag_count > 5 then
    raise exception 'hashtag_ids must have 1–5 elements, got %', v_tag_count
      using errcode = 'P0003';
  end if;

  -- 4. Validate all hashtag UUIDs exist.
  if exists (
    select 1
    from unnest(p_hashtag_ids) as t(id)
    where not exists (select 1 from public.hashtags h where h.id = t.id)
  ) then
    raise exception 'One or more hashtag_ids do not exist' using errcode = 'P0004';
  end if;

  -- 5. Validate image_paths count 0–5.
  v_img_count := coalesce(array_length(p_image_paths, 1), 0);
  if v_img_count > 5 then
    raise exception 'image_paths must have at most 5 elements, got %', v_img_count
      using errcode = 'P0005';
  end if;

  -- 6. Update kudos row (content_html already sanitized by caller).
  update public.kudos
  set
    content_html = p_content_html,
    danh_hieu    = p_danh_hieu,
    updated_at   = now()
  where id = p_kudo_id;

  -- 7. Replace hashtags (delete existing, insert new set).
  delete from public.kudo_hashtags where kudo_id = p_kudo_id;

  insert into public.kudo_hashtags (kudo_id, hashtag_id)
  select p_kudo_id, unnest(p_hashtag_ids);

  -- 8. Replace images (delete existing, insert new set with sort_order).
  delete from public.kudo_images where kudo_id = p_kudo_id;

  for i in 1 .. v_img_count loop
    insert into public.kudo_images (kudo_id, storage_path, sort_order)
    values (p_kudo_id, p_image_paths[i], i - 1);
  end loop;
end;
$$;

-- ============================================================
-- 3. Grant EXECUTE to authenticated users
-- ============================================================

grant execute on function public.update_kudo(uuid, text, text, uuid[], text[])
  to authenticated;
