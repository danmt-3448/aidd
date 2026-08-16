# System Architecture — SAA 2025 Internal

> Describes the actual running system as of 2026-08-06.
> All route paths, module names, and data flows are derived from reading `src/`.
> See `docs/database-schema.md` for full table/column reference.

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 16.2.12 |
| UI library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Rich-text | Tiptap (starter-kit + mention + link + placeholder + character-count) | ^3.29 |
| Server state | TanStack Query | ^5.101 |
| Backend / Auth | Supabase (Postgres + Auth + Storage) | `@supabase/ssr ^0.12` |
| i18n | next-intl (cookie-based, no URL prefix) | ^4.13 |
| Validation | Zod | ^4.4 |
| HTML sanitize | sanitize-html | ^2.17 |
| Toast | Sonner | ^2.0 |
| Icons | Lucide React | ^1.28 |
| Unit tests | Vitest | ^4.1 |
| E2E tests | Playwright | ^1.62 |

---

## Route Map (`src/app/`)

```
/                          src/app/page.tsx                — HomepageConnected (public; proxy guards with pre-launch gate)
/login                     src/app/login/page.tsx          — LoginScreen; guard redirects here if unauthenticated
/auth/callback             src/app/auth/callback/route.ts  — OAuth/magic-link code exchange → session → redirect /
/dev-login                 src/app/dev-login/page.tsx      — email+password (NEXT_PUBLIC_ENABLE_DEV_LOGIN)
/board                     src/app/board/page.tsx          — Sun* Kudos live board (auth-guarded)
/kudos                     src/app/kudos/page.tsx          — Viết Kudo compose modal (auth-guarded)
/awards                    src/app/awards/page.tsx         — Hệ thống giải award showcase (auth-guarded)
/rules                     src/app/rules/page.tsx          — Thể lệ rules page (auth-guarded)
/profile                   src/app/profile/page.tsx        — Profile bản thân (auth-guarded)
/countdown                 src/app/countdown/page.tsx      — Pre-launch countdown (public)
/secret-box                src/app/secret-box/page.tsx     — Secret box open flow (auth-guarded)
/notifications             src/app/notifications/page.tsx  — Notifications inbox (auth-guarded)
/notifications/panel       src/app/notifications/panel/page.tsx — Notification panel (auth-guarded)
```

All routes except `/`, `/login`, `/auth/**`, `/dev-login`, `/countdown` are protected.
The route guard (`src/proxy.ts`) enforces this at the edge.

---

## Module Map (`src/`)

```
src/
├── app/                   Next.js App Router pages + route handlers
│   ├── layout.tsx         Root layout: NextIntlClientProvider + Geist fonts + RootProviders
│   ├── providers.tsx      RootProviders: QueryProvider + Toaster (single root instance)
│   ├── globals.css        Tailwind base styles
│   ├── auth/callback/     OAuth callback route handler
│   ├── awards/            Hệ thống giải page
│   ├── board/             Sun* Kudos live board page
│   ├── countdown/         Pre-launch countdown page
│   ├── dev-login/         Dev-only email+password page
│   ├── kudos/             Viết Kudo page
│   ├── login/             Login page + signInWithGoogle / signInWithPassword server actions
│   ├── notifications/     Notifications inbox + panel
│   ├── profile/           User profile page
│   ├── rules/             Thể lệ rules page
│   └── secret-box/        Secret box open flow page
│
├── features/              12 feature modules
│   ├── auth/              Auth: LoginScreen, guard-rules, get-is-admin
│   ├── awards/            Awards showcase: static config + components
│   ├── board/             Live board: feed, spotlight, sidebar, connected helpers
│   ├── countdown/         Countdown display + mock fixtures
│   ├── errors/            Shared error components
│   ├── event/             launch-gate.ts (isPreLaunch, isBypassPath)
│   ├── homepage/          HomepageConnected + hero, nav, awards grid, FAB
│   ├── kudos/             Viết Kudo compose modal (8 components, hooks, schema, actions)
│   ├── notifications/     Notification inbox + panel components
│   ├── profile/           Profile hero + stats components
│   ├── rules/             Thể lệ content + modal
│   └── secret-box/        Secret box flow + badge-assets.ts (static badge config)
│
├── components/            Shared app components
│   ├── language-switcher.tsx
│   ├── page-container.tsx
│   ├── site-account-menu.tsx
│   └── site-header.tsx
│
├── i18n/
│   ├── config.ts          locales=['vi','en'], defaultLocale='vi', LOCALE_COOKIE='NEXT_LOCALE'
│   └── request.ts         next-intl getRequestConfig — reads NEXT_LOCALE cookie, loads messages
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts      createClient() — browser (createBrowserClient)
│   │   ├── server.ts      createClient() — server async (createServerClient + cookies())
│   │   └── middleware.ts  updateSession() — refreshes Supabase session in proxy;
│   │                      verifies identity via getClaims() (local ES256/JWKS, ~1–6ms),
│   │                      falls back to getUser() (network) on missing/expired/errored claims
│   ├── query/
│   │   ├── query-client.ts  makeQueryClient(), getQueryClient() — SSR-safe singleton
│   │   └── query-provider.tsx  <QueryProvider> — mounts QueryClientProvider client-side
│   └── time/              Time utilities (countdown, formatting)
│
└── proxy.ts               3 responsibilities:
                             1. Session refresh (updateSession)
                             2. Pre-launch gate — reads event_config DB; non-admin before
                                event_start_at → redirect /countdown. Fail-open on error.
                             3. Auth guard — logged-in on /login → /; unauthenticated on
                                protected path → /login.
```

