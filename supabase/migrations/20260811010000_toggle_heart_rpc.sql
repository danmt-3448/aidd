-- toggle_heart: atomic idempotent like/unlike in ONE transaction.
-- Fixes the SELECT-then-INSERT/DELETE race in heart-actions.ts (double-click → PK 23505).
-- Guards live IN the function (security definer bypasses RLS); RLS policies kept as backstop.
-- Business rules (spec C.4.1 Hearts): 1 like/user/kudo · sender cannot like own kudo ·
-- special-day stamp for weighted hearts_received (see 20260811030000).
-- Rollback: drop function if exists public.toggle_heart(uuid);

create or replace function public.toggle_heart(p_kudo_id uuid)
returns table(liked boolean, heart_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_sender  uuid;
  v_special boolean;
  v_deleted int;
begin
  if v_uid is null then
    raise exception 'auth required' using errcode = 'P0001';
  end if;

  select sender_id into v_sender from public.kudos where id = p_kudo_id;
  if v_sender is null then
    raise exception 'kudo not found' using errcode = 'P0007';
  end if;
  if v_sender = v_uid then
    raise exception 'cannot heart own kudo' using errcode = 'P0008';
  end if;

  -- Toggle: try to remove an existing heart first.
  delete from public.hearts where user_id = v_uid and kudo_id = p_kudo_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    -- Was not liked → like now, stamping special-day at insert time.
    v_special := exists (
      select 1 from public.special_day_config where event_date = current_date
    );
    insert into public.hearts (user_id, kudo_id, is_special_day)
      values (v_uid, p_kudo_id, v_special)
      on conflict (user_id, kudo_id) do nothing; -- race-safe: concurrent insert → no-op
    liked := true;
  else
    liked := false;
  end if;

  select count(*)::int into heart_count from public.hearts where kudo_id = p_kudo_id;
  return next;
end;
$$;

grant execute on function public.toggle_heart(uuid) to authenticated;
