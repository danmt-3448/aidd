---
reviewer: plan-reviewer (adversarial, security lens)
date: 2026-08-03
plan: 260803-1636-saa2025-remaining-7-screens
lens: RISK & SECURITY
verdict: APPROVED_WITH_CONDITIONS
---

# Risk & Security Audit — SAA 2025 Remaining 7 Screens

## Scope
- Files reviewed: plan.md + phase-01 through phase-17, clarifications.md
- Existing migrations: create_profiles.sql, create_kudos.sql, grant_kudos_privileges.sql
- Depth: full adversarial read of all load-bearing security claims

---

## Assessment

The three load-bearing security claims are structurally sound and well-designed. The plan correctly isolates authority to the DB layer and uses the right primitives (SECURITY DEFINER, row locks, caller-scoped views). Four issues require pre-build resolution: one Critical (Realtime RLS bypass on raw table channels), one High (anon sender leaks through the existing raw-kudos SELECT policy), and two Warnings. The E2E session-injection gap is real but credibly gated at phase-16; it does not block the build.

---

## Critical

### C1 — Supabase Realtime broadcasts raw `kudos` rows, bypassing `kudos_public` mask
**Location:** phase-04 (board Realtime) + phase-03 (notification trigger interaction)

Supabase Realtime `postgres_changes` publishes rows from the **base table** (`public.kudos`), not from views. The existing `kudos_select_authenticated USING(true)` RLS policy means that any authenticated client subscribing to `postgres_changes` on `public.kudos` will receive full rows including `sender_id` — **even for `is_anonymous = true` rows**. The `kudos_public` view only masks the sender when rows are read via SQL queries, not when they stream via Realtime.

Phase-04 specifies subscribing to `postgres_changes` on `kudos` (INSERT) and `hearts` (INSERT/DELETE) to invalidate the board feed. If the subscription payload is ever passed to the UI directly (or if the developer naively destructures the Realtime event to pre-populate the feed), the raw `sender_id` leaks client-side.

**Attack path:** Authenticated attacker subscribes `postgres_changes` on `public.kudos` — Supabase streams full row on every kudo INSERT, including `sender_id` for anonymous kudos. The attacker reads the payload directly from the Realtime channel, no SQL needed.

**Fix — two-pronged required:**
1. Realtime publication for `kudos` must be set to **row-level filtered** using a Realtime policy that nullifies `sender_id` before broadcast. Supabase supports this via `realtime.messages` + custom policies in newer versions, but the simpler correct approach for Supabase Realtime v1 is: **subscribe to `kudos` Realtime for invalidation signals only** — the handler must call `invalidateQueries` and re-fetch through `kudos_public`, never touch the event payload for display data. This must be an explicit implementation constraint in phase-04.
2. Add a note in phase-01 that `kudos` must **not** be added to a Realtime publication that sends full row payloads to clients. The publication should either: (a) include only the `id` and `created_at` columns (Supabase supports column-level filtering in `supabase_realtime` publication), or (b) use `notifications` table events instead of raw `kudos` events to push board updates (the `notifications` table is already caller-scoped).

**Recommended fix for phase-04:** Replace `postgres_changes` on `kudos` with a pattern that triggers on `notifications` (already INSERT-per-receiver and RLS-scoped to `user_id`), or explicitly constrain the Realtime subscription handler to use `payload.new.id` only, immediately discarding the rest and re-fetching through `kudos_public`.

---

## High

### H1 — Existing `kudos_select_authenticated USING(true)` remains active alongside `kudos_public`
**Location:** `supabase/migrations/20260731000000_create_kudos.sql:67`, phase-01

The plan says `kudos_public` is "the ONLY read path." But the existing RLS policy `kudos_select_authenticated` (`USING(true)`) is still in place. Any code that queries `public.kudos` directly (PostgREST: `supabase.from('kudos').select(...)`) will succeed and return raw `sender_id` — RLS does not block it, it just returns all rows.