---

## Data Flow

### Authentication

```
Browser
  │
  ├─ GET /login
  │    └─ LoginScreen → GoogleLoginButton
  │         └─ click → signInWithGoogle() [server action]
  │              └─ supabase.auth.signInWithOAuth({ provider:'google', redirectTo:'/auth/callback' })
  │                   └─ redirect → Google consent screen
  │
  └─ GET /auth/callback?code=...
       └─ supabase.auth.exchangeCodeForSession(code)
            └─ session cookie set
                 └─ redirect → / (or sanitizeNext(?next=))
```

### Route Guard (every request)

```
Request → src/proxy.ts
  │
  ├─ 1. updateSession(request)          // getClaims() local verify (ES256/JWKS, ~1–6ms);
  │                                     // getUser() network fallback on expired/absent claims
  │                                     // (token refresh + cookie sync happen on fallback path)
  ├─ 2. Auth fast-path
  │       user + path=/login → redirect /
  │       !user + !isPublic  → redirect /login (no DB query)
  └─ 3. Pre-launch gate (non-bypass paths only)
          parallel: event_config.event_start_at + profiles.is_admin
          isPreLaunch && !isAdmin → redirect /countdown
          otherwise → NextResponse.next()
```

### Viết Kudo Submit

```
KudoComposeModal (client)
  │
  ├─ useRecipientSearch(query)   → searchRecipients() [server action]
  │    └─ supabase.from('profiles').select().ilike('full_name', ...).neq('id', uid)
  │
  ├─ useHashtags()               → listHashtags() [server action]
  │    └─ supabase.from('hashtags').select().order('name')
  │
  ├─ ImageUploader
  │    └─ supabase.storage.from('kudo-images').upload('{uid}/{kudoId}/...')
  │
  └─ useCreateKudo().submit(input)
       └─ createKudo(input) [server action]
            ├─ supabase.auth.getUser()           // auth guard
            ├─ createKudoSchema.safeParse(input)  // Zod validation (8 fields incl. danh_hieu)
            ├─ sanitizeHtml(contentHtml, ...)     // strip disallowed tags
            └─ supabase.rpc('create_kudo', ...)  // 8-arg atomic Postgres RPC
                 └─ INSERT kudos + kudo_hashtags + kudo_images (1 transaction)
                      └─ returns kudoId → toast.success + modal close + form reset
```

---

## Database (Supabase Postgres)

All migrations applied (`supabase/migrations/`):

| Table | Key migration | Purpose |
|-------|--------------|---------|
| `profiles` | `20260730062749` | Sunner profiles, 1-1 with `auth.users` |
| `hashtags` | `20260731000000` | Tag catalog (12 seeded) |
| `kudos` | `20260731000000` + `20260804010000` | Kudo records (incl. `danh_hieu`) |
| `kudo_hashtags` | `20260731000000` | M-N kudos ↔ hashtags (max 5) |
| `kudo_images` | `20260731000000` | Storage paths for attached images (max 5) |
| `event_config` | `20260731020000` | Singleton (id=1): `event_start_at`, pre-launch gate config |
| `hearts` | `20260731030000` | Like-hearts per kudo (PK: user_id + kudo_id) |
| `special_day_config` | `20260731040000` | Per-date hearts multiplier overrides |
| `secret_box` | `20260731050000` | Per-user unopened box count (PK: user_id) |
| `secret_box_badges` | `20260731050000` | Badges earned on open (badge_key, opened_at) |
| `notifications` | `20260731060000` | Per-user notification inbox |
| `kudos_public` | `20260731070000` + `20260731100000` | View: sender masked for anonymous kudos |
| `profile_stats_view` | `20260731080000` | View: aggregated kudos/hearts stats per profile |
| `departments` | `20260804040000` | Department lookup; `profiles.department_ref` uuid FK |

