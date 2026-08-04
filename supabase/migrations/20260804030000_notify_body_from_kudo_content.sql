-- Phase 03 update: populate `body` on notify_on_kudo_insert trigger.
-- The kudo body is HTML from Tiptap — we strip tags and truncate to ~80 chars
-- so the notification preview is plain-text and safe.
--
-- Rollback (revert body to NULL):
--   Recreate function without v_body logic and redeploy.

create or replace function public.notify_on_kudo_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title       text;
  v_body        text;
  v_sender_name text;
  v_raw_content text;
begin
  -- ── 1. Build title (anon-safe) ────────────────────────────────────────────
  if NEW.is_anonymous then
    v_title := 'Bạn nhận được một Kudo ẩn danh';
  else
    select full_name
      into v_sender_name
      from public.profiles
     where id = NEW.sender_id;

    v_title := coalesce(v_sender_name, 'Ai đó') || ' đã gửi cho bạn một Kudo';
  end if;

  -- ── 2. Build body — strip HTML tags, trim whitespace, truncate to 80 chars ─
  -- regexp_replace strips every <...> tag (non-greedy). The second call collapses
  -- multiple whitespace (spaces/newlines/tabs) from entity-decoded text.
  v_raw_content := coalesce(NEW.content_html, '');

  v_body := trim(
    regexp_replace(
      regexp_replace(v_raw_content, '<[^>]*>', '', 'g'),
      '\s+', ' ', 'g'
    )
  );

  -- Truncate to 80 chars with ellipsis if longer.
  if char_length(v_body) > 80 then
    v_body := left(v_body, 80) || '…';
  end if;

  -- Null-out empty body so the client can apply a fallback gracefully.
  if v_body = '' then
    v_body := null;
  end if;

  -- ── 3. Insert notification ────────────────────────────────────────────────
  insert into public.notifications (user_id, type, title, body, link)
  values (NEW.receiver_id, 'kudo_received', v_title, v_body, '/kudos/' || NEW.id);

  return NEW;
end;
$$;

-- Recreate trigger (drop+create is idempotent because we own the function).
drop trigger if exists notify_on_kudo_insert on public.kudos;

create trigger notify_on_kudo_insert
  after insert on public.kudos
  for each row
  execute function public.notify_on_kudo_insert();
