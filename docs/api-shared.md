# API Reference — Shared APIs

Cross-cutting APIs used by multiple screens. All server actions are `'use server'` files.
See also: [API by Screen](./api-by-screen.md)

---

## Auth guard pattern

**File:** `src/lib/supabase/server.ts:1`, used in every `*-actions.ts`

```ts
export async function createClient(): Promise<SupabaseClient>
```

`createClient()` returns a cookie-backed Supabase client (`@supabase/ssr`). Every server action that requires auth calls `supabase.auth.getUser()` and returns an error discriminated union if `user` is null. Raw Postgres errors never surface to the caller; each action maps SQLSTATE codes to friendly Vietnamese strings before returning.

**Pattern (server action):**
```ts
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) return { ok: false, errors: { _root: ['...'] } }
```

**Used on:** every protected screen.

---

## Route guard — `src/proxy.ts`

**File:** `src/proxy.ts:18`

Next.js 16 route guard (replaces `middleware.ts`). Execution order per request:

1. `?ui_state=` present in dev → bypass all guards (UI-gate mock support).
2. `updateSession()` — refresh Supabase cookie session.
3. Auth fast-path: logged-in on `/login` → `/`; unauthenticated on protected path → `/login` (no DB query on this branch).
4. Pre-launch gate: reads `event_config.event_start_at` + `profiles.is_admin` in parallel. If `now < event_start_at` and not admin → `/countdown`. Fail-open on missing/unreadable config.

**Bypass paths** (never gated): `/countdown`, `/login`, `/auth`, `/dev-login`.
**RLS note:** `event_config` is anon-readable (`20260805020000`), but `profiles.is_admin` requires `authenticated`. Unauthenticated visitors skip the admin check and go straight to `/login` via the auth fast-path.

---

## `profiles` table + `handle_new_user` trigger

**Migration:** `supabase/migrations/20260730062749_create_profiles.sql`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | `text` | From OAuth metadata |
| `full_name` | `text` | From `raw_user_meta_data.full_name` or `.name` |
| `avatar_url` | `text` | From `raw_user_meta_data.avatar_url` or `.picture` |
| `department_id` | `integer` | Nullable; no FK yet |
| `title` | `text` | Job title |
| `kudos_received_count` | `integer NOT NULL default 0` | Denormalized counter |
| `kudos_sent_count` | `integer NOT NULL default 0` | Denormalized counter |
| `hearts_received` | `integer NOT NULL default 0` | Denormalized; view is authoritative |
| `star_level` | `integer NOT NULL default 0` | |
| `is_admin` | `boolean NOT NULL default false` | Pre-launch gate bypass |
| `created_at` | `timestamptz NOT NULL default now()` | |

**RLS:**
- `SELECT` — `authenticated` sees all profiles.
- `UPDATE` — own row only (`auth.uid() = id`).

**`handle_new_user()` trigger** (`AFTER INSERT ON auth.users`): SECURITY DEFINER, inserts into `profiles` on first OAuth sign-in. `ON CONFLICT (id) DO NOTHING` makes it idempotent.

**Used on:** /board sidebar, /profile, /kudos recipient autocomplete, `src/proxy.ts` admin check.

---

## `kudos_public` view

**Migration:** `supabase/migrations/20260731070000_create_kudos_public_view.sql`

