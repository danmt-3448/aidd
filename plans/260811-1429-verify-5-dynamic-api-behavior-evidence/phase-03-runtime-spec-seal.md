# Phase 03 — Runtime spec-verify seal

**Priority:** High · **Owner:** code-reviewer (+ debugger) · **Depends:** 01 · **Blocks:** feeds 04/06

## Goal
Đóng các rule `UNVERIFIED(static)` trong report `spec-verify-260811-1405-6-dynamic-screens.md` bằng **runtime thật** (DB đã up) → nâng verdict lên `[runtime]`.

## Runtime rules cần seal (SQL probe + browser)
- **board/profile:** double-like idempotency (gọi `toggle_heart` 2 lần → không PK 23505, count đúng) · special-day `+2` (heart `is_special_day=true` → `hearts_received` +2 không +1) · weighted highlight ranking · keyset pagination no-dup.
- **kudos:** `create_kudo` atomicity (ép lỗi hashtag/receiver → rollback, không partial row) · receiver-FK friendly error (P0007) · double-submit (mutex — cần browser: click Gửi nhanh 2 lần → 1 kudo).
- **secret-box:** double-open race (`FOR UPDATE` — 2 lần liên tiếp count=1 → 1 badge) · decrement đúng 1 · reject khi count=0 (P0102).
- **profile V2:** heart toggle trên profile feed → count cập nhật theo **server** (đã fix, cần browser confirm refetch).
- **homepage:** countdown days/hours/minutes đúng từ `event_start_at` (+TZ), at-zero → 00:00:00 + hide "Coming soon" · realtime unread badge (bell) tăng khi INSERT notification.

## Steps
1. SQL probe theo mẫu `supabase/tests/kudo-integration*.sql` + `references/runtime-probes.md`; chạy trong transaction rollback hoặc trên seed data (không destructive).
2. Behavior cần hydrate (double-submit, profile heart refetch, realtime) → prod build (`npm run build && npm start`) + Playwright/manual.
3. Cập nhật report spec-verify: đổi verdict runtime-provable từ `UNVERIFIED(static)` → `SATISFIED[runtime]` / `VIOLATED[runtime]` kèm bằng chứng (SQL output / screenshot).

## Success criteria
- [ ] Mọi runtime rule ở trên có verdict `[runtime]` + bằng chứng.
- [ ] Bug mới phát hiện → log vào report + feed phase-04 (viết test regression) / fix.

## Risk
Turbopack dev hydration lỗi → dùng prod build. Probe làm bẩn data → transaction rollback / seed riêng.
