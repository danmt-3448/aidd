# Code Standards — SAA 2025 Internal

> Describes the conventions actually in use in this repo.
> Derived from `CLAUDE.md`, the existing source files, and the two shipped features.
> These are the rules; the code is the evidence.

---

## File Naming

- **All source files**: kebab-case. Examples from the repo:
  - `kudo-compose-modal.tsx`, `recipient-select.tsx`, `guard-rules.ts`
  - `use-create-kudo.ts`, `use-recipient-search.ts`, `query-client.ts`
  - `language-switcher.tsx`, `tiptap-mention-list.tsx`
- Names are self-describing — a name like `hashtag-actions.ts` tells you it's a server
  action module for hashtags without opening it.
- **Never** create `*-enhanced`, `*-v2`, or `*-new` copies. Edit files in place.

---

## File Size

- Hard cap: **200 lines per file**.
- When a file approaches the cap: extract into smaller single-purpose modules.
  - UI widget growing large → extract sub-components.
  - Multiple server actions in one file → split by domain.
  - Shared helpers → move to a `utils` or dedicated module.
- Three files in the current repo slightly exceed this (modal ~270, tiptap-editor ~230,
  image-uploader ~210) — tracked in `docs/system-architecture.md` → Known Issues. Split on
  next touch.

---

## Path Alias

The `@/*` alias resolves to `./src/*` (configured in `tsconfig.json`).

```ts
// correct
import { createClient } from '@/lib/supabase/server'
import { isPublic } from '@/features/auth/guard-rules'

// wrong — relative paths across features
import { createClient } from '../../../lib/supabase/server'
```

Use `@/*` for all cross-module imports. Relative imports are acceptable within the same
feature folder.

---

## Directory Conventions

| Path | Purpose |
|------|---------|
| `src/app/**` | Next.js App Router: pages, layouts, route handlers, server actions colocated with routes |
| `src/features/{feature}/` | Feature-scoped components, hooks, server actions, schemas, fonts |
| `src/features/{feature}/components/` | React components for that feature |
| `src/features/{feature}/hooks/` | Custom React hooks (TanStack Query wrappers, etc.) |
| `src/components/` | Shared components reused across features |
| `src/lib/supabase/` | Supabase client factories (client, server, middleware) |
| `src/lib/query/` | TanStack Query client factory + provider |
| `src/i18n/` | next-intl config and request handler |
| `messages/` | i18n message catalogs (`vi.json`, `en.json`) |
| `supabase/migrations/` | Ordered SQL migrations (filename = timestamp + description) |
| `supabase/` | Supabase CLI config, seeds, integration tests |
| `e2e/` | Playwright E2E specs |
| `docs/` | Project documentation |

---

## TypeScript

- Strict mode is on (`tsconfig.json`).
- No `any` without a comment explaining why.
- Prefer explicit return types on public functions (server actions, hooks).
- Use `z.infer<typeof schema>` to derive types from Zod schemas rather than writing
  duplicate interfaces:
  ```ts
  export type CreateKudoInput = z.infer<typeof createKudoSchema>
  ```
- Server actions export named response types for type-safe consumption by hooks:
  ```ts
  export type CreateKudoSuccess = { ok: true; kudoId: string }
  export type CreateKudoFailure = { ok: false; errors: Record<string, string[]> }
  export type CreateKudoResult = CreateKudoSuccess | CreateKudoFailure
  ```

---

## React Conventions

- **Server Components by default.** Pages that need interactivity opt in with `'use client'`.
- **Server Actions** are marked `'use server'` and colocated with the feature:
  `src/features/kudos/kudo-actions.ts`, `src/app/login/actions.ts`.
- **Client Components** that call server actions do so via TanStack Query mutations
  (`useMutation`), not `useFormState` / `useActionState`.
- Keep components **presentational** where possible — data-fetching hooks live in `hooks/`,
  orchestration in the modal/page.
- Use `useCallback` for handlers passed to child components; avoids unnecessary re-renders
  in modal-heavy UIs.
- **Conditional mount over `isOpen` prop** for resettable forms:
  ```tsx
  {modalOpen && <KudoComposeModal onClose={() => setModalOpen(false)} />}
  ```
  This gives a clean-state instance on every open without manual reset logic.

---

## Styling

- **Tailwind CSS v4** utility-first. No custom CSS files beyond `globals.css`.
- Use `className` for layout, spacing, typography, responsive breakpoints.
- Use `style={{}}` inline for values that come directly from Figma (exact hex colors,
  border-radius, px measurements) so the Figma-to-code mapping stays traceable.
