# System Architecture — SAA 2025 Internal

> Describes the actual running system as of 2026-08-03.
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
/                          src/app/page.tsx              — redirects → /todo (authed) / /login (unauth, via proxy)
/login                     src/app/login/page.tsx         — LoginScreen; guard redirects here if unauthenticated
/auth/callback             src/app/auth/callback/route.ts — OAuth/magic-link code exchange → session
/dev-login                 src/app/dev-login/page.tsx     — email+password (NEXT_PUBLIC_ENABLE_DEV_LOGIN)
/todo                      src/app/todo/page.tsx          — placeholder post-login destination
/kudos                     src/app/kudos/page.tsx         — Viết Kudo compose modal (auth-guarded)
```

All routes except `/login`, `/auth/**`, `/dev-login` are protected. The route guard
(`src/proxy.ts`) enforces this at the edge.

---

## Module Map (`src/`)

```
src/
├── app/                   Next.js App Router pages + route handlers
│   ├── layout.tsx         Root layout: NextIntlClientProvider + Geist fonts
│   ├── globals.css        Tailwind base styles
│   ├── auth/callback/     OAuth callback route handler
│   ├── dev-login/         Dev-only email+password page
│   ├── kudos/             Viết Kudo page (QueryProvider + KudoComposeModal)
│   ├── login/             Login page + signInWithGoogle / signInWithPassword server actions
│   └── todo/              Post-login placeholder
│
├── features/
│   ├── auth/              Auth feature module
│   │   ├── components/    LoginScreen, LoginHeader, GoogleLoginButton, LanguageSelector
│   │   ├── fonts.ts       Montserrat + MontserratAlternates (Google Fonts)
│   │   └── guard-rules.ts PUBLIC_PATHS, isPublic(), sanitizeNext()
│   │
│   └── kudos/             Viết Kudo feature module
│       ├── components/    KudoComposeModal, RecipientSelect, TiptapEditor,
│       │                  TiptapMentionList, HashtagPicker, ImageUploader,
│       │                  AnonymousToggle, SubmitBar, RichTextToolbar, ContentEditor
│       ├── hooks/         useCreateKudo, useRecipientSearch, useHashtags, useCurrentUserId
│       ├── fonts.ts       Montserrat (scoped to kudos modal)
│       ├── kudo-schema.ts Zod schema: createKudoSchema, CreateKudoInput, countContentChars
│       ├── kudo-actions.ts  Server action: createKudo (auth + Zod + sanitize + RPC)
│       ├── recipient-actions.ts  Server action: searchRecipients
│       └── hashtag-actions.ts   Server action: listHashtags
│
├── components/
│   └── language-switcher.tsx  useLanguageSwitcher hook + minimal LanguageSwitcher select
│
├── i18n/
│   ├── config.ts          locales=['vi','en'], defaultLocale='vi', LOCALE_COOKIE='NEXT_LOCALE'
│   └── request.ts         next-intl getRequestConfig — reads NEXT_LOCALE cookie, loads messages
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts      createClient() — browser (createBrowserClient)
│   │   ├── server.ts      createClient() — server async (createServerClient + cookies())
│   │   └── middleware.ts  updateSession() — refreshes Supabase session in proxy
│   └── query/
│       ├── query-client.ts  makeQueryClient(), getQueryClient() — SSR-safe singleton
│       └── query-provider.tsx  <QueryProvider> — mounts QueryClientProvider client-side
│
└── proxy.ts               Route guard + session refresh (Next.js 16 proxy, replaces middleware.ts)
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
                 └─ redirect → /todo (or sanitizeNext(?next=))
```

### Route Guard (every request)

```
Request → src/proxy.ts
  └─ updateSession(request)         // refresh Supabase session cookie
       └─ supabase.auth.getUser()   // validate token with Auth server
            ├─ user + path=/login   → redirect /todo
            ├─ !user + !isPublic    → redirect /login
            └─ otherwise            → NextResponse.next()
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
            ├─ supabase.auth.getUser()          // auth guard
            ├─ createKudoSchema.safeParse(input) // Zod validation
            ├─ sanitizeHtml(contentHtml, ...)    // strip disallowed tags
            └─ supabase.rpc('create_kudo', ...) // atomic Postgres RPC
                 └─ INSERT kudos + kudo_hashtags + kudo_images (1 transaction)
                      └─ returns kudoId → toast.success + modal close + form reset
```

---

## Database (Supabase Postgres)

Tables in scope today (migrations applied):

| Table | Migration | Purpose |
|-------|-----------|---------|
| `profiles` | `20260730062749` | Sunner profiles, 1-1 with `auth.users` |
| `hashtags` | `20260731000000` | Tag catalog (12 seeded) |
| `kudos` | `20260731000000` | Kudo records (sender/receiver/content_html) |
| `kudo_hashtags` | `20260731000000` | M-N kudos ↔ hashtags (max 5) |
| `kudo_images` | `20260731000000` | Storage paths for attached images (max 5) |

Tables in schema but not yet migrated: `kudos_likes`, `secret_boxes`, `badges`, `user_badges`,
`departments`, `kudos_mentions`, `special_days`, `awards` — see `docs/database-schema.md`.

### RLS Summary

| Table | SELECT | INSERT | UPDATE |
|-------|--------|--------|--------|
| `profiles` | authenticated (all) | trigger only | own row |
| `hashtags` | authenticated (all) | — | — |
| `kudos` | authenticated (all)* | own `sender_id` | — |
| `kudo_hashtags` | authenticated (all) | via owned kudo | — |
| `kudo_images` | authenticated (all) | via owned kudo | — |

*`kudos` SELECT exposes `sender_id` even for anonymous kudos — masking required before Live board ships (see known issues).

### Storage

Bucket `kudo-images` (private). Policy: INSERT/DELETE to own `{uid}/` prefix; SELECT for all authenticated.

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
│  │ Next.js  │  │ Client Components                       │ │
│  │ App      │  │  LoginScreen, KudoComposeModal,         │ │
│  │ Router   │  │  TiptapEditor, ImageUploader, ...       │ │
│  └────┬─────┘  │  TanStack Query (useQuery/useMutation)  │ │
│       │        └────────────────────┬────────────────────┘ │
└───────┼─────────────────────────────┼─────────────────────┘
        │ Server request              │ Server Actions
        ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Server (App Router)                                │
│                                                             │
│  proxy.ts           route guard + session refresh           │
│  app/login/actions  signInWithGoogle, signInWithPassword    │
│  app/auth/callback  code exchange                           │
│  features/kudos/    createKudo, searchRecipients,           │
│    *-actions.ts     listHashtags                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ @supabase/ssr
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase (local / cloud)                                   │
│                                                             │
│  Auth   Google OAuth, session tokens                        │
│  DB     Postgres: profiles, kudos, hashtags, ...            │
│  RPC    create_kudo() — atomic transaction                  │
│  Storage  bucket: kudo-images                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Known Architecture Issues

| ID | Issue | Impact | Resolution |
|----|-------|--------|-----------|
| M3 | `kudos_select_authenticated USING(true)` exposes `sender_id` for anonymous kudos | Security — Live board must not ship with this | Column-level policy or view before Phase 4 |
| — | `profiles.department_id` has no FK constraint yet | Data integrity | Wire when `departments` table is migrated |
| — | 3 files slightly over 200-line target (`kudo-compose-modal ~270`, `tiptap-editor ~230`, `image-uploader ~210`) | Maintainability | Split on next feature touch |
