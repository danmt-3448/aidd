## Code Review — SAA 2025: Awards, Rules, Secret-Box completion (phases 06 + 07)
Reviewer: Code Reviewer (Staff Engineer)
Verdict: APPROVED_WITH_CONDITIONS

Critical: 0
Warning: 2
Suggestion: 2

---

### Scope
- Files reviewed: 12 source + 5 test files
- Lines: ~650 source, ~350 test
- Depth: full — every file in scope read; SQL logic traced step-by-step; surrounding files read for
  context (proxy.ts, guard-rules.ts, query-provider.tsx, query-client.ts, root layout, kudos precedent)

---

## Eight Checks

| # | Check | Status |
|---|-------|--------|
| 1 | Concurrency | PASS — FOR UPDATE row lock in RPC prevents double-open race |
| 2 | Error boundaries | WARN — state query failure silently shows 0 boxes |
| 3 | API contracts | WARN — SQLSTATE matching targets wrong field |
| 4 | Backwards compatibility | PASS — CREATE OR REPLACE, no schema breakage |
| 5 | Input validation | PASS — no client input trusted; RPC re-reads server state |
| 6 | Identity and permission | PASS — auth.uid() null-guard before any data access, server-side |
| 7 | Query efficiency | PASS — parallel queries; bounded by corporate event scale |
| 8 | Data leakage | PASS — raw Postgres errors logged server-side only; friendly strings to client |

---

## Security Focus (phase-06 checklist)

| Requirement | Status |
|-------------|--------|
| SECURITY DEFINER + `search_path=public` | PASS |
| `auth.uid()` null-guard before any data access | PASS |
| `SELECT ... FOR UPDATE` BEFORE count check | PASS — lock at line 35, reject at line 41 |
| Rejects at count 0 or row missing | PASS — `if not found or v_count = 0` |
| Decrements by exactly 1 | PASS |
| Inserts exactly one badge in same transaction | PASS |
| `GRANT EXECUTE ... TO authenticated` | PASS — line 81 |
| Weighted roll server-side only | PASS — single `random()*100` call |
| Cumulative weights sum to 100 | PASS — 30+25+20+10+10+5=100 |
| Thresholds: no gap, no overlap | PASS — [0,30)[30,55)[55,75)[75,85)[85,95)[95,100) |
| `badgeAsset` is an allowlist map | PASS — BADGE_ASSET_MAP, client URL never echoed |
| Revival→placeholder documented workaround | PASS — accepted per review mandate |

---

## Findings

### WARNING — SQLSTATE matching always misses; generic fallback is always returned
File: `src/features/secret-box/secret-box-actions.ts:64-66`

`friendlyRpcError(msg)` receives `error.message`. In the Supabase PostgREST error shape, the
SQLSTATE errcode (`P0101`, `P0102`) lives in `PostgrestError.code`, not in `.message`.
`.message` holds the exception text (`"Bạn cần đăng nhập..."` etc.).

So `msg.includes('P0101')` is always `false`. Every RPC error falls through to the generic
`'Đã xảy ra lỗi. Vui lòng thử lại.'` regardless of cause.

**Security posture is unaffected** — no raw error leaks. The only harm is UX: the user
gets a generic message instead of the specific one.

**Note:** The identical pattern exists in `kudo-actions.ts:54-59` (pre-existing). This change
copies it faithfully. Fix both together or defer.

Fix:
```ts
// Pass the full error object into the mapper
function friendlyRpcError(err: { message: string; code?: string }): string {
  if (err.code === 'P0101') return 'Bạn cần đăng nhập để mở Secret Box'
  if (err.code === 'P0102') return 'Bạn không có Secret Box nào để mở'
  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}

// Call site (line 143):
return { error: friendlyRpcError(error) }
```

---

### WARNING — State query errors silently degrade to "0 boxes" with no user feedback
File: `src/features/secret-box/use-secret-box.ts:48-58`, `components/secret-box-connected.tsx:16-18`

When `getSecretBoxState()` fails (network blip, auth expiry, Supabase down), `stateQuery.isLoading`
becomes `false` and `stateQuery.data` is `undefined`. The hook defaults `unopened = 0` and the
component renders `SecretBoxModal` as if the user has no boxes. No error is surfaced.

A user who actually has boxes to open will see "0 boxes available" and be blocked with no
explanation. This is a confusing silent failure.

Fix — expose a `stateError` in the hook's return and handle it in the connected component:

`use-secret-box.ts`:
```ts
stateError: stateQuery.error?.message ?? null,
```

`secret-box-connected.tsx`:
```tsx
if (stateQuery.isError) {
  return (
    <p role="alert" className="text-center text-sm" style={{ color: '#FFEA9E' }}>
      {stateError ?? 'Đã xảy ra lỗi khi tải Secret Box'}
    </p>
  )
}
```

---

### SUGGESTION — Migration rollback comment should include REVOKE for completeness
File: `supabase/migrations/20260731110000_open_secret_box_rpc.sql:11`

The rollback comment is `-- Rollback: drop function if exists public.open_secret_box();`.
`DROP FUNCTION` implicitly removes all grants on that function — so the REVOKE is not strictly
needed. But for consistency with the team's convention and to make intent explicit:

```sql
-- Rollback:
--   revoke execute on function public.open_secret_box() from authenticated;
--   drop function if exists public.open_secret_box();
```

---

### SUGGESTION — `badgeAsset` fallback in use-secret-box is a silent second-level fallback
File: `src/features/secret-box/use-secret-box.ts:66-68`

```ts
imageSrc: badgeAsset(latestBadgeKey) ?? '/rules/badge-stay-gold.png',
```

