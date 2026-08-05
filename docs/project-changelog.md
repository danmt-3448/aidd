# Changelog — SAA 2025 Internal

All significant changes to this project. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Dates and descriptions derived from `git log` (branch `develop`). Commits listed oldest-to-newest per release.

---

## [Unreleased]

_(Nothing merged to main yet — all work is on `develop`.)_

### Changed — Live Board (rework pass 2, 2026-08-05)
- **Card backgrounds (D1):** All feed and highlight cards now use `#FFF8E1` (warm cream) per Figma.
  Highlight cards get a `4px solid #FFEA9E` gold border + `16px` radius; feed cards use `24px` radius,
  no extra border, `40px` padding.
- **Tier badge (D2):** Replaced 3-star SVG system with colored text pill badges. Tier names sourced
  from Figma MM_MEDIA nodes: `1=New Hero` (coral), `2=Rising Hero` (amber), `3=Legend Hero` (gold),
  `4=Super Hero` (violet). `board-types.ts`, `feed-card-tier-badge.tsx`, and `board-card-person-block.tsx`
  updated; all three type-checked to `1 | 2 | 3 | 4`.
- **Action row (D4):** `BoardWriteKudoTrigger` now renders two pill fields side by side — compose
  trigger (flex-1) and "Tìm kiếm profile Sunner" search (fixed ~246px). `onProfileSearch` prop wired
  through `BoardScreen`; integration with router deferred to integration phase.
- **Section eyebrow (D5):** `SectionEyebrow` component ("Sun* Annual Awards 2025", Montserrat 700 24px
  white) added above each of: Highlight Kudos, Spotlight Board, All Kudos section titles.
- **Sidebar (D7):** `rankingLeaderboard` prop removed from `BoardSidebar`, `BoardScreen`,
  `BoardConnected`, `board-connected-helpers` (`ResolvedBoardData` + all `resolveOverrideData` branches),
  and `board-mock`. Figma shows only the gift ("Nhận Quà") leaderboard in the sidebar.
- **Mock data (D6):** `board-mock.ts` expanded from 7 to 12 feed cards with richer Vietnamese content,
  `imageUrls` populated with `/images/board/sample-0{1,2,3}.png` placeholders, diverse tier levels
  including Tier 4, and 18 spotlight nodes. Old `board-figma-spec-brief.md` values superseded by
  MoMorph MCP node data — do not reference the old brief.
- **Tests:** `board-sidebar.test`, `feed-card-tier-badge.test`, `board-feed-card.test` updated to
  match new pill badge API and removed `rankingLeaderboard` prop. 113 board unit tests passing.

### Performance
- **BE indexes + RLS hoisting:** new migration `20260804000000_perf_indexes_and_rpc.sql` — added
  indexes on `kudos.sender_id`, `secret_box_badges(user_id, opened_at)`, `profiles.full_name` (trigram),
  `kudos(created_at, id)`, `notifications(user_id, created_at)`; wrapped `auth.uid()` in `(select auth.uid())`
  across 9 RLS policies so it's evaluated once per statement. EXPLAIN confirms Seq Scans replaced by index scans.
- **Highlight-kudos RPC:** replaced the 2000-row client-side ranking in `getHighlightKudos` with a
  `get_highlight_kudos()` SQL RPC returning the top-5 weighted rows in one query.
- **FE bundle:** Tiptap editor lazy-loaded (`next/dynamic`, `ssr:false`) — ProseMirror + 7 @tiptap
  packages code-split out of the initial `/kudos` load; `QueryProvider`/`Toaster` consolidated to a single
  SSR-safe root instance; `refetchOnWindowFocus:false`; `/awards` statically generated; added
  `@next/bundle-analyzer` (`npm run analyze`).
- **Guidelines:** added `docs/performance-guidelines.md` (budgets + FE/BE checklist + measurement flow).

---

## [0.2.0] — 2026-08-03

### Fixed
- **Kudos compose form reset on reopen:** conditional mount (`{modalOpen && <KudoComposeModal />}`)
  so closing + reopening starts a fresh instance with cleared state.
  (commit `be791ae` · plan concern ID-46/47)
- **Mention render:** `@mention` now displays the person's full name in the editor bubble.
  (commit `be791ae`)

### Added
- **Seed: loginable users for E2E.** `supabase/seed-auth-users.mjs` + `npm run seed:auth` script
  inserts auth users the Playwright suite can sign in as.
  (commit `be791ae`)
- **E2E spec: `e2e/viet-kudo.spec.ts`.** Playwright tests for the Viết Kudo compose flow.
  (commit `be791ae`)

### Changed
- **Workflow tooling:** role-injection workflow + `check-progress` routing added to `.claude/`
  config. No user-facing change.
  (commit `b894bd4`)

---

## [0.1.2] — 2026-07-31

### Fixed
- **Playwright config updated** to latest version. (commit `7ee46d5`)
- **Pixel-perfect Viết Kudo modal:** Lucide icons, community link, spacing aligned to Figma.
  (commit `9ce9e1a`)
- **Dev-login restored** — env-gated (`NEXT_PUBLIC_ENABLE_DEV_LOGIN`) for local testing.
  (commit `26f30ef`)
