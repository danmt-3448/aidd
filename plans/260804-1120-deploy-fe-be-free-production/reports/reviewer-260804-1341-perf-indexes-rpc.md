# Reviewer Report — perf-indexes-and-rpc

**Date:** 2026-08-04  
**Reviewer:** reviewer agent  
**Scope:** `supabase/migrations/20260804000000_perf_indexes_and_rpc.sql` · `src/features/board/board-queries.ts` · `src/features/board/board-queries.test.ts`  
**Depth:** Full — every shipped migration read to verify parity

---

## Review Summary

### Scope
- Files reviewed: 3 changed + 6 shipped migrations (parity source of truth)
- Lines: ~210 SQL + ~428 TS + ~526 test
- Depth: full

### Assessment

The change is **safe to ship**. All 9 RLS rewrites are byte-for-byte logically equivalent to the policies they replace — no access widening, no wrong name, no missing clause. The SECURITY DEFINER RPC is correctly scoped, leaks nothing past board-public visibility, preserves anonymous masking exactly, and guards against search_path hijack. The caller rewrite in `board-queries.ts` is correct and removes the 2000-row path entirely. One warning and two suggestions follow; none block deploy.

---

## RLS Parity Table

| # | Policy | Table | Op | Logic-equivalent? | Notes |
|---|--------|-------|----|-------------------|-------|
| 1 | `profiles_update_own` | profiles | UPDATE | YES | USING + WITH CHECK both wrapped; role unchanged |
| 2 | `kudos_insert_own` | kudos | INSERT | YES | Name matches `20260731000000`; WITH CHECK preserved |
| 3 | `kudos_select_own` | kudos | SELECT | YES | Name matches `20260731090000` rewrite; OR logic preserved |
| 4 | `hearts_insert_own` | hearts | INSERT | YES | Both auth.uid() calls in outer + subquery wrapped |
| 5 | `hearts_delete_own` | hearts | DELETE | YES | |
| 6 | `notifications_select_own` | notifications | SELECT | YES | |
| 7 | `notifications_update_own` | notifications | UPDATE | YES | USING + WITH CHECK both wrapped |
| 8 | `secret_box_select_own` | secret_box | SELECT | YES | |
| 9 | `secret_box_badges_select_own` | secret_box_badges | SELECT | YES | |

All 9 policy names match the names in the shipped migrations exactly. No old policy is left alive alongside its replacement (drop-then-create in a transaction; no window for concurrent DML to see an unprotected table).

---

## Critical

None.

---

## Warning

**W-1 — `get_highlight_kudos` grant is `authenticated`-only; anonymous callers get a PostgreSQL error, not an empty result**  
`supabase/migrations/20260804000000_perf_indexes_and_rpc.sql:209`

The migration issues:
```sql
grant execute on function public.get_highlight_kudos(date, int) to authenticated;
```
`anon` (unauthenticated Supabase role) receives no EXECUTE grant. The board highlight widget is board-public — it renders for non-logged-in viewers if the app ever opens that route without a session. When `anon` calls the RPC, PostgREST returns a 403/permission-denied error, not an empty array. Inside the function `auth.uid()` correctly returns null for anon and `liked_by_me` falls to `false` — the logic is correct — but the caller never reaches it.

**Impact:** if the board page is ever accessed without a session (share link, public embed, event kiosk) the highlight widget errors out instead of rendering with `likedByMe=false`.

**Fix:** add one line to the migration (or a follow-up):
```sql
grant execute on function public.get_highlight_kudos(date, int) to anon;
```
If the board is strictly authenticated-only, close this by documenting the decision in the migration comment and ensuring the route enforces auth before calling the RPC.

---

## Suggestions

**S-1 — `p_today` parameter is unused inside the RPC body**  
`supabase/migrations/20260804000000_perf_indexes_and_rpc.sql:148–206`

The function signature accepts `p_today date` and the caller passes `today` from JS. But the SQL body never references `p_today` — there is no `WHERE k.created_at::date = p_today` or similar filter. The RPC currently ranks across **all kudos ever**, not just today's. The comment says "Replaces the 2000-row JS-side ranking" — the old JS path also ranked all kudos (no date filter), so behavior is preserved. But the parameter is dead weight that misleads readers and adds a maintenance hazard if a future date-scoped variant is grafted on without noticing the body does not use it.

**Options:**
- Remove `p_today` from the signature (and the caller) if the intent is all-time ranking.
- Add `WHERE k.created_at::date = p_today` if the intent is today-only highlights (would change behavior — verify against spec first).
- Keep it and add an inline comment: `-- p_today reserved for future date-scoped variant; body ranks all kudos`.

