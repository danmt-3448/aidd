# Database Schema — SAA 2025 Kudos (Web)

> **Nguồn:** derive từ `supabase/migrations/` (source of truth). Tất cả bảng/cột ở đây đã có migration applied.
> **Lưu trữ:** Supabase — Postgres (data) + Storage (ảnh) + Auth (Google). Không có backend riêng.
> **Scope:** Web only.

## Decisions Log

| # | Câu hỏi | Quyết định |
|---|---------|-----------|
| 1 | Tim (hearts) cộng cho ai? | **Người nhận** kudos (`receiver_id`) |
| 2 | Kudos ẩn danh hiển thị thế nào? | `kudos_public` view mask `sender_id` → null, `sender_name` → `anonymous_name`. Admin xem được danh tính thật qua base table. |
| 3 | Cơ chế nhận Secret Box? | Seed/admin cấp thủ công. Mở box → RPC `open_secret_box()` ghi badge_key vào `secret_box_badges`. |
| 4 | Lưu `content` kudos? | **HTML** (rich-text: bold/italic/strike/list/link/quote) — render y như lúc nhập |
| 5 | Lưu ảnh? | **Supabase Storage** (bucket), DB chỉ giữ `storage_path` |
| 6 | Config sự kiện (countdown start)? | **DB table `event_config`** (singleton id=1, `event_start_at` timestamptz). Không dùng env var. |
| 7 | Huy hiệu (badges)? | **Static config** `src/features/secret-box/badge-assets.ts`. Không có DB table `badges`. |
| 8 | Awards? | **Static TS config** trong `src/features/awards/`. Không có DB table `awards`. |

## Tables

### profiles — hồ sơ Sunner (1-1 với auth.users)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text | từ Google |
| `full_name` | text | |
| `avatar_url` | text | ảnh Gmail |
| `department_id` | int | legacy column (no FK); kept for compat — use `department_ref` |
| `department_ref` | uuid FK → departments | added `20260804040000`; nullable |
| `title` | text null | danh hiệu |
| `kudos_received_count` | int default 0 | → suy `star_level` |
| `kudos_sent_count` | int default 0 | |
| `hearts_received` | int default 0 | +N khi kudos user **nhận** được thả tim |
| `star_level` | int (0–3) | computed: ≥10→1, ≥20→2, ≥50→3 kudos nhận |
| `is_admin` | bool default false | quyền xem danh tính ẩn danh + bypass pre-launch gate |
| `created_at` | timestamptz | |

### departments — phòng ban (lookup, seed sẵn)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | gen_random_uuid() (fixed RFC 4122 v4 UUIDs for seed rows) |
| `name` | text unique | vd `Marketing`, `Engineering`, `HR` |
| `created_at` | timestamptz | |
> Migration `20260804040000`. Seed: 7 departments (Marketing, CEVC10, DXVC, Engineering, HR, Finance, Design).

### hashtags — thẻ (lookup, load động)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | gen_random_uuid() |
| `name` | text unique | không kèm `#` (thêm khi render) |
| `created_at` | timestamptz | |
> Seed 12 tags (migration `20260731000000`): TeamWork, Support, Innovation, Leadership, Ownership, GoAbove, CustomerFirst, Mentorship, Quality, Agility, Collaboration, WellDone.

### kudos — lời cảm ơn (entity trung tâm)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | client-generated (passed to RPC) |
| `sender_id` | uuid FK → profiles | **luôn lưu** (kể cả ẩn danh; masked via `kudos_public` view) |
| `receiver_id` | uuid FK → profiles | tên cột thực tế trong DB |
| `content_html` | text | sanitized HTML (B/I/S/list/link/quote + @mention) |
| `is_anonymous` | bool default false | |
| `anonymous_name` | text null | nickname khi ẩn danh |
| `danh_hieu` | text null | "Danh hiệu" field (migration `20260804010000`) |
| `created_at` | timestamptz | |
> Constraint: `sender_id <> receiver_id` (DB-level check). Index trên `receiver_id` và `created_at desc`.
> `like_count` không có trong DB — tính tổng từ `hearts` table tại query time.

### kudo_hashtags — n-n (tối đa 5/kudos)
`kudo_id` uuid FK → kudos · `hashtag_id` uuid FK → hashtags · PK(kudo_id, hashtag_id)

### kudo_images — ảnh đính kèm (tối đa 5)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `kudo_id` | uuid FK → kudos | cascade delete |
| `storage_path` | text | path trong bucket `kudo-images` |
| `sort_order` | int default 0 | thứ tự hiển thị |
| `created_at` | timestamptz | |

### kudos_mentions — @mention đồng nghiệp
`kudos_id` FK · `mentioned_user_id` FK · PK(kudos_id, mentioned_user_id)
> **Chưa có migration** — @mention hiện nhúng vào `content_html`. Bảng này sẽ tạo khi cần query "đồng nghiệp được mention".

### hearts — lượt thả tim
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `user_id` | uuid FK → profiles | |
| `kudo_id` | uuid FK → kudos | |
| `liked_at` | timestamptz default now() | |
| `is_special_day` | boolean default false | true khi thả tim trong ngày có multiplier |
| PK | (user_id, kudo_id) | mỗi user 1 tim/kudos |
> Self-heart blocked by INSERT RLS policy. Migration `20260731030000`.

### special_day_config — ngày thả tim x2 (admin config)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `event_date` | date PK | |
| `hearts_multiplier` | int default 1 | multiplier áp cho ngày đó |
> Migration `20260731040000`. Admin writes via service role / direct DB.

