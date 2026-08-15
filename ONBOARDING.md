# ONBOARDING — AIDD (Sun* Annual Awards 2025)

Guide cho người mới clone repo: hiểu project, chạy local, và làm việc với AI (Claude Code). Đọc file này trước, rồi tới `CLAUDE.md` nếu dùng AI-driven dev.

---

## 1. Project là gì

Web app nội bộ cho **Sun\* Annual Awards 2025** — bảng "Live Kudos" (gửi lời khen), secret box, countdown sự kiện, profile, awards. Sinh từ Figma + MoMorph specs bằng Takumi Agent Kit.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript · Tailwind v4 + shadcn/ui · Supabase (Postgres + Auth + Storage + Realtime) · TanStack Query v5 · next-intl (VN/EN) · Tiptap (rich text) · Vitest + Playwright.

**Production live:** `https://agentic-coding-hands-on-dusky.vercel.app` (xem deploy runbook: `plans/reports/deploy-260815-1727-aidd-production-runbook.md`).

---

## 2. Prerequisites

| Cần | Ghi chú |
|---|---|
| **Node.js ≥ 20 LTS** | Next 16 + React 19. Check: `node -v` |
| **npm** | Đi kèm Node (project dùng npm) |
| **Docker runtime** | Supabase local cần Docker. Mac: **Colima** (`brew install colima docker`) hoặc Docker Desktop |
| **Supabase CLI** | `brew install supabase/tap/supabase` — chạy Postgres/Auth/Storage local |
| **psql** | `brew install libpq` (client Postgres, cho seed) |
| **gh** (optional) | GitHub CLI cho PR/issue |

> Dùng AI-driven dev (Claude Code)? Xem thêm §8 (MCP + Takumi kit).

---

## 3. Clone + Install

```bash
git clone git@github.com:danmt-3448/agentic-coding-hands-on.git aidd
cd aidd
git checkout develop        # app code ở đây (KHÔNG phải main — main là docs workshop)
npm install
```

> ⚠️ **Branch:** app thật ở `develop` (và `main-app`). Nhánh `main` là tài liệu hands-on, **không có app** (lịch sử riêng, unrelated). Đừng nhầm.

---

## 4. Env setup

```bash
cp .env.example .env.local
```

Điền `.env.local` bằng **key LOCAL** (lấy sau khi `supabase start` ở §5, xem `supabase status`):

| Biến | Local value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | copy `anon key` từ `supabase status` |
| `SUPABASE_SERVICE_ROLE_KEY` | copy `service_role key` từ `supabase status` (server-only) |
| `SUPABASE_DB_URL` | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| `EVENT_START_AT` | vd `2026-09-01T00:00:00+07:00` (nguồn chính là bảng `event_config`; xem §7) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | chỉ cần cho Google login; local có thể bỏ qua và dùng `/dev-login` |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | `true` (bật màn `/dev-login` email+password cho local) |

> `.env.local` đã gitignored. **KHÔNG commit secret.** (Prod dùng file khác, xem deploy runbook.)

---

## 5. Chạy Supabase local + seed DB

```bash
colima start            # (Mac) khởi động Docker runtime; bỏ qua nếu dùng Docker Desktop
supabase start          # dựng Postgres/Auth/Storage local — lần đầu tải image, hơi lâu
supabase status         # in ra URL + anon/service_role key → dán vào .env.local (§4)

npm run db:reset        # apply 31 migration + seed auth users + seed demo data (30 user, 71 kudo)
```

`db:reset` = `supabase db reset` + `seed:auth` (tạo user qua GoTrue admin API) + `seed:demo` (data demo cho board đỡ trống).

> ⚠️ Seed user qua `supabase/seed-auth-users.mjs` (admin API) — **KHÔNG** INSERT thẳng `auth.users` (sẽ hỏng login).

---

## 6. Chạy app

```bash
npm run dev             # http://localhost:3001
```

**Đăng nhập local (2 cách):**
- **Dev login** (dễ nhất): mở `http://localhost:3001/dev-login` → email seeded (vd `an.thi.xuan@sun-asterisk.com`) + password `TestPass123!`.
- **Google OAuth**: cần `GOOGLE_CLIENT_ID/SECRET` + cấu hình redirect trong Supabase (xem deploy runbook §3). Local thường dùng dev-login cho nhanh.

> Trước `EVENT_START_AT` (countdown), non-admin bị đẩy sang `/countdown`. Muốn vào home để dev: set 1 user `is_admin=true`, hoặc chỉnh `event_config.event_start_at` về quá khứ (xem §7).

---

## 7. Lệnh hay dùng

```bash
npm run dev            # dev server :3001
npm run build          # production build
npm run lint           # eslint
npm run test           # unit tests (vitest), single run
npm run test:watch     # unit watch
npm run test:coverage  # coverage
npm run test:e2e       # e2e (playwright) — cần dev server + supabase local
npm run db:reset       # reset schema + seed lại toàn bộ
npm run seed:auth      # seed lại auth users
npx tsc --noEmit       # typecheck (chạy sau mỗi lần sửa file)
```

