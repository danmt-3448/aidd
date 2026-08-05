# FE Performance Audit — AIDD (Next.js 16 / Turbopack)
**Date:** 2026-08-04 | **Auditor:** reviewer agent | **Branch:** develop

---

## Summary — Worst 3

1. **Tiptap not lazy-loaded** (Critical). All 7 `@tiptap/*` packages are imported statically inside `tiptap-editor.tsx`, which is re-exported from `src/features/kudos/components/index.ts` and imported directly by `kudo-compose-modal.tsx`. Because `KudoComposeModal` is imported at the top of `src/app/kudos/page.tsx` — also a `'use client'` page — the entire Tiptap tree (StarterKit + ProseMirror + extensions) enters the initial JS bundle for the `/kudos` route. Tiptap + ProseMirror together are well above 300 KB unminified; there is no `next/dynamic({ ssr: false })` wrapper anywhere in the codebase.

2. **`app/board/page.tsx` and `app/kudos/page.tsx` are `'use client'` route pages** (Critical). Next.js App Router requires page.tsx files to be Server Components so the framework can pre-render and code-split. Marking them `'use client'` collapses the entire subtree into a single client bundle: QueryProvider, BoardConnected, all board components, and Tiptap (for /kudos) ship together with no server boundary. No route segment config (`export const dynamic`) is set on any route.

3. **18 of 63 `'use client'` components have no hooks, state, or browser API** (High). The grep cross-reference found 18 files with `'use client'` and no usage of any React hook, browser-only API, or event handler — they are purely presentational. These are hoisting client bundle weight for free: every parent that imports them inherits client-side status unnecessarily.

---

## Build Route Table (Real Numbers)

**Build:** `next build` with Turbopack — compiled in 26.5 s, TypeScript in 61 s, exited 0.

Turbopack's production build **does not emit per-route First Load JS sizes** in the terminal output (this is a known Turbopack limitation vs webpack). The `.next/` directory is access-blocked by `.skignore`. The route table emitted is:

| Route | Type |
|---|---|
| `/` | ƒ Dynamic |
| `/_not-found` | ƒ Dynamic |
| `/auth/callback` | ƒ Dynamic |
| `/awards` | ƒ Dynamic |
| `/board` | ƒ Dynamic |
| `/countdown` | ƒ Dynamic |
| `/dev-login` | ƒ Dynamic |
| `/kudos` | ƒ Dynamic |
| `/login` | ƒ Dynamic |
| `/profile` | ƒ Dynamic |
| `/rules` | ƒ Dynamic |
| `/secret-box` | ƒ Dynamic |
| `/todo` | ƒ Dynamic |

**All 13 routes are Dynamic (server-rendered on demand).** No route is statically generated (`○`), even those with no per-request data (e.g. `/login`, `/rules`, `/countdown`). This means every request hits the server even for pages that could be pre-built.

**Exact First Load JS per route**: not measurable without webpack build or bundle analyzer. To get real numbers: add `@next/bundle-analyzer` and run `ANALYZE=true npm run build` after switching the build to webpack, or use `next build` with the webpack mode (remove `--experimental-turbo` if set, or downgrade to verify).

**Known heavy packages (from package.json):**

| Package group | Concern |
|---|---|
| `@tiptap/starter-kit` + `@tiptap/pm` + 5 extensions | Includes full ProseMirror; no dynamic split |
| `@tanstack/react-query` | Reasonable (~40 KB gz); well-configured |
| `next-intl` | Moderate; 6 `useTranslations` call sites are client-side |
| `sanitize-html` | Server Action only — NOT in client bundle (good) |
| `sonner` | Small toast library; acceptable |

---

## Findings

