# Phase 01 — DB up + demo-data seed

**Priority:** Blocking · **Owner:** be-developer · **Depends:** none · **Blocks:** 03, 05

## Goal
Dựng Supabase local qua colima, reset schema, và seed **demo data đủ density** cho 5 màn để test UI thật.

## Steps
1. `colima start` (cấp đủ CPU/RAM, vd `colima start --cpu 4 --memory 8`); verify `docker ps` OK.
2. `npx supabase start` → verify 54321 (API) + 54322 (db) healthy (`npx supabase status`).
3. `npm run db:reset` → chạy tất cả migrations + `seed.sql` (departments/hashtags) + `seed:auth` (users). Verify `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c '\dt'`.
4. **Viết demo-data seed** `supabase/seed-demo-data.sql` (idempotent, chạy sau db:reset) — content lấy density từ Figma, KHÔNG bịa cấu trúc:
   - `event_config.event_start_at` = ngày TƯƠNG LAI (countdown chạy) + 1 biến để test pre-launch/at-zero.
   - `kudos`: ~40–50 rows (signed + ≥5 anonymous), phủ nhiều sender/receiver/department/hashtag → board feed dày + spotlight word-cloud ~45–50 tên.
   - `hearts`: nhiều rows, gồm `is_special_day=true` (cần `special_day_config.event_date = current_date`) → test weighted +2 + highlight ranking.
   - `secret_box`: mỗi vài user có `unopened_box_count > 0` (test open) + 1 user = 0 (test empty/disabled).
   - đủ để profile self (received/sent, tier≥10) + profile other.
5. Thêm script `npm run seed:demo` (chạy seed-demo-data.sql) và cập nhật `db:reset` để gọi luôn seed:demo (hoặc doc rõ 2 bước).
6. `npm run dev` (port 3001) → mở thủ công 5 route, xác nhận render data thật (không empty, không console error nặng).

## File ownership
- `supabase/seed-demo-data.sql` (new), `package.json` (add `seed:demo`), maybe `supabase/config.toml` (seed glob). KHÔNG đụng migrations schema (chỉ data).

## Success criteria
- [ ] colima + supabase up; `db:reset` xanh.
- [ ] seed-demo-data chạy idempotent; board/profile/kudos/secret-box/homepage đều có data thật đúng density Figma.
- [ ] dev server 3001 render 5 màn với data seed, 0 console error đỏ.

## ⚠️ DEPLOY-TIME migration (BẮT BUỘC — user yêu cầu 2026-08-11)
Khi deploy production KHÔNG chỉ chạy schema — phải migrate + seed các thứ cần:
- Chạy toàn bộ `supabase/migrations/**` (schema + RPC + views + grants).
- Seed **danh mục bắt buộc**: `departments`, `hashtags`, `event_config` (event_start_at THẬT), `special_day_config` (ngày đặc biệt THẬT).
- **KHÔNG** seed demo users/kudos/hearts giả lên prod (chỉ là dev fixtures). Prod: user thật qua Google OAuth; profile tạo qua trigger/onboarding.
- Verify sau deploy: RPC `create_kudo`/`toggle_heart`/`open_secret_box` execute-able · RLS đúng · uuid = `gen_random_uuid()` (v4, hợp lệ cả `.uuid()`/`.guid()`) · grant `event_config` UPDATE cho admin flow.
- Chi tiết + root-cause bugs: `reports/data-migration-and-ui-bugs-260811.md`.

## uuid hợp lệ (BÀI HỌC — tránh lặp)
Dev fixtures TRÁNH uuid version-0 (`11111111-0000-0000-…`, `dddddddd-0000-0000-…`) — **Zod v4 `.uuid()` reject** (gây bug like). Dùng uuid **v4-format** (`xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx`) hoặc validation `.guid()`.

## Risk
colima cold start lâu/tốn RAM. Seed FK order (profiles→kudos→hearts→kudo_hashtags). Special-day cần `current_date` khớp `special_day_config`.
