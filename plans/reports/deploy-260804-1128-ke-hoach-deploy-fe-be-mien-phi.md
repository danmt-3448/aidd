# Báo cáo — Kế hoạch Deploy AIDD (FE + BE), miễn phí, link nội bộ ổn định

**Ngày:** 2026-08-04 · **Lăng kính:** CTO · **Trạng thái:** Thiết kế đã chốt
**Plan chi tiết:** `plans/260804-1120-deploy-fe-be-free-production/`

## 1. Đề bài

Đưa AIDD (SAA 2025 nội bộ) từ chạy local lên production **miễn phí**, **link nội bộ ổn định**.
Cả 2 phần: FE (Next.js 16) + BE (Supabase). "Migrate data dễ" = chỉ schema + reference data, seed
lại bằng script sẵn có (KHÔNG copy toàn bộ row dev tạo ra lúc test).

## 2. Quyết định đã chốt

| Hạng mục | Chốt |
|---|---|
| Host FE | **Vercel** (Hobby, free) — native cho Next.js App Router + Server Actions + middleware |
| Host BE | **Supabase Cloud** (free tier) — app vốn build trên Supabase, không có lựa chọn khác hợp lý |
| Migrate data | Schema qua `supabase db push` (13 migrations) + reseed `seed.sql` & `seed-auth-users.mjs`. KHÔNG copy row dev |
| Auth | Google OAuth phải chạy thật ở prod. Tắt dev-login (`NEXT_PUBLIC_ENABLE_DEV_LOGIN`) ở prod |
| Mục đích | Free, link nội bộ, ổn định |

## 3. Kiến trúc

```
GitHub repo ──git push──▶ Vercel (Next.js SSR + Server Actions + middleware)
                             │  env: NEXT_PUBLIC_SUPABASE_*, SERVICE_ROLE, GOOGLE_*, EVENT_START_AT
                             ▼
                        Supabase Cloud (free)  →  Postgres + Auth + RLS + RPC + Realtime + Storage
```

**Điểm mấu chốt: KHÔNG cần sửa code.** Kiểm tra code đã xác nhận:
- `auth/callback/route.ts` lấy `origin` từ request → tự thích ứng domain prod, không hardcode localhost.
- `login/actions.ts` dựng OAuth `redirectTo` từ header `origin`/`host` → tự đúng domain prod.
- `dev-login/page.tsx` trả **404 trừ khi** `NEXT_PUBLIC_ENABLE_DEV_LOGIN==='true'` → không set = an toàn mặc định.

→ Đây là việc **cấu hình/ops**, không phải sửa tính năng.

## 4. Các bước deploy (5 phase tuần tự)

| # | Phase | Nội dung chính | Chi phí |
|---|-------|---------------|---------|
| 01 | **Tạo Supabase Cloud** | Tạo project free → lấy URL + anon key + service-role key + DB connection string | free |
| 02 | **Migrate schema + seed** | `supabase link` → `db push` (13 migrations) → chạy `seed.sql` + `seed-auth-users.mjs` trỏ vào cloud → verify realtime publication cho `kudos` | free |
| 03 | **Deploy FE lên Vercel** | Import repo GitHub → set 6 env var (cố ý BỎ dev-login toggle) → deploy | free |
| 04 | **Nối Google OAuth + siết prod** ⚠️ | Đồng bộ **3 nơi** (Google Console ↔ Supabase ↔ app) → xác nhận `/dev-login` = 404 | free |
| 05 | **Smoke test + keep-warm** | 8 kiểm tra flow ở prod → chọn chiến lược keep-warm → ghi verdict SEALED cho evidence gate | — |

## 5. Rủi ro cần canh (đã ghim vào phase)

1. **Google OAuth = 3 nơi phải khớp** (lỗi deploy #1):
   - Google Cloud Console → redirect URI = `https://<ref>.supabase.co/auth/v1/callback`
   - Supabase → Auth → Site URL + Redirect URLs = domain Vercel
   - App tự lo phần redirect (không cần sửa)
   - Triệu chứng sai: `redirect_uri_mismatch` (Google) / "requested path is invalid" (Supabase) → so khớp đúng chuỗi, để ý dấu `/` cuối.
2. **`NEXT_PUBLIC_ENABLE_DEV_LOGIN`** phải KHÔNG set ở Vercel prod — để `true` = mở toang cửa hậu auth.
3. **`SUPABASE_SERVICE_ROLE_KEY`** chỉ ở server env, không client, không commit. `.env.local` đã gitignore → nhập tay lại toàn bộ key trên Vercel.
4. **Supabase free tier ngủ sau ~7 ngày không dùng** + giới hạn DB 500MB → cần quyết keep-warm (cron ping) hoặc chấp nhận resume tay.
5. **Realtime (kudos)** — verify migration `supabase_realtime` publication đã áp trên cloud, nếu không kudos không cập nhật realtime.

## 6. Đo lường thành công (Definition of Done)

- URL prod load được; login Google + email/password đều chạy end-to-end.
- Kudos hiện realtime; hearts, secret-box, event countdown chạy đúng spec.
- RLS được thực thi (anon không đọc lén được data); dev-login 404 ở prod.
- Migration + seed tái lập được từ project cloud sạch.

## 7. Biến môi trường cần set trên Vercel

`NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` (secret) ·
`GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` (secret) · `EVENT_START_AT`
→ **Cố ý KHÔNG set** `NEXT_PUBLIC_ENABLE_DEV_LOGIN`.

## 8. Bước tiếp theo

- Tự chạy theo checklist từng phase (mỗi file phase là 1 checklist độc lập), **hoặc**
- `/tkm:takumi plans/260804-1120-deploy-fe-be-free-production/plan.md` để deployer agent chạy các bước CLI/config.
- Evidence gate: khi push/deploy thật cần verdict SEALED trong `evidence/` (do smoke test phase 05 sinh ra).

## Câu hỏi còn mở

- Chiến lược keep-warm cho free-tier: cron ping vs resume tay — quyết ở phase 05.
- Custom domain vs `*.vercel.app` — mặc định dùng subdomain free trừ khi bạn muốn domain riêng.
