# Deploy Report — AIDD SAA 2025 (Production, free tier)

Ngày: 2026-08-15 · Repo: `danmt-3448/agentic-coding-hands-on` · Plan: `plans/260804-1120-deploy-fe-be-free-production/`

> ⚠️ **Bản này AN TOÀN commit — mọi secret đã che.** Giá trị secret thật nằm ở bản local `deploy-260815-credentials-LOCAL-secrets.md` (gitignored) + `.env.prod` / `.env.vercel` (gitignored).

## TL;DR
- ✅ **FE + BE + Auth đã LIVE**: `https://agentic-coding-hands-on-dusky.vercel.app`
- ✅ Login Google chạy; DB cloud đủ schema + seed; countdown gate hoạt động.
- Còn: sau 20:00 (2026-08-15) event mở cho mọi user; trước đó chỉ admin vào home (non-admin thấy `/countdown`).

## Kiến trúc
```
GitHub (branch main-app) ──auto-deploy──▶ Vercel (Next.js 16 SSR + Server Actions + proxy)
                                             │ 6 env vars (Supabase cloud + Google prod)
                                             ▼
                    Supabase Cloud (ngsvtvfhgtarbzvlfyrz, Tokyo, Postgres 17.6)
                    Postgres + Auth(GoTrue) + RLS + RPC + Realtime + Storage
                                             ▲
                    Google OAuth "SAA Prod" ─┘ (Supabase = OAuth client của Google)
```