- **RLS privileges:** `authenticated` role granted SELECT/INSERT on `kudos` and `profiles` tables.
  (commit `dc4e23a`)

### Security
- **Review fixes applied** (adversarial review APPROVE-WITH-FIXES · commit `be791ae`):
  - H1: Added `DELETE` policy to Storage bucket `kudo-images` (orphan cleanup).
  - H2: Link scheme guard in sanitize-html allowlist restricts to `https`/`http`/`mailto`.
  - H3: RPC `SQLSTATE` codes mapped to friendly Vietnamese messages — raw Postgres errors never reach client.
  - UUID regex broadened from v4-only to RFC 4122 to prevent false rejection of seed hashtag UUIDs.

---

## [0.1.1] — 2026-07-31

### Added
- **Viết Kudo feature** — full compose modal on `/kudos`:
  - `RecipientSelect` — debounced autocomplete on `profiles.full_name` (excludes self).
  - `TiptapEditor` — rich-text: bold/italic/strike/list/link/blockquote + `@mention` → HTML.
  - `HashtagPicker` — 1–5 hashtags from catalog.
  - `ImageUploader` — up to 5 jpg/png (≤5 MB) uploaded to Supabase Storage bucket `kudo-images`
    under `{uid}/{kudoId}/` prefix.
  - `AnonymousToggle` — send without revealing identity (optional alias).
  - `SubmitBar` — disabled until recipient + content + hashtag are filled.
- **Server actions:** `createKudo` (auth guard + Zod schema + `sanitize-html` allowlist + atomic
  Postgres RPC), `searchRecipients`, `listHashtags`.
- **TanStack Query hooks:** `useCreateKudo`, `useRecipientSearch`, `useHashtags`, `useCurrentUserId`.
- **Zod schema:** `createKudoSchema` — validates all six fields, content stripped of HTML for
  character count (1–2000).
- **DB migration `20260731000000`:** tables `hashtags`, `kudos`, `kudo_hashtags`, `kudo_images`,
  RLS on all four, Storage bucket + policies, RPC `create_kudo()` (atomic, `security invoker`).
- **DB migration `20260731010000`:** explicit `GRANT` of SELECT/INSERT privileges to `authenticated` role.
- **Seed data:** 10 `auth.users` + `profiles` (via `seed.sql`), 12 hashtags
  (TeamWork, Support, Innovation, Leadership, Ownership, GoAbove, CustomerFirst, Mentorship,
  Quality, Agility, Collaboration, WellDone).
- **Unit tests:** `kudo-schema.test.ts` — 64 passing (happy path + UUID regression + all error branches).
- **DB integration tests:** `supabase/tests/kudo-integration-simple.sql` — 8 passing (RPC writes to
  3 tables atomically, FK/CHECK enforced, cascade delete, seed idempotent).
- **`QueryProvider`** — TanStack Query client provider wired into `/kudos` page.
- **`Sonner` toast** — success/error feedback on kudo submit.

### Removed
- Dev-login magic-link fallback removed from production path.
  (commit `0013183`)

---

## [0.1.0] — 2026-07-30

### Added
- **Login screen** — pixel-perfect from Figma (screen `GzbNeVGJHz`):
  - Keyvisual background with two-layer gradient overlay.
  - "ROOT FURTHER" heading image, intro copy, Google sign-in button.
  - Error state (`?error=1`) rendered via `role="alert"`.
  - Responsive at 375 / 768 / 1024 / 1280 px.
- **Google OAuth flow:**
  - `signInWithGoogle` Server Action → Supabase `signInWithOAuth`.
  - `GET /auth/callback` route — exchanges code for session, redirects to `?next=` or `/todo`.
  - Open-redirect protection in `sanitizeNext` (only allows internal paths starting with `/`,
    not `//`).
- **Route guard (`src/proxy.ts`):** replaces Next.js 15 `middleware.ts`. Redirects
  unauthenticated users to `/login`; authenticated users hitting `/login` → `/todo`.
- **Supabase clients:** `client.ts` (browser), `server.ts` (Server Components/Actions/Route Handlers),
  `middleware.ts` (session refresh in proxy).
- **`profiles` table** (migration `20260730062749`): 1-1 with `auth.users`, trigger
  `on_auth_user_created` auto-creates row on first sign-in. RLS: authenticated SELECT all,
  UPDATE own row only.
- **i18n (next-intl):** cookie-based locale (`NEXT_LOCALE`), no URL prefix. Locales: `vi` (default), `en`.
  Message catalogs in `messages/vi.json` and `messages/en.json`.
- **`LanguageSwitcher`** (`src/components/language-switcher.tsx`) + `useLanguageSwitcher` hook.
- **`dev-login` route** — email+password sign-in, gated by `NEXT_PUBLIC_ENABLE_DEV_LOGIN`.
- **Unit tests (Vitest):** `guard-rules.test.ts`, `login-screen.test.tsx`, `language-switcher.test.ts`,
  `i18n/config.test.ts` — all passing.
- **E2E tests (Playwright):** `e2e/login.spec.ts`.

### Added (project infrastructure)
- **Bootstrap:** `4140ca2` — Next.js 16 App Router scaffold, Tailwind v4, TypeScript,
  Vitest, Playwright, ESLint, Supabase local dev, `@/*` path alias.
  (commit `4140ca2`)
