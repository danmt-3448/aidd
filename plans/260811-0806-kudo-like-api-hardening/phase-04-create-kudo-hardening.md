# Phase 04 — create_kudo: receiver check + orphan-image cleanup

**Track:** B·Viết · **Scope:** core · **Priority:** P1 · **blockedBy:** — (∥ phases 01–03)

## Problem
1. `create_kudo()` (`20260731000000_create_kudos.sql` + 8-arg replace in `20260804010000`) validates hashtag/image counts + image-path ownership (P0002–P0006) but **NOT receiver existence**. A valid-UUID-but-nonexistent receiver → raw Postgres FK error, unmapped by `friendlyRpcError` (`kudo-actions.ts:54–60`) → generic "Đã xảy ra lỗi". Raw FK leaks conceptually.
2. Images upload to Storage BEFORE the RPC insert. If the RPC fails, uploaded objects are **orphaned** (no cleanup path).

## Approach
1. **New migration** `supabase/migrations/20260811020000_create_kudo_receiver_check.sql` — `create or replace function create_kudo(...)` (same 8-arg signature) adding, right after the sender/receiver checks:
   ```sql
   if not exists (select 1 from profiles where id = p_receiver_id) then
     raise exception 'receiver not found' using errcode = 'P0007';
   end if;
   ```
   Keep every existing P-code + logic identical (copy current body, insert the check). Verify current signature via `\df create_kudo` before rewriting.
2. **Orphan cleanup** in `src/features/kudos/kudo-actions.ts`: wrap the RPC call so on failure it best-effort `supabase.storage.from('kudo-images').remove(uploadedPaths)` before returning the typed error. Map P0007 → "Người nhận không tồn tại" in `friendlyRpcError`.

## Files
- **Create:** `supabase/migrations/20260811020000_create_kudo_receiver_check.sql`
- **Modify:** `src/features/kudos/kudo-actions.ts` — add P0007 mapping + orphan-image cleanup on RPC failure.

## Steps
1. Dump current `create_kudo` body (from `20260804010000`), add the receiver-exists check, save as new migration (create-or-replace). `npm run db:reset`.
2. In `kudo-actions.ts`: collect uploaded storage paths; on RPC error → remove them (best-effort, log failures), then return typed `{ok:false}`.
3. Map P0007 in `friendlyRpcError`. `npx tsc --noEmit`.

## Todo
- [ ] Migration: create_kudo + receiver-exists P0007 (preserve all existing logic)
- [ ] kudo-actions: orphan-image cleanup on failure
- [ ] Map P0007 friendly message
- [ ] tsc clean

## Success Criteria
- Nonexistent receiver → friendly "Người nhận không tồn tại" (no raw FK).
- RPC failure after upload → orphaned objects removed from `kudo-images` bucket.
- All prior create_kudo behavior (atomic 3-table insert, P0002–P0006, sanitize, sender-mask) unchanged.

## Risks
- Rewriting the RPC risks dropping a P-code → copy the current body verbatim, add only the new check. Diff against `20260804010000` before applying.
- Storage `.remove` may itself fail → best-effort + log, never throw (don't mask the original error).
