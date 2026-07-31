# Database Schema — SAA 2025 Kudos (Web)

> **Nguồn:** derive từ MoMorph screen specs (file `9ypp4enmFmdK3YAFJLIu6C`). Cột `databaseTable/Column` trong MoMorph để trống → schema này suy ra từ mô tả chức năng + quyết định của product owner (xem Decisions Log).
> **Lưu trữ:** Supabase — Postgres (data) + Storage (ảnh) + Auth (Google). Không có backend riêng.
> **Scope:** Web only.

## Decisions Log

| # | Câu hỏi | Quyết định |
|---|---------|-----------|
| 1 | Tim (hearts) cộng cho ai? | **Người nhận** kudos (`recipient`) |
| 2 | Kudos ẩn danh hiển thị thế nào? | Ẩn `sender_id` khỏi UI, chỉ show `anonymous_name` (nickname). **Admin xem được** danh tính thật (RLS) |
| 3 | Cơ chế nhận Secret Box? | Không có spec admin → **seed/admin cấp thủ công**. Mở box → random 1 huy hiệu theo tỉ lệ drop |
| 4 | Lưu `content` kudos? | **HTML** (rich-text: bold/italic/strike/list/link/quote) — render y như lúc nhập |
| 5 | Lưu ảnh? | **Supabase Storage** (bucket), DB chỉ giữ `storage_path` |

## Tables

### profiles — hồ sơ Sunner (1-1 với auth.users)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text | từ Google |
| `full_name` | text | |
| `avatar_url` | text | ảnh Gmail |
| `department_id` | int FK → departments | |
| `title` | text null | danh hiệu |
| `kudos_received_count` | int default 0 | → suy `star_level` |
| `kudos_sent_count` | int default 0 | |
| `hearts_received` | int default 0 | +1 (hoặc +2 ngày đặc biệt) khi kudos user **nhận** được thả tim |
| `star_level` | int (0–3) | computed: ≥10→1, ≥20→2, ≥50→3 kudos nhận |
| `is_admin` | bool default false | quyền xem danh tính ẩn danh |
| `created_at` | timestamptz | |

### departments — phòng ban (lookup, seed sẵn)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | int PK | |
| `code` | text unique | vd `CEVC2`, `OPDC-HRF` |
> Seed ~50 phòng: CTO, SPD, FCOV, CEVC1–4, STVC-R&D, STVC-R&D-DTR/DPS/AIR/SDX, CEVC2-CySS/System, FCOV-LRM/F&A/GA/ISO, OPDC-HRF/-HRD (L&D, TI, TA, HRBP, C&B, OD, C&C), CEVC1-DSV (UI/UX 1/2, AIE), GEU (HUST, DUT, UET, UIT, TM), PAO/-PEC/-PAO, IAV, CPV/-CGP, BDV, CEVEC/-SAPD/-GSD... *(danh sách đầy đủ trong spec "Dropdown Phòng ban")*

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
| `sender_id` | uuid FK → profiles | **luôn lưu** (kể cả ẩn danh; admin xem được) |
| `receiver_id` | uuid FK → profiles | tên cột thực tế trong DB (spec gọi là `recipient_id`) |
| `content_html` | text | sanitized HTML (B/I/S/list/link/quote + @mention) |
| `is_anonymous` | bool default false | |
| `anonymous_name` | text null | nickname khi ẩn danh |
| `created_at` | timestamptz | |
> Constraint: `sender_id <> receiver_id` (DB-level check). Index trên `receiver_id` và `created_at desc`.
> **Lưu ý bảo mật:** RLS SELECT policy hiện tại (`kudos_select_authenticated`) expose toàn bộ `sender_id` kể cả khi `is_anonymous=true`. Cần mask `sender_id` (column-level policy hoặc view) **trước khi** bất kỳ màn READ nào ship.
> `like_count` **chưa có trong migration này** — denormalized counter sẽ thêm khi implement màn Live Board.

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

### kudos_likes — lượt thả tim
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `kudos_id` | uuid FK | |
| `liker_id` | uuid FK → profiles | |
| `hearts_value` | smallint | 1 thường, 2 ngày đặc biệt (để thu hồi đúng khi hủy) |
| `created_at` | timestamptz | |
> **UNIQUE(kudos_id, liker_id)** — mỗi user 1 tim/kudos. Không thả tim kudos mình gửi (chặn ở app + policy).

### secret_boxes — hộp quà
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | chủ box |
| `is_opened` | bool default false | |
| `opened_at` | timestamptz null | |
| `badge_id` | int FK → badges null | huy hiệu nhận khi mở (random) |
> Nguồn cấp box: seed/admin (chưa có spec). Mở → random 1 badge theo drop rate.

### badges — huy hiệu (lookup, seed sẵn)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | int PK | |
| `name` | text unique | |
| `icon_url` | text | |
| `drop_rate` | numeric | xác suất khi mở box |
> Seed 6 badge: Stay Gold (0.30), Flow to Horizon (0.25), Touch of Light (0.20), Beyond the Boundary (0.10), Revival (0.10), Root Further (0.05).