Phase-04 plans to enforce "all feed reads go through `kudos_public`" at the application layer, and phase-17 includes a final audit. But there is no migration step that **revokes SELECT on `public.kudos` from `authenticated`** or **drops the open SELECT policy**. A developer error, a future feature, or a query-builder autocompletion will query `kudos` directly and the mask will silently not apply.

**Attack path:** Developer writes `supabase.from('kudos').select('*')` in any query — returns `sender_id` for all rows including anonymous ones. RLS does not stop it.

**Fix required in phase-01:** Add a migration step:
```sql
-- Revoke direct SELECT on kudos from authenticated; all reads must go through kudos_public
drop policy if exists "kudos_select_authenticated" on public.kudos;
create policy "kudos_select_own_only"
  on public.kudos
  for select
  to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());
```
This allows a sender to read their own sent kudos (needed for kudo compose confirmation) and a receiver to read their received kudos — but blocks the broad `USING(true)` that leaks anonymous senders. The `kudos_public` view then becomes the only path for board/profile feeds where callers are neither sender nor receiver.

Alternatively, if the "sender sees own anonymous kudo" use case is not needed: drop the policy entirely and grant SELECT only on the view. Either way, the broad open policy must be closed.

### H2 — `profile_stats` as a view with `SECURITY INVOKER` does not guarantee sent-null for other users
**Location:** phase-01, Requirements §Views §8

The plan specifies `profile_stats` as a `SECURITY INVOKER` view that "hides other users' `sent` count." SECURITY INVOKER means the view runs with the calling user's privileges and RLS context. The CASE expression `WHEN user_id = auth.uid() THEN count(sent) ELSE NULL END` in the view definition achieves the goal correctly — **but only if the view is implemented correctly**.

The risk: if the view is implemented as a plain JOIN without the caller-scoped CASE, and RLS on the underlying `kudos` table still has `USING(true)` (see H1), a query `SELECT sent FROM profile_stats WHERE user_id = $other_id` returns real sent counts for others.

This is a **design-correct but implementation-fragile** pattern. The plan's success criteria verify `sent = NULL` for other users, which will catch the regression — but only if the DB-integration test is actually run first (before phase-15 integration ships data to the UI).

**Mitigation required:** Phase-01 success criteria must include a SQL-level assertion (not just an application-level test), and the binary test `profile_stats for user A queried as user B returns sent = NULL for A` must run in a DB integration context (not a mock) before integration phase begins. Already in plan; verify it is not marked as skippable.

---

## Warning

### W1 — `notify_on_kudo_insert` trigger leaks sender identity if implemented carelessly
**Location:** phase-03

The trigger writes `title` for notifications. The plan correctly specifies "anon-safe title CASE." However, the trigger function is SECURITY DEFINER and has access to the full `kudos` row (including `sender_id`, `is_anonymous`, `anonymous_name`). If the developer writes the title as:
```sql
title := (select full_name from profiles where id = NEW.sender_id);
```
instead of:
```sql
title := case when NEW.is_anonymous then 'Bạn nhận được một Kudo ẩn danh'
              else (select full_name from profiles where id = NEW.sender_id) end;
```
...sender identity leaks via the notification title. The notification is then delivered to the receiver via Realtime, exposing the sender name client-side.

**Mitigation:** The success criterion "Anonymous kudo notification title contains no sender name" already covers this. Ensure the DB-integration test asserts the exact title string for an anonymous kudo, not just "no error."

### W2 — `open_secret_box` replay via network retries / client-side retry logic
**Location:** phase-06

