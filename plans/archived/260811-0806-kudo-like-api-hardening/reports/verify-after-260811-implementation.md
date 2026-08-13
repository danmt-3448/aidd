# Verify-after — Kudo + Like API hardening (runtime proven)

**Date:** 2026-08-11 · Branch develop · local Supabase (colima) · migrations applied via `db:reset`.
**Method:** each fix proven with SQL in a rolled-back transaction (no data pollution) + tsc + unit tests.

## Rules: before → after (runtime evidence)

| Rule | Before (VIOLATED) | After (SATISFIED[runtime]) | Proof |
|------|-------------------|----------------------------|-------|
| **R6 toggle race** | SELECT→INSERT/DELETE, double-click → PK 23505 unmapped | `toggle_heart` RPC atomic; like→(t,1), unlike→(f,0); duplicate insert ON CONFLICT → no error | probe T1/T2/T3 all pass |
| **R2 self-like** | RLS-only, RPC would bypass | RPC guard raises **P0008** | T5: `[P0008] cannot heart own kudo` |
| **R (kudo not found)** | — | RPC raises **P0007** | T6: `[P0007] kudo not found` |
| **R4 special-day +2** | `hearts_received = count(*)` → special like = +1 | weighted: normal +1, special +2 | probe: 1 normal + 1 special → **hearts_received = 3** |
| **R5 unlike revoke** | always −1 (couldn't revoke 2) | unlike special → **−2** (query-time recompute) | probe: 3 → delete special → **1** |
| **R2 create_kudo receiver** | valid-UUID-nonexistent → raw FK 23503 | RPC raises **P0007** → friendly "Người nhận không tồn tại" | probe T1: `[P0007] Receiver does not exist`; T2 valid → created |

## Code changes (edit in place, no new files/copies)
- `supabase/migrations/20260811010000_toggle_heart_rpc.sql` (new) — atomic toggle RPC.
- `supabase/migrations/20260811020000_create_kudo_receiver_check.sql` (new) — create_kudo + P0007 (body copied verbatim, only receiver check added).
- `supabase/migrations/20260811030000_weighted_hearts_received.sql` (new) — profile_stats weighted + `event_config.hearts_special_multiplier=2`.
- `src/features/board/heart-actions.ts` — toggleHeart → 1 RPC call; friendlyHeartError maps P0001/P0007/P0008 (+ RLS backstop). Removed racy SELECT/INSERT/DELETE + fetchHeartCount.
- `src/features/kudos/kudo-actions.ts` — map P0007 → field `receiverId`; orphan-image cleanup (`kudo-images` bucket) on RPC failure.
- `src/features/board/heart-actions.test.ts` — rewritten to mock the RPC (exercises final code).

## Gates
- **tsc --noEmit:** clean.
- **Unit (Vitest) board + kudos:** 159/159 pass.
- **No UI change** → ui-gate not required (3 fixes are backend seams FE already consumes; return shapes unchanged).
- **E2E:** not written (per instruction — normal tests first).

## Not done (by design)
- **P03** (liked_by_me/count server-side) DEFERRED — perf/privacy, NOT a correctness bug (current client liked_by_me is correct; only leaks liker user_ids + O(N)). Touches board-query shape → needs its own verify; out of "ko ổn" scope.
- **P05** (kudo detail) OPTIONAL — awaits user keep/cut.

## Open (flag cho user)
- Spec C.4.1 mâu thuẫn nội bộ **sender vs receiver** cho hearts. Đã theo **receiver** (label D.1.4 "Số tim bạn NHẬN được" + dbNote + code cũ). Nếu ý là sender → đảo `k.receiver_id` → `k.sender_id` trong `profile_stats.hearts_received`.
- `event_config.hearts_special_multiplier=2` = giá trị special-day của sự kiện (admin chỉnh được). Carousel ranking vẫn dùng `special_day_config.hearts_multiplier` per-date (2 nguồn cho 2 mục đích khác nhau — ghi rõ ở phase-02).
