---
title: Profile stats + direction queries
work_type: feature
track: B
status: completed
blockedBy: [01]
blocks: [15]
spec_source: momorph:3FoIx6ALVb
---

# Phase 05 — Profile stats + direction queries (Track B · logic)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (§9 Profile — HEAVY, security)
- DB: phase-01 `profile_stats` view, `kudos_public`, `secret_box`, `secret_box_badges`.
- Reuse: kudo keyset feed + heart actions from phase-04; `kudo-compose-modal` for "other" write-bar.
- Clarifications: anon counted in "sent" total; sender masked in others' received feed; 6 greyed badge slots.

## Overview
- **Priority:** P1 · **Status:** planned
- Backend for the dual-mode Profile: SELF (`/profile`) vs OTHER (`/profile?id={uuid}`). Stats card,
  received/sent direction feed, UUID route validation, and the anon-masking guard on others' feeds.

## Key Insights
- **Security-critical:** OTHER mode must NEVER return that user's **sent** feed (anon-leak vector) — spec
  hides sent to non-owners. `profile_stats.sent` is null for non-callers (phase-01); direction feed
  query must reject `direction=sent` when `profileId ≠ auth.uid()`.
- Received feed for OTHER reads through `kudos_public` → anon senders already masked.
- UUID route shape validated **before** any DB call: malformed `id` → 400/404 fast (don't hit DB);
  well-formed but unknown → 404 after lookup. Reuse a zod uuid guard.
- Tier/stars shown only if `received ≥ 10` (spec); computed from stats, no new column.
- Badge slots = 6 greyed placeholders driven by `boxes_opened` count only; no unlock logic (deferred).

## Requirements
### Server queries (`src/features/profile/profile-queries.ts`)
- `getProfileStats(profileId)`: read `profile_stats` for the id; `sent` present only when `profileId =
  auth.uid()`. Returns received/sent/hearts/boxesOpened/boxesRemaining + tier/stars derived.
  **`boxesRemaining` defaults to `0`** when the caller has no `secret_box` row (phase-01 view already
  `coalesce(...,0)`; the query/hook must not surface `null` for this field).
- `listProfileKudos({ profileId, direction, cursor })`: keyset feed from `kudos_public` on `(created_at, id) desc`.
  - `direction=received`: kudos where `receiver_id = profileId` (anon senders masked).
  - `direction=sent`: **only allowed when `profileId = auth.uid()`**; else throw/deny.
- `getProfileHeader(profileId)`: **EXPLICIT column list — no `SELECT *`.** Returns exactly
  `id (the profile id, NOT auth id — same value here but selected explicitly), full_name, avatar_url,
  department_id, title` from `profiles`. **Excludes `email`** and any auth/session identifier.
- `getIsAdmin()`: reads **`profiles.is_admin`** (boolean) for `auth.uid()` → returns `boolean`.
  > Disk fact: the admin flag is `profiles.is_admin`, **NOT** `profiles.role` (no such column). The
  > Homepage header (phase-11 contract `isAdmin`) consumes exactly this boolean. May be folded into
  > `getProfileHeader` for the self case, but the admin-menu gate on Homepage reads `getIsAdmin()`.

### Route validation util (`src/features/profile/profile-route.ts`)
- `parseProfileId(param): { mode: 'self' } | { mode: 'other', id: string } | { mode: 'invalid' }`.
  Uses zod uuid; malformed → `invalid` (→ 404). No `id` → `self`.

### Client hooks (`src/features/profile/use-profile-stats.ts`, `use-profile-feed.ts`)
- `use-profile-stats`: query stats + header.
- `use-profile-feed`: `useInfiniteQuery` keyset by direction; reuse `use-toggle-heart` from phase-04.

## Architecture — data flow
```
route param ──parseProfileId──▶ self | other(uuid) | invalid(→404)
profile_stats ──getProfileStats(caller-scoped)──▶ received/sent(null for other)/hearts/boxes ──▶ stats card
kudos_public ──listProfileKudos(direction, keyset)──▶ feed  [sent blocked for non-owner]
```

## Related Code Files
- **Create:** `src/features/profile/profile-queries.ts`, `src/features/profile/profile-route.ts`,
  `src/features/profile/use-profile-stats.ts`, `src/features/profile/use-profile-feed.ts`.
- **Modify:** none.
- **Delete:** none.

## Implementation Steps
1. `parseProfileId` zod-uuid guard (self / other / invalid).
2. `getProfileStats` reading caller-scoped view; derive tier/stars (`received ≥ 10`); `boxesRemaining` never null (default 0).
3. `listProfileKudos` keyset `(created_at, id) desc`; hard-deny `sent` for non-owner.
4. `getProfileHeader` explicit column list (`id, full_name, avatar_url, department_id, title`); no `SELECT *`, no email.
5. `getIsAdmin()` reads `profiles.is_admin` for `auth.uid()`.
6. Hooks wrapping the above; reuse phase-04 heart toggle.

## Todo
- [ ] `parseProfileId` (self/other/invalid, uuid guard)
- [ ] `getProfileStats` (sent null for non-owner, tier/stars derive, boxesRemaining default 0)
- [ ] `listProfileKudos` (keyset (created_at,id) desc; sent denied for non-owner)
- [ ] `getProfileHeader` (explicit columns, no `SELECT *`, no email/auth-id)
- [ ] `getIsAdmin()` (reads `profiles.is_admin`)
- [ ] `use-profile-stats` + `use-profile-feed`

## Success Criteria (binary)
- [ ] `listProfileKudos({direction:'sent'})` for another user's id is rejected (throws/empty-deny), never returns rows.
- [ ] `getProfileStats(otherId)` returns `sent = null`.
- [ ] Malformed uuid param resolves to `invalid` without a DB round-trip.
- [ ] Received feed for an anon kudo exposes `sender_id = null`.
- [ ] `getProfileHeader` result contains no `email` / auth id field (explicit column list only).
- [ ] `getIsAdmin()` returns the caller's `profiles.is_admin` boolean (true for a seeded admin, false otherwise).
- [ ] `getProfileStats` returns `boxesRemaining = 0` (not null) for a user with no `secret_box` row.

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Other's sent feed leaks (anon vector) | Med | **High** | Hard deny in query + binary test above |
| PII leak in header | Low | **High** | Explicit field allowlist + test asserts no email |
| Sparse profile null-crash | Med | Med | Null-checks; tier/stars gated on received≥10 |

## Security Considerations
- Sent-list never crosses users; anon masking via `kudos_public`; header field allowlist (no PII).

## Next Steps
- Profile UI (13) + write-bar (reuse kudo modal) consume these in integration (15).

## MoMorph refs:
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
