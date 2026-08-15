# Báo cáo: Kiểm tra Schema — Sẵn sàng Deploy

Ngày: 2026-08-15 · Branch: `develop` · Target: Supabase Cloud + Vercel
Phạm vi: audit schema DB (`supabase/migrations/`) trước khi deploy lên production. Chưa push gì lên cloud.

## Kết luận: ✅ SCHEMA SẴN SÀNG (còn 1 plan cũ cần cập nhật)

---

## 1. Schema vững — các điểm đạt

- **31 migration, apply sạch lên DB trống** — `db:reset` chạy exit 0; bảng `supabase_migrations.schema_migrations` = **31/31**, đúng thứ tự, **không drift**.
- **12 bảng, tất cả đã bật RLS**: `profiles, kudos, hearts, notifications, secret_box, secret_box_badges, event_config, special_day_config, departments, hashtags, kudo_hashtags, kudo_images`.
- **Mọi function `SECURITY DEFINER` đều set `search_path = public`** → không dính lỗ hổng mutable search_path (privilege-escalation). (Grep ban đầu báo lệch là do đếm nhầm dòng comment "security definer"; đã verify từng function an toàn.)
- **Thao tác tương thích cloud** (apply được qua `supabase db push`):
  - `alter publication supabase_realtime set/add table` cho `kudos (id, created_at)`, `hearts`, `notifications` — realtime live board.
  - Trigger `handle_new_user` trên `auth.users` (tự tạo `profiles`).
  - `insert into storage.buckets` + policy `storage.objects` (bucket ảnh kudo).
  - `create extension if not exists pg_trgm` (search).
- **Tách seed đúng chuẩn** — `config.toml [db.seed]` chỉ load `seed.sql` (dữ liệu tham chiếu: hashtag catalog + config, idempotent, **an toàn cho prod**). Dữ liệu demo (30 user / 71 kudo trong `seed-demo-data.sql`) **tách riêng, KHÔNG lọt lên prod**. Auth user seed qua GoTrue admin API — không bao giờ `INSERT` thẳng vào `auth.users`.

## 2. ⚠️ BẮT BUỘC xử lý trước khi deploy

1. **Plan deploy đã CŨ (stale).** `plans/260804-1120-deploy-fe-be-free-production/phase-02` ghi **"13 migration"** (`20260730…` → `…110000`), nhưng thực tế đã có **31** (tới `20260812000000`). Các *bước* vẫn đúng (`db push` apply hết), nhưng **số lượng + checklist sai** cần cập nhật. Phase-02 đang `DEFERRED` — chưa chạy lần nào nên **không có drift trên cloud**; cả 31 file apply fresh.
2. **Các bước cấu hình cloud thủ công** (chặn deploy, KHÔNG phải lỗi schema — nằm ở plan phase-04):
   - Auth URL config + Google OAuth redirect → trỏ về domain Vercel (config.toml `site_url = localhost:3001` chỉ dùng local).
   - Cloud project phải là **Postgres 17** (khớp `config.toml major_version = 17`).
   - Set env vars trên Vercel (Supabase URL/anon/service_role key).

## 3. ℹ️ Nhỏ (không chặn)

- `pg_trgm` tạo không kèm `SCHEMA extensions` → cài vào `public`; Supabase advisor có thể cảnh báo "extension in public". Chỉ là cosmetic.

## 4. CHƯA làm (cần bạn duyệt — thao tác ra ngoài)

Chưa chạy `supabase link` / `supabase db push` — vì đẩy lên project cloud thật (khó undo, mà project cũng chưa link). Schema local đã sẵn sàng push khi bạn muốn.

## Việc tiếp theo (chờ bạn chọn)
- **(a)** Cập nhật plan phase-02 (sửa 13→31 migration + làm mới checklist).
- **(b)** Chạy deploy thật: `supabase link` → `db push` → seed. Cần bạn `! supabase login` (interactive) + xác nhận project ref (`ngsvtvfhgtarbzvlfyrz`?).

## Câu hỏi mở
- Cloud project ref chính xác là gì (plan ghi `ngsvtvfhgtarbzvlfyrz`, config.toml `project_id = "aidd"`)? Xác nhận trước khi `db push`.
- Prod có cần dữ liệu demo không, hay chỉ reference (`seed.sql`) + auth thật? (Mặc định: chỉ reference + auth.)