**Chỉnh countdown/event (DB là nguồn thật):**
```bash
psql "$SUPABASE_DB_URL" -c "update event_config set event_start_at='2026-08-01T00:00:00+07' where id=1;"
```

**Set admin (vào home trước countdown):**
```bash
psql "$SUPABASE_DB_URL" -c "update profiles set is_admin=true where id=(select id from auth.users where email='<email>');"
```

---

## 8. Cấu trúc & nơi tra cứu

```
src/app/**              routes (App Router) — 1 folder/route: /board /kudos /profile /awards /countdown ...
src/components/ui/**    shadcn/ui primitives
src/features/{feature}/** component + hooks + server actions + schema theo feature
src/lib/**              utils, 3 Supabase client (client/server/middleware), TanStack Query
src/i18n/               next-intl config
src/proxy.ts            route guard (Next 16 — KHÔNG phải middleware.ts): session refresh → pre-launch gate → auth guard
supabase/migrations/**  31 migration (schema, RLS, RPC, realtime)
supabase/seed*.sql      seed reference + demo
e2e/**                  Playwright specs
docs/**                 tài liệu chi tiết (dưới)
```

**Docs có sẵn** (`docs/`): `system-architecture.md`, `database-schema.md`, `api-by-screen.md`, `api-shared.md`, `code-standards.md`, `development-roadmap.md`, `project-changelog.md`, `performance-guidelines.md`.

**Patterns chính** (chi tiết trong `CLAUDE.md`):
- **Connected component**: mỗi screen có `{screen}-connected.tsx` lo data fetching, truyền props xuống component thuần.
- **Server Actions**: `'use server'` colocated `*-actions.ts` — auth guard → Zod `safeParse` → DB → trả `{ok:true|false}`, không throw.
- **DB writes nhiều bảng**: qua Postgres RPC (vd `create_kudo()`), 1 transaction.
- **3 Supabase client** không lẫn nhau: `client.ts` (browser), `server.ts` (server), `middleware.ts` (proxy).

---

## 9. Làm việc với AI (Claude Code)

Repo tối ưu cho AI-driven dev qua **Takumi Agent Kit**:
- **`CLAUDE.md`** = chỉ dẫn cho AI: tech stack, route map, conventions, và **bảng Step → Role → Skill bắt buộc** (mọi code đi qua skill, không code ad-hoc).
- **`.claude/rules/`** = rule chi tiết (UI-First Gate, workflow, orchestration). Committed, đọc được.
- Onboarding kit (1 lần): `tkm init --kit extras` — cài skills/agents/roles.
- **MCP** (design + browser): `cp .mcp.example.json .mcp.json` rồi điền `MOMORPH_GITHUB_TOKEN` (export ở shell trước khi mở Claude Code). `.mcp.json` gitignored.

> AI đọc `ONBOARDING.md` (file này) + `CLAUDE.md` là hiểu cách chạy + quy tắc. Workflow chuẩn: plan → build → **UI-First Gate** (`/aidd-ui-gate`) → integrate → test → review.

---

## 10. Deploy (production)

Xem runbook đầy đủ: **`plans/reports/deploy-260815-1727-aidd-production-runbook.md`**
- FE: Vercel (branch `main-app`), 6 env vars.
- BE: Supabase Cloud — push schema qua **session pooler** (direct host IPv6-only), seed reference + auth.
- Auth: Google OAuth "SAA Prod" + đồng bộ secret trong Supabase → Sign In / Providers → Google.

---

## 11. Troubleshooting

| Triệu chứng | Nguyên nhân / Fix |
|---|---|
| `supabase start` fail | Docker chưa chạy → `colima start` (hoặc mở Docker Desktop) |
| App load nhưng board trống / lỗi query | Chưa `npm run db:reset` (DB chưa có schema/seed) |
| Login xong vẫn ở `/countdown` | Đúng thiết kế: trước `event_start_at` non-admin bị gate. Set admin hoặc chỉnh `event_config` (§7) |
| Google login "Unable to exchange external code" | Secret Google trong **Supabase → Sign In / Providers → Google** lệch secret thật → cập nhật + Save |
| `psql`/`db push` "failed to connect" tới cloud | Direct host `db.<ref>.supabase.co` là **IPv6-only** → dùng **session pooler** `aws-0-<region>.pooler.supabase.com:5432` |
| Seeded user không login được | Phải seed qua `seed:auth` (admin API), không INSERT thẳng `auth.users` |
| Type error sau khi sửa | `npx tsc --noEmit` để bắt sớm |

---

_Cập nhật 2026-08-15. Chi tiết AI/quy tắc: `CLAUDE.md`. Chi tiết deploy: `plans/reports/deploy-260815-1727-aidd-production-runbook.md`._
</content>
