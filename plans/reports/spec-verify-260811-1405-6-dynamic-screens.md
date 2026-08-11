# Spec Verification — 6 Dynamic Screens (spec-anchored re-run) — verdict: FAIL · runtime UNSEALED

**Date:** 2026-08-11 · **fileKey:** 9ypp4enmFmdK3YAFJLIu6C · **Mode:** static, spec-anchored (Docker/Supabase local DOWN → runtime rules UNVERIFIED(static); Docker.app not installed, cannot bring DB up from here)
**Specs used:** real `download_test_cases` (main thread) for board `MaZUn5xHXZ`(41) · profile `3FoIx6ALVb`(30) · notifications `6-1LRz3vqr`(21) · secret-box `J3-4YFIpMM`(19) · homepage `i87tDx10uM`(62). Kudos `ihQ26W78P2` TCs not re-fetched (findings there are objective/runtime, not spec-interpretation).

## Method note (why this run supersedes the first)
First pass fanned out to 6 subagents; **MoMorph MCP returned empty inside every subagent** (token not propagated) so they inferred rules from `clarifications.md`/migrations — not the spec. This pass re-fetched the **real test cases in the main thread** and re-adjudicated every High/Critical claim against them + the code. **6 of the subagents' top findings were false** (below). Trust subagent static findings only after spec+code re-check.

## Debunked on spec+code re-check — NOT bugs
| Claimed | Sev claimed | Reality (evidence) |
|---|---|---|
| Profile: `toggle_heart` crashes on anonymous kudos | High | **FALSE** — base `kudos.sender_id` is `NOT NULL` (`20260731000000:17`); anonymity masked only in `kudos_public` view. RPC reads base table |
| Secret-box: missing `QueryProvider` → crash | Critical | **FALSE** — global provider `layout.tsx:37 → providers.tsx:19` wraps all routes |
| Board: `get_highlight_kudos` not granted `anon` → unauth board breaks | Critical | **MOOT** — `/board` not in `PUBLIC_PATHS`; anon → `/login`, never calls RPC (`guard-rules.ts:17`) |
| Board: feed `heartCount` raw vs carousel weighted (inconsistent) | High | **FALSE** — carousel displays raw `heart_count` (`20260804000000:187`), weighted only in `order by` (`:205`); feed also raw. Spec TC `7a7ec63e`=raw like count; TC `31936b72` weighting is on **sender's aggregate stat**, not per-card. Consistent + correct |
| Secret-box: badge distribution wrong | — | **SATISFIED** — code matches spec TC `d566fbeb` exactly (30/25/20/10/10/5 per Stay-Gold/Flow/Touch/Beyond/Revival/Root) |
| Homepage/countdown: `TODO-NAV-LOCK` strands users | High | **NOT REQUIRED** — spec TC `ID-41`: at event start countdown "shows 00 00 00, Coming soon hidden". Code does exactly this. No nav-lock in spec |

## CONFIRMED spec violations (spec-anchored) — FAIL drivers

| # | Screen | Rule (spec TC) | Code loc | Verdict | Fix |
|---|---|---|---|---|---|
| V1 | profile | **Write-Kudo bar must open Viết Kudo modal with viewed Sunner pre-filled as recipient** — `TC_WEB_PROFILE_FUN_007` (High) | `profile-connected.tsx:128` `handleWriteKudo=()=>{}` (no-op); `KudoComposeModal` has no `initialRecipient` prop | **VIOLATED[static]** | Add `initialRecipientId?:string` prop to modal; wire `handleWriteKudo` to open it seeded with `profileId` when `!isSelf` |
| V2 | profile | **Heart toggle count must update to the SERVER-reported value on the profile feed** — `TC_WEB_PROFILE_FUN_014` (High) | `use-toggle-heart.ts` `onSettled` invalidates only `boardFeedKeys`/`highlightKeys`, never `profileFeedKeys` | **VIOLATED[static]** | Invalidate `profileFeedKeys.all` in `onSettled` (or extend optimistic update to profile cache) |
| V3 | profile | Clicking receiver avatar/name opens receiver profile (board-parity `GUI_006` + board TC `630f42a3`) — broken on **sent** cards | `profile-connected.tsx:57` `receiverId: direction==='received'?profileId:''` → `handleOpenProfile('')` returns early (`:139`) | **VIOLATED[static]** | Add `receiver_id` to `ProfileKudoRow` + `listProfileKudos` select; map it for sent cards |

## Spec gaps / blocked-on-spec