### event_config — config sự kiện (singleton)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | smallint PK | always = 1 (check constraint) |
| `event_start_at` | timestamptz | thời điểm mở cửa sự kiện |
| `hearts_special_multiplier` | int default 1 | multiplier toàn cục |
| `updated_at` | timestamptz | |
> Migration `20260731020000`. Proxy reads this to enforce pre-launch gate. Anonymous read enabled via `20260805020000`.

### secret_box — hộp quà (per-user)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `user_id` | uuid PK FK → profiles | chủ box |
| `unopened_box_count` | int default 0 | số box chưa mở |
| `updated_at` | timestamptz | |
> Migration `20260731050000`. All mutations go through `open_secret_box()` DEFINER RPC.

### secret_box_badges — huy hiệu đã nhận
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `badge_key` | text | key maps to static config in `badge-assets.ts` |
| `opened_at` | timestamptz | |
> Badge display config (name, icon, drop_rate) is static in `src/features/secret-box/badge-assets.ts`.
> There is no DB `badges` table or `user_badges` table — both are superseded by this design.

### notifications — hộp thư thông báo
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `type` | text | |
| `title` | text | |
| `body` | text | |
| `link` | text | |
| `is_read` | boolean default false | |
| `created_at` | timestamptz | |
> Migration `20260731060000`. Inserted only by triggers (notify_on_kudo_insert) or DEFINER RPCs.
> Composite index on (user_id, is_read) for unread-count queries.

## Views

### kudos_public — masked feed view
> Migrations `20260731070000` + `20260731100000` (security_invoker removed).
> Projects kudos with `sender_id → null` and `sender_name → anonymous_name` when `is_anonymous = true`.
> `GRANT SELECT TO authenticated`. Base table `kudos` SELECT is restricted to own rows; all feed reads go through this view.

### profile_stats_view
> Migration `20260731080000`. Aggregated kudos/hearts stats per profile for the board and profile pages.

## RPCs

| Function | Args | Purpose |
|----------|------|---------|
| `create_kudo` | 8 args (incl. `p_danh_hieu`) | Atomic insert: kudos + kudo_hashtags + kudo_images |
| `open_secret_box` | — | Migration `20260731110000`; decrements `unopened_box_count`, inserts badge row |
| `get_highlight_kudos` | — | Migration `20260804000000`; top-5 weighted kudos for spotlight |
| `board_leaderboard` | — | Migration `20260804020000`; leaderboard data for board sidebar |

## Config (DB, not env var)

| Table | Column | Ghi chú |
|-------|--------|---------|
| `event_config` | `event_start_at` | Datetime ISO-8601, timezone Asia/Ho_Chi_Minh. Proxy reads this for countdown gate. |

> The `EVENT_START_AT` environment variable is **not used**. Config lives in the `event_config` DB table.

## Business Rules (ảnh hưởng schema/logic)

1. **Hearts:** thả tim → increment `recipient.hearts_received`. Multiplier từ `special_day_config` hoặc `event_config.hearts_special_multiplier`. Không thả tim kudos của chính mình (RLS + app).
2. **Star level:** từ `kudos_received_count` — ≥10→1 sao, ≥20→2 sao, ≥50→3 sao.
3. **Ẩn danh:** `kudos_public` view — `sender_id = null`, `sender_name = anonymous_name`. Base table lưu real `sender_id` (admin-accessible).
4. **Secret box:** mở → `open_secret_box()` RPC ghi badge_key (từ static drop config), set `updated_at`.
5. **Spotlight/Highlight:** `get_highlight_kudos()` RPC — top-5 theo weighted score. Feed count = COUNT(*) trên `kudos`.

## RLS (Supabase) — nguyên tắc

- `profiles`, `kudos_public`, `hearts`, `notifications`, `event_config`: authenticated SELECT.
- `kudos` base table: SELECT restricted to own sender/receiver rows; feed reads go through `kudos_public`.
- `kudos.sender_id` khi `is_anonymous=true`: masked trong `kudos_public` view (cột = null). Đây là cổng privacy duy nhất — **đã implemented**.
- Ghi `kudos`: qua `create_kudo()` RPC (security invoker). Ghi `hearts`: owner INSERT với self-heart check.
- Storage bucket ảnh kudos: INSERT/DELETE bởi owner `{uid}/`, SELECT for authenticated.

## Coverage — màn đã build

| Màn | Status | Entity chính |
|-----|--------|-------------|
| Login | Done + Gate PASS | `profiles` |
| Viết Kudo | Done + Gate PASS | `kudos` + hashtags/images + `danh_hieu` |
| Sun* Kudos - Live board | Done + Gate PASS | `kudos_public`, `hearts`, `secret_box`, stats views |
| Profile bản thân | Done + Gate PASS | `profiles`, `secret_box_badges`, stats |
| Homepage SAA | Done + Gate PASS | `event_config`, static nav |
| Countdown | Done + Gate PASS | `event_config.event_start_at` |
| Thể lệ | Done + Gate PASS | static content |
| Hệ thống giải | Done + Gate PASS | static TS config (no DB table) |
| Notifications | Routes exist; gate BLOCKED | `notifications` |

## Out of scope / not yet migrated

- `kudos_mentions`: @mentions embedded in content_html; table deferred until "mentioned in" queries needed.
- Admin screens (campaign, user management): no spec → deferred.