`badgeAsset()` already returns `undefined` only for keys not in the allowlist. A badge key from
the DB that is not in the allowlist map would silently show the stay-gold asset with no log entry.
If a new badge key is ever added to the RPC without updating the allowlist, this would be invisible.

Fix — add a server-side warning log in `badgeAsset()` on allowlist miss:
```ts
export function badgeAsset(badgeKey: string): string | undefined {
  const path = BADGE_ASSET_MAP[badgeKey]
  if (!path) console.warn('[badgeAsset] unknown badge key:', badgeKey)
  return path
}
```

---

## Edge Cases Turned Up

1. **`v_count` can never be NULL** — `unopened_box_count NOT NULL DEFAULT 0 CHECK (>= 0)`. The
   DB-level constraint is an independent safety net even if the application logic were bypassed.

2. **No negative count possible** — `FOR UPDATE` serializes concurrent opens for the same user;
   the DB `CHECK (>= 0)` is a belt-and-suspenders guard. Correct.

3. **`random()` edge at exactly 95** — `v_roll < 95` is false, so 95.0 falls to `else` (root-further),
   correct. The bucket [85,95) covers revival at exactly 10%.

4. **QueryProvider singleton** — `getQueryClient()` returns a browser singleton, so even if
   `<QueryClientProvider>` is conditionally mounted/unmounted (rules page, kudo modal), the
   underlying `QueryClient` instance is the same. No double-cache or state duplication hazard.

5. **Rules page renders `KudoComposeModal` inside a conditional `<QueryProvider>`** — the conditional
   mount means the `QueryClientProvider` is created fresh when `composeOpen` transitions to true.
   Because `getQueryClient()` returns the singleton, the cache is warm. No regression.

6. **Awards page is a Server Component** (`no 'use client'`) — it receives `AWARDS` as a prop to
   `<AwardsShowcase>`. This is correct. Static config, no fetching, no hydration risk.

7. **`secret_box_badges` query has no `.limit()`** — for a bounded corporate event this is acceptable.
   Flag for revisit if the event scales or the feature is reused.

---

## Done Well

- **Atomic, tamper-proof RPC** — the step ordering (`FOR UPDATE` → count check → roll → decrement →
  badge insert) is exactly right. The row lock is acquired before the reject condition is evaluated.
  A correctly paranoid implementation.

- **`retry: 0` on the open mutation** — the non-idempotent guard is in place and commented with
  the exact reason. Easy for the next reader to understand why.

- **`open()` guarded at zero AND at `isPending`** — double guard prevents both the zero-box case
  and rapid double-click during in-flight RPC. Correct.

- **`badgeAsset` allowlist is a hard boundary** — no client-supplied path can reach the UI. The map
  is the only path, and the revival placeholder workaround is documented at three levels (action,
  rules-content, test assertion).

- **`GRANT EXECUTE ... TO authenticated`** is in the same migration file as the function — it cannot
  be forgotten or run out of order.

- **Parallel `Promise.all` in `getSecretBoxState`** — box count and badge history fetched
  concurrently; no sequential round-trip.

- **`revalidatePath('/secret-box')` after mutation** — Next.js server-side cache invalidated, so a
  page reload post-open does not show stale data.

- **`not found or v_count = 0` — not just `v_count = 0`** — handles both the missing-row and
  zero-count case in one guard, no separate null check needed due to NOT NULL schema constraint.

- **Static config tests** — `award-config.test.ts` and `rules-content.test.ts` cover all structural
  invariants (count, uniqueness, slug shape, anchor contract). Solid safety net against accidental
  content edits.

---

## Actions In Order

1. **Fix SQLSTATE matching in `friendlyRpcError`** (WARNING) — use `error.code` not `error.message`.
   Fix `kudo-actions.ts` in the same commit (same bug). Affects the UX of every RPC error path.

2. **Expose `stateError` in `useSecretBox` and handle it in `SecretBoxConnected`** (WARNING) —
   prevents silent "0 boxes" degradation when the state query fails.

3. **Add server-side warning log in `badgeAsset` on allowlist miss** (SUGGESTION) — cheap, makes
   badge key drift detectable.

4. **Extend rollback comment to include REVOKE** (SUGGESTION) — cosmetic consistency only.

---

## Numbers

- Type coverage: TypeScript strict is on; no `any` in scope; one documented `as` cast
  (`rpcData = data as { badge_key: string; remaining: number }`) with inline comment — accepted
  pending `supabase gen types`.
- Test coverage: `badgeAsset` — all 6 keys + 3 edge paths; component — 6 scenarios including
  loading, error, clear; static config — all invariants. E2E: 3 unauthenticated redirect tests
  (runnable); 3 authenticated tests skip-gated (expected, known constraint).
- Lint findings: 0 in reviewed files (baseline confirmed).

---

## Verdict Rationale

No CRITICAL findings. The RPC is correctly structured: auth guard, row lock, count check, server-side
roll, atomic decrement + insert, correct GRANT. The allowlist map is enforced. The two WARNINGs are
UX defects (wrong error messages reach users, silent state failure) — not security or data-integrity
issues. Both are fixable in a focused follow-up commit.

**Conditions before merge:**
1. Fix `friendlyRpcError` to read `error.code` (WARNING 1) — or explicitly defer with a linked issue
   noting the pre-existing identical defect in `kudo-actions.ts`.
2. Surface `stateError` in the connected component (WARNING 2) — or explicitly defer.

If deferred with linked issues, APPROVED. Otherwise CHANGES_REQUIRED for the two WARNINGs.