### user_badges — bộ sưu tập icon của user
`user_id` FK · `badge_id` FK · `earned_at` timestamptz · PK(user_id, badge_id)
> Profile hiển thị icon đã mở; chưa có → icon xám.

### special_days — ngày thả tim x2 (admin config)
`id` PK · `date` date unique · `heart_multiplier` smallint default 2

### awards — hạng mục giải thưởng (optional, seed / read-only)
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `id` | int PK | |
| `slug` | text unique | dùng làm hash anchor (Homepage → Awards Information) |
| `title` | text | vd 'Top Talent', 'MVP' |
| `description` | text | |
| `quantity_label` | text | vd '10 Đơn vị', '02 Tập thể' |
| `prize_value` | text | vd '7.000.000 VNĐ cho mỗi giải' |
| `image_path` | text | |
| `sort_order` | int | |
> 6 hạng mục cố định: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 - Creator, MVP. **Read-only, không có admin quản lý** → có thể để **static content** trong code thay vì bảng DB (YAGNI). Chỉ tạo bảng nếu muốn data-driven.

## Config (KHÔNG lưu DB — biến môi trường)

| Biến | Ghi chú |
|------|---------|
| `EVENT_START_AT` | Datetime ISO-8601, timezone Asia/Ho_Chi_Minh. Dùng cho Countdown (Homepage + Prelaunch page). |
> **Prelaunch gate:** khi countdown chưa về 0 → **khóa điều hướng** sang trang khác (middleware/guard); về 0 → mở khóa. Không cần DB.

## Business Rules (ảnh hưởng schema/logic)

1. **Hearts:** thả tim 1 kudos → `recipient.hearts_received += hearts_value` + `kudos.like_count += 1`. Hủy tim → trừ đúng `hearts_value` đã lưu. Ngày trong `special_days` → `hearts_value = multiplier` (2). Không thả tim kudos của chính mình.
2. **Star level (số hoa thị):** từ `kudos_received_count` — 10→1 sao, 20→2 sao, 50→3 sao.
3. **Ẩn danh:** UI dùng `anonymous_name`; `sender_id` chỉ lộ cho `is_admin`.
4. **Secret box:** mở → chọn ngẫu nhiên 1 badge theo `drop_rate`, ghi `user_badges`, set `is_opened`.
5. **Spotlight/Highlight:** top kudos theo `like_count`; tổng "N KUDOS" = count toàn bảng `kudos`.

## RLS (Supabase) — nguyên tắc

- `profiles`, `kudos`, `kudos_likes`... : authenticated read.
- `kudos.sender_id` khi `is_anonymous=true`: che với user thường, lộ với admin (view riêng hoặc column-level policy).
- Ghi `kudos` / `kudos_likes`: chỉ chính chủ (`auth.uid()`), kèm ràng buộc không tự thả tim.
- Storage bucket ảnh kudos: đọc theo policy, ghi bởi owner.

## Coverage — 18 màn web spec-done đã quét

| Màn | Entity/kết luận |
|-----|-----------------|
| Login | Supabase Auth + `profiles` |
| Viết Kudo | `kudos` + hashtags/images/mentions |
| Sun* Kudos - Live board | `kudos` (read), `kudos_likes`, stats, `secret_boxes`, `badges` |
| Profile bản thân | `profiles`, `user_badges`, stats *(spec phần lớn draft)* |
| Dropdown Phòng ban | `departments` |
| Dropdown list hashtag / Dropdown Hashtag filter | `hashtags` |
| Open secret box- chưa mở | `secret_boxes`, `badges` (drop rates) |
| Hệ thống giải | `awards` (optional/static) |
| Homepage SAA | UI/static + nav; xác nhận `EVENT_START_AT` là env var; role admin |
| Thể lệ UPDATE | UI/static (rules panel) — không entity mới |
| Countdown - Prelaunch | env var `EVENT_START_AT` + prelaunch gate — không entity mới |
| Addlink Box | UI thuần (dialog chèn link cho rich-text) — link nhúng vào `kudos.content` |
| Dropdown-profile / Dropdown-ngôn ngữ / FAB (x2) | UI thuần — tái dùng entity đã có |

→ **Đã phủ hết. Không còn entity giao dịch nào bị bỏ sót.**

## Out of scope / hinted (chưa có spec web)

- **notifications**: header có chuông + badge "chưa đọc" (Homepage A1.6) → gợi ý bảng `notifications`, nhưng **không có màn web spec** → để sau.
- **Admin** (campaign, review content, user, special_days config): design in_progress, spec none → bỏ qua theo quyết định.

## Open Assumptions (cần xác nhận khi build)

- Cơ chế **cấp** secret box chưa có spec → tạm seed thủ công.
- Hashtag list đầy đủ chưa rõ → seed từ các tag xuất hiện trong spec, bổ sung sau.
- `awards`: để static content hay tạo bảng seed — chọn lúc build (mặc định static, YAGNI).
- `hearts_received` / `kudos_*_count`: giữ counter denormalized (trigger) hay tính realtime (view) — quyết định lúc implement theo tải.
