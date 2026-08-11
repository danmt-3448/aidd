# Grain Reading: Kudo + Like API hardening (Track B)

## Verdict: CAUTION

Core fixes are sound and worth doing (toggle race, create_kudo gaps). BUT code evidence shows **the plan overstates existing work** — realtime hearts + feed filtering are already built. Re-scope phases 03 + 06 down before forging, or burn effort rebuilding what exists.

## Where All Voices Agree
- **Phase 01 (`toggle_heart` RPC) is the real win.** The SELECT→INSERT/DELETE race is genuine; `23505` unmapped → confusing error. Atomic RPC is the correct, minimal fix. GO.
- **Phase 04 (create_kudo receiver check + orphan cleanup) is a genuine gap.** Valid-UUID-nonexistent receiver leaks raw FK; images orphan on failure. GO.
- **No UI layout touched** — plan correctly stays Track B; UI already gated. Good boundary.
- **Business rules match spec** (self-like block, 1/user/kudo, special-day ranking-only). Correct.

## Conflicts & Resolutions

| Topic | Architect | Security | Performance | UX | Devil's Advocate | Resolution |
|-------|-----------|----------|-------------|-----|-----------------|------------|
| **Phase 03 realtime** | Realtime already exists (`use-board-feed.ts:91–116` + `use-highlights.ts:63–80` both listen to `hearts`) | payload already identity-safe (id+created_at) | feed still fetches ALL `hearts` rows for 20 kudos to count client-side (`board-queries.ts:347`) — real cost at event scale | count already updates live via existing channels | **Don't rebuild realtime — it's built.** | **Re-scope 03** → keep ONLY: (a) move feed `heart_count`/`liked_by_me` server-side (perf, justified), (b) add `hearts` DELETE to feed channel if missing. Drop "add realtime subscription." |
| **Phase 06 filter** | filter params already wired `board-queries.ts:65–67,202,214–221` + `use-board-feed.ts` reads `?hashtag/?department` | — | inner-join filter is indexed? verify | dropdowns already gated | **Already done — CUT.** | **CUT phase 06** to verify+test only. |
| **toggle_heart `security definer`** | clean encapsulation | **bypasses RLS** → guards MUST be complete + no other code path may insert hearts directly | 1 round-trip (was 3) — better | — | RLS already there as backstop | Route ALL heart writes through RPC; keep RLS policies as defense-in-depth. Guards in RPC are complete (auth/exists/self). OK. |
| **create_kudo rewrite** | create-or-replace is the pattern | must preserve P0001–P0006 | — | — | risk of dropping a check on copy | Diff new migration vs `20260804010000` (135 lines, P0001–P0006 at known lines) — add ONLY the receiver check. |
| **Optimistic + realtime double-fire** | — | — | own like → optimistic patch + onSettled invalidate + realtime invalidate on own `hearts` INSERT = 2–3 refetches | brief flicker possible | over-engineered | Low severity (invalidate-based, count stays correct). Debounce (300ms) already dampens. Only matters if switching to count-patch → then filter self-echo. Leave as-is. |

## Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Phases 03 + 06 rebuild already-built realtime + filter → wasted effort, regression risk | **High** | Re-scope 03 to feed server-side count only; CUT 06 to verify+test. Update plan.md before takumi. |
| `create_kudo` rewrite drops an existing P-code | High | New migration = copy `20260804010000` body verbatim, insert receiver check after P0002; diff before apply |
| `toggle_heart` security-definer + a stray direct-insert path → inconsistent guard | Medium | Grep for any other `hearts` insert; route all through RPC; keep RLS backstop |
| Feed client-side O(N) hearts fetch at event scale (popular kudo = hundreds of hearts × 20 cards) | Medium | Server-side `count` + `liked_by_me` in feed query/RPC (the surviving justified part of phase 03) |
| Special-day multiplier double-source drift (`event_config` vs `special_day_config`) | Low | Phase 02 already scoped to single-source; mostly verify (highlights already use `special_day_config`) |
| `P0007` reused by two RPCs (toggle=kudo-not-found, create=receiver-not-found) | Low (cosmetic) | Different action files map separately; fine. Optionally use P0009 for create to avoid confusion |

## Recommendations
1. **Re-scope phase 03** — realtime hearts is already wired (`use-board-feed.ts:107`, `use-highlights.ts:72`). Keep only: move feed `heart_count`/`liked_by_me` server-side (perf) + add hearts DELETE to feed channel if absent. Delete the "build subscription" framing.
2. **CUT phase 06 to verify-only** — hashtag+department filter is fully implemented (`board-queries.ts:214–221`). Confirm indexes + add e2e; don't re-implement.
3. **Keep 01 + 04 as-is** — genuine, high-value, minimal. These are the actual "ko ổn" fixes.
4. **Phase 02 = verify, not build** — highlights already read `special_day_config`; just confirm leaderboard does too + annotate deprecated `event_config` column.
5. **Before takumi:** diff-guard the `create_kudo` rewrite; grep for non-RPC hearts inserts.

## Net effect
Real work ≈ **phase 01 + 04 (core fixes) + a thin slice of 03 (feed server-side count)**. Phases 02/06 collapse to verify; 03 shrinks ~60%. The "ko ổn" is genuinely phases 01 (race) + 04 (create gaps) — the plan's other phases are largely already solved. Trim, then forge.

## Unresolved questions
- Phase 05 (kudo detail): keep or cut? Needs MoMorph artboard to gate UI.
- Does the feed realtime channel listen to hearts **DELETE** (unlike), or only INSERT? (INSERT confirmed at `:107`; verify DELETE.)
