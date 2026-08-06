# Docs Refresh — 2026-08-06

All six docs updated in priority order. Every claim was verified against source before writing.

---

## system-architecture.md (A1–A10)

| Finding | Action |
|---------|--------|
| A1 Route map 6→13 routes | Updated: added /board /awards /countdown /profile /rules /secret-box /notifications /notifications/panel; removed /todo |
| A2 `/` renders HomepageConnected | Updated: no redirect to /todo; public route |
| A3 Features map 2→12 modules | Updated: all 12 modules listed with purpose |
| A4 src/components | Updated: +page-container, site-account-menu, site-header |
| A5 src/lib | Updated: +time/, +ui-state-override.ts |
| A6 proxy.ts 3 responsibilities | Updated: session refresh + pre-launch gate (reads event_config DB, fail-open) + auth guard; fast-path for unauthenticated added |
| A7 DB "not yet migrated" list | Removed. Replaced with full applied-migrations table (14 tables/views across 22 migrations) |
| A8 QueryProvider → root providers.tsx | Updated: RootProviders in src/app/providers.tsx; Toaster also moved there |
| A9 auth callback default → `/` | Updated: sanitizeNext defaults to `/` |
| **A10 Sender masking** | **Implemented and active.** `kudos_public` view (migrations 20260731070000 + 20260731100000) masks `sender_id → null` and `sender_name → anonymous_name` for `is_anonymous = true` rows. The "must ship before Live board" concern in the prior doc was stale — board shipped, masking was already in place. Known Issues entry replaced accordingly. |

Lines: 295 (was 240).

---

## development-roadmap.md (B1–B9)

| Finding | Action |
|---------|--------|
| B1–B3 Phases 4/5/6 "Planned" → Done | Marked Done with delivered items |
| B4 /todo removed | Removed from route references; auth callback notes `/` default |
| B5 Screen count | 8 Done + Gate PASS; remaining accurately listed |
| B6 departments FK migrated | Phase 5 now shows `profiles.department_ref` uuid FK wired |
| B7 notifications built | Routes exist; status: gate BLOCKED on MoMorph spec |
| B8 secret-box row | Added to Phase 4 |
| B9 /kudos → /board context | Note added in Phase 4 |

Lines: 158 (was 142).

---

## database-schema.md (D1–D12)

| Finding | Action |
|---------|--------|
| D1 `secret_boxes` → `secret_box` (singular, user_id PK) | Fixed: `secret_box` with user_id PK, unopened_box_count, updated_at |
| D2 `badges` table doesn't exist | Removed badges table section; replaced with note pointing to static `badge-assets.ts` |
| D3 `user_badges` → `secret_box_badges` | Fixed: `secret_box_badges(id, user_id, badge_key, opened_at)` |
| D4 `kudos_likes` → `hearts` (no hearts_value) | Fixed: `hearts(user_id, kudo_id, liked_at, is_special_day)` PK(user_id,kudo_id) |
| D5 `special_days` → `special_day_config` | Fixed: `special_day_config(event_date PK, hearts_multiplier)` |
| D6 `departments` uuid PK + `name` unique | Fixed: uuid PK, `name unique not null`; seed is 7 departments not ~50 code-based ones |
| D7 Config: `event_config` DB table not env var | Fixed: Decision Log entry updated; Config section now shows DB table not env var |
| D8 awards = static TS config | Fixed: explicit note — no DB table, static config in src/features/awards/ |
| D9 "chưa có migration" list stale | Removed stale list; only `kudos_mentions` correctly marked pending |
| D10 no `kudos.like_count` | Fixed: note says aggregated from hearts at query time |
| D11 `kudos.danh_hieu` | Added column to kudos table (migration 20260804010000); create_kudo is 8-arg |
| D12 kudos_mentions deferred | Kept with correct "no migration" note |

Additional: Added Views and RPCs sections (kudos_public, profile_stats_view, create_kudo, open_secret_box, get_highlight_kudos, board_leaderboard). Added notifications table (previously absent from doc). Added event_config table (previously described only as env var). Lines: 203 (was 181).

---

## code-standards.md (E1–E2)

| Finding | Action |
|---------|--------|
| E1 Test list 5 files → `src/**/*.test.ts(x)` (39 files) | Updated: pattern + count (39 as of 2026-08-06) |
| E2 QueryProvider root layout | Updated: points to src/app/providers.tsx (RootProviders) |

Lines: 227 (was 230 — net smaller).

---

## getting-started-guide.html (G1–G5)

| Finding | Action |
|---------|--------|
| G1 port 3000 → 3001 | Fixed in `npm run dev` comment |
| G2 Remove shadcn/Zustand rows | Verified absent in package.json; removed both table rows |
| G3 Remove "only next/react/react-dom" callout | Removed the warn callout; replaced with neutral note |
| G4 Screen count | Updated callout: 8 screens Done + Gate PASS listed by name |
| G5 TDD → test-after | Fixed: lead paragraph, flow step ⑨, and surrounding text updated to reflect ui-first-gate override |

---

## project-changelog.md (C1)

Added `### Added — 2026-08-06` and `### Changed — 2026-08-06` sections under `[Unreleased]` covering:
- Homepage redesign, Awards page, Rules page, Countdown refinements
- Shared ui_state fixture infra (`7eeba16`)
- Property-diff hard gate replacing pixel-diff (`2bd507f`)
- 1920px no-break
- Fixed header + modal z-index fixes
- Pre-launch gate parallelization (`229c0c5`)
- `/todo` removal (`08788b9`) with `/` as new default redirect

All entries tied to actual commit SHAs from `git log`. Lines: 186 (was 158).

---

## performance-guidelines.md (F1–F2)

| Finding | Action |
|---------|--------|
| F1 63 client comps → actual | Updated to 89 (verified: `grep -rl "'use client'" src/ | wc -l`) |
| F2 bundle-analyzer open item | Removed — `@next/bundle-analyzer` already added (noted in changelog 2026-08-05 Unreleased section) |

Lines: 99 (was 100).

---

## Audit findings that were wrong or imprecise

- **D6 audit said `name` only (no `code`)** — confirmed correct: migration has `name unique not null`, no `code` column. The old doc had `code` column; audit correctly flagged it.
- **F1 audit said 71 client comps** — actual grep count is 89 as of 2026-08-06. The audit figure (71) was already stale by the time this refresh ran. Used the live grep count.
- **A10 masking** — the audit correctly flagged this as needing a targeted check. Masking is **fully implemented** via `kudos_public` view (two migrations). The "must ship before Live board" known-issue entry has been replaced with a factual statement that it is resolved.

---

**Status:** DONE
**Summary:** All 7 docs updated. Every change verified against source (migrations, src/, proxy.ts, git log) before writing. A10 sender masking confirmed implemented — `kudos_public` view active across two migrations; prior "must ship" warning removed.
