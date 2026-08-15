---
title: Integration (UI ↔ backend)
work_type: feature
track: A+B
status: planned
blockedBy: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14]
blocks: [16]
spec_source: momorph:MaZUn5xHXZ
---

# Phase 15 — Integration: wire UI ↔ backend (Track A+B merge)

## Context Links
- ALL Track A phases (08–14) + ALL Track B phases (01–07). `01` is in `blockedBy` explicitly (the DB
  root) — integration re-verifies RLS/view/publication behaviour live, so it must not start before 01 lands.
- **THE ONLY cross-track merge point** — no Track A↔B edge exists before this.
- Auth model (disk fact `src/features/auth/guard-rules.ts`): app is **default-protected** —
  `PUBLIC_PATHS = ['/login','/auth','/dev-login']` only; every other route requires auth.
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Overview
- **Priority:** P1 · **Status:** planned
- Replace each screen's Figma mock data with the real hooks/actions, wire event handlers, connect
  Realtime, enforce route validation. **Incremental** per the MoMorph protocol: integrate each screen
  as both its tracks land — no monolithic big-bang.

## Key Insights
- Integration owns **page-level composition only** — the `page.tsx` / route file that imports the
  Track A components and the Track B hooks. It does NOT edit component internals (Track A) or
  actions/queries (Track B) → no ownership collision.
- Contracts are already fixed in each Track A phase's "Integration contract" block — wiring is
  mechanical: match prop shape → hook return shape.

## Requirements (per screen)
- **Countdown (08←02):** `use-countdown` → LED display; enforce nav-lock until `done`; invalid fallback.
  **Route auth-guard:** `/countdown` is NOT in `PUBLIC_PATHS` → guard applies (unauth → redirect to `/login?next=/countdown`). Verify, do not add to PUBLIC_PATHS.
- **Prize (09←07):** `AWARDS` → cards; smooth-scroll + active-menu; anchor targets.
  **Route auth-guard:** `/awards` not public → guard applies (unauth → `/login?next=/awards`). Verify.
- **Rules (10←07):** `RULES_SECTIONS`/`RULE_BADGES` → body; scroll-overflow → button enable; "Viết KUDOS" → `kudo-compose-modal`.
  **Auth decision:** Rules **requires auth** — consistent with the default-protected model (`/rules` not in
  PUBLIC_PATHS). "Viết KUDOS" additionally requires an authed session (kudo compose). No public exception added.
- **Homepage (11←02,03,05,07):** countdown hero; `use-notifications` → bell badge; auth-gated account menu +
  admin menu gated on `getIsAdmin()` (phase-05, reads `profiles.is_admin`); `AWARDS` grid; card→`/awards#{slug}`; active-nav.
- **Live board (12←04):** feed/highlights/spotlight/heart hooks; signal-only Realtime (re-fetch via `kudos_public`);
  filter sync via `?hashtag` URL search param (page.tsx owns the param); avatar→`/profile?id=`.
- **Profile (13←05,04):** `parseProfileId` route guard (invalid→404); stats/direction hooks; sent hidden for OTHER; write-bar prefill; heart toggle; tier/stars gating.
- **Secret box (14←06):** `use-secret-box` → open flow; disable box when `unopened=0` OR `isOpening`; badge asset from allowlist.

### i18n audit (cross-screen, one pass at the end)
- After wiring, run a single i18n audit: every user-visible string on Countdown / Homepage / Live board /
  Profile / Secret box resolves to a defined next-intl key (VN filled) with no missing-key warning at render.
  Track A used Figma mock text; integration confirms the phase-07-owned message files cover each rendered string.

## Architecture — data flow (composition layer)
```
Track A components (props)  +  Track B hooks (data)  ──page.tsx wiring──▶ live screen
mock data ──replaced by──▶ real hook returns (contract shapes pre-agreed)
```

## Related Code Files
- **Modify (page shells created in Track A):** `src/app/countdown/page.tsx`, `src/app/awards/page.tsx`,
  `src/app/rules/page.tsx`, home page, `src/app/board/page.tsx`, `src/app/profile/page.tsx`,
  `src/app/secret-box/page.tsx` — swap mock → hooks. Wrap data subtrees in `QueryProvider`.
- **Create:** none (all pieces exist from 02–14).
- **Delete:** mock-data fixtures introduced by Track A (once real data is wired).

## Implementation Steps
1. Per screen: import Track A components + Track B hook; map contract props → hook returns.
2. Wire event handlers (heart toggle, open box, write-kudo, markRead, nav).
3. Connect Realtime subscriptions (board, notifications) at the page level — signal-only, re-fetch via `kudos_public`.
4. Enforce route/nav guards: countdown nav-lock; profile UUID 404; verify Countdown/Prize/Rules fall under
   the default auth guard (not in `PUBLIC_PATHS`); wire `?hashtag` param ownership on the board page.
5. i18n audit pass across the 5 dynamic screens (Countdown/Homepage/Live board/Profile/Secret box).
6. `tsc --noEmit` after each screen; remove that screen's mock fixtures.

## Todo
- [ ] Countdown wired (nav-lock + fallback; `/countdown` under auth guard, verified)
- [ ] Prize wired (config + scroll; `/awards` under auth guard, verified)
- [ ] Rules wired (overflow + Viết KUDOS modal; `/rules` requires auth — no public exception)
- [ ] Homepage wired (countdown + bell + account menu + admin gated on `getIsAdmin()` + grid)
- [ ] Live board wired (feed/heart/spotlight + signal-only Realtime + `?hashtag` filter)
- [ ] Profile wired (route guard + stats + direction + write-bar)
- [ ] Secret box wired (open + disable when unopened=0 OR isOpening)
- [ ] i18n audit pass (5 dynamic screens, no missing-key)
- [ ] all mock fixtures removed; `tsc --noEmit` clean

## Success Criteria (binary)
- [ ] Every screen renders real data (no mock fixture imports remain).
- [ ] Board + notifications update live via Realtime with a second client.
- [ ] Profile OTHER mode shows no sent feed; malformed id → 404.
- [ ] Countdown blocks nav until `done`; secret box disabled at `unopened=0` or while `isOpening`.
- [ ] Unauthed request to `/countdown`, `/awards`, `/rules` redirects to `/login` (guard holds; none in PUBLIC_PATHS).
- [ ] No missing-i18n-key warning renders on any of the 5 dynamic screens.
- [ ] `tsc --noEmit` and `npm run lint` pass with zero errors.

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Contract drift (prop ≠ hook shape) | Med | Med | Contracts pinned in Track A phases; tsc catches |
| Ownership collision at page file | Low | Med | Integration owns only `page.tsx`; components/actions untouched |
| Realtime double-subscribe on remount | Med | Low | Single channel per page; cleanup verified |

## Security Considerations
- Re-verify at wiring time: anon mask holds on board/profile feeds; secret-box outcome server-only; no PII in profile header.

## Next Steps
- Hand fully-wired screens to Tests (16), then Review (17).

## MoMorph refs:
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Profile: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
