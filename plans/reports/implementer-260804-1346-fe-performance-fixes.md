# Implementer Report — FE Performance Fixes
**Date:** 2026-08-04 | **Branch:** develop | **Plan:** 260804-1120-deploy-fe-be-free-production

---

## Task: FE Performance Optimizations
**Status:** DONE_WITH_CONCERNS

---

## Files Touched

| File | Change | Lines |
|---|---|---|
| `package.json` | Added `@next/bundle-analyzer` devDep + `analyze` script | +2 |
| `next.config.ts` | Wired `createBundleAnalyzer` (guarded by `ANALYZE=true`) | +7 |
| `src/lib/query/query-client.ts` | Added `refetchOnWindowFocus: false` to `makeQueryClient` | +3 |
| `src/app/providers.tsx` | **NEW** — `RootProviders` client component (QueryProvider + Toaster once at root) | +22 |
| `src/app/layout.tsx` | Import + mount `RootProviders` wrapping children | +3 |
| `src/app/board/page.tsx` | Removed `'use client'`, `QueryProvider`, `Toaster` — now Server Component | -10 |
| `src/app/kudos/page.tsx` | Removed `QueryProvider`, `Toaster` (retains `'use client'` for `useState`) | -4 |
| `src/app/countdown/layout.tsx` | Removed `'use client'`, `QueryProvider` — now Server Component pass-through | -7 |
| `src/app/rules/page.tsx` | Removed per-route `QueryProvider` wrapper around `KudoComposeModal` | -3 |
| `src/app/page.tsx` | Removed per-route `QueryProvider`, updated stale comment | -4 |
| `src/app/secret-box/page.tsx` | Removed `QueryProvider` wrapper — now pure Server Component shell | -4 |
| `src/app/profile/page.tsx` | Removed `QueryProvider`, `Toaster` — server component renders `ProfileConnected` directly | -5 |
| `src/app/awards/page.tsx` | Added `export const dynamic = 'force-static'` | +8 |
| `src/features/kudos/components/kudo-compose-modal.tsx` | Replaced static `TiptapEditor` import with `next/dynamic({ ssr: false })` + loading fallback | +22 |
| `src/features/kudos/components/index.ts` | Removed `TiptapEditor` barrel export to prevent accidental re-bundling | -3 |

---

## Checks

- **Typecheck:** `npx tsc --noEmit` — CLEAN (no output, exit 0)
- **Unit tests:** 336 passing, 0 failing (26 test files, Vitest v4.1.10)
- **Production build:** `npm run build` — compiled successfully (Turbopack, 5.5s compile, TypeScript clean)
- **Webpack build:** `npx next build --webpack` — compiled successfully, TypeScript clean

---

## Acceptance Criteria

- [x] **Bundle analyzer wired:** `@next/bundle-analyzer` installed, `npm run analyze` script added (`ANALYZE=true next build --webpack`), guarded by env var — normal `npm run build` unaffected
- [x] **Tiptap lazy-loaded:** `TiptapEditor` wrapped with `next/dynamic(() => import('./tiptap-editor'), { ssr: false })` in `kudo-compose-modal.tsx`. ProseMirror + 7 `@tiptap/*` packages are no longer in any route's initial bundle. Confirmed: `grep -r "@tiptap" src/app/` returns nothing (only comment in modal).
- [x] **`'use client'` removed from route pages:** `app/board/page.tsx` and `app/countdown/layout.tsx` are now Server Components. `app/kudos/page.tsx` retains `'use client'` only because it has `useState` for modal open/close state.
- [x] **QueryProvider consolidated to root:** Single `RootProviders` client component at `src/app/providers.tsx` mounts `QueryProvider` + `Toaster` once. All 6 per-route `QueryProvider` instances removed (`/`, `/board`, `/kudos`, `/countdown`, `/rules`, `/secret-box`, `/profile`).
- [x] **`refetchOnWindowFocus: false`:** Added to `makeQueryClient` default options.
- [x] **`useRecipientSearch` `enabled` guard:** Already present (`enabled: debouncedQuery.trim().length > 0`) — no change needed.
- [x] **Static route `/awards`:** `export const dynamic = 'force-static'` added. Build confirms `○ (Static)`.
- [x] **`/login` skipped (correct):** Reads `searchParams` — opts out of static generation by framework semantics.
- [x] **`/rules` skipped (correct):** `'use client'` page with `useState` — cannot be statically generated.

---

## Route Table: BEFORE → AFTER

| Route | Before | After |
|---|---|---|
| `/awards` | ƒ Dynamic | **○ Static** |
| All others | ƒ Dynamic | ƒ Dynamic (unchanged) |

---

## Bundle Impact (Source-Level Evidence)

Per-route First Load JS terminal numbers are not emitted by Next.js 16 (neither Turbopack nor webpack mode). The analyzer HTML at `.next/analyze/client.html` was generated but `.next/` is access-blocked by `.skignore`.

**Source-level proof of Tiptap split (high-confidence):**
- `@tiptap/*` packages: imported only in `tiptap-editor.tsx`
- `tiptap-editor.tsx`: reached only via `next/dynamic(() => import('./tiptap-editor'), { ssr: false })` — a dynamic import boundary
- No `app/` route file has any `@tiptap` import (confirmed by grep)
- `TiptapEditor` removed from barrel `index.ts`
- Expected impact on `/kudos` initial bundle: ~300–500 KB reduction (Tiptap + ProseMirror, deferred to on-demand load when compose modal opens)

---

## Smoke Test Results

Server already running on port 3000 from a prior session. Tested against production build:

| Route | HTTP Status | Result |
|---|---|---|
| `/login` | 200 | Renders correctly; full HTML with login form, no hydration errors |
| `/board` | 307 | Redirect to login (middleware auth guard, correct) |
| `/awards` | 307 | Redirect to login (auth-guarded, static content correct) |
| `/kudos` | 307 | Redirect to login (correct) |
| `/countdown` | 307 | Redirect to login (correct) |

**RSC payload confirmation:** `/login` HTML contains `$L85 → src/app/providers.tsx [app-client] → RootProviders` — confirms the root provider is correctly mounted in the component tree. `NextIntlClientProvider` wraps `RootProviders` which wraps children. No hydration error strings present.

Compose modal (Tiptap editor mounts on modal open) could not be verified without an authenticated session in this environment. The dynamic import is confirmed structurally — `TiptapEditor` is only reachable via `next/dynamic`.

---

## Deferred (Per Task Spec — Do NOT Do Now)

- 13 unjustified `'use client'` presentational component removals
- `window.prompt` → popover replacement in `tiptap-editor.tsx`
- Tiptap barrel export split (`editor.ts` sub-barrel)

---

## Concerns

1. **First Load JS numbers not measurable** in this environment (Next.js 16 suppresses terminal output; `.next/` access-blocked). The structural fix (dynamic import boundary) is correct and high-confidence, but the exact KB delta requires reading `client.html` from the analyzer or running Lighthouse against the deployed app.

2. **`/kudos/page.tsx` still `'use client'`** because it has `useState` for modal open state. To make it a true Server Component, the modal trigger button would need to move to a client component — a small follow-up refactor. The page is structurally better now (QueryProvider removed) but not a Server Component.

3. **Authenticated smoke test not run** — compose modal editor load (the Tiptap lazy-load code path) requires a logged-in session. Structural correctness is confirmed; runtime behavior of the dynamic import on modal open was not exercised.
