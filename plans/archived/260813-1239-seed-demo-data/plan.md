# Plan — Realistic, operable seed demo data (local skew + real images + remote dev seed)

> Date: 2026-08-13 · Branch: develop · Status: DRAFT for review
> Goal: dev deploy **không trống trơn** — board/profile/recipient hiển thị data dày, có chiều sâu, và **user thật vẫn thao tác bình thường** (login, thả tim, sửa, gửi kudo). Data KHÔNG phải rác.

## Confirmed decisions (2026-08-13)
- Giữ **30 user**, **thêm skew** (không tăng user) — vài người nhận nhiều = "star" trong word-cloud; hearts rải khắp 30 user cho leaderboard đa dạng.
- **Auto-upload ảnh thật** vào `db:reset` (galleries không rỗng) — local + remote.
- Tạo script **`seed:dev`** seed vào **cloud Supabase dev** — idempotent, **non-destructive** (không xoá data thật), an toàn chạy lại.
- Giữ **tên VN thật** (đã có), avatar dicebear.

## Verified current state (audit + review 2026-08-13)
- Chain: `db:reset` → migrations → `seed.sql`(12 hashtag) → `seed:auth`(30 user GoTrue, login `TestPass123!`) → `seed:demo`. `seed-demo-data.sql` **đã có sẵn**: 60 kudo batch + cards 901–913 (minimal/long/**4 image-bearing 910–913**), hashtags, hearts (~137), `special_day_config`. TX wrap + delete-then-reinsert (idempotent local).
- `seed-kudo-images.mjs` **đã tồn tại** (upsert:true, idempotent) nhưng **KHÔNG trong chain** + **chưa có npm script `seed:images`** → 4 `kudo_images` row **không có file storage** → galleries rỗng.
- **Leaderboard KHÔNG do hearts** (review): `get_ranking_leaderboard` = `count(kudos) by receiver`; `get_gift_leaderboard` = `secret_box_badges` đã mở. Hearts chỉ vào sidebar `hearts_received` (SENDER-scoped). → skew phải ở **kudo receiver**, không phải hearts.
- Phân bố kudo hiện tại `(g+7)%30` = **đều** (mỗi receiver ~2) → word-cloud + ranking leaderboard **không có star** (đây mới là "trông trống", không phải hearts).
- Operable OK: user GoTrue thật, kudos owned đúng, RLS `auth.uid()=sender_id`, hearts không self, `toggle_heart` security-definer chạy được cho user thật.

## Phases

### Phase 01 — Skew phân bố — `supabase/seed-demo-data.sql`
- **Kudo RECEIVER skew (drives word-cloud + ranking leaderboard):** thay công thức receiver `(g+7)%30` (đang đều) bằng phân bố lệch — ~3 "star" nhận 15–20 kudos, ~7 mid nhận 5–10, đuôi dài 1–3. **Đây là thứ làm board hết trống**, không phải hearts.
- **Hearts (chỉ drives sidebar `hearts_received`, SENDER-scoped):** rải hearts đa dạng để sidebar stat có biến thiên — phụ, không đổi ranking leaderboard.
- **Gift leaderboard (`get_gift_leaderboard` = `secret_box_badges` đã mở):** hiện **rỗng** vì seed chỉ set `unopened_box_count=5`, không tạo badge. Nếu muốn có data → seed vài `secret_box_badges` row cho ~10 user (hoặc empty-state — quyết ở Open Q). `badge_key` hợp lệ: `stay-gold`, `flow-to-horizon`, `touch-of-light`, `beyond-the-boundary`, `revival`, `root-further`.
- **event_config guard (edge):** seed đang `UPDATE event_config SET event_start_at=now()-2d` — nếu row absent → no-op → board kẹt countdown gate. Đổi sang `INSERT ... ON CONFLICT (…) DO UPDATE` để chắc event live.
- Giữ nguyên: FK, no self-heart (CHECK `sender<>receiver` vẫn thỏa với công thức mới — verify), anon ratio, danh_hieu tiers, created_at giảm dần, direct INSERT (không qua RPC), TX + delete-reinsert.
- Acceptance: word-cloud ≥ ~25 tên **có star rõ (chữ to/nhỏ)**; **ranking leaderboard top-10 phản ánh receiver skew** (không phải hearts); feed 20+ card; profile mỗi user có nhận/gửi; board KHÔNG kẹt countdown.

### Phase 02 — Ảnh thật vào chain — `package.json` (+ mở rộng `seed-demo-data.sql`/`seed-kudo-images.mjs`)
- **`seed-kudo-images.mjs` ĐÃ tồn tại + upsert:true (idempotent)** — việc còn lại chỉ là **thêm npm `seed:images`** và **gọi trong `db:reset`** sau `seed:demo`. KHÔNG viết lại script.
- Đã có 4 image kudo (910–913); mở rộng lên **~8–10 kudo có ảnh** (1–5 ảnh đa dạng) — thêm rows trong `seed-demo-data.sql` + upload tương ứng trong `seed-kudo-images.mjs`.
- Ảnh nguồn: bundle vài PNG placeholder nhẹ (solid-color) trong `supabase/seed-assets/` (commit) — không cần ảnh bản quyền.
- Acceptance: `db:reset` 1 lệnh ra ảnh; board/profile card có gallery **ảnh load 200** (display-path đã fix phiên trước — `<img>` + signed URL); đủ mật độ.

### Phase 03 — Remote dev seed — `supabase/seed-dev.mjs` + `npm run seed:dev`
- Script seed **cloud Supabase dev** đọc creds từ env riêng (`.env.dev`: `SUPABASE_URL`, `SERVICE_ROLE_KEY`) — KHÔNG hardcode, KHÔNG commit. **Thêm `.env.dev` vào `.gitignore`** (hiện chỉ có `.env.local`).
- **Non-destructive + idempotent — KHÔNG dùng `seed-demo-data.sql` (nó DELETE ở đầu = phá data thật).** Viết path insert-if-absent riêng.
  - Auth users: admin API skip-existing (như `seed-auth-users.mjs`). ⚠️ `seed-auth-users.mjs` **hardcode `psql …127.0.0.1:54322`** cho profile/department backfill → `seed-dev.mjs` **phải dùng remote DB URL/REST**, KHÔNG reuse verbatim.
  - Kudos/hearts/hashtags: `ON CONFLICT DO NOTHING` (id cố định) — insert-if-absent.
  - ⚠️ **`kudo_images` KHÔNG idempotent** (PK = `gen_random_uuid()`, không unique trên `(kudo_id, storage_path)`) → re-run **nhân đôi ảnh**. Fix: migration additive `ALTER TABLE kudo_images ADD CONSTRAINT kudo_images_kudo_storage_unique UNIQUE (kudo_id, storage_path)` → dùng `ON CONFLICT DO NOTHING`; hoặc guard `WHERE NOT EXISTS` trong `seed-dev.mjs`.
  - Ảnh: upload `upsert:true` (skip-if-exists ở storage). service_role bypass storage-RLS — **hợp lệ cho seed tooling** (ghi rõ để reviewer không nhầm là lỗ hổng).
- **Guard**: refuse nếu thiếu `SUPABASE_URL` HOẶC `SERVICE_ROLE_KEY`, hoặc URL trỏ `localhost/127.0.0.1` (chống nhầm); in target host để confirm trước khi ghi.
- Acceptance: chạy `seed:dev` 2 lần → lần 2 skip hết, **0 duplicate (kể cả ảnh)**, 0 lỗi; dev deploy data dày; data user thật (nếu có) KHÔNG bị đụng.

### Phase 04 — Verify (local + remote dry-check)
- `npm run db:reset` local → screenshot board (word-cloud skew + leaderboard đa dạng + gallery ảnh) + profile. Không console error.
- `seed:dev` chạy thật vào dev (hoặc dry-run nếu chưa có creds) → xác nhận idempotent + non-destructive.
- Ghi evidence vào `plans/260813-1239-seed-demo-data/evidence/`.

## Constraints
- **Operable, không rác**: mọi kudo/heart owned bởi auth user thật; RLS/FK giữ nguyên; user thật login + thao tác bình thường trên data seed.
- **Idempotent + non-destructive**, nhất là remote (không xoá).
- Không commit secret (`.env.dev` gitignore).
- Không đụng file i18n / `messages/` (đang refactor song song).

## Open questions
- File env nào giữ creds remote dev (`.env.dev`? Vercel/Supabase project ref)? Ai cấp SERVICE_ROLE_KEY dev?
- Placeholder ảnh: mình tự bundle vài PNG solid-color, hay bạn có bộ ảnh demo muốn dùng?
- Remote dev DB có phải shared nhiều dev không (ảnh hưởng chiến lược idempotent)?
- **Gift leaderboard** ("10 SUNNER NHẬN QUÀ") hiện rỗng (cần `secret_box_badges`) — seed vài badge cho có data, hay để empty-state?

## Execution (post-approval)
Track B thuần (data/script, non-visual) → không cần UI gate. Sau seed: verify bằng screenshot thật. Chạy qua `be-developer` + `tester`.
