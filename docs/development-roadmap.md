# Development Roadmap — SAA 2025 Internal

> Tracks delivery phases for the Sun* Annual Awards 2025 web application.
> "Done" items are grounded in completed plans and git history.
> Future items are planned based on the 18 screens in the MoMorph spec
> (`fileKey: 9ypp4enmFmdK3YAFJLIu6C`).

---

## Phase 1 — Foundation (Done)

**Delivered:** 2026-07-30 · commit `4140ca2`

- [x] Project scaffold: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- [x] Supabase local dev setup (`supabase/config.toml`)
- [x] Path alias `@/*` → `./src/*`
- [x] Vitest + Playwright wired up (`npm test` / `npm run test:e2e`)
- [x] ESLint config

---

## Phase 2 — Login Screen (Done)

**Delivered:** 2026-07-30 · commits `bb3d2f5`
**Plan:** `plans/260730-1150-login/`
**MoMorph screen:** `GzbNeVGJHz`

- [x] `profiles` table + trigger `on_auth_user_created` (migration `20260730062749`)
- [x] Supabase clients: browser (`src/lib/supabase/client.ts`), server (`src/lib/supabase/server.ts`), middleware (`src/lib/supabase/middleware.ts`)
- [x] Google OAuth Server Action (`src/app/login/actions.ts → signInWithGoogle`)
- [x] OAuth callback route (`src/app/auth/callback/route.ts`)
- [x] Route guard / proxy (`src/proxy.ts`) with open-redirect protection
- [x] i18n via next-intl — cookie-based locale (VN/EN), no URL prefix
- [x] Login UI pixel-perfect from Figma — keyvisual, gradient overlays, login button
- [x] `dev-login` route (env-gated, email+password for local seeded users)
- [x] Unit tests (Vitest): `guard-rules`, `language-switcher`, `login-screen`, `i18n/config` — 64 passing
- [x] E2E tests (Playwright): `e2e/login.spec.ts`

---

## Phase 3 — Viết Kudo Compose Screen (Done)

**Delivered:** 2026-07-31 · commits `992daa6`, `dc4e23a`, `26f30ef`, `9ce9e1a`, `7ee46d5`, `be791ae`
**Plan:** `plans/260731-0836-viet-kudo/`
**MoMorph screen:** `ihQ26W78P2`

- [x] DB tables: `hashtags`, `kudos`, `kudo_hashtags`, `kudo_images` (migration `20260731000000`)
- [x] Atomic RPC `create_kudo()` in Postgres — single transaction for kudos + hashtags + images
- [x] RLS policies on all four tables
- [x] Supabase Storage bucket `kudo-images` with per-user folder policies
- [x] Seed: 10 `auth.users` + `profiles`, 12 hashtags
- [x] Server actions: `createKudo` (auth guard + Zod + sanitize-html + RPC), `searchRecipients`, `listHashtags`
- [x] TanStack Query hooks: `useCreateKudo`, `useRecipientSearch`, `useHashtags`, `useCurrentUserId`
- [x] Rich-text editor: Tiptap with bold/italic/strike/list/link/blockquote/`@mention`
- [x] KudoComposeModal (8 components): RecipientSelect, TiptapEditor, HashtagPicker, ImageUploader, AnonymousToggle, SubmitBar
- [x] `/kudos` route — modal mounted with QueryProvider + Sonner toasts
- [x] Unit tests: `kudo-schema.test.ts` (64 passing including UUID regression)
- [x] DB integration tests: `supabase/tests/kudo-integration-simple.sql` (8 passing)
- [x] E2E tests: `e2e/viet-kudo.spec.ts`

---

## Phase 4 — Live Board / Sun* Kudos Feed (Planned)

**Status:** Not started
**Screens:** Live board (read view — kudos feed + like hearts + stats + secret boxes)

- [ ] Read `kudos` with hashtags, images, sender/receiver profiles
- [ ] Like hearts (`kudos_likes` table — schema drafted in `docs/database-schema.md`)
- [ ] Secret box open flow (`secret_boxes` + `badges` tables)
- [ ] `sender_id` masking for anonymous kudos before this ships (security gap noted in schema)
- [ ] Spotlight / highlight top kudos by `like_count`
- [ ] Real-time or polling for new kudos

---

## Phase 5 — User Profile Screen (Planned)

**Status:** Not started
**Screens:** Profile bản thân

- [ ] Profile page: avatar, `star_level`, stats (`kudos_received_count`, `kudos_sent_count`, `hearts_received`)
- [ ] `user_badges` display (badge collection from secret box opens)
- [ ] Department label (`departments` table — FK wiring deferred)

---

## Phase 6 — Homepage SAA + Countdown (Planned)

**Status:** Not started
**Screens:** Homepage SAA, Countdown/Prelaunch, Thể lệ UPDATE, Hệ thống giải

- [ ] Homepage: nav, event info, awards information section
- [ ] Prelaunch countdown gate (env `EVENT_START_AT`; locks navigation until `0`)
- [ ] "Thể lệ" (rules) page — static content
- [ ] "Hệ thống giải" (awards) page — 6 award categories (static content or `awards` table)

---

## Phase 7 — Polish + Production Readiness (Planned)

**Status:** Not started

- [ ] Mask `kudos.sender_id` for anonymous kudos before Live board (per M3 concern in viet-kudo plan)
- [ ] `departments` table FK + department dropdown
- [ ] Admin: content review, user management, `special_days` config (design in-progress, no spec)
- [ ] Notifications table/flow (hinted from header bell icon, no spec yet)
- [ ] Responsive audit at 375 / 768 / 1280 px across all screens
- [ ] Production Supabase project + deployment

---

## Screens Status Summary

| Screen | Status |
|--------|--------|
| Login | Done |
| Viết Kudo (compose modal) | Done |
| Sun* Kudos — Live board | Planned |
| Profile bản thân | Planned |
| Homepage SAA | Planned |
| Countdown / Prelaunch | Planned |
| Thể lệ UPDATE | Planned |
| Hệ thống giải | Planned |
| Open secret box | Planned |
| Dropdown Phòng ban | Planned |
| Addlink Box (inline) | Planned |
| Dropdown-profile / Dropdown-ngôn ngữ / FAB | Planned |

---

## Key Cross-Cutting Concerns

| Item | Status |
|------|--------|
| Anonymous kudo `sender_id` masking (M3) | Pending — must ship before Live board |
| `departments` FK wiring | Deferred to Phase 5 |
| `kudos_mentions` table (separate from `content_html`) | Deferred |
| Notifications | No spec — deferred |
| E2E with real Supabase session injection | In-progress |

> Schema reference: `docs/database-schema.md`
