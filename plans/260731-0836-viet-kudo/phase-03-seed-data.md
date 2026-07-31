# Phase 03 — Seed profiles + hashtags (Track B)

**Track:** B (DB) · **Depends:** 02

## Context
Autocomplete người nhận + @mention cần nhiều Sunner; hashtag cần catalog. Data thật trong DB (không mock UI).

## Requirements
- **⚠️ `profiles.id` là FK → `auth.users(id)`** (Validation Session 1): KHÔNG insert profiles trần. Seed phải **insert `auth.users` trước** (id, email, `raw_user_meta_data` chứa `full_name`/`avatar_url`) — trigger `handle_new_user` tự sinh row `profiles`, hoặc insert `profiles` ngay sau. <!-- Updated: Validation Session 1 - seed auth.users first -->
- Seed **~10 auth.users + profiles test** (tên VN thật: Nguyễn Văn An, Trần Thị Bình…), có `full_name`, `avatar_url` (placeholder), `email`.
- Seed **hashtag catalog** (~8–12 tag SAA hợp lý: TeamWork, Support, Innovation, Leadership, GoAbove, Ownership…).
- Seed idempotent (chạy lại không nhân đôi) — dùng `on conflict do nothing`.

## Related files
- Create: `supabase/seed.sql` (hoặc migration seed riêng) — profiles + hashtags.

## Success criteria
- Sau seed: autocomplete người nhận trả ≥10 kết quả; dropdown hashtag có catalog.
- Chạy seed lần 2 không lỗi/không trùng.

## Todo
- [ ] Seed ~10 `auth.users` (raw_user_meta_data) → profiles, idempotent
- [ ] Seed hashtag catalog idempotent
- [ ] Verify query search theo tên hoạt động
