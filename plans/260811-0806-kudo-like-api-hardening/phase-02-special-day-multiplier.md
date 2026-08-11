# Phase 02 — Special-day weighted `hearts_received` (REAL FIX, not verify)

**Track:** B·Like · **Scope:** core · **Priority:** P1 · **blockedBy:** 01

## The bug (spec-confirmed)
Spec `C.4.1 Hearts` (authoritative): mỗi like → tài khoản **+1 tim**; like **ngày đặc biệt (admin config) → +2 tim**; unlike **thu hồi đúng 1 hoặc 2**. Sidebar `D.1.4` = "Số tim bạn **nhận** được: 25". databaseNote: *"phân biệt tim thường vs đặc biệt để thu hồi đúng số tim đã cộng cho **người nhận** kudo."*

**Reality:** `profile_stats.hearts_received` (`20260731080000`) = `count(*)` — **đếm phẳng, bỏ qua special-day**. Special-day ×2 chỉ tồn tại trong `get_highlight_kudos` (carousel), **KHÔNG** vào "Số tim nhận được". → Sidebar/profile hiển thị SAI số tim khi có ngày đặc biệt. Đây là "special-day ko ổn".

`profiles.hearts_received` (denormalized col) = dead (default 0, không trigger) — view đã bỏ qua nó, giữ nguyên.

## Ai được cộng tim = SENDER (chốt 2026-08-11, user xác nhận)
**Tim cộng cho người GỬI kudo** (`k.sender_id = p.id`). Spec C.4.1 ghi rõ *"tài khoản gửi lời cảm ơn... được cộng 1 tim / +2 ngày đặc biệt"*. Bằng chứng logic: spec cấm **sender** tự thả tim kudo mình → chỉ có nghĩa chống tự-farm NẾU tim thuộc sender.
> ⚠️ **Label lệch:** sidebar D.1.4 ghi "Số tim bạn NHẬN được" nhưng data giờ = tim mà kudo bạn GỬI nhận được. Đây là lỗi soạn label spec (dòng unlike cũng ghi "nhận"). Data đúng theo business rule; nếu cần, i18n label → "Số tim đạt được" (product quyết, không đổi code).
> (Trước đó default nhầm receiver — đã sửa runtime-verified: sender +3/receiver 0.)

## Fix
Sửa `hearts_received` thành **weighted sum** (thường 1, special M):
```sql
-- trong profile_stats view (thay count(*)):
(select coalesce(sum(case when h.is_special_day then :M else 1 end), 0)
   from public.hearts h join public.kudos k on k.id = h.kudo_id
   where k.receiver_id = p.id)                                    as hearts_received
```
- `M` = special multiplier = **2** (spec "+2"). Nguồn: `special_day_config.hearts_multiplier` (per-date) — nhưng view không biết heart nào thuộc ngày nào; `is_special_day` boolean đã stamp lúc insert (phase-01/hiện tại) → dùng **M cố định của sự kiện** (config 1 giá trị, =2). Chốt M từ `event_config.hearts_special_multiplier` (global, đúng ngữ nghĩa "1 hệ số cho cả sự kiện") → **đây mới là chỗ dùng của `event_config.hearts_special_multiplier`** (trước tưởng dead). Đọc M trong view qua subquery `event_config`.
- **Unlike auto-correct:** view tính query-time từ hearts rows → xoá heart row là trừ đúng 1 hoặc 2 (khớp dbNote "thu hồi đúng"). ✓ Không cần trigger.

## Files
- **Modify:** `supabase/migrations/` — new migration thay `profile_stats` view: `hearts_received` = weighted sum, M từ `event_config.hearts_special_multiplier`.
- **Verify:** sidebar D.1.4 "Số tim" + profile "hearts received" đọc từ `profile_stats.hearts_received` (giờ đã weighted) — grep consumer, đảm bảo không có chỗ nào tự `count` hearts phẳng.
- **Decide multiplier source:** `event_config.hearts_special_multiplier` (global, =2) là nguồn duy nhất cho weighting tài khoản. `special_day_config` = per-date on/off flag (quyết `is_special_day` lúc stamp). Ghi rõ vai trò 2 bảng (không còn "trùng/dead").

## Todo
- [ ] Migration: `profile_stats.hearts_received` → weighted sum (special = M)
- [ ] M = `event_config.hearts_special_multiplier` (set =2 cho sự kiện); document vai trò 2 config table
- [ ] Grep mọi consumer "số tim nhận" → đều dùng profile_stats (không count phẳng)
- [ ] Verify unlike trừ đúng (special heart xoá → -2)

## Success Criteria
- Like thường → +1; like ngày đặc biệt → +2 vào "Số tim nhận được".
- Unlike special heart → -2 (đúng), unlike thường → -1.
- Sidebar D.1.4 + profile khớp weighted total.
- 2 config table có vai trò rõ ràng, không trùng.

## Risks
- `event_config.hearts_special_multiplier` hiện default 1 → nếu không set 2, weighting vô hiệu. Set =2 trong migration/seed cho sự kiện.
- `is_special_day` stamp phải đúng lúc insert (phase-01 RPC lo) — heart cũ stamp sai thì weighted sai. Với event mới thì ok.
