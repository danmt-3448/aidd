# Phase 03 — Supabase clients + Google provider (Track B)

**Track:** B (auth) · **Depends:** 02

## Goal
Cấu hình Supabase Auth Google provider + tạo Supabase client cho Next.js App Router (@supabase/ssr).

## Requirements
- `supabase/config.toml`:
  - `[auth.external.google]` `enabled = true`, client_id/secret tham chiếu env `GOOGLE_CLIENT_ID/SECRET`, redirect callback `http://127.0.0.1:54321/auth/v1/callback`.
  - `[auth.email]` bật (magic-link) — cho **dev fallback** test trước khi có Google creds; Inbucket bắt email local (`:54324`).
  - `[auth]` site_url + additional_redirect_urls cho callback app.
- Client helpers (@supabase/ssr): browser client + server client (cookies) + middleware helper để refresh session.

## Files
- Modify: `supabase/config.toml`
- Create: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server), `src/lib/supabase/middleware.ts` (session refresh)
- Deps: `@supabase/supabase-js`, `@supabase/ssr`

## Implementation
1. `npm i @supabase/supabase-js @supabase/ssr`
2. Viết 3 client helper đọc `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Sửa `config.toml`: bật Google provider (creds thật — đúng design) + bật email/magic-link (dev fallback qua Inbucket).

## Todo
- [ ] Cài deps
- [ ] client.ts / server.ts / middleware.ts
- [ ] config.toml Google provider

## Success
- `createClient()` server + browser hoạt động · session đọc/ghi qua cookie.

## Security
- Chỉ `NEXT_PUBLIC_*` ra client · service_role chỉ dùng server · không log token.
