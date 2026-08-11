-- create_kudo hardening: reject a receiver_id that does not exist.
-- Spec (Viết Kudo, item B): "must select a valid existing Sunner".
-- Before: Zod validated UUID shape only; a valid-but-nonexistent receiver hit a
-- raw Postgres FK error (unmapped) → generic "Đã xảy ra lỗi".
-- After: explicit P0007 → friendly "Người nhận không tồn tại" (mapped in kudo-actions.ts).
-- Body copied verbatim from 20260804010000 (8-arg); ONLY the receiver-exists check
-- (step 2b) is added. All prior codes P0001–P0006 preserved. create-or-replace keeps grants.
-- Rollback: re-apply 20260804010000's function body.

create or replace function public.create_kudo(
  p_kudo_id        uuid,
  p_receiver_id    uuid,
  p_content_html   text,
  p_is_anonymous   boolean,
  p_anonymous_name text,
  p_hashtag_ids    uuid[],
  p_image_paths    text[],
  p_danh_hieu      text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_sender_id  uuid;
  v_tag_count  int;
  v_img_count  int;
  i            int;
begin
  -- 1. Resolve caller identity
  v_sender_id := auth.uid();
  if v_sender_id is null then
    raise exception 'Not authenticated' using errcode = 'P0001';
  end if;

  -- 2. Validate: receiver must differ from sender
  if p_receiver_id = v_sender_id then
    raise exception 'Sender and receiver must differ' using errcode = 'P0002';
  end if;

  -- 2b. Validate: receiver must exist (spec: "valid existing Sunner")
  if not exists (select 1 from public.profiles where id = p_receiver_id) then
    raise exception 'Receiver does not exist' using errcode = 'P0007';
  end if;

  -- 3. Validate: hashtag_ids 1–5
  v_tag_count := coalesce(array_length(p_hashtag_ids, 1), 0);
  if v_tag_count < 1 or v_tag_count > 5 then
    raise exception 'hashtag_ids must have 1–5 elements, got %', v_tag_count using errcode = 'P0003';
  end if;

  -- 4. Validate: all hashtag UUIDs exist
  if exists (
    select 1
    from unnest(p_hashtag_ids) as t(id)
    where not exists (select 1 from public.hashtags h where h.id = t.id)
  ) then
    raise exception 'One or more hashtag_ids do not exist' using errcode = 'P0004';
  end if;

  -- 5. Validate: image_paths 0–5
  v_img_count := coalesce(array_length(p_image_paths, 1), 0);
  if v_img_count > 5 then
    raise exception 'image_paths must have at most 5 elements, got %', v_img_count using errcode = 'P0005';
  end if;

  -- 5b. Validate: every image path must be under the caller's uid folder
  if v_img_count > 0 then
    if exists (
      select 1 from unnest(p_image_paths) as t(path)
      where split_part(t.path, '/', 1) <> v_sender_id::text
    ) then
      raise exception 'image paths must be under caller uid folder' using errcode = 'P0006';
    end if;
  end if;

  -- 6. Insert kudo (including danh_hieu)
  insert into public.kudos (id, sender_id, receiver_id, content_html, is_anonymous, anonymous_name, danh_hieu)
  values (p_kudo_id, v_sender_id, p_receiver_id, p_content_html, p_is_anonymous, p_anonymous_name, p_danh_hieu);

  -- 7. Insert kudo_hashtags
  insert into public.kudo_hashtags (kudo_id, hashtag_id)
  select p_kudo_id, unnest(p_hashtag_ids);

  -- 8. Insert kudo_images (with sort_order by position)
  for i in 1 .. v_img_count loop
    insert into public.kudo_images (kudo_id, storage_path, sort_order)
    values (p_kudo_id, p_image_paths[i], i - 1);
  end loop;

  return p_kudo_id;
end;
$$;
