-- open_secret_box(): atomic, tamper-proof box-opening RPC.
-- Steps in one transaction:
--   1. Verify caller is authenticated.
--   2. Lock caller's secret_box row (for update — concurrent-open guard).
--   3. Reject if count = 0 or row missing.
--   4. Roll a weighted badge key server-side (single random(), cumulative weights).
--   5. Decrement unopened_box_count by 1.
--   6. Insert secret_box_badges row.
--   7. Return { badge_key, remaining }.
--
-- Rollback: drop function if exists public.open_secret_box();

create or replace function public.open_secret_box()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid             uuid;
  v_count           int;
  v_roll            float8;
  v_badge_key       text;
  v_remaining       int;
begin
  -- ── 1. Auth guard ──────────────────────────────────────────────────────────
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Bạn cần đăng nhập để mở Secret Box'
      using errcode = 'P0101';
  end if;

  -- ── 2. Lock row and read count (concurrent double-open guard) ──────────────
  select unopened_box_count
    into v_count
    from public.secret_box
   where user_id = v_uid
     for update;

  -- ── 3. Reject if no entitlement ───────────────────────────────────────────
  if not found or v_count = 0 then
    raise exception 'Bạn không có Secret Box nào để mở'
      using errcode = 'P0102';
  end if;

  -- ── 4. Weighted badge roll (server-side, single random()) ─────────────────
  -- Distribution: Stay Gold 30 · Flow to Horizon 25 · Touch of Light 20 ·
  --               Beyond the Boundary 10 · Revival 10 · Root Further 5
  -- Cumulative:   0–30, 30–55, 55–75, 75–85, 85–95, 95–100
  v_roll := random() * 100;

  v_badge_key := case
    when v_roll <  30 then 'stay-gold'
    when v_roll <  55 then 'flow-to-horizon'
    when v_roll <  75 then 'touch-of-light'
    when v_roll <  85 then 'beyond-the-boundary'
    when v_roll <  95 then 'revival'
    else                   'root-further'
  end;

  -- ── 5. Decrement count ────────────────────────────────────────────────────
  update public.secret_box
     set unopened_box_count = unopened_box_count - 1,
         updated_at         = now()
   where user_id = v_uid
  returning unopened_box_count into v_remaining;

  -- ── 6. Record the badge ───────────────────────────────────────────────────
  insert into public.secret_box_badges (user_id, badge_key)
  values (v_uid, v_badge_key);

  -- ── 7. Return result ──────────────────────────────────────────────────────
  return json_build_object(
    'badge_key', v_badge_key,
    'remaining', v_remaining
  );
end;
$$;

-- DEFINER context owns the table writes; caller still needs EXECUTE on the function.
grant execute on function public.open_secret_box() to authenticated;
