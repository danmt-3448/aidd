# Phase 02 — Supabase schema: profiles (Track B)

**Track:** B (DB) · **Depends:** none

## Goal
Migration tạo bảng `profiles` (1-1 với `auth.users`), tự tạo row khi user đăng nhập lần đầu, RLS bật.

## Requirements
- Bảng `profiles` theo `docs/database-schema.md`: `id`(uuid PK, FK auth.users), `email`, `full_name`, `avatar_url`, `department_id`(null), `title`(null), counters default 0, `is_admin` default false, `created_at`.
- Trigger `on_auth_user_created`: insert `profiles` từ `auth.users` (email, full_name/avatar từ `raw_user_meta_data` của Google).
- RLS: authenticated đọc mọi profile; user chỉ update chính mình (`auth.uid() = id`).

## Files
- Create: `supabase/migrations/<ts>_create_profiles.sql`
- (departments/hashtags/... để plan sau — Login chỉ cần profiles)

## Implementation
1. `supabase migration new create_profiles`
2. Viết SQL: table + `enable row level security` + policies + function `handle_new_user()` + trigger trên `auth.users`.
3. `supabase db reset` (hoặc `migration up`) áp local, verify bằng Studio.

## Todo
- [ ] Migration file
- [ ] Trigger tạo profile
- [ ] RLS policies
- [ ] Apply local + verify Studio

## Success
- Đăng nhập Google lần đầu → 1 row `profiles` tự sinh · RLS chặn update chéo.

## Security
- RLS bắt buộc ON · không expose service_role ra client · trigger chạy `security definer` đúng cách.