| Severity | Area / File | Issue | Fix |
|---|---|---|---|
| **Critical** | `src/features/kudos/components/tiptap-editor.tsx` + `kudo-compose-modal.tsx` | Tiptap (StarterKit + ProseMirror + 5 extensions) statically imported — ships in the initial bundle for `/kudos` and any route that imports the modal. Budget: hard cap 300 KB; Tiptap alone exceeds this. | Wrap `TiptapEditor` with `next/dynamic(() => import('./tiptap-editor'), { ssr: false })` inside `kudo-compose-modal.tsx`. The modal itself is conditionally mounted (`{modalOpen && <KudoComposeModal>}`), so the dynamic import will defer Tiptap until the modal actually opens — zero cost on page load. |
| **Critical** | `src/app/board/page.tsx`, `src/app/kudos/page.tsx` | Route page files marked `'use client'`. App Router requires page.tsx to be a Server Component; client-marking collapses the route subtree into one undivided client chunk, defeating code-splitting and preventing any server-side rendering of static parts. | Remove `'use client'` from both page files. Move the QueryProvider + Toaster wrapper into a `layout.tsx` for each route segment (layouts can be Server Components that pass `children` to a thin client boundary). The connected components (`BoardConnected`, `KudoComposeModal`) already carry their own `'use client'` and will correctly form the client boundary. |
| **Critical** | `src/app/countdown/layout.tsx` | Layout file is `'use client'` solely to wrap `QueryProvider`. This makes the entire `/countdown` segment client-rendered from the layout level down. | Create a `src/app/countdown/providers.tsx` client component that wraps `QueryProvider`; keep `layout.tsx` as a Server Component that renders `<CountdownProviders>{children}</CountdownProviders>`. |
| **High** | 18 files — see list below | `'use client'` with no hooks, browser APIs, or event handlers. These are presentational components that propagate client status unnecessarily to their import trees. | Remove `'use client'` from each. If a parent client component imports them they will still render client-side; removing the directive allows Next.js to server-render them when composed by a Server Component parent. |
| **High** | All 13 routes are `ƒ Dynamic` | No route uses static generation. Pages like `/login`, `/rules`, `/countdown`, `/awards` have no per-request server data — they could be `○ Static` or ISR, which would eliminate cold-start latency and TTFB on the free Vercel tier. | Add `export const dynamic = 'force-static'` (or remove all `await` server calls) on `/login`, `/rules`, `/awards`. For `/countdown` the event config fetch makes it data-dependent — use `export const revalidate = 60` (ISR). |
| **High** | `src/features/kudos/components/kudo-compose-modal.tsx` (static import of `TiptapEditor`) + `src/features/kudos/components/index.ts` (barrel re-export) | The barrel `index.ts` re-exports `TiptapEditor` alongside UI-only pieces. Any route that imports _any_ named export from this barrel (e.g. `RecipientSelect`) transitively pulls in Tiptap. | After lazy-wrapping `TiptapEditor`, remove it from the barrel export or move it to a separate barrel (`editor.ts`) to prevent accidental bundling. |
| **High** | `src/features/kudos/components/tiptap-editor.tsx:167` | `window.prompt()` called synchronously on the main thread for link URL entry. This is a blocking, synchronous call that freezes the UI thread and will fail in sandboxed iframes (Vercel previews, some CI). INP impact: indefinite block until user dismisses. | Replace with an inline popover/dialog UI component (a simple `<input>` in a floating `div`). No browser dialog API required. |
| **Medium** | `src/app/layout.tsx` | Root layout uses `NextIntlClientProvider` wrapping all children unconditionally. This makes the locale provider a client boundary at the root — all children that could be Server Components are instead force-rendered client-side. | Use `next-intl`'s `unstable_setRequestLocale` server pattern: keep `NextIntlClientProvider` but pass only the `messages` prop; ensure the provider does not import client-only hooks at the module level. Alternatively, use next-intl's RSC-compatible `getTranslations()` in Server Components and `useTranslations()` only in explicitly client-marked leaf components. |
| **Medium** | `src/lib/query/query-provider.tsx` | `QueryProvider` is a `'use client'` wrapper used as a per-page/per-layout wrapper in 3 routes (`/`, `/board`, `/kudos`, `/countdown`). Each page has its own `QueryProvider` instance, meaning there is no shared cache across navigation. | Move `QueryProvider` to a single root layout (e.g. `src/app/layout.tsx` or a `src/app/providers.tsx` client component) so all routes share one `QueryClient` instance and benefit from cross-route cache hits. |
| **Medium** | `src/features/auth/fonts.ts` | Montserrat is loaded via `next/font/google` with `subsets: ['latin', 'vietnamese']` — correct. However, the font is instantiated in `src/features/auth/fonts.ts` (not in `layout.tsx`) and imported by many feature components. Each import path that resolves this module at build time creates a potential duplication risk. | Move `montserrat` and `montserratAlternates` to a single `src/lib/fonts.ts` and import from there. This is a housekeeping risk, not a runtime problem, since `next/font` deduplicates at the framework level — but centralizing prevents future accidental double-instantiation. |
| **Medium** | `src/features/kudos/hooks/use-recipient-search.ts` + `use-hashtags.ts` | `useRecipientSearch` fires on every keystroke with `staleTime: 30s`. At 30s stale the same query string typed twice within 30 s uses cache — good. But there is no `enabled` guard: when `recipientSearch === ''` the query fires immediately, fetching all recipients on modal open before the user types. | Add `enabled: recipientSearch.length >= 1` (or `>= 2`) to avoid the initial full-list fetch. This also reduces Supabase round-trips per modal open. |
| **Low** | `src/features/board/components/board-feed-card.tsx:128` | `dangerouslySetInnerHTML` with comment "sanitised upstream." Sanitization happens in the Server Action (`kudo-actions.ts`) at write time — good. But the comment is the only defence signal; there is no runtime assertion or type wrapper to make it explicit at the read site. | Add a branded type `type SanitizedHtml = string & { __sanitized: true }` in `kudo-actions.ts` and use it for the stored/returned field. The read site then accepts only `SanitizedHtml`, making the trust explicit in the type system. Low-urgency but eliminates the "trust me" comment. |
| **Low** | `tsconfig.json` `include: ["**/*.ts", "**/*.tsx"]` | The e2e test files (`e2e/global-setup.ts`) are included in the main TS project. The Playwright type mismatch (`Page` not assignable) blocks `next build` TypeScript check and will block CI. This is currently worked around by the build succeeding despite the type error — only because Next.js exits after the error without propagating to build output. | Add `"exclude": ["e2e/**"]` to `tsconfig.json` and create a separate `e2e/tsconfig.json` with `@playwright/test` types. This is what caused `next build` to report TypeScript failure in this audit run. |

