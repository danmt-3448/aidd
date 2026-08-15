---
title: Secret-box open logic
work_type: feature
track: B
status: planned
blockedBy: [01]
blocks: [15]
spec_source: momorph:J3-4YFIpMM
---

# Phase 06 — Secret-box open logic (Track B · logic)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (§7 Secret box — LOGIC + SECURITY)
- DB: phase-01 `secret_box`, `secret_box_badges`.
- Clarifications: consume-only this round (open + decrement + weighted-random badge server-side); grant out of scope, seed manually.

## Overview
- **Priority:** P1 · **Status:** planned
- The open flow: entitlement check → weighted-random badge (server-side) → decrement counter → record
  badge — all in one atomic, tamper-proof RPC. Client can only *request* an open; it cannot choose the
  outcome or forge the count.

## Key Insights
- **All state authority is server-side.** `unopened_box_count` is the source of truth; the RPC is
  SECURITY DEFINER and re-reads the count inside the transaction (no trust in client-sent count).
- Weighted distribution (exact, sums to 100): **Stay Gold 30 · Flow to Horizon 25 · Touch of Light 20 ·
  Beyond the Boundary 10 · Revival 10 · Root Further 5.** Roll server-side with a single `random()` over
  cumulative weights — never client-side.
- Idempotency / double-open guard: RPC decrements and inserts the badge in one transaction; a concurrent
  double-click cannot open two boxes from one count (row lock `for update` on `secret_box`).
- Badge image URLs are sanitized/allowlisted (map badge_key → known asset path; never echo client URL).

## Requirements
### RPC (migration — owned here) `open_secret_box()`
- SECURITY DEFINER, `search_path=public`. Steps in one tx:
  1. `v_uid := auth.uid()`; null → raise (errcode P0101).
  2. `select unopened_box_count ... for update` on caller's `secret_box`; missing/`0` → raise "no box" (P0102).
  3. Roll weighted badge_key over the fixed distribution.
  4. `update secret_box set unopened_box_count = count - 1`.
  5. `insert secret_box_badges (user_id, badge_key)`.
  6. Return `{ badge_key, remaining }`.
- **GRANT (do NOT skip — precedent `20260731010000`):** the RPC is SECURITY DEFINER but the caller still
  needs EXECUTE. Ship in the same migration:
  `grant execute on function public.open_secret_box() to authenticated;`

### Server action (`src/features/secret-box/secret-box-actions.ts`)
- `getSecretBoxState()`: caller's `{ unopened, opened: [{badgeKey, openedAt}] }`.
- `openSecretBox()`: calls RPC; maps SQLSTATE → friendly message; returns `{ badgeKey, remaining }` or error.
- `badgeAsset(badgeKey)`: pure map badge_key → allowlisted image path (no client URL echo).

### Client hook (`src/features/secret-box/use-secret-box.ts`)
- Query state; `openSecretBox` mutation → on success refresh badge + counter. Disable open when `unopened=0`.
- **Mutation config: `retry: 0`** — an open is a non-idempotent, state-mutating action; a retry on a
  transient error could open a second box. Never auto-retry.
- **Expose `isOpening: boolean`** (the mutation's pending flag) so Track A can disable the box + show a
  spinner while the RPC is in flight. This is part of the phase-14 integration contract.

## Architecture — data flow
```
click open ──openSecretBox()──▶ RPC open_secret_box (DEFINER, row-locked)
   ──roll weighted badge server-side──▶ decrement count + insert badge ──▶ {badgeKey, remaining}
   ──badgeAsset(key)──▶ allowlisted image ──▶ modal badge + counter (Track A 14)
```

## Related Code Files
- **Create:** `supabase/migrations/2026XXXX_open_secret_box_rpc.sql`,
  `src/features/secret-box/secret-box-actions.ts`, `src/features/secret-box/use-secret-box.ts`.
- **Modify:** none.
- **Delete:** none.

## Implementation Steps
1. RPC `open_secret_box` (DEFINER, `for update` lock, weighted roll, decrement, badge insert) + `GRANT EXECUTE ... TO authenticated`.
2. `getSecretBoxState`, `openSecretBox`, `badgeAsset` server-side.
3. Hook: state query + open mutation (`retry: 0`) + `isOpening` flag + disable-at-zero.
4. Seed one test row (`unopened_box_count > 0`) via seed script note.

## Todo
- [ ] `open_secret_box` RPC (row-locked, weighted, atomic decrement + badge) + GRANT EXECUTE to authenticated
- [ ] `getSecretBoxState`
- [ ] `openSecretBox` (RPC + friendly errors)
- [ ] `badgeAsset` allowlist map (no client URL echo)
- [ ] `use-secret-box` hook (`retry: 0`, exposes `isOpening`, disable at 0)

## Success Criteria (binary)
- [ ] Opening with `unopened=0` is rejected server-side (client cannot force an open).
- [ ] Each open decrements the count by exactly 1 and inserts exactly one badge row.
- [ ] Over 10k simulated rolls, distribution matches 30/25/20/10/10/5 within tolerance (statistical test).
- [ ] Concurrent double-open from count=1 yields exactly one badge (row lock holds).
- [ ] Badge image path comes only from `badgeAsset` allowlist, never client input.

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Client forges outcome/count | Med | **High** | All authority in DEFINER RPC; re-read count in tx |
| Double-open race | Med | Med | `select ... for update` row lock |
| Skewed distribution | Low | Med | Cumulative-weight roll + statistical test |
| Badge URL injection | Low | Med | Allowlist map; no client URL passthrough |

## Security Considerations
- No client write to `secret_box`/`secret_box_badges` (DEFINER RPC only); outcome + count server-authoritative.

## Next Steps
- Secret-box UI (14) consumes the hook in integration (15); Profile (05) reads opened/remaining counts.

## MoMorph refs:
- Open Secret Box: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
