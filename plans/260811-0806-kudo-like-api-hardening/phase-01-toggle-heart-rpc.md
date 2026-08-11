# Phase 01 — `toggle_heart` RPC (atomic idempotent)

**Track:** B·Like · **Scope:** core · **Priority:** P1 · **blockedBy:** —

## Problem
`src/features/board/heart-actions.ts:104–161` toggles via SELECT-existing → INSERT/DELETE = **not atomic**. Rapid double-click races → PK `23505`, which `friendlyHeartError` (`:31–41`) does NOT map → confusing "Vui lòng thử lại". 3 round-trips/like (select + special-day + count). Self-like guarded only by RLS subquery.

## Approach — move the whole toggle into one server-side transaction
New migration `supabase/migrations/20260811010000_toggle_heart_rpc.sql`:

```sql
create or replace function public.toggle_heart(p_kudo_id uuid)
returns table(liked boolean, heart_count int)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_sender uuid; v_special boolean; v_deleted int;
begin
  if v_uid is null then raise exception 'auth required' using errcode = 'P0001'; end if;
  select sender_id into v_sender from kudos where id = p_kudo_id;
  if v_sender is null then raise exception 'kudo not found' using errcode = 'P0007'; end if;
  if v_sender = v_uid then raise exception 'cannot heart own kudo' using errcode = 'P0008'; end if;

  delete from hearts where user_id = v_uid and kudo_id = p_kudo_id;
  get diagnostics v_deleted = row_count;

  if v_deleted = 0 then
    v_special := exists(select 1 from special_day_config where event_date = current_date);
    insert into hearts(user_id, kudo_id, is_special_day) values (v_uid, p_kudo_id, v_special)
      on conflict (user_id, kudo_id) do nothing;   -- race-safe: concurrent insert → no-op
    liked := true;
  else
    liked := false;
  end if;

  select count(*)::int into heart_count from hearts where kudo_id = p_kudo_id;
  return next;
end $$;

grant execute on function public.toggle_heart(uuid) to authenticated;
```

`security definer` → guards MUST live in the function (they do). Keep existing RLS on `hearts` as defense-in-depth (unchanged).

## Files
- **Create:** `supabase/migrations/20260811010000_toggle_heart_rpc.sql`
- **Modify:** `src/features/board/heart-actions.ts` — replace SELECT/INSERT/DELETE block (`:103–164`) with one `supabase.rpc('toggle_heart', { p_kudo_id: kudoId })`; map P0001/P0007/P0008 in `friendlyHeartError`; drop `fetchHeartCount` + special-day fetch (now inside RPC).

## Steps
1. Write migration; `npm run db:reset` (or targeted apply) to load RPC.
2. Rewrite `toggleHeart()` → single RPC call; return `{ liked, heartCount }` from RPC row.
3. Extend `friendlyHeartError`: P0007→"Kudo không tồn tại", P0008→"Không thể thả tim cho Kudo của chính mình", P0001→"Bạn cần đăng nhập".
4. `npx tsc --noEmit`.

## Todo
- [ ] Migration `toggle_heart` RPC + grant
- [ ] Rewrite `heart-actions.ts` to call RPC (1 round-trip)
- [ ] Map P-codes in `friendlyHeartError`
- [ ] tsc clean

## Success Criteria
- Rapid double-click → toggles cleanly, **no 23505 error surfaced**.
- Self-like → friendly P0008 message (not generic).
- Non-existent kudo → P0007.
- `heart_count` returned matches `select count(*)` — authoritative.
- 1 DB round-trip per toggle.

## Risks
- `security definer` bypasses RLS → guards must be complete (they are: auth, exists, self-check). Mitigate: keep RLS policies as belt-and-suspenders.
- `on conflict do nothing` on race → insert reports 0 rows but we still set `liked=true` (heart exists either way) — correct idempotent semantics.