## 1. Frontend — Vercel
- Project `agentic-coding-hands-on` (team danmt's projects, Hobby). Framework Next.js auto-detect, build `next build`, output default. Không cần `vercel.json`.
- **Production Branch = `main-app`**. ⚠️ Repo `main` gốc là **docs workshop, KHÔNG chung gốc lịch sử với app** (`merge-base` rỗng) → không merge được. App code = `develop`; đã tạo `main-app` từ develop để deploy; `main` docs backup ở `main-template-backup`.
- Domain production ổn định: `agentic-coding-hands-on-dusky.vercel.app` (2 domain còn lại theo branch/deploy — bỏ qua khi cấu hình).
- Build green (54s). Trang load HTTP 200.
- **Env vars (Production+Preview), 6 biến** — giá trị che:
  | Key | Nguồn | Ghi chú |
  |---|---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | public |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | key MỚI `sb_publishable_…` | public |
  | `SUPABASE_SERVICE_ROLE_KEY` | key MỚI `sb_secret_…` | secret |
  | ~~`EVENT_START_AT`~~ | ISO 8601 | ⚠️ **ENV CHẾT — không code nào đọc.** Xoá khỏi Vercel; giờ launch chỉ do DB `event_config.event_start_at` quyết định (xem §4). |
  | `GOOGLE_CLIENT_ID` | SAA Prod | — |
  | `GOOGLE_CLIENT_SECRET` | SAA Prod | secret |
  - **KHÔNG set** `NEXT_PUBLIC_ENABLE_DEV_LOGIN` → `/dev-login` 404 ở prod (đúng, chặn bypass auth).
  - `SUPABASE_DB_URL` KHÔNG đưa lên Vercel (chỉ để seed từ máy).
  - ⚠️ **`EVENT_START_AT` đã set trên Vercel prod nhưng là env chết** — gỡ khi tiện (repo đã bỏ khỏi `.env.local`/`.env.example` ngày 2026-08-16).

## 2. Backend — Supabase (schema + seed)
- Project `ngsvtvfhgtarbzvlfyrz`, region ap-northeast-1 (Tokyo), **Postgres 17.6** (khớp `config.toml`), ACTIVE_HEALTHY.
- ⚠️ **Direct host `db.<ref>.supabase.co` là IPv6-only** → máy Mac (IPv4) connect fail ("Failed to connect", KHÔNG phải sai mật khẩu). **Giải: push qua Session Pooler IPv4** `aws-0-ap-northeast-1.pooler.supabase.com:5432`, user `postgres.<ref>`.
  - Lệnh: `supabase db push --db-url "postgresql://postgres.<ref>:<DB_PASSWORD>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"`
- **Verify cloud (đã chạy):**
  | Check | Kết quả |
  |---|---|
  | migrations | **31/31**, no drift |
  | auth users | 30 |
  | profiles | 30 |
  | hashtags | 12 |
  | departments | 7 |
  | event_config | 1 |
  | RLS | **12/12 bảng bật** |
  | realtime | publication có `kudos` |
- Seed reference: `psql -f supabase/seed.sql` (INSERT 12 — hashtags + config). Auth users: `node supabase/seed-auth-users.mjs` (30 created, profiles + department_ref + secret_box grants). **KHÔNG seed demo data** lên prod.

## 3. Auth — Google OAuth (nhiều bẫy đã fix)
- Client **"SAA Prod"** (id `299016377640-…`), tạo 4/8, secret mới tạo 15/8 15:05 (đuôi `-isT`).
- **Google Console** → Authorized redirect URIs = `https://ngsvtvfhgtarbzvlfyrz.supabase.co/auth/v1/callback` (⚠️ ban đầu thiếu `/auth/v1/callback` — phải đủ path). JS origins không bắt buộc.
- **Supabase** → Auth → URL Configuration: Site URL + Redirect URLs = `https://agentic-coding-hands-on-dusky.vercel.app` (+ `/**`).
- 🐞 **Bug login "Unable to exchange external code"**: Supabase → Sign In / Providers → Google giữ **secret CŨ** trong khi Google chỉ nhận secret mới `-isT`. **Fix: cập nhật Client Secret trong Supabase = secret `-isT` + Save.** (Xác nhận secret đúng bằng cách gọi `oauth2.googleapis.com/token` với code giả → trả `invalid_grant` = secret hợp lệ; `invalid_client` = sai.)
- Luồng đúng: `App(Vercel) → Google consent → Supabase /auth/v1/callback (đổi token) → App /auth/callback (exchangeCodeForSession) → redirect`.
- ⚠️ Đừng nhầm **"OAuth Server"** (Supabase làm IdP cho app khác) với **"Sign In / Providers"** (nơi cấu hình login BẰNG Google). Cần cái sau.

## 4. Config hành vi
- **Countdown/pre-launch gate** (`src/proxy.ts`): đọc `event_config.event_start_at` từ **DB** (KHÔNG phải env). Nếu `now < event_start_at` và user không phải admin → `/countdown`.
- Đã set `event_config.event_start_at = 2026-08-15 20:00+07`. Trước 20:00: non-admin thấy countdown; admin vào home.
- Đổi mốc: `update event_config set event_start_at='<ISO>' where id=1;` (qua psql pooler).

## 5. Cách vận hành / seed lại (khi cần)
```bash
cd /Users/mai.thanh.dan/Desktop/Sun/AI/aidd
# link + push (DB password lấy ở bản LOCAL / .env.prod):
supabase db push --db-url "postgresql://postgres.ngsvtvfhgtarbzvlfyrz:<DB_PASSWORD>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
# seed reference:
psql "<pooler url với password>" -f supabase/seed.sql
# seed auth users (URL + service key lấy từ .env.prod):
SUPABASE_URL=<cloud url> SUPABASE_SERVICE_ROLE_KEY=<sb_secret_…> node supabase/seed-auth-users.mjs
```
- Secret ở đâu: `.env.vercel` (6 biến app), `.env.prod` (+ DB_URL có password), bản LOCAL report (DB password + connection string).

## 6. Bẫy đã gặp (để lần sau nhanh)
1. Supabase key MỚI: `sb_publishable_` (=anon) + `sb_secret_` (=service_role). supabase-js ≥2.111 hỗ trợ; dán vào đúng env cũ, không đổi code.
2. Direct DB host IPv6-only → dùng **session pooler** IPv4 cho push/seed/psql.
3. Repo `main` = docs workshop, unrelated history → deploy `main-app` (từ develop), đừng merge.
4. Google redirect URI phải đủ `/auth/v1/callback`; đổi xong chờ 5' propagate.
5. Login "Unable to exchange external code" = secret Google trong **Supabase** lệch secret thật → đồng bộ.
6. Countdown đọc DB `event_config`, không phải env `EVENT_START_AT`.

## 7. Còn lại / open
- [ ] Sau 20:00 (2026-08-15): xác nhận non-admin vào được home (event live). Hoặc set admin / đổi mốc nếu cần test sớm.
- [ ] Smoke test đầy đủ (Phase 05): kudos realtime, hearts, secret-box, notifications, profile — trên data thật.
- [ ] (Tùy) keep-warm chống Supabase free pause sau ~7 ngày idle.
- [ ] (Tùy) gộp `main-app` → `main` cho gọn, hoặc để Vercel prod branch = `main-app`.
- [ ] Merge `develop`/plan updates về nhánh deploy nếu muốn docs đi kèm.

## Câu hỏi mở
- Có muốn mở event sớm (đổi `event_start_at` về quá khứ) hay giữ 20:00?
- Có cần seed thêm data thật (không phải demo) cho board đỡ trống lúc launch?
</content>
