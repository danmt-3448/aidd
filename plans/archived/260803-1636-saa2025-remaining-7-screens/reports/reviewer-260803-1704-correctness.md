---
title: Correctness & Sequencing Review — SAA 2025 remaining 7 screens
lens: LENS 2 (correctness/sequencing)
verdict: APPROVED_WITH_CONDITIONS
date: 2026-08-03
---

# LENS 2 — Correctness & Sequencing Review

## Scope
- Files reviewed: plan.md, phase-01 through phase-17 (17 files), clarifications.md
- Recon: check-progress-260803-1636-remaining-screens.md
- Existing DB verified: 20260730062749_create_profiles.sql, 20260731000000_create_kudos.sql, 20260731010000_grant_kudos_privileges.sql
- Existing source verified: src/features/kudos/, src/features/auth/guard-rules.ts, kudo-compose-modal.tsx

---

## Critical

### C1 — `kudos_public` view missing `receiver_name` / `receiver_avatar`; `listBoardKudos` has a hollow row shape
**Location:** phase-01-db-foundation.md (view def, line 49–53) vs phase-04-hearts-board-queries.md (line 41) vs phase-12-ui-live-board.md (integration contract, line 23)

Phase-01 defines `kudos_public` as returning: `id, receiver_id, content_html, created_at, is_anonymous, sender_id (masked), sender_name`. It joins `profiles` only for the sender display name. **`receiver_name` and `receiver_avatar` are absent from the view definition.**

Phase-12 integration contract requires: `{ id, senderName|null, receiverName, contentHtml, heartCount, likedByMe, createdAt }`.

Phase-04's `listBoardKudos` row description says only "each row carries `heart_count` + `liked_by_me`" — it never explicitly declares that `receiverName` is in the output. An implementer reading phase-04 alone will not add `receiver_name` to the query join.

**Result:** integration (phase-15) will fail the contract at wiring time. `tsc --noEmit` won't catch it if either side uses `string | undefined`.

**Fix required before implementation begins:**
- Phase-01: add `receiver_name` (always visible — not masked) and `receiver_avatar_url` to `kudos_public` column list, joining `profiles` on `receiver_id`.
- Phase-04: expand `listBoardKudos` row shape to explicitly include `receiverName, receiverAvatar` to document the full contract.

---

### C2 — Department filter (`departmentId?`) in `listBoardKudos` references an unresolvable column
**Location:** phase-04-hearts-board-queries.md (line 40) + supabase/migrations

`listBoardKudos({ cursor, hashtagId?, departmentId? })` proposes a department filter. In the DB, `kudos` has no `department_id` column. `profiles` has `department_id integer` (nullable, no FK — comment explicitly says "plan sau"). There is no `departments` table anywhere in migrations.

Filtering board kudos by department requires joining `kudos → profiles(receiver_id or sender_id) → profiles.department_id`, but:
1. `kudos_public` does not expose `department_id`.
2. `profiles.department_id` is an unvalidated integer with no referential integrity — it cannot be used as a reliable filter without a lookup.

This means either (a) the department filter silently returns wrong results, or (b) phase-04 implementer has to invent a join not described anywhere, potentially bypassing `kudos_public`.