**S-2 — `weighted_score` column returned in the RPC but not used by the caller**  
`src/features/board/board-queries.ts:123–136`

`RpcRow` declares `weighted_score: number` and the DB returns it, but the `map()` at line 149 does not include it in `BoardKudoRow`. This is fine (unused columns are harmless), but the type declaration is dead. Either drop `weighted_score` from `RpcRow` or add it to `BoardKudoRow` if the UI will ever want to display it (e.g. for a score badge). Current state just adds confusion.

---

## Edge Cases Turned Up

1. **`liked_by_me` under `bool_or` with zero hearts:** when `count(h.kudo_id) = 0`, `bool_or(h.user_id = (select auth.uid()))` returns `null` (no rows to aggregate). The `coalesce(..., false)` on line 193–196 of the migration correctly converts this to `false`. Verified correct.

2. **`greatest(p_multiplier - 1, 0)` when `p_multiplier = 0`:** caller passes `sdRow?.hearts_multiplier ?? 1`; `special_day_config` could theoretically store `hearts_multiplier = 0`. `greatest(0 - 1, 0)` = `greatest(-1, 0)` = `0`, so the bonus term is zeroed. Correct — no negative score inflation.

3. **`receiver_id ?? ''` in caller map (line 154):** `receiver_id` is declared `uuid NOT NULL` in the schema — it can never be null from a well-formed kudos row. The fallback `?? ''` is safe dead code; it would only trigger if the RPC somehow returned null for a non-null column (impossible under normal operation). Low risk.

4. **Migration idempotency:** all indexes use `CREATE INDEX IF NOT EXISTS`. The `DROP POLICY IF EXISTS` / `CREATE POLICY` sequence is idempotent for re-runs. `CREATE OR REPLACE FUNCTION` is idempotent. The `CREATE EXTENSION IF NOT EXISTS pg_trgm` is idempotent. Full idempotency confirmed.

5. **`drop policy if exists` for `kudos_select_own`:** the old `kudos_select_authenticated` was already dropped by `20260731090000`. The new migration drops `kudos_select_own` (the replacement). Name is correct; no ghost policy survives.

---

## Done Well

- **RLS hoisting is complete and correct.** All 9 policies identified in the audit are addressed; none missed.
- **`set search_path = public` on the SECURITY DEFINER function** — prevents search_path hijack. Present and correct.
- **Anonymous masking mirrors `kudos_public` view exactly** — `case when is_anonymous then null::uuid / coalesce(anonymous_name, 'Ẩn danh') / null::text`. No accidental sender leakage.
- **`greatest(p_multiplier - 1, 0)` guard** — prevents negative weighted scores if a zero multiplier ever lands in config.
- **`coalesce(bool_or(...), false)`** — clean handling of the zero-hearts null aggregation case.
- **Dead 2000-row code path fully removed** — `board-queries.ts` has no leftover `.limit(2000)` or JS sort. The old path is gone, not commented out.
- **Error boundaries intact** — `getHighlightKudos` wraps both the `special_day_config` fetch and the RPC call in separate error checks, propagating typed error strings, never leaking stack traces.
- **Tests updated correctly** — mocking RPC directly, verifying the mask (`senderId=null`), `likedByMe` passthrough, and error paths. No fake-green patterns.

---

## Actions In Order

1. **Resolve W-1** — decide: board is auth-only (add comment + route guard) or board is public (add `grant execute ... to anon`). This is the only item that could cause a visible runtime error.
2. **Resolve S-1** — remove `p_today` from signature and caller, or add a comment explaining it is reserved. Prevents future misreads.
3. **Resolve S-2** — drop `weighted_score` from `RpcRow` type declaration in `board-queries.ts` if the UI has no use for it.

---

## Numbers

- Type coverage: clean (`tsc --noEmit` reported clean per task context)
- Test coverage: 6 tests cover `getHighlightKudos` (ranking, cap, mask, likedByMe passthrough, RPC error, config error); all 336 tests pass
- Lint findings: 0 reported

---

## Verdict

**SAFE TO SHIP** with W-1 resolved (or consciously deferred with a documented auth-only decision). The RLS change introduces no access widening. The SECURITY DEFINER RPC is correctly bounded. The caller is correct.

---

## Still Unresolved

- Is the board highlight route accessible to unauthenticated users? That answer determines whether W-1 is a blocker or a documentation note.
- `p_today` intent: all-time ranking or today-scoped? (S-1)