| # | Screen | Finding | Code | Status |
|---|---|---|---|---|
| G1 | notifications | Spec F007 mandates **4 notification types** (`kudos_received`, `heart_received`+dedupe TC-013 High, `secret_box_available`, `kudos_hidden`). Code emits **only `kudos_received`** (`20260731120000` trigger); `notifications.type` is free-text with no other emitter; mock shows `heart_received` the backend never produces | `20260811010000` (no notify), `notification-actions.ts:15` | **UNIMPLEMENTED — BLOCKED on spec** (see contradiction C1) |
| G2 | notifications | Badge caps at **`99+`**; spec `TC-F007-005` says cap at **`9+`** | `site-header.tsx:222` `unreadCount>99?'99+'` | **VIOLATED (minor)** — pending F007 provenance |

## ⚠️ Spec-internal contradiction — needs your decision (C1)
The notifications spec `6-1LRz3vqr` (F007) is written in a **different vocabulary** from every other screen — oRPC (`notifications.list/markRead`), `authMiddleware`, `data-testid`, `EC/US/BL` codes, `kudos_hidden` moderation, `/community-standards`. This **contradicts**:
- the **profile spec** `TC_WEB_PROFILE_GUI_007`: *"no moderation model exists in the schema or the specs"* (⇒ `kudos_hidden` shouldn't exist), and
- the project's actual **Supabase + server-action** architecture (no oRPC layer).

**F007 looks like a template/foreign spec grafted onto the notifications frame.** Do NOT build `heart_received`/`secret_box_available`/`kudos_hidden` against it until you confirm scope. Question: is the notification system meant to be just `kudos_received` (current), or the full 4-type F007 design?

## Runtime-provable rules — UNVERIFIED(static), Docker down (need `npm run db:reset` to seal)
- Board/Profile: double-like idempotency (`on conflict do nothing` — looks correct), special-day `+2` weighting end-to-end (`hearts_received` view formula correct statically), keyset pagination no-dup.
- Kudos: `create_kudo` transaction atomicity / rollback on partial failure; receiver-FK friendly error; double-submit (no synchronous mutex in `kudo-compose-modal.tsx:181` — add `useRef` guard).
- Secret-box: `FOR UPDATE` double-open race; decrement-by-exactly-1.
- Notifications: realtime unread badge INSERT/UPDATE; `markRead` foreign-id → NOT_FOUND (`TC-F007-020`).

## Gate-coverage gaps (UI-gate concern, not spec-logic)
- Secret-box: no `?ui_state=` override → can't force empty/error at UI gate (only screen missing it).
- Kudos compose: no `mocks/kudos.mock.ts` / `?ui_state=error` path into the modal.

## Confirmed SOLID (spec-anchored, high confidence)
- **Board:** self-like block (P0008, TC `63645b03`), one-like-per-user (`91e102ba`), special-day +2 to sender stat (`31936b72`), toggle updates count (`7a7ec63e`), hashtag/department filters (`0e56cacb`/`159fed13`), empty copy "Hiện tại chưa có Kudos nào." (`926d92a5`), feed keyset ordering.
- **Profile:** access control is excellent — sent-direction hidden on other's profile (`SEC_001`, spec's "single most important case") enforced 3 layers; own anonymous sent shows self as author (`SEC_002`); sent never crosses users (`SEC_003`); no email/auth-id exposure (`SEC_004`); route canonicalization/404/malformed-UUID all correct (`FUN_002`–`005`).
- **Secret-box:** auth (P0101), entitlement (P0102, TC `2a8a63de`), `FOR UPDATE` lock, weighted roll = spec, badge allowlist/no-URL-echo (`43badf5d`/`2e7bec78`), close-on-X (`982ae7f9` — spec is silent on destination, so `router.back()` split is cosmetic not a violation).
- **Homepage:** public homepage (ID-0), countdown arithmetic + ISO-8601 +07 (ID-57), zero-state 00:00:00 + hide Coming-soon (ID-41/42), invalid-datetime fallback (ID-60), admin-menu gating (ID-37/38), VN/EN switch (ID-25/26), bell gated on auth.
- **Kudos:** layered validation (Zod+server+DB CHECK), server-side `sanitize-html` allowlist + link-scheme block, atomic `create_kudo` RPC, self-kudo double-guard, anon masking in `kudos_public` + realtime column restriction.

