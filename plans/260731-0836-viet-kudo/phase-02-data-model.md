# Phase 02 — Data model + Storage (Track B)

**Track:** B (DB) · **Depends:** none

## Context
- Reuse bảng `profiles` (từ Login) làm nguồn sender/receiver.
- MoMorph spec: cột databaseTable/Column để trống → tự thiết kế theo clarifications.

## Requirements
Tạo migration Supabase (`supabase/migrations/`) + Storage bucket.

### Tables
- `hashtags`: `id uuid pk default gen_random_uuid()`, `name text unique not null`, `created_at timestamptz default now()`.
- `kudos`: `id uuid pk`, `sender_id uuid not null references profiles(id)`, `receiver_id uuid not null references profiles(id)`, `content_html text not null`, `is_anonymous boolean not null default false`, `anonymous_name text`, `created_at timestamptz default now()`. CHECK `sender_id <> receiver_id`.
- `kudo_hashtags`: `kudo_id uuid references kudos(id) on delete cascade`, `hashtag_id uuid references hashtags(id)`, PK(`kudo_id`,`hashtag_id`).
- `kudo_images`: `id uuid pk`, `kudo_id uuid references kudos(id) on delete cascade`, `storage_path text not null`, `sort_order int not null default 0`, `created_at timestamptz default now()`.

### Storage
- Bucket `kudo-images` (private). Policy: authenticated INSERT vào folder `{auth.uid()}/...`; SELECT cho authenticated.

### RPC `create_kudo()` <!-- Updated: Validation Session 1 - atomic insert -->
- Postgres function (plpgsql, `security invoker`) nhận payload (`kudo_id uuid`, `receiver_id`, `content_html`, `is_anonymous`, `anonymous_name`, `hashtag_ids uuid[]`, `image_paths text[]`).
- Insert `kudos` (sender = `auth.uid()`, id = tham số `kudo_id` do client sinh) → `kudo_hashtags` → `kudo_images` **trong 1 transaction** (function = atomic). Trả `kudo_id`.
- Validate trong function: hashtag 1–5 tồn tại, receiver ≠ sender.

### RLS (bật hết)
- `kudos` INSERT: `auth.uid() = sender_id`. SELECT: authenticated (board đọc sau).
- `kudo_hashtags`/`kudo_images` INSERT: qua kudo thuộc sender. SELECT: authenticated.
- `hashtags` SELECT: authenticated. `profiles` SELECT: authenticated (đã có/ bổ sung nếu thiếu).

## Related files
- Create: `supabase/migrations/{ts}_create_kudos.sql`
- Modify (nếu cần): policy `profiles` SELECT.

## Success criteria
- `supabase db reset`/migration chạy sạch; RLS bật; bucket tồn tại; FK + CHECK đúng.

## Todo
- [ ] Migration 4 bảng + index (`kudos.receiver_id`, `kudos.created_at`)
- [ ] Storage bucket + policies
- [ ] RLS policies từng bảng
- [ ] RPC `create_kudo()` atomic (insert 3 bảng)
- [ ] Verify bằng `supabase` CLI local