Tables with pending migration: `kudos_mentions` (schema only; @mentions embedded in content_html).

### Anonymous Kudos — Sender Masking (A10)

`kudos_public` view (migration `20260731070000` + corrected `20260731100000`) masks `sender_id`
to `null` and `sender_name` to `anonymous_name` for rows where `is_anonymous = true`.
The base table `kudos` still stores the real `sender_id` (admin-accessible via direct table
query with appropriate role). **Masking is implemented and active.** The prior "must ship
before Live board" concern is resolved.

### RLS Summary (core tables)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | authenticated (all) | trigger only | own row | — |
| `hashtags` | authenticated (all) | — | — | — |
| `kudos` | own sender/receiver | own `sender_id` via RPC | — | — |
| `kudos_public` | authenticated (all, masked) | — | — | — |
| `hearts` | authenticated (all) | own, not self-heart | — | own |
| `notifications` | own | trigger/RPC only | own | — |
| `secret_box` | own | RPC only | RPC only | — |
| `secret_box_badges` | own | RPC only | — | — |
| `event_config` | authenticated (all) | — | — | — |

### Storage

Bucket `kudo-images` (private). Policy: INSERT/DELETE to own `{uid}/` prefix; SELECT for all authenticated.

---

## Root Providers

`src/app/providers.tsx` exports `RootProviders` — a single client-side wrapper mounted in
`src/app/layout.tsx` that provides:

- `QueryProvider` — single `QueryClient` instance shared across all routes via client-side navigation
- `Toaster` (Sonner, `position="top-center"`, `richColors`) — toast calls from any feature surface here

Individual pages no longer mount their own `QueryProvider`.

---

## i18n

- **Locales:** `vi` (default), `en`
- **Mechanism:** cookie `NEXT_LOCALE`, no URL routing prefix
- **Message catalogs:** `messages/vi.json`, `messages/en.json`
- **Server:** `src/i18n/request.ts` reads cookie → loads catalog
- **Client:** `useTranslations()` from `next-intl` in Client Components
- **Switcher:** `useLanguageSwitcher()` hook — writes cookie, calls `router.refresh()`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌──────────┐  ┌─────────────────────────────────────────┐ │
│  │ Next.js  │  │ Client Components (RootProviders wrap)  │ │
│  │ App      │  │  HomepageConnected, BoardScreen,        │ │
│  │ Router   │  │  KudoComposeModal, TiptapEditor, ...    │ │
│  └────┬─────┘  │  TanStack Query (useQuery/useMutation)  │ │
│       │        └────────────────────┬────────────────────┘ │
└───────┼─────────────────────────────┼─────────────────────┘
        │ Server request              │ Server Actions
        ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Server (App Router)                                │
│                                                             │
│  proxy.ts  session refresh + pre-launch gate + auth guard  │
│  app/login/actions   signInWithGoogle, signInWithPassword   │
│  app/auth/callback   code exchange → redirect /            │
│  features/*/         server actions per feature domain     │
└──────────────────────────┬──────────────────────────────────┘
                           │ @supabase/ssr
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (local / cloud)                                   │
│                                                             │
│  Auth    Google OAuth, session tokens                       │
│  DB      Postgres: 14 tables/views, RLS on all             │
│  RPC     create_kudo() (8-arg), open_secret_box(),          │
│          get_highlight_kudos(), board_leaderboard()         │
│  Storage bucket: kudo-images                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Known Architecture Issues

| ID | Issue | Impact | Resolution |
|----|-------|--------|-----------|
| — | `profiles.department_id` (int, no FK) remains alongside new `department_ref` (uuid FK) | Data integrity; legacy column kept for compat | Drop `department_id` in a future migration after backfill confirmed |
| — | 3 files slightly over 200-line target (`kudo-compose-modal ~270`, `tiptap-editor ~230`, `image-uploader ~210`) | Maintainability | Split on next feature touch |
| — | `kudos_mentions` table not yet migrated | @mention query capability deferred | Migrate when "mentioned in" queries are needed |
