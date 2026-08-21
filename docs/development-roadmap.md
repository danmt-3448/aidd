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

**Delivered:** 2026-07-30 · commit `bb3d2f5`
**Plan:** `plans/260730-1150-login/`
**MoMorph screen:** `GzbNeVGJHz`

- [x] `profiles` table + trigger `on_auth_user_created` (migration `20260730062749`)
- [x] Supabase clients: browser (`src/lib/supabase/client.ts`), server, middleware
- [x] Google OAuth Server Action (`src/app/login/actions.ts → signInWithGoogle`)
- [x] OAuth callback route (`src/app/auth/callback/route.ts`) → redirect default `/`
- [x] Route guard / proxy (`src/proxy.ts`) with open-redirect protection (`sanitizeNext`)
- [x] i18n via next-intl — cookie-based locale (VN/EN), no URL prefix
- [x] Login UI pixel-perfect from Figma — keyvisual, gradient overlays, login button
- [x] `dev-login` route (env-gated, email+password for local seeded users)
- [x] Unit tests (Vitest): `guard-rules`, `language-switcher`, `login-screen`, `i18n/config`
- [x] E2E tests (Playwright): `e2e/login.spec.ts`
- [x] UI-First Gate PASS at 1440 + 1280 (property-diff)

---

## Phase 3 — Viết Kudo Compose Screen (Done)

**Delivered:** 2026-07-31 · commits `992daa6`–`be791ae`
**Plan:** `plans/260731-0836-viet-kudo/`
**MoMorph screen:** `ihQ26W78P2`

- [x] DB tables: `hashtags`, `kudos`, `kudo_hashtags`, `kudo_images` (migration `20260731000000`)
- [x] `kudos.danh_hieu` column + 8-arg `create_kudo()` RPC (migration `20260804010000`)
- [x] Atomic RPC `create_kudo()` — single transaction for kudos + hashtags + images
- [x] RLS policies on all four tables; `kudos_public` view with sender masking
- [x] Supabase Storage bucket `kudo-images` with per-user folder policies
- [x] Seed: 10 `auth.users` + `profiles`, 12 hashtags
- [x] Server actions: `createKudo`, `searchRecipients`, `listHashtags`
- [x] TanStack Query hooks: `useCreateKudo`, `useRecipientSearch`, `useHashtags`, `useCurrentUserId`
- [x] Rich-text editor: Tiptap with bold/italic/strike/list/link/blockquote/`@mention`
- [x] KudoComposeModal (8 components): RecipientSelect, TiptapEditor, HashtagPicker,
      ImageUploader, AnonymousToggle, SubmitBar
- [x] `/kudos` route — modal mounted; QueryProvider + Sonner moved to root `providers.tsx`
- [x] Unit tests: `kudo-schema.test.ts`
- [x] DB integration tests: `supabase/tests/kudo-integration-simple.sql`
- [x] E2E tests: `e2e/viet-kudo.spec.ts`

---

## Phase 4 — Live Board / Sun* Kudos Feed (Done)

**Delivered:** 2026-08-05
**Screens:** Live board — kudos feed + like hearts + stats + spotlight + secret boxes

- [x] `hearts` table (migration `20260731030000`) — PK(user_id, kudo_id); self-heart blocked by RLS
- [x] `secret_box` + `secret_box_badges` tables (migration `20260731050000`)
- [x] `notifications` table (migration `20260731060000`) — trigger-inserted on kudo create
- [x] `kudos_public` view — sender masking for anonymous kudos (implemented and active)
- [x] `profile_stats_view` — aggregated stats per profile
- [x] `get_highlight_kudos()` RPC — top-5 weighted rows (replaces client-side ranking)
- [x] `board_leaderboard()` RPC (migration `20260804020000`)
- [x] Performance indexes migration `20260804000000`
- [x] BoardScreen: feed cards, highlight kudos, spotlight, sidebar
- [x] UI-First Gate PASS at 1440 + 1280 (property-diff)
- [x] `/kudos` navigates to `/board` in the live board context

---

## Phase 5 — User Profile Screen (Done)

**Delivered:** 2026-08-05
**Screens:** Profile bản thân

- [x] Profile page: avatar, `star_level`, stats (`kudos_received_count`, `kudos_sent_count`, `hearts_received`)
- [x] Badge display from `secret_box_badges` (badge config in `badge-assets.ts` — static, no DB `badges` table)
- [x] `departments` table (migration `20260804040000`) — uuid PK, `name` unique; `profiles.department_ref` FK wired
- [x] UI-First Gate PASS at 1440 + 1280 (property-diff)