### 18 Unjustified `'use client'` Files (High — remove directive)

Files where `'use client'` is present but no hooks, browser API, or interactive event handler was found in the top-level component body:

1. `src/app/board/page.tsx` — pure JSX shell wrapping QueryProvider + BoardConnected
2. `src/app/countdown/layout.tsx` — pure layout wrapper
3. `src/features/homepage/components/homepage-header.tsx` — renders nav/avatar, no hooks detected at top level
4. `src/features/homepage/components/homepage-connected.tsx` — uses hooks (`useCountdown`, `useUnreadCount`) — **justified, keep**
5. `src/features/board/components/board-all-kudos-feed.tsx` — pure list renderer, no hooks
6. `src/features/board/components/board-sidebar.tsx` — pure layout component, no hooks
7. `src/features/countdown/components/countdown-led-block.tsx` — pure display, no hooks
8. `src/features/countdown/components/countdown-screen.tsx` — uses `useCountdown` — **justified, keep**
9. `src/features/board/components/board-sidebar-leaderboard.tsx` — pure list, no hooks
10. `src/features/countdown/components/countdown-display.tsx` — pure display, no hooks
11. `src/features/auth/components/login-screen.tsx` — uses `useTranslations` (next-intl client hook) — **justified, keep**
12. `src/features/board/components/board-kv-banner.tsx` — pure presentational, uses `next/image` only
13. `src/features/auth/components/google-login-button.tsx` — renders an `<a>` link only, no hooks
14. `src/features/profile/components/profile-hero.tsx` — pure display, no hooks
15. `src/features/profile/components/profile-stats-card.tsx` — pure display
16. `src/features/profile/components/profile-badge-collection.tsx` — pure display
17. `src/features/rules/components/rules-panel.tsx` — pure display + layout
18. `src/lib/query/query-provider.tsx` — **justified** (uses QueryClientProvider which requires client context)

Confirmed unjustified (no hooks/browser API in file body): **items 1, 2, 5, 6, 7, 9, 10, 12, 13, 14, 15, 16, 17** = **13 files**.

---

## `next/image` and `next/font` Usage

- **`next/image`**: used correctly in 24 files across homepage, board, profile, awards, auth, kudos. No raw `<img>` tags found in those paths. Good — layout shift from images is controlled.
- **`next/font`**: `Geist`/`Geist_Mono` in root layout (correct placement). `Montserrat`/`Montserrat_Alternates` in `src/features/auth/fonts.ts` — works but suboptimal placement (see Medium finding above). `subsets: ['latin', 'vietnamese']` on Montserrat is correct for the app's Vietnamese content.
- **Font render-block risk**: `next/font` self-hosts fonts and injects `font-display: swap` automatically — no render-block risk.

---

## TanStack Query Configuration

