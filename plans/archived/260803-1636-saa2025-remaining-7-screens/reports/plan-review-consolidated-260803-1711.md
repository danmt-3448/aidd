# Plan Review — Consolidated (4 reviewers)

Date: 2026-08-03 · Plan: 260803-1636-saa2025-remaining-7-screens · 4 parallel reviewer lenses

## Verdict: APPROVED_WITH_CONDITIONS (rework phase files, no restructure)

| Lens | Verdict | Crit |
|------|---------|------|
| Completeness (spec/test coverage) | APPROVED_WITH_CONDITIONS | 2 |
| Correctness & sequencing | APPROVED_WITH_CONDITIONS (REWORK) | 2 |
| Parallelism & file ownership | APPROVED (clean) | 0 |
| Risk & security | REWORK | 1 |

Structure sound: 2-track graph correct, 0 cross-track edges, 0 file collisions, Track A ≤30 lines, integration sole merge. Rework is content-level, concentrated in phase-01.

## Must-fix (Critical)
- **C-RT (phase-04+01):** Supabase Realtime publishes base `kudos` rows → `sender_id` of anon kudos leaks, bypassing `kudos_public`. Fix: handler uses `payload.new.id` as invalidation signal only + re-fetch via `kudos_public`; `ALTER PUBLICATION supabase_realtime SET TABLE kudos (id, created_at)`.
- **C-VIEW (phase-01+04):** `kudos_public` missing `receiver_name`/`receiver_avatar_url`; board contract (phase-12) needs `receiverName` → phase-15 wiring fails. Fix: join `profiles` on `receiver_id`, add columns; phase-04 documents full row shape.
- **C-DEPT (phase-04):** `departmentId?` filter has no backing column/table. Decision: DROP dept filter this round (hashtag-only), log follow-up. Filter state = URL search param.
- **C-SPEC16 (phase-16):** `spec_source` lists only Homepage → tester misses 131/193 cases. Fix: list all 7 screenIds.

## Must-fix (High)
- **H-RLS (phase-01):** drop `kudos_select_authenticated USING(true)`; add `kudos_select_own` (sender_id=auth.uid() OR receiver_id=auth.uid()). Makes `kudos_public` the enforced third-party read path.
- **H-GRANT (phase-01+06):** add GRANT for hearts/event_config/special_day_config/notifications/secret_box/secret_box_badges + `GRANT EXECUTE ON FUNCTION open_secret_box() TO authenticated`. (Project already hit this class once — migration 20260731010000.)
- **H-STATS (phase-01):** `profile_stats` view with explicit `CASE WHEN user_id=auth.uid() THEN sent_count ELSE NULL END AS sent`; `hearts_received` = live count from `hearts`.
- **H-SELFHEART (phase-01+04):** exact `WITH CHECK (NOT EXISTS (SELECT 1 FROM kudos k WHERE k.id=kudo_id AND k.sender_id=auth.uid()))`; remove inline `?` in phase-04.
- **H-GUARD (phase-15):** route auth-guard on Countdown + Prize; document Rules auth decision.
- **H-ADMIN (phase-05/15):** name `getIsAdmin()` action reading `profiles.role`; wire to Homepage header.
- **H-E2E (phase-16):** concrete session-inject todo → storageState via `supabase/seed-auth-users.mjs` service-role.

## Should-fix (Medium)
- phase-04: `listBoardKudos` hashtag join FROM `kudos_public` (not `kudos`); replace bogus "reuse Viết-Kudo keyset" with "keyset on (created_at desc, id desc)".
- phase-01: `CREATE INDEX hearts_kudo_id_idx ON hearts (kudo_id)`; migration-timestamp ordering note (notifications table before phase-03 trigger).
- phase-06: `retry:0` on openSecretBox mutation; hook exposes `isOpening`.
- phase-14: integration contract add `isOpening: boolean`.
- phase-03: test asserts EXACT anon title string; trigger never reads sender name for anon kudos.
- phase-05/17: `getProfileHeader` explicit column list (no `SELECT *`; exclude email/auth id).
- phase-15: i18n audit step for Countdown/Homepage/Live board/Profile/Secret box.

## Low / optional
- plan.md: one-line note that phase-01 absent from phase-15 blockedBy is by-design (transitive) — OR just add 01 to blockedBy (cheaper; done in rework).
- Track A subagent prompts (spawn-time): "Do NOT write i18n message files" (phase-07 owns them).

## Praise (keep as-is)
- M3 sender-mask threaded through 01/04/05/17.
- secret-box RPC: DEFINER + `FOR UPDATE` row lock + `search_path` + weighted roll server-side + badge allowlist — textbook.
- profile_stats caller-scoped design; phase-03 DB-trigger for notification atomicity.

## Unresolved (user judgment)
- Department filter on Live board: dropped this round (no data model). Override → expose `receiver.department_id` via `kudos_public`.