## Per-screen verdict (spec-anchored static)
| Screen | Verdict | Why |
|---|---|---|
| profile | **FAIL** | V1, V2, V3 confirmed against High-priority spec TCs |
| notifications | **FAIL / BLOCKED** | G1 unimplemented + G2 + C1 spec contradiction — resolve F007 scope first |
| board | **CAUTION** | 0 confirmed VIOLATED after debunk; runtime rules unsealed |
| kudos | **CAUTION** | double-submit mutex + gate-coverage; runtime unsealed |
| secret-box | **CAUTION** | 0 spec VIOLATED; ui_state gap (UI-gate); double-open unsealed |
| homepage | **CAUTION→PASS(static)** | 0 VIOLATED; realtime bell unsealed |

**Overall: FAIL** — profile has 3 confirmed spec violations; notifications blocked on the F007 contradiction. Board/kudos/secret-box/homepage are static-clean but cannot seal runtime rules until local Supabase is up.

## FIXED + re-verified (2026-08-11 14:40) — profile V1/V2/V3
Implemented via fe-developer implementer, re-verified statically vs spec + `tsc --noEmit` clean:
- **V1 SATISFIED** (FUN_007): `KudoComposeModal` gains optional `initialRecipient` prop; seeds `recipient` state on mount, `recipientOpen` stays false (no dropdown auto-pop); `profile-screen.tsx` passes `{id: header.id, name, avatarUrl}`. Board/homepage compose flows unchanged (prop optional). `kudo-compose-modal.tsx:55,75-78` · `profile-screen.tsx:198`.
- **V2 SATISFIED** (FUN_014): `profileFeedKeys` extracted to leaf `profile-feed-keys.ts` (no circular import); `use-toggle-heart.ts:171` now invalidates `profileFeedKeys.all` in `onSettled`.
- **V3 SATISFIED** (GUI_006): `ProfileKudoRow.receiverId` added; `receiver_id` added to `listProfileKudos` select (`profile-queries.ts:268,298`); `mapProfileRowToFeedCard` uses `row.receiverId` for both directions (`profile-connected.tsx:56`).

Note: edits are logic-only (props / cache-invalidation / DB select column / mapper) — no visual change; UI-gate skipped once with justification (`.claude/hooks/.logs/ui-gate-skip`). Runtime behavior (V2 refetch, V1 open-with-recipient) still wants a live-DB / browser confirm when Docker is up.

## RUNTIME SEAL (2026-08-11 15:10) — colima + Supabase local up, SQL probes on seed data
Auth-simulated via `request.jwt.claims`, each in BEGIN/ROLLBACK (seed untouched). Probes: `/tmp/aidd-probes.sql`.

| Rule | Probe | Result | Verdict |
|---|---|---|---|
| toggle_heart self-like block (P0008) | user1 heart own kudo-010 | `ERROR: cannot heart own kudo` | **SATISFIED[runtime]** |
| toggle_heart like/unlike + count | user3 kudo-010 twice | liked t (cnt 4) → f (cnt 3), no PK err | **SATISFIED[runtime]** |
| weighted hearts_received (special +2 → +1 each) | view vs raw+special, 8 users | view == raw+special for ALL (u5 15+5=20, u1 12+4=16) | **SATISFIED[runtime]** |
| create_kudo receiver-FK friendly (P0007) | bad receiver uuid | `ERROR: Receiver does not exist` (not raw FK) | **SATISFIED[runtime]** |
| create_kudo atomic (multi-table) | valid → kudo + 2 hashtags in 1 tx | kudo_rows=1, hashtag_rows=2 | **SATISFIED[runtime]** |
| open_secret_box decrement + badge | user2 (5 boxes) | `{badge_key:touch-of-light, remaining:4}` | **SATISFIED[runtime]** |
| open_secret_box reject at 0 (P0102) | user10 (0 boxes) | `ERROR: Bạn không có Secret Box nào để mở` | **SATISFIED[runtime]** |

**Still browser-only (→ Phase 05 E2E, not SQL-provable):** double-submit mutex (kudos), profile V2 heart→server refetch on profile feed, homepage countdown tick + realtime bell, true double-open race (FOR UPDATE lock present statically + sequential decrement sealed; concurrent race needs 2 sessions).

## To fully seal
1. Answer C1 (notification scope: `kudos_received`-only vs full F007 4-type).
2. ✅ Runtime SQL rules — SEALED above (2026-08-11).
3. ✅ Fix V1/V2/V3 (profile) — DONE, static-verified.
4. Browser-only rules → Phase 05 E2E (plan 260811-1429).