The row lock `SELECT ... FOR UPDATE` correctly handles concurrent double-click within one transaction. However, the plan does not address application-level retries: if the Next.js server action (or TanStack Mutation's `retry` config) automatically retries a failed network request, a single user intent can fire the RPC twice. The first call succeeds (decrement to N-1, insert badge); the second call, if the DB transaction committed, reads N-1 and either decrements again (if N-1 > 0) or returns "no box." For N=1: fine. For N=2: two boxes opened from a single click.

**Mitigation:** Set `retry: 0` on the `openSecretBox` mutation. The plan already shows "disable open when unopened=0" in the hook, but does not mention disabling retries. Add this as an explicit implementation note in phase-06 or phase-16 (test: verify that mutation retry count is 0).

---

## Suggestion

### S1 — Rate limiting absent on heart toggle and box open
Neither the heart toggle nor the open-box RPC has any rate-limit defense. Heart spam: an attacker can script 1000 requests/second to `toggleHeart` — each one does an INSERT+DELETE cycle on the `hearts` table, burning DB connections and inflating the Realtime event stream. Box open: rate-limit is less critical because the count acts as a natural cap, but a bot hammering `open_secret_box` against a seeded account would generate noise.

For an internal event tool this is acceptable risk, but worth noting: Supabase Edge Functions or a simple server-action rate-limit guard (token bucket keyed to `uid`) would close the vector. Out of scope for this plan but should be flagged for production hardening.

### S2 — `getProfileHeader` field allowlist needs explicit enforcement
Phase-05 specifies "no email/auth-id" in the header. The `profiles` table contains `email` (stored from OAuth). The allowlist must be an explicit `SELECT id, full_name, avatar_url, department_id, title FROM profiles` — never `SELECT *`. The plan's success criterion checks `result contains no email/auth id field`, but the enforcement must be at the query level, not just tested away. Flag this for reviewer attention in phase-17 audit.

---

## Rollback Coverage

| Phase | Has rollback strategy? |
|-------|----------------------|
| 01 (DB migrations) | Partial — one file per concern enables independent revert (`supabase migration down`); idempotent `if not exists` noted. No explicit down migration scripts noted. |
| 03 (trigger migration) | Same as 01 — separate file, revertible. |
| 06 (RPC migration) | Same as 01. |
| All others (app code only) | Git revert sufficient; no DB state change. |

**Gap:** No phase explicitly writes a down migration (`drop table/view/trigger/function`). For a dev-only local Supabase this is acceptable (reset is `supabase db reset`). For a production environment, down migrations are required. This is not a blocker for the current plan scope (local dev + review gate) but must be addressed before any production deployment.

---

## E2E Session Injection (Residual Risk Assessment)

**Phase-16 mitigation credibility: CREDIBLE but not fully specified.**

The plan acknowledges this as the Viết-Kudo gap and says "resolve service-role session inject first; blocks e2e sign-off." The risk table rates it Med/High. This is honest. The mitigation pattern (service-role session injection via GoTrue admin API, reusing the `seed-auth-users.mjs` pattern already in the repo) is the correct approach and is already established in the codebase (`npm run seed:auth`). Phase-16 simply needs to extend that seed step to also inject a Playwright auth state file.

The gap is real: if E2E session injection is not resolved, all authenticated flows (board hearts, profile direction, box open) cannot be E2E tested. The plan gates shipping on this. That gate is credible IF the test-writer actually resolves it before declaring phase-16 done — and the success criterion "npm run test:e2e passes for all 7 screens" with "NO skips, NO forced pass" is the right binary gate.

**Not a blocker for the plan as written**, but the phase-16 implementer must know: the Playwright `storageState` injection pattern is available from `@playwright/test` — call `browser.newContext({ storageState })` with a pre-seeded session file written by a setup script that calls Supabase Admin API.

---

## Realtime + RLS Interaction (Detailed)

Supabase Realtime v1 respects RLS on `postgres_changes` subscriptions: the subscription itself is filtered by the table's RLS policy for the authenticated user's JWT. This means:

- `notifications` Realtime (phase-03): RLS `user_id = auth.uid()` → only the correct user receives their own notification events. Correct.
- `hearts` Realtime (phase-04): RLS allows `SELECT authenticated` (all authenticated can select all hearts). A subscriber to `hearts` changes receives all heart events across all kudos. This is acceptable for the board (it just invalidates the feed), but the subscription payload must not be used directly to infer who hearted what kudo.
- `kudos` Realtime (phase-04): RLS `kudos_select_authenticated USING(true)` → full row payload delivered including `sender_id`. **This is Critical C1 above.**

For `kudos_public` view: **Supabase Realtime does not support `postgres_changes` on views** (only on base tables). So subscribing to `kudos_public` changes is not possible. The correct pattern, already implied by the plan's "invalidate on event" language, is: subscribe to base-table events for the signal (insert ID only) and re-fetch through the view. Phase-04 must explicitly enforce that the Realtime event payload is discarded after extracting the signal.

---

## Auth-Touching Phases — Security Consideration Coverage

| Phase | Auth/DB touched? | Security Consideration present? |
|-------|-----------------|----------------------------------|
| 01 (DB migrations) | Yes (RLS, views) | Yes |
| 02 (event config) | Yes (auth-guarded read) | Yes (minimal — read-only, adequate) |
| 03 (notification trigger) | Yes (DEFINER trigger, RLS) | Yes |
| 04 (hearts + board) | Yes (heart RLS, Realtime) | Yes |
| 05 (profile queries) | Yes (sent-list, PII) | Yes |
| 06 (secret box RPC) | Yes (DEFINER RPC, row lock) | Yes |
| 15 (integration) | Yes (re-verify at wiring) | Yes |
| 17 (review) | Yes (6-invariant audit) | Yes |

All auth/DB-touching phases have a security consideration block. The pattern is consistent.

---

## Done Well

- **Defense-in-depth architecture.** All three load-bearing controls are DB-layer enforced, not app-layer enforced. The plan explicitly states "enforced in DB, not app layer" for anon masking. This is the right instinct.
- **SECURITY DEFINER RPC design for secret box.** Row lock + auth.uid() inside the transaction + no client-supplied count is textbook correct. The plan also adds `search_path=public` to prevent schema-injection attacks — a detail many plans miss.
- **Caller-scoped `profile_stats`.** Nulling `sent` for non-owner in the view (not in the app action) is the right place to enforce this. App-layer guards are bypassable; view-layer guards are not.
- **Explicit success criteria as binary assertions.** Every phase has testable, binary success criteria tied to the security invariants. This is the right way to make security claims verifiable.
- **Anon mask in notification trigger.** The plan correctly identifies that the trigger has access to the raw sender and specifies the CASE expression to prevent leakage — a subtle edge case that is easy to miss.
- **One migration file per concern.** Enables independent rollback at the DB level.
- **`badgeAsset` allowlist.** Blocking client-controlled badge image URLs prevents an open redirect / asset injection vector.

---

## Actions In Order

1. **[Critical — must fix before phase-04 build]** Add explicit constraint to phase-04 and phase-01: Realtime `postgres_changes` on `kudos` delivers raw rows. Handler MUST use `payload.new.id` only as an invalidation signal and re-fetch through `kudos_public`. Consider restricting the Realtime publication to `id, created_at` columns only for the `kudos` table.

2. **[High — must fix before phase-01 migration lands]** Phase-01 must include a migration step that drops or replaces `kudos_select_authenticated` (the `USING(true)` open SELECT policy) with a narrower policy (own-sender OR own-receiver) to make `kudos_public` the enforced-by-DB read path, not just the conventional one.

3. **[High — verify in phase-16 before shipping]** `profile_stats` sent-null invariant must be verified via DB-integration test (not mock). Already in success criteria; ensure it runs against real Supabase local instance.

4. **[Warning — add to phase-06 impl notes]** Set TanStack Mutation `retry: 0` on `openSecretBox` to prevent application-level double-open from network retries.

5. **[Warning — add to phase-03 impl notes]** Notification trigger anon-safe title must be asserted by exact string match in the DB-integration test, not just absence-of-error.

6. **[Pre-production, not current-plan scope]** Write down migrations for all new tables/views/functions before any production deploy.

---

## Verdict

**APPROVED_WITH_CONDITIONS**

Conditions that must be resolved before shipping (not merely before review):

1. Phase-01 migration must narrow the `kudos` SELECT RLS policy (drop `USING(true)`, replace with own-sender/own-receiver) — this makes `kudos_public` the enforced DB path.
2. Phase-04 Realtime subscription on `kudos` must explicitly document and implement "invalidation signal only — discard payload, re-fetch through `kudos_public`."

The remaining findings (W1, W2, S1, S2) are either already covered by existing success criteria or are minor enough to defer to phase-17 audit.

The E2E session-injection gap is real and correctly gated at phase-16. The plan's binary success criterion ("no skips, no forced pass") is the right control.

```json
{
  "score": 7,
  "criticalCount": 1,
  "decision": "REWORK",
  "acceptanceCovered": [
    "Secret-box RPC is SECURITY DEFINER with row lock — client cannot forge outcome or count",
    "profile_stats caller-scoped design correctly nulls sent for non-owner",
    "anon-mask architecture is DB-layer enforced via kudos_public view",
    "notification trigger specifies anon-safe title CASE",
    "badgeAsset allowlist blocks client URL injection",
    "hearts RLS enforces 1/user/kudo + self-heart block at DB level",
    "All auth/DB phases have security consideration blocks"
  ],
  "regressionChecked": [
    "existing kudos_select_authenticated USING(true) policy conflicts with kudos_public mask claim",
    "Supabase Realtime postgres_changes on kudos delivers raw rows bypassing kudos_public",
    "profile_stats sent-null only holds if view CASE is implemented correctly",
    "notification trigger has full row access including sender_id",
    "TanStack Mutation retry can trigger double-open on secret box",
    "getProfileHeader SELECT * would leak email from profiles table"
  ],
  "contractStatus": "OK",
  "refuted": [
    "kudos_public as ONLY read path — refuted: existing open SELECT policy on base kudos table remains active; any direct query bypasses the mask"
  ],
  "unproven": [
    "Realtime broadcast of kudos rows respects kudos_public masking — not proven: Supabase Realtime publishes from base table, not views"
  ],
  "reachableRegressions": [
    "Authenticated attacker subscribes postgres_changes on public.kudos, reads raw sender_id from anonymous kudo events (C1)",
    "Developer queries supabase.from('kudos').select('*') in any new feature — open SELECT policy returns full rows including anon sender_id (H1)"
  ],
  "findings": [
    {
      "severity": "Critical",
      "category": "Security",
      "location": "plans/260803-1636-saa2025-remaining-7-screens/phase-04-hearts-board-queries.md:47",
      "summary": "Realtime postgres_changes on public.kudos delivers raw rows to clients including sender_id for anonymous kudos, bypassing kudos_public mask. Handler must use payload as invalidation signal only and re-fetch through kudos_public.",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Security",
      "location": "supabase/migrations/20260731000000_create_kudos.sql:67",
      "summary": "kudos_select_authenticated USING(true) remains active. Any direct query to public.kudos returns sender_id for all rows. Phase-01 must drop or narrow this policy to make kudos_public the enforced-by-DB read path.",
      "disposition": "Accept"
    },
    {
      "severity": "High",
      "category": "Security",
      "location": "plans/260803-1636-saa2025-remaining-7-screens/phase-01-db-foundation.md:54",
      "summary": "profile_stats SECURITY INVOKER view sent-null guarantee is implementation-fragile. DB-integration test (real Supabase, not mock) must run before integration phase.",
      "disposition": "Accept"
    },
    {
      "severity": "Warning",
      "category": "Security",
      "location": "plans/260803-1636-saa2025-remaining-7-screens/phase-03-notification-service.md:24",
      "summary": "Notification trigger anon-safe title must be tested by exact string assertion, not absence-of-error. A careless title= assignment leaks sender name.",
      "disposition": "Accept"
    },
    {
      "severity": "Warning",
      "category": "Logic",
      "location": "plans/260803-1636-saa2025-remaining-7-screens/phase-06-secret-box-logic.md:49",
      "summary": "TanStack Mutation retry on openSecretBox can trigger double-open if network retry fires after DB commit. Set retry:0 on the mutation.",
      "disposition": "Accept"
    }
  ]
}
```