---

## Phase 6 — Homepage + Countdown + Rules + Awards (Done)

**Delivered:** 2026-08-06
**Screens:** Homepage SAA, Countdown/Prelaunch, Thể lệ, Hệ thống giải

- [x] `event_config` DB table (migration `20260731020000`) — `event_start_at` timestamptz, singleton (id=1)
- [x] `event_config_anon_read` policy (migration `20260805020000`) — anonymous can read for countdown
- [x] Homepage: nav, hero, awards grid, FAB widget, account menu
- [x] Prelaunch gate: proxy reads `event_config.event_start_at` DB (not env var); non-admin before start → `/countdown`
- [x] `special_day_config` table (migration `20260731040000`) — per-date hearts multiplier
- [x] "Thể lệ" (`/rules`) page — static content + modal
- [x] "Hệ thống giải" (`/awards`) page — static TS config (no DB table; YAGNI)
- [x] Countdown page (`/countdown`) — public route, pre-launch display
- [x] UI-First Gate PASS at 1440 + 1280 for Homepage, Countdown, Rules, Awards (property-diff)

---

## Phase 7 — Polish + Production Readiness (Done)

**Status:** Done — all screens delivered; deploy live; secret-box gated 2026-08-17; infra hardening 2026-08-20.

- [x] Fixed header (sticky → fixed overlay) with content offsets for all routes
- [x] Z-index layering: rules/secret-box/compose modals above fixed header
- [x] 1920px no-break verified (property-diff gate extended)
- [x] Production Supabase project + deployment — LIVE `https://agentic-coding-hands-on-dusky.vercel.app` (runbook `plans/reports/deploy-260815-1727-aidd-production-runbook.md`)
- [x] Notifications UI (`/notifications`, `/notifications/panel`) — accepted as-is: no MoMorph visual spec exists → logic-pass = pass (no visual gate applicable)
- [x] Secret box open flow — UI + logic + RPC (`open_secret_box()`, migration `20260731110000`); **UI-First Gate PASS** (property-diff 1440+1280 + behavior on real seeded data — report `plans/reports/ui-gate-260817-secret-box.md`)
- [x] `kudos_mentions` table migration — deferred by design (@mentions embedded in content_html; YAGNI)
- [x] **Readiness hardening** (2026-08-20, PR #5) — git-hook infra (`.githooks/`, `hooks:install`, `docs:sync`),
      PR template, coverage floor (`@vitest/coverage-v8`, baseline lines 37.82 / stmt 37.03 / func 33.5 / branch 32.65),
      e2e gap specs (notifications + admin-smoke), `aidd_readonly` DB role (SELECT-only for agent introspection)

> Responsive audit at 375 / 768 — **dropped**: UI-First Gate policy scores 1440 + 1280 (property-diff) + 1920 (no-break) only; 768/375 no longer gated (see `.claude/rules/ui-first-gate.md`).

---

## Screens Status Summary

| Screen | Status |
|--------|--------|
| Login | Done + Gate PASS |
| Viết Kudo (compose modal) | Done + Gate PASS |
| Sun* Kudos — Live board | Done + Gate PASS |
| Profile bản thân | Done + Gate PASS |
| Homepage SAA | Done + Gate PASS |
| Countdown / Prelaunch | Done + Gate PASS |
| Thể lệ UPDATE | Done + Gate PASS |
| Hệ thống giải | Done + Gate PASS |
| Open secret box | Done + Gate PASS (property-diff 1440+1280 + behavior on real data) |
| Notifications | Accepted as-is — no MoMorph visual spec → logic-pass = pass |
| Dropdown Phòng ban | Done (departments FK wired) |
| Dropdown-profile / Dropdown-ngôn ngữ / FAB | Done (in homepage/shared chrome) |

---

## Key Cross-Cutting Concerns

| Item | Status |
|------|--------|
| Anonymous kudo `sender_id` masking | **Done** — `kudos_public` view masks sender for anonymous rows |
| `departments` FK wiring | Done — `profiles.department_ref` uuid FK (migration `20260804040000`) |
| `kudos_mentions` table | Deferred — @mentions embedded in content_html |
| Notifications | Routes + UI + logic exist; accepted as-is (no MoMorph visual spec → logic-pass = pass) |
| E2E with real Supabase session injection | In-progress |
| Git hooks + docs-drift guard | Done — `.githooks/` + `hooks:install` + `docs:sync` (2026-08-20) |
| Coverage regression floor | Done — `@vitest/coverage-v8` baseline wired (2026-08-20) |

> Schema reference: `docs/database-schema.md`