`SECURITY INVOKER` view (caller's RLS context). Masks anonymous sender identity:

| Column | Anonymous kudo | Non-anonymous kudo |
|---|---|---|
| `sender_id` | `null` | sender UUID |
| `sender_name` | `anonymous_name ?? 'Ẩn danh'` | `profiles.full_name` |
| `sender_avatar_url` | `null` | `profiles.avatar_url` |
| `receiver_id` | always visible | always visible |
| `receiver_name` | always visible | always visible |
| `receiver_avatar_url` | always visible | always visible |

Also exposes: `id`, `content_html`, `created_at`, `is_anonymous`.

**GRANT:** `SELECT` to `authenticated`. Base-table RLS (`kudos_select_own`) is bypassed for feed reads through this view; the GRANT on the view itself is the gate.

**Used on:** /board feed, /board highlights, /profile feed, spotlight word-cloud.

---

## `profile_stats` view

**Migration:** `supabase/migrations/20260811030000_weighted_hearts_received.sql` (latest body; original `20260731080000`)

`SECURITY INVOKER`. Keyed by `user_id`.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | Equals `profiles.id` |
| `received` | `bigint` | Count of kudos where `receiver_id = user_id` |
| `sent` | `bigint \| null` | Only non-null when `p.id = auth.uid()` (privacy guard) |
| `hearts_received` | `bigint` | **WEIGHTED** — normal heart = 1, special-day heart = `hearts_special_multiplier`. **Credited to kudo SENDER** (`k.sender_id = p.id`). Formula: `count + count(is_special_day) * (M - 1)` |
| `boxes_opened` | `bigint` | Count of `secret_box_badges` rows |
| `boxes_remaining` | `bigint (coalesce 0)` | From `secret_box.unopened_box_count` |

**`hearts_received` semantics (important):** per spec C.4.1, the Sunner who *sends* a kudo gets credited for the hearts that kudo accumulates. The view's `hearts_received` sums hearts on kudos where `k.sender_id = p.id`, not `k.receiver_id`. Self-like is blocked by the `toggle_heart` RPC.

**GRANT:** `SELECT` to `authenticated`.

**Used on:** /profile stats, /board sidebar (`use-board-user-stats.ts` → `getProfileStats`).

---

## `create_kudo` RPC

**Migration:** `supabase/migrations/20260811020000_create_kudo_receiver_check.sql` (final body; adds P0007 receiver-exists check over `20260804010000`)
**Wrapper:** `src/features/kudos/kudo-actions.ts:67`

```sql
create_kudo(
  p_kudo_id        uuid,
  p_receiver_id    uuid,
  p_content_html   text,
  p_is_anonymous   boolean,
  p_anonymous_name text,
  p_hashtag_ids    uuid[],
  p_image_paths    text[],
  p_danh_hieu      text
) returns uuid
```

`SECURITY INVOKER`. Resolves caller via `auth.uid()`. Atomic: inserts into `kudos` + `kudo_hashtags` + `kudo_images` in one transaction.

**Error codes:**

| Code | Condition |
|---|---|
| `P0001` | Not authenticated |
| `P0002` | Receiver = sender |
| `P0003` | `hashtag_ids` length not in 1–5 |
| `P0004` | A hashtag UUID does not exist |
| `P0005` | `image_paths` length > 5 |
| `P0006` | An image path is not under the caller's uid folder |
| `P0007` | Receiver does not exist in `profiles` |

**Client-side validation** (Zod, `src/features/kudos/kudo-schema.ts:74`):
- `contentHtml`: stripped plain-text 1–2000 chars
- `hashtagIds`: 1–5 UUIDs
- `imagePaths`: 0–5 strings, default `[]`
- `danhHieu`: 1–200 chars, required
- `isAnonymous`: boolean, default `false`
- `anonymousName`: string max 100, optional

**Server action `createKudo`** (`kudo-actions.ts:67`):
- Auth guard → Zod validation → `sanitize-html` on `contentHtml` → RPC call
- On RPC error: orphan-image cleanup (best-effort `storage.remove`)
- P0007 maps to `errors.receiverId`; others map to `errors._root`
- Returns `{ ok: true; kudoId: string }` or `{ ok: false; errors: Record<string, string[]> }`

**GRANT:** `EXECUTE` to `authenticated`.

**Used on:** /kudos compose modal, /board?modal=compose.

---

## `toggle_heart` RPC

**Migration:** `supabase/migrations/20260811010000_toggle_heart_rpc.sql`
**Wrapper:** `src/features/board/heart-actions.ts:64`

```sql
toggle_heart(p_kudo_id uuid)
returns table(liked boolean, heart_count int)
```

`SECURITY DEFINER`. Atomic idempotent like/unlike in one transaction. Races handled via `ON CONFLICT DO NOTHING`.

**Business rules:** 1 like per user per kudo. Sender cannot like own kudo. Special-day stamp set at INSERT time from `special_day_config.event_date = current_date`.

**Error codes:**

| Code | Condition |
|---|---|
| `P0001` | Not authenticated |
| `P0007` | Kudo not found |
| `P0008` | Cannot heart own kudo |

**Server action `toggleHeart`** (`heart-actions.ts:64`):
- Validates UUID input → auth guard → `supabase.rpc('toggle_heart').single()`
- Returns `{ data: { liked: boolean; heartCount: number } }` or `{ error: string }`

**GRANT:** `EXECUTE` to `authenticated`.

**Used on:** /board feed cards, /board highlight carousel.

---

## `hashtag-actions.ts` — `listHashtags`

**File:** `src/features/kudos/hashtag-actions.ts:14`

```ts
listHashtags(query?: string): Promise<HashtagResult[]>
// HashtagResult = { id: string; name: string }
```

Auth-guarded (returns `[]` when unauthenticated). Reads `hashtags` table, ordered by name ascending. When `query` is provided, applies `ILIKE '%query%'` filter. Returns empty array on error (non-throwing).

**Used on:** /kudos compose hashtag dropdown, /board hashtag filter.

---

## `recipient-actions.ts` — `searchRecipients`

**File:** `src/features/kudos/recipient-actions.ts:17`

```ts
searchRecipients(query: string): Promise<RecipientResult[]>
// RecipientResult = { id: string; full_name: string; avatar_url: string | null }
```

Auth-guarded (returns `[]` when unauthenticated). Reads `profiles` table with `ILIKE '%query%'` on `full_name`, excludes `auth.uid()`, limit 10. `pg_trgm` index active (`idx_profiles_full_name_trgm`, migration `20260804000000`). Returns `[]` on empty query or error.

**Used on:** /kudos compose recipient autocomplete.

---

## `board-department-queries.ts` — `listDepartments`

**File:** `src/features/board/board-department-queries.ts:26`

```ts
listDepartments(): Promise<ListDepartmentsResult>
// ListDepartmentsResult = { data: DepartmentRow[] } | { error: string }
// DepartmentRow = { id: string; name: string }
```

Auth-guarded (server Supabase client). Reads `departments` table ordered by name. RLS: `departments_select_authenticated`. `staleTime` in hook: 5 min (data changes rarely).

**Used on:** /board department filter dropdown.

---

## `event_config` table + `getEventConfig`

**Migration:** `supabase/migrations/20260731020000_create_event_config.sql`
**Action:** `src/features/event/event-actions.ts:24`

Singleton table (`id = 1 CHECK (id = 1)`):

| Column | Type | Notes |
|---|---|---|
| `id` | `smallint PK` | Always 1 |
| `event_start_at` | `timestamptz NOT NULL` | Pre-launch gate threshold |
| `hearts_special_multiplier` | `int NOT NULL default 1` | Set to 2 by `20260811030000` |
| `updated_at` | `timestamptz NOT NULL` | |

**RLS:** `SELECT` to `authenticated` (original); `SELECT` to `anon` added by `20260805020000` (countdown anon access).

```ts
getEventConfig(): Promise<EventConfig | null>
// EventConfig = { eventStartAt: string; heartsSpecialMultiplier: number }
```

Returns `null` when row is missing or query fails (fail-closed: callers render `--:--:--` and lock nav). No auth check — anon-readable by RLS.

**Used on:** /countdown (`useCountdown`), `src/proxy.ts` pre-launch gate, `profile_stats` view weighted hearts formula.

---

## Notifications — actions + trigger

**Action file:** `src/features/notifications/notification-actions.ts`
**Trigger migration:** `supabase/migrations/20260731120000_notify_on_kudo_insert.sql`

### `notify_on_kudo_insert` trigger

`AFTER INSERT ON kudos`, SECURITY DEFINER. Branches on `is_anonymous` before any sender lookup to prevent identity leak. Inserts into `notifications(user_id, type, title, link)`:
- Anonymous kudo: `title = 'Bạn nhận được một Kudo ẩn danh'`
- Named kudo: `title = '{sender.full_name} đã gửi cho bạn một Kudo'`
- `link = '/kudos'`, `type = 'kudo_received'`

### `getUnreadCount`

```ts
getUnreadCount(): Promise<{ data: number } | { error: string }>
```

Returns 0 (not error) for unauthenticated callers. Counts `notifications` where `is_read = false`.

### `listNotifications`

```ts
listNotifications(opts?: { limit?: number; cursor?: NotificationCursor | null })
  : Promise<{ data: Notification[]; nextCursor: NotificationCursor | null } | { error: string }>
// Notification = { id, user_id, type, title, body, link, is_read, created_at }
// NotificationCursor = { createdAt: string; id: string }
```

Keyset paginated on `(created_at DESC, id DESC)`. Returns unauthenticated callers `{ data: [], nextCursor: null }`. Fetches `limit + 1` rows to detect next page without COUNT.

### `markRead`

```ts
markRead(id: string): Promise<{ ok: true } | { error: string }>
```

Validates UUID, sets `is_read = true` where `id = ? AND user_id = auth.uid()`.

### `markAllRead`

```ts
markAllRead(): Promise<{ ok: true } | { error: string }>
```

Sets `is_read = true` for all unread rows belonging to the calling user.

**RLS:** `notifications_select_own` + `notifications_update_own` (caller's `user_id`). Realtime: `notifications` in `supabase_realtime` publication.

**Used on:** homepage bell badge, /notifications page.

---

_Verified against source: 2026-08-11_
