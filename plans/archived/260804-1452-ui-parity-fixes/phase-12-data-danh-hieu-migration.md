# Phase 12 — "Danh hiệu" persistence (kudos column + create_kudo RPC)

**Track:** B · **Priority:** MAJOR · **Status:** pending · **blockedBy:** —

## Context
- Per clarifications.md 2026-08-04: field "Danh hiệu" (required per MoMorph spec) has **no DB column**.
  Decision = FULL FIX — add a `danh_hieu` column to `public.kudos` + extend RPC `create_kudo` to accept
  and persist it. No fake persistence.
- `create_kudo` is **security-sensitive**: it feeds the anonymous-masking `kudos_public` view
  (`supabase/migrations/20260731100000_...`) and the restricted Realtime publication
  (`...090000...`: `alter publication supabase_realtime set table public.kudos (id, created_at)`).
  Adding a column MUST NOT leak identity via the masked view nor widen the Realtime wire.

## Data flow
Client submit (phase-08) → `use-create-kudo` → RPC `create_kudo(..., p_danh_hieu text)` →
`insert into public.kudos (..., danh_hieu)` → read back via existing kudo read path. Realtime wire
stays `(id, created_at)` only; `kudos_public` continues to mask sender for anonymous rows.

## Related code files
- Create: `supabase/migrations/{ts}_add_danh_hieu_to_kudos.sql` — `alter table public.kudos add column
  danh_hieu text;` + `create or replace function public.create_kudo(...)` adding `p_danh_hieu text`
  param and inserting it; re-`grant execute` on the NEW signature (old grant references old arg list).
- Modify: `src/features/kudos/kudo-actions.ts` / `hooks/use-create-kudo.ts` — pass `p_danh_hieu`.
- Read (do NOT change): `supabase/migrations/20260731090000_...` (Realtime), `...100000_...` (view).
- Update: `supabase/tests/kudo-integration*.sql` if the RPC signature is asserted there.

## Implementation steps
1. New migration: `alter table public.kudos add column danh_hieu text;` (nullable → backfill-safe).
2. `create or replace function public.create_kudo` — add trailing param `p_danh_hieu text`; include
   `danh_hieu` in the `insert into public.kudos (...)`. Keep all existing validation ordering intact.
3. **[W-1] DROP the old 7-arg overload** — `create or replace` with a NEW arg list creates an
   overload, it does NOT replace the 7-arg function. After the 8-arg `create or replace`, add:
   `drop function if exists public.create_kudo(uuid, uuid, text, boolean, text, uuid[], text[]);`
   else the stale 7-arg function stays callable (a direct RPC caller could insert with `danh_hieu=null`,
   bypassing the Zod non-empty guard). Then re-issue `grant execute on function
   public.create_kudo(uuid, uuid, text, boolean, text, uuid[], text[], text) to authenticated;`.
4. Do NOT add `danh_hieu` to the Realtime publication (`set table public.kudos (id, created_at)` stays).
5. `kudos_public` uses an **explicit column projection** (not `select *`) → adding the column does NOT
   surface it in the view. Do NOT add `danh_hieu` to that projection. Confirm masking still returns
   `null` sender for anon rows AND that `danh_hieu` is absent from the view.
6. **[W-4]** Wire `p_danh_hieu` through `kudo-actions.ts` / `use-create-kudo.ts`: the Zod field
   `danhHieu` already exists on `CreateKudoInput` (added by phase-08). In `kudo-actions.ts` destructure
   `danhHieu` from `parsed.data` and pass it as `p_danh_hieu` — else the field is Zod-validated but
   silently dropped. (This step is what phase-08's wire-submit gate waits on.)
7. `supabase db reset` → run RPC → assert value persisted + anonymity/Realtime unchanged.

## Todo
- [ ] Migration adds nullable `danh_hieu` column to `public.kudos`
- [ ] `create_kudo` accepts `p_danh_hieu` and inserts it; re-grant execute on new signature
- [ ] Realtime publication still `(id, created_at)` — column NOT added to wire
- [ ] `kudos_public` still masks sender for anonymous rows (no identity leak)
- [ ] `kudo-actions.ts` / `use-create-kudo.ts` pass the field
- [ ] Round-trip verified after `supabase db reset`

## Acceptance criteria (binary)
- [ ] `public.kudos` has a `danh_hieu text` column after migration (verified via `\d public.kudos`).
- [ ] `create_kudo` signature includes `p_danh_hieu text` and inserts it; execute is granted on the
      new signature (call succeeds as `authenticated`).
- [ ] **[W-1]** The old 7-arg `create_kudo` overload is dropped — `pg_proc` has exactly ONE
      `create_kudo` (8-arg). No stale 7-arg function remains callable.
- [ ] **[W-2]** `danh_hieu` is ABSENT from `kudos_public` (verified via `information_schema.columns`
      on the view / `\d public.kudos_public`).
- [ ] A kudo submitted with a `danh_hieu` value is read back with that exact value (integration test).
- [ ] The Realtime publication on `public.kudos` still lists exactly `(id, created_at)` — `danh_hieu`
      is NOT in the published column set (verified via `pg_publication_tables`).
- [ ] `kudos_public` returns `sender_id = null` for anonymous rows (masking unchanged; re-asserted).
- [ ] `supabase db reset` applies all migrations clean; `tsc --noEmit` + `npm run build` succeed.

## Rollback
- **[W-5]** Before dropping, confirm no subsequent migration/view references `kudos.danh_hieu`
  (else `drop column` needs `cascade`). Drop column + revert RPC: `alter table public.kudos drop
  column danh_hieu;` and `create or replace function public.create_kudo` back to the 7-arg signature
  (drop the 8-arg overload, re-grant old signature). Realtime + view untouched → nothing to revert
  there. Rolling back before phase-08 wires submit leaves phase-08's Danh-hiệu UI rendering but
  simply not persisting (the phase-08 wire-step stays gated on this phase).

## Risk assessment
- **High.** Touches a security-hardened RPC. Mitigation: column is content-only (nullable), Realtime
  wire and view masking are explicitly re-verified by acceptance criteria, rollback is a clean drop.

## Security considerations
- `danh_hieu` is user input → same sanitize/validate posture as other kudo text; no raw HTML.
- MUST NOT widen the Realtime wire or de-anonymize `kudos_public`.
- **[W-3]** `get_highlight_kudos` RPC (`20260804000000_perf_indexes_and_rpc.sql`) reads `kudos` with an
  explicit column list + its own anon mask and does NOT select `danh_hieu` → unaffected by the new
  column. No change needed there; noted so future reviewers don't re-derive it.

## Next steps
- Unblocks phase-08's wire-into-submit step. Feeds phase-11 verify.