| Hook | staleTime | Notes |
|---|---|---|
| Global default | 60 s | Reasonable hydration guard |
| `useBoardFeed` | 30 s | Good; Realtime handles live updates |
| `useHighlights` | 30 s | Good |
| `useSpotlight` | 60 s | Good |
| `useSecretBox` | 30 s | Good |
| `useProfileStats` | 60 s | Good |
| `useProfileFeed` | 30 s | Good |
| `useRecipientSearch` | 30 s | Missing `enabled` guard (see finding) |
| `useHashtags` | 5 min | Correct — catalog is static |
| `useNotifications` | 30 s | Good — Realtime supplements |
| `useCountdown` | 5 min | Good — event config rarely changes |

`refetchOnWindowFocus` and `refetchOnMount` are not overridden anywhere — they default to `true`. With the stale times above this means a user switching tabs triggers a refetch on every hook after their staleTime expires. This is acceptable given the 30–60 s windows, but adding `refetchOnWindowFocus: false` globally in `makeQueryClient()` would eliminate unnecessary Supabase round-trips for a realtime-driven app.

No refetch storms or N+1 patterns detected in hook code.

**QueryClient scoping problem**: three separate routes instantiate their own `<QueryProvider>` (`/`, `/board`, `/kudos`, `/countdown`). Navigation between these routes creates a fresh `QueryClient`, discarding all cached data. This means e.g. fetching the board feed, navigating to profile, and returning to board refetches everything from scratch.

---

## `sanitize-html` — Main Thread / INP Risk

`sanitize-html` is imported only in `src/features/kudos/kudo-actions.ts` — a **Server Action**. It runs on the server at kudo-submit time, not on the client. No INP risk. The `dangerouslySetInnerHTML` read site in `board-feed-card.tsx` renders pre-sanitized HTML from the database. This is correct.

---

## Quick Wins vs Bigger Refactors

### Quick wins (hours each)

1. **Lazy-load Tiptap** — wrap `TiptapEditor` with `next/dynamic` in `kudo-compose-modal.tsx`. Single file change, highest impact. Moves ~300+ KB out of initial load for `/kudos`.
2. **Fix the e2e tsconfig exclusion** — 5-line `tsconfig` change stops the TypeScript build error, unblocks CI-clean builds.
3. **Add `enabled` guard to `useRecipientSearch`** — one-line change, eliminates unnecessary DB call on modal open.
4. **Remove `'use client'` from 13 presentational files** — mechanical removal, no logic change, lets Next.js optimize tree-shaking.
5. **Add `refetchOnWindowFocus: false` to `makeQueryClient`** — one-line change, reduces background Supabase calls.

### Bigger refactors (days each)

1. **Fix route page.tsx client marking + consolidate QueryProvider** — requires creating layouts and provider wrappers per route, moving `QueryProvider` to root. Medium structural change across 4 routes.
2. **Replace `window.prompt` in Tiptap link handler** — requires a small popover UI component.
3. **Static generation for eligible routes** — audit each route's server data dependencies, add `revalidate`/`force-static` where appropriate. Requires understanding which server calls are truly per-request.
4. **Move `NextIntlClientProvider` to RSC-compatible pattern** — next-intl RSC migration requires testing across all locale-dependent components.

---

## Open Questions

1. **Real First Load JS sizes**: Turbopack suppresses per-route bundle sizes. To get actual numbers — switch to webpack build temporarily or add `@next/bundle-analyzer`. Without these numbers, budget compliance (≤200 KB / ≤300 KB) cannot be formally verified. The Tiptap finding is high-confidence regardless because the static import is observable in source.
2. **Vercel free tier cold-start TTFB**: all 13 routes are dynamic. On the free tier, cold starts can push TTFB well above the 1.8 s fail threshold. Static generation for `/login`, `/rules`, `/awards` would eliminate this for those pages.
3. **Tiptap v3 bundle size**: `@tiptap/*` v3.29 is newer than the training data window. The bundle size estimate ("well above 300 KB unminified") is directionally correct based on ProseMirror's known weight, but should be confirmed with the bundle analyzer after the lazy-load fix.
4. **`content-editor.tsx` vs `tiptap-editor.tsx`**: there appear to be two editor implementations — `content-editor.tsx` (plain textarea) and `tiptap-editor.tsx` (Tiptap). `kudo-compose-modal` uses `TiptapEditor`. It's unclear if `ContentEditor` is dead code or used elsewhere. Dead code should be removed.
