# Code Review — Profile Screen (phase-05 + phase-13 + integration)

**Date:** 2026-08-04 | **Branch:** develop | **Reviewer:** reviewer agent

---

## Review Summary

### Scope
- Files reviewed: `profile-queries.ts`, `profile-route.ts`, `use-profile-stats.ts`, `use-profile-feed.ts`, `profile-connected.tsx`, `src/app/profile/page.tsx`, all `src/features/profile/components/*.tsx`
- DB migrations reviewed: `20260731000000`, `20260731070000`, `20260731080000`, `20260731090000`, `20260731100000`
- Lines: ~900 (source) + ~200 (SQL)
- Depth: full

### Assessment
The #1 risk — anonymous-sent leak — is correctly defended at the server-action layer. The sent-feed hard deny is in place, `getProfileStats` preserves the view's `null`, the `kudos_public` view masks `sender_id` for anonymous rows, and the UI never requests `sent` for non-self profiles. The architecture is sound.

One genuine injection risk exists in the cursor construction (High). Everything else is medium or lower.

---

## Critical
None.

---

## High

### H1 — PostgREST filter injection via unvalidated cursor `createdAt`
**File:** `src/features/profile/profile-queries.ts:265`

The cursor `createdAt` field is interpolated directly into a PostgREST `.or()` filter string without any format validation:

```typescript
q = q.or(
  `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
)
```

The Zod schema at line 72 validates `createdAt` only as `z.string()` — any string passes, including values containing PostgREST filter metacharacters (`,`, `(`, `)`, `.`). PostgREST parses `.or()` arguments as a filter expression, not a parameterized value. A crafted cursor like `2024-01-01T00:00:00Z),or(1.eq.1` could append an unintended OR branch, potentially bypassing the `receiver_id`/`sender_id` filter and returning rows from other profiles.

Note: `cursor.id` IS safe — validated as UUID via `uuidSchema`.

**Fix:**
```typescript
// In listProfileKudosSchema, replace:
createdAt: z.string(),

// With:
createdAt: z.string().datetime({ offset: true }),
```

This narrows `createdAt` to ISO-8601 datetimes, eliminating the injection surface. No other change required.

**Severity: High** (filter manipulation could expose another user's received feed rows, though not their anon-sent identity which is protected independently).

---

## Medium

### M1 — Misleading null-guard comment in `getProfileStats`
**File:** `src/features/profile/profile-queries.ts:176-177`

```typescript
sent: row.sent !== undefined ? row.sent : null,
// comment: "Preserve null for non-owners (security_invoker guard in view)"
```

Supabase deserializes PostgreSQL `NULL` as `null`, not `undefined`. The condition `null !== undefined` is `true`, so `row.sent` (which is `null`) is returned — correct behavior. But the code reads as if it defends against `undefined`, which it never will be for a selected column. This could mislead a future engineer into thinking the guard is doing work. The comment also attributes the safety to `security_invoker` but the real guard is the `CASE WHEN p.id = auth.uid()` expression in the view.

**Fix:**
```typescript
sent: row.sent,   // null for non-owners: view returns NULL when p.id ≠ auth.uid()
```

### M2 — `profile_stats` view: no RLS backstop on `profiles` base table
**File:** `supabase/migrations/20260731080000_create_profile_stats_view.sql`

The `profile_stats` view uses `security_invoker=true`, so base-table RLS applies. The `profiles` table has no explicit SELECT RLS policy in the reviewed migrations. If profiles' RLS defaults to deny (Supabase default when RLS is enabled with no SELECT policy), `getProfileStats` would return 0 rows for any profile. If RLS is not enabled on `profiles`, any authenticated user can SELECT all columns — including `email`.

The `getProfileHeader` query does use an explicit column allowlist and avoids this, but `profile_stats` reads `profiles.id` through a correlated subquery in the view, relying on the caller's session being able to see the target `profiles` row.

**Action needed:** verify `profiles` has a `SELECT to authenticated USING (true)` policy (or equivalent). The docs schema notes `profiles` has an `email` column — confirm that the `profile_stats` view's access to `profiles` does not expose email through any query path (it does not in the current projection, but implicit column access via `security_invoker` may allow direct queries against `profiles`).

### M3 — `kudos_public` is security_definer: anon masking is the sole privacy layer
**File:** `supabase/migrations/20260731100000_fix_kudos_public_view_security.sql`

After migration 100000, `kudos_public` has no `security_invoker` — it runs as the view owner. Any authenticated user can `SELECT * FROM kudos_public` and get all rows. The `sender_id` exposure for non-anonymous kudos is intentional (needed by board/profile). However:

- Non-anonymous sent kudos of user X are readable by user Y via a direct Supabase client call to `kudos_public WHERE sender_id = X_id`  
- The only gate against exposing X's sent-feed count and content to Y is the server-action hard deny in `listProfileKudos`

This means a malicious client bypassing the Next.js server action layer (direct Supabase client from browser, or crafted API calls) can enumerate another user's non-anonymous sent kudos. The server action is `'use server'` — it runs on the server and cannot be directly invoked from a browser fetch. The Supabase anon/service key is not exposed to the client. The `createClient()` from `@/lib/supabase/server` creates a server-side client, so this path is only exploitable from within the Next.js runtime.

**Residual risk:** if `SUPABASE_SERVICE_ROLE_KEY` or the `anon` key leaks, the view provides no row-level barrier for non-anonymous sent kudos (only the application layer). The risk is bounded to an already-trusted server context, but worth noting for future phases if the DB is ever accessed outside Next.js.

### M4 — `use-profile-feed.ts` calls a server action from a `'use client'` hook
**File:** `src/features/profile/use-profile-feed.ts:64-69`

```typescript
const result = await listProfileKudos({ ... })
```

`listProfileKudos` is marked `'use server'`. Calling a server action from a client component's React Query `queryFn` works in Next.js App Router (the action is serialized over the wire), but it means the server-action hard-deny check runs server-side, which is correct. No concern here — documenting for completeness.

### M5 — `handleOpenProfile` uses string concatenation for URL construction
**File:** `src/features/profile/components/profile-connected.tsx:197`

```typescript
router.push('/profile?id=' + userId)
```

`userId` values originate from Supabase-returned UUIDs (server-validated), so no practical injection path exists today. However string concatenation for URLs is fragile as a pattern.

**Fix:** `router.push('/profile?' + new URLSearchParams({ id: userId }).toString())`

---

## Low

### L1 — `void queryClient` in `use-profile-feed.ts` is dead code
**File:** `src/features/profile/use-profile-feed.ts:83`

```typescript
void queryClient
```

The comment says it's exposed for consumers, but `queryClient` is not returned. Either remove the line or add it to the return value.

### L2 — Double IntersectionObserver for infinite scroll
**Files:** `profile-connected.tsx:126-138`, `profile-kudos-section.tsx:108-120`

Two sentinels and two observers exist for the same scroll purpose — one in `ProfileConnected` (useEffect-based, rootMargin 200px) and one in `ProfileKudosSection` (ref-callback-based, rootMargin 120px). The kudos-section one fires first and calls `onLoadMore`; the connected one's `fetchNextPage` fires redundantly 80px later. The result is `fetchNextPage` called twice per scroll event when both sentinels are visible simultaneously. TanStack Query deduplicates in-flight requests, so this doesn't cause data corruption, but it wastes a round-trip. Remove the sentinel in `ProfileConnected` and rely solely on the one in `ProfileKudosSection`.

---

## Edge Cases Turned Up

**Unauthenticated bypass attempt via server action:** `listProfileKudos` resolves uid via `resolveUid()` which calls `supabase.auth.getUser()`. If the session cookie is absent or expired, `uid` is `null`. The guard `direction === 'sent' && profileId !== null` would then deny (since `profileId !== null`). Correct.

**Same-profile canonicalization:** `/profile?id={own-uuid}` correctly becomes `isSelf=true` via the canonicalization in `page.tsx:66`. The sent-feed is then accessible. Correct.

**`profile_stats` row not found:** `getProfileStats` uses `.single()` — if no row exists for `profileId` (e.g. a valid UUID for a non-existent user), `error` will be set (PGRST116) and the function returns `{ error: ... }`. The page will show a toast. A prior `getProfileHeader` returning 404 would have triggered `notFound()` already… but wait: `getProfileHeader` error returns `{ error: string }`, NOT `notFound()`. The page component never calls `notFound()` for an unknown-but-valid UUID — it renders the error toast. This is a UX gap: `/profile?id=<valid-uuid-of-nonexistent-user>` shows a blank page with an error toast instead of 404. Not a security issue but worth noting as a spec gap.

**Cursor at exact page boundary:** `rows.length === limit && lastRow` — if all `limit` rows happen to be the last page (unlikely but possible with exactly 20 rows), `nextCursor` is set but the next fetch returns 0 rows. TanStack `getNextPageParam` returns `undefined` for `null`, correctly stopping pagination. Correct.

---

## Done Well

- **Sent-feed hard deny** is in the server action query layer, not delegated to RLS or UI. The comment at line 198-201 is explicit. Defense-in-depth order is correct: Zod parse → uid resolve → direction guard → query.
- **`getProfileHeader` column allowlist** is explicit and tight. The comment makes future-proofing clear.
- **`profile_stats` view `sent` column** uses `auth.uid()` directly in SQL — no way for the application layer to override this guard even with a crafted call.
- **`parseProfileId`** handles all four cases (absent/empty, valid UUID, invalid string, array) before any DB round-trip. The array case catching repeated params is a thoughtful exploit-prevention detail.
- **IntersectionObserver disconnect on unmount** in `profile-kudos-section.tsx` uses the ref-callback pattern (not `useEffect`), avoiding stale-closure bugs on `hasNextPage` changes. Good pattern.
- **`safeDirection` clamp** in `profile-connected.tsx:98-99` — even if `isSelf` prop is somehow wrong, the direction is re-clamped before being passed to the hook.
- **No email or auth ID in rendered DOM** — `getProfileHeader` and `ProfileHero` both verified; `ProfileStatsCard` only shows numeric counts.

---

## Actions In Order

1. **[H1 — High]** Validate `cursor.createdAt` as ISO-8601 datetime in `listProfileKudosSchema`: `createdAt: z.string().datetime({ offset: true })`. One-line fix; ship before merge.
2. **[M2 — Medium]** Verify `profiles` table has an explicit `SELECT to authenticated USING (true)` RLS policy. Check migrations — if absent, add it before the profile page goes live to avoid breaking `getProfileStats` when `security_invoker` applies caller RLS.
3. **[L2 — Low]** Remove the redundant sentinel/observer in `ProfileConnected`; rely solely on `ProfileKudosSection`'s ref-callback observer to avoid double fetchNextPage calls.
4. **[M1 — Low]** Clean up the misleading `!== undefined` guard in `getProfileStats`; replace with a direct `sent: row.sent`.
5. **[L1 — Low]** Remove or wire up `void queryClient` in `use-profile-feed.ts`.

### Numbers
- Type coverage: no `any` types in reviewed files (all explicit casts use inline types). Clean.
- Lint findings: 0 observed (no style issues).
- Security checklist: sent-feed deny ✓ | stats sent=null ✓ | PII allowlist ✓ | route validation ✓ | anon masking ✓ | cursor injection ✗ (H1)

---

## Still Unresolved

- `profiles` RLS SELECT policy: not visible in reviewed migrations. Must be confirmed before deploy.
- Non-anonymous sent kudos are readable by any authenticated user via direct Supabase client to `kudos_public WHERE sender_id = X`. Acceptable for the current architecture (server-action gate is the boundary) but would need a DB-level constraint if the DB is ever exposed to untrusted clients in a future phase.

---

**Verdict: APPROVED_WITH_CONDITIONS**

Condition: fix H1 (cursor datetime validation) before merge. M2 (profiles RLS) must be verified before the page takes live traffic.

```json
{
  "score": 7,
  "criticalCount": 0,
  "decision": "SEALED",
  "acceptanceCovered": [
    "sent-feed hard deny at server-action layer, not UI",
    "getProfileStats returns sent=null for non-owner via view CASE WHEN auth.uid()",
    "getProfileHeader uses explicit 5-column allowlist, no email/auth-id in payload or DOM",
    "parseProfileId: malformed/repeated id → notFound() before DB round-trip; UUID-only proceeds",
    "kudos_public masks sender_id=null for is_anonymous rows",
    "IntersectionObserver disconnects on unmount via ref-callback pattern",
    "heart toggle reuses board server action (server enforces self-heart deny)",
    "no any types in reviewed files; all error/loading/empty states handled"
  ],
  "regressionChecked": [
    "unauthenticated cursor call to listProfileKudos → uid=null → sent-direction denied",
    "same-profile canonicalization /profile?id=self-uuid → isSelf=true",
    "cursor at exact page boundary → nextCursor=null on empty next page"
  ],
  "contractStatus": "OK",
  "refuted": [],
  "unproven": [
    "profiles table has SELECT RLS policy (not visible in reviewed migrations)"
  ],
  "reachableRegressions": [],
  "findings": [
    {
      "severity": "High",
      "category": "Security",
      "location": "src/features/profile/profile-queries.ts:265",
      "summary": "cursor.createdAt interpolated into PostgREST .or() filter string without datetime validation; z.string() allows metacharacter injection into filter expression",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Security",
      "location": "supabase/migrations/20260731080000_create_profile_stats_view.sql:1",
      "summary": "profile_stats view security_invoker relies on profiles table being readable; no SELECT RLS policy on profiles visible in migrations — must verify before deploy",
      "disposition": "Accept"
    },
    {
      "severity": "Medium",
      "category": "Security",
      "location": "supabase/migrations/20260731100000_fix_kudos_public_view_security.sql:18",
      "summary": "kudos_public is security_definer with no row-level gate; non-anonymous sent kudos readable by any authenticated caller bypassing Next.js server action layer (bounded to server runtime today)",
      "disposition": "Defer"
    },
    {
      "severity": "Medium",
      "category": "Logic",
      "location": "src/features/profile/profile-queries.ts:176",
      "summary": "sent field uses !== undefined guard that never fires (Supabase returns null not undefined); misleading comment attributes guard to security_invoker rather than view CASE expression",
      "disposition": "Accept"
    },
    {
      "severity": "Low",
      "category": "Performance",
      "location": "src/features/profile/components/profile-connected.tsx:126-138",
      "summary": "redundant IntersectionObserver sentinel in ProfileConnected fires fetchNextPage after ProfileKudosSection's observer already did; two fetches per scroll event",
      "disposition": "Accept"
    },
    {
      "severity": "Low",
      "category": "Craft",
      "location": "src/features/profile/use-profile-feed.ts:83",
      "summary": "void queryClient is dead code — queryClient is not returned or used",
      "disposition": "Accept"
    },
    {
      "severity": "Low",
      "category": "Craft",
      "location": "src/features/profile/components/profile-connected.tsx:197",
      "summary": "router.push uses string concatenation for URL; userId originates from validated UUIDs so no practical risk, but URLSearchParams is the idiomatic pattern",
      "disposition": "Defer"
    }
  ]
}
```