- **Never hardcode** visual values from memory — always pull from MoMorph MCP.
- **Responsive breakpoints** (Tailwind defaults): `sm:640 md:768 lg:1024 xl:1280`.
  Mobile-first. Test at 375 / 768 / 1280 px.
- No fixed `width`/`height` on elements wider than 50% of the viewport.
- `clamp()` for large typographic values on mobile.

---

## Server Actions

- Always mark with `'use server'` at the top of the file.
- Always guard with `supabase.auth.getUser()` before any DB write — never trust the client.
- Validate input with Zod's `safeParse` before calling the database.
- Sanitize user-generated HTML with `sanitize-html` (allowlist) on write, not on read.
- Never let raw Postgres `SQLSTATE` codes reach the client — map them to user-friendly messages.
- Return a typed discriminated union (`{ ok: true, ... } | { ok: false, errors: ... }`)
  rather than throwing.

---

## TanStack Query

- One hook per query/mutation: `use-create-kudo.ts`, `use-recipient-search.ts`, `use-hashtags.ts`.
- `queryKey` convention: `[resource, ...params]` — e.g. `['recipients', debouncedQuery]`,
  `['hashtags', query ?? '']`.
- Use `placeholderData: (prev) => prev` for search queries to avoid flicker on keystroke.
- `staleTime` set explicitly — `60s` for general queries, `5m` for slow-changing catalogs
  (hashtags), `30s` for autocomplete.
- `QueryProvider` is mounted at the page level, not in the root layout — only pages that need
  client-side fetching pay the cost.

---

## i18n

- **Mechanism:** cookie `NEXT_LOCALE`; no URL routing prefix.
- **Locales:** `vi` (default), `en`.
- Server Components: `getLocale()`, `getTranslations()` from `next-intl/server`.
- Client Components: `useTranslations()`, `useLocale()` from `next-intl`.
- Switcher: `useLanguageSwitcher()` writes the cookie then calls `router.refresh()` to
  re-render the full server tree.
- Message keys are nested by screen/component: `login.googleButton`, `login.error`, etc.

---

## Database & Migrations

- Migration filenames: `{timestamp}_{description}.sql` where timestamp is
  `YYYYMMDDHHmmss` (UTC). Example: `20260730062749_create_profiles.sql`.
- One migration = one logical change. Do not combine unrelated schema changes.
- Always include `if not exists` on `create table` and `create index`.
- RLS: enable on every new table. Deny by default — add only the policies needed.
- Security-sensitive functions: use `security definer` + `set search_path = public` to
  prevent search-path hijack.
- Atomic multi-table writes: use a Postgres RPC (`create or replace function`) rather than
  multiple round-trips from the server action.

---

## Testing

### Unit (Vitest)

- Test files colocated with source: `foo.test.ts` next to `foo.ts`.
- Cover: happy path + all validation branches + edge cases.
- Test files follow the same naming convention as source files (kebab-case).
- Current test files:
  - `src/features/auth/guard-rules.test.ts`
  - `src/features/auth/components/login-screen.test.tsx`
  - `src/features/kudos/kudo-schema.test.ts`
  - `src/components/language-switcher.test.ts`
  - `src/i18n/config.test.ts`
- Run: `npm test` (single run) or `npm run test:watch`.

### E2E (Playwright)

- Specs live in `e2e/`.
- One spec file per major user flow: `login.spec.ts`, `viet-kudo.spec.ts`.
- Run: `npm run test:e2e`.
- Seed auth users before E2E runs: `npm run seed:auth`.

### Database Integration

- SQL test files in `supabase/tests/`.
- Run against local Supabase after `npm run db:reset`.

### Rules

- Never use `test.skip`, `--force`, or mocks to bypass a failing test.
- Fix the code, not the test.
- Do not fake a green build.

---

## Git & Commits

- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `style:`.
- Scope in parentheses when useful: `fix(kudos):`, `feat(.claude):`.
- One commit per logical change. Do not bundle unrelated work.
- No secrets in commits (`.env`, API keys, credentials).
- Lint before commit: `npm run lint`.
- Tests pass before push: `npm test && npm run test:e2e`.

---

## Principles

**YAGNI** — build only what the current screen spec calls for. No speculative tables, hooks,
or abstractions for future screens.

**KISS** — prefer the simplest solution that satisfies the acceptance criteria. Avoid
over-engineering.

**DRY** — extract shared logic, but only after the second real use. Premature abstraction
costs more than duplication.