**Fix:** Either drop `departmentId?` from `listBoardKudos` for this round (YAGNI — it's not in the clarifications), or add it explicitly to phase-01 `kudos_public` as a joined column AND note the nullable-integer limitation.

---

## High

### H1 — `GRANT` statements missing for new tables — will hit "permission denied" at runtime
**Location:** phase-01-db-foundation.md (RLS section, line 59–64; Implementation Steps, line 82–88)

The existing project burned once on exactly this (migration `20260731010000_grant_kudos_privileges.sql` was added specifically because PostgREST returned "permission denied" without explicit GRANTs). Phase-01's RLS section only defines policies. It does not include:
```sql
grant select, insert, delete on public.hearts to authenticated;
grant select on public.event_config to authenticated;
grant select on public.special_day_config to authenticated;
grant select on public.kudos_public to authenticated;
grant select, update on public.notifications to authenticated;
-- secret_box / secret_box_badges: SELECT only (RPC handles write)
grant select on public.secret_box to authenticated;
grant select on public.secret_box_badges to authenticated;
grant execute on function public.open_secret_box() to authenticated;
```

Phase-01 Todo only has "kudos_public view … + grant". All other tables lack GRANT. Phase-06 has the same gap for `open_secret_box` RPC.

**Fix:** Add explicit GRANT statements (or a companion `_grant_new_tables.sql` migration) in phase-01. Explicitly include `execute on function open_secret_box()` in phase-06.

---

### H2 — Self-heart guard definition is ambiguous between phase-01 RLS and phase-04 action
**Location:** phase-01-db-foundation.md line 60; phase-04-hearts-board-queries.md lines 36–37

Phase-01 RLS: "INSERT own … + CHECK sender≠self (kudo.receiver_id/sender_id guard via subquery)". The description uses "sender≠self" but the subquery hint mentions both `receiver_id` AND `sender_id` — it is unclear whether "self" is the kudo's receiver or sender.

Phase-04 spells it out but with visible uncertainty: "reject when caller is the kudo **sender**? spec: 1/user, sender≠self → block liking own sent kudo". The inline question mark `?` signals the implementer is unsure.

The correct rule (per spec: you can't heart your own sent kudo) should be: `kudo.sender_id ≠ auth.uid()`. But the RLS `WITH CHECK` wording doesn't state this clearly, and leaves room for an implementer to write the wrong subquery.

**Fix:** Phase-01 RLS block should specify exactly: `WITH CHECK (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM kudos k WHERE k.id = kudo_id AND k.sender_id = auth.uid()))`. Phase-04 should remove the inline `?`.

---

### H3 — `profile_stats` view "caller-scoped" semantics: SECURITY INVOKER views cannot filter by `auth.uid()` row-level without explicit WHERE
**Location:** phase-01-db-foundation.md lines 54–57

The plan describes `profile_stats` as a SECURITY INVOKER view that returns data for a given `user_id` parameter, but then says it's "keyed to `auth.uid()`". A plain SQL view does not take parameters. The plan says "params via function or view keyed to `auth.uid()`" but never resolves this ambiguity.

If it's a view: it returns ALL rows but `sent` column is null-guarded when `user_id ≠ auth.uid()`. Phase-05 then reads `getProfileStats(profileId)` from the view — this works only if the `sent` null-guard is expressed as a SQL CASE in the view definition itself: `CASE WHEN user_id = auth.uid() THEN sent_count ELSE NULL END`.

If it's a function: parameterized, cleaner, but phase-01 says "view/function" without committing.

The ambiguity will cause an implementer to write a view without the `CASE` null-guard, making `sent` visible for all users.

**Fix:** Phase-01 must commit: either (a) SQL view with `CASE WHEN user_id = auth.uid() THEN <sent_count> ELSE NULL END AS sent` explicitly, or (b) a parameterized SQL function `profile_stats(p_user_id uuid)`. The current wording does not commit and the success criterion test (line 103) alone won't catch a missing CASE during implementation.

---

## Warning

### W1 — `kudos_public` view semantics under SECURITY INVOKER: inherits RLS from `kudos` table
**Location:** phase-01-db-foundation.md line 49

`kudos_public` is SECURITY INVOKER. The base table `kudos` has `kudos_select_authenticated USING(true)` — which means all authenticated users can SELECT all kudos. The view's masking is a column-level CASE expression, not a row filter. This is correct *only* if `kudos_select_authenticated` remains USING(true). If that policy is ever tightened, the view will inherit a narrower RLS and board/profile feeds would break silently.

No issue today, but the dependency is not documented. Phase-01 should note: "View correctness depends on `kudos_select_authenticated USING(true)` remaining unchanged."

---

### W2 — No index on `hearts(user_id)` or `hearts(kudo_id)` for ranking/toggle queries
**Location:** phase-01-db-foundation.md (hearts table def)

Phase-01 defines `hearts` with PK `(user_id, kudo_id)`. The PK index covers lookups keyed on `user_id` first. `toggleHeart(kudoId)` looks up `(auth.uid(), kudoId)` — fine, PK covers it.

`getHighlightKudos` aggregates `COUNT(*) GROUP BY kudo_id` — needs an index on `kudo_id`. The PK `(user_id, kudo_id)` index is not usable for a `kudo_id`-first scan. Without `CREATE INDEX hearts_kudo_id_idx ON hearts (kudo_id)`, the ranking query does a sequential scan on `hearts` every render.

**Fix:** Add `CREATE INDEX hearts_kudo_id_idx ON hearts (kudo_id)` to the hearts migration.

---

### W3 — Keyset pagination on board: reuse claim ("reuse Viết-Kudo keyset pattern") references non-existent code
**Location:** phase-04-hearts-board-queries.md line 33

The plan says "reuse the Viết-Kudo keyset pattern" for infinite feed. The existing kudos hooks (use-create-kudo, use-hashtags, use-recipient-search, use-current-user-id) contain **no keyset pagination**. The Viết Kudo screen only creates kudos; it never paginates a feed. There is no existing keyset pattern to reuse.

This is a misleading reuse claim. Implementer will need to write the keyset from scratch. It is not a blocking issue, but the plan overstates existing foundations.

**Fix:** Remove the "reuse Viết-Kudo keyset pattern" claim; state "implement keyset on `(created_at desc, id desc)`" directly.

---

### W4 — Notification trigger migration in phase-03 will silently fail if `notifications` table is not yet created
**Location:** phase-03-notification-service.md lines 33–34, 53–54

Phase-03 owns the trigger migration `notify_on_kudo_insert`. The trigger inserts into `notifications`, which is created in phase-01. Phase-03 declares `blockedBy: [01]` — correct. However, the trigger migration file timestamp must be later than the notifications table migration timestamp, or Supabase will apply them in the wrong order.

Phase-01 uses the note `2026XXXX` (placeholder) for all its migration timestamps. Phase-03 uses `2026XXXX_notify_on_kudo_insert.sql` — also placeholder. If the implementer assigns the trigger migration a timestamp earlier than the notifications table migration, `supabase db reset` will fail.

**Fix:** Phase-01 and phase-03 implementation steps should specify that phase-03 trigger migration timestamp must be strictly after the phase-01 notifications table migration timestamp. One approach: phase-03 trigger file gets timestamp suffix `_002` after the phase-01 batch.

---

### W5 — `profile_stats` view does not include `hearts_received` from `profiles`; naming collision risk
**Location:** phase-01-db-foundation.md line 55

Phase-01 states `profile_stats` returns `hearts_received` (from the view), but `profiles` already has a denormalized `hearts_received` counter (line 29). The view is supposed to compute it live. If the view recomputes by counting from `hearts` table vs reading the denormalized column, the two values may diverge (hearts can be deleted; denormalized counter may not decrement unless there's a trigger — none is planned).

Phase-05 returns `getProfileStats → hearts` in the response. Phase-13 UI uses `stats.hearts`. Which source is canonical — the live count from `hearts` table or the denormalized `profiles.hearts_received`? The plan never states which one `profile_stats` uses.

**Fix:** Phase-01 must commit to one source for `hearts_received`. Recommended: live count `COUNT(*) FROM hearts WHERE kudo.receiver_id = user_id` (avoids stale-counter bugs). If using denormalized counter, document the trigger that maintains it.

---

## Sequencing — blockedBy graph

| Phase | Declared blockedBy | Actual dependencies satisfied? |
|-------|-------------------|-------------------------------|
| 01 | — | Root, correct |
| 02 | [01] | event_config created in 01 — OK |
| 03 | [01] | notifications table created in 01 — OK; trigger timestamps must be ordered (W4) |
| 04 | [01] | hearts, kudos_public, special_day_config in 01 — OK |
| 05 | [01] | profile_stats, kudos_public, secret_box in 01 — OK |
| 06 | [01] | secret_box, secret_box_badges in 01 — OK |
| 07 | — | Static content, correct |
| 08–14 | — | Track A, parallel, correct |
| 15 | [02,03,04,05,06,07,08,09,10,11,12,13,14] | 01 is transitively covered; no circular dep |
| 16 | [15] | correct |
| 17 | [16] | correct |

**No circular dependency. Phase-01 as DB root is correctly threaded. Integration (15) is the sole convergence.**

One implicit gap: phase-15 does NOT list phase-01 directly. This is acceptable (transitive via 02–06) but an implementer executing phases out of order could skip phase-01 if only looking at phase-15's blockedBy. Low risk given the plan text, but worth noting.

---

## Done Well

- Phase-01 is the clean DB root: every logic phase (02–06) correctly gates on it.
- Track A phases carry explicit, typed integration contracts that match the Track B query return shapes for the most part (countdown, rules, prize, secret-box all align cleanly).
- `kudos_public` anon-masking is load-bearing and correctly placed at the DB layer, not app layer.
- `open_secret_box` RPC design (DEFINER, row-lock FOR UPDATE, server-side weighted roll) is correctly specified and cannot be tampered from the client.
- Phase-03 trigger approach (DB trigger vs app-layer race) is the right call for notification atomicity.
- Phase-05 hard-deny of `direction=sent` for non-owner is in both the query logic AND the view (defense-in-depth for the anon-leak vector).
- Phase-06 `badgeAsset` allowlist (no client URL echo) is correctly identified as an injection guard.
- `profile_stats.sent` null-guard for non-callers is in phase-01 view definition AND phase-05 query — two layers, consistent.
- Phase-15 owns only `page.tsx` composition; no component internals or action files — ownership boundary is correct.

---

## Actions In Order

1. **[Must-fix before implementation]** Phase-01: add `receiver_name` (always exposed, not masked) and `receiver_avatar_url` to `kudos_public` view definition. Phase-04: add `receiverName, receiverAvatar` to `listBoardKudos` return shape. (Blocks C1)
2. **[Must-fix before implementation]** Phase-01: resolve `profile_stats` as either a parameterized SQL function or a view with explicit `CASE WHEN user_id = auth.uid() THEN sent_count ELSE NULL END AS sent`. (Blocks H3)
3. **[Must-fix before implementation]** Phase-01: add explicit `GRANT … TO authenticated` for all new tables + `kudos_public` view. Phase-06: add `GRANT EXECUTE ON FUNCTION open_secret_box() TO authenticated`. (H1)
4. **[Must-fix before implementation]** Resolve `departmentId?` in `listBoardKudos`: drop it (YAGNI) or specify the exact join + `kudos_public` column addition required. (C2)
5. **[Should-fix]** Phase-01 hearts RLS: write the exact `WITH CHECK` subquery for the self-heart guard. Phase-04: remove the inline `?`. (H2)
6. **[Should-fix]** Phase-01: commit to live-count vs denormalized `hearts_received` source in `profile_stats`. (W5)
7. **[Should-fix]** Phase-01: add `CREATE INDEX hearts_kudo_id_idx ON hearts (kudo_id)`. (W2)
8. **[Should-fix]** Phase-01 + phase-03: add timestamp ordering constraint for trigger migration. (W4)
9. **[Low]** Phase-04: replace "reuse Viết-Kudo keyset" with "implement keyset from scratch". (W3)
10. **[Low]** Phase-01: note the `kudos_select_authenticated USING(true)` dependency for `kudos_public`. (W1)

---

## Verdict

**APPROVED_WITH_CONDITIONS**

Items C1 and C2 are contract mismatches that will produce a broken integration at phase-15 wiring time. H1 (missing GRANTs) will produce runtime 403s. H3 (profile_stats ambiguity) will produce a leaking sent-count if not resolved before implementation. All four must be resolved in the phase files before `tkm:takumi` executes.

Once the four must-fix items (C1, C2, H1, H3) are corrected in the plan documents, the sequencing graph is sound, the DB root is correct, no circular deps, contracts are otherwise aligned, and the security model is well-specified.
