# Phase 01 — Backend foundation (Track B)

**Priority:** P0 · **Status:** ✅ built · covers STT 13 (Like) + shared data for 6/7/9/11.

## Scope (in-scope only)
- **Auth (Google OAuth)** — `src/features/auth/**`, `src/app/auth/callback/route.ts`, guard in `src/proxy.ts`.
- **event_config + prelaunch gate** — `src/features/event/launch-gate.ts`, gate enforced in `src/proxy.ts`.
- **Kudos model** — `supabase/migrations/20260731000000_create_kudos.sql`, `kudos_public` masked view.
- **Hearts (Like Kudos, STT 13)** — `supabase/migrations/20260731030000_create_hearts.sql`,
  `src/features/board/heart-actions.ts`, `use-toggle-heart.ts`. RLS: PK `(user_id,kudo_id)` = 1/user;
  `hearts_insert_own` blocks sender≠self.
- **Board queries** feeding the 6 Kudos sub-features — `src/features/board/board-queries.ts`,
  RPCs `get_highlight_kudos`, `get_spotlight_recipients`, `get_gift_leaderboard`.

## Out of scope (do NOT build under these 8)
- `profile_stats` view / direction queries (Profile screen — not required).
- secret-box open/entitlement/weighted-random logic. **Exception:** the minimal gift-received data
  that feeds sub-feature (f) "top-10 nhận quà" leaderboard is kept; the open-screen is not.
- notification service tables + Realtime.

## Success criteria
- Google login works; prelaunch gate redirects non-admins to `/countdown`; admins + bypass paths exempt.
- Heart toggle idempotent, 1/user, sender cannot heart own kudo (server-enforced).
- Board query RPCs return data for all 6 sub-features.
