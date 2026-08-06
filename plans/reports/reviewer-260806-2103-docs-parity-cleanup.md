# Docs Parity Audit — cleanup findings (2026-08-06)

Audit of `docs/` vs actual code (`src/`, `supabase/migrations/`, `package.json`, `src/proxy.ts`). No doc should be deleted — all drift = **update**. (Written by orchestrator; source agent could not write to disk.)

## Per-file verdict
| File | Verdict | Critical drift |
|---|---|---|
| `system-architecture.md` | OUTDATED (10) | route map, module map, DB table list, QueryProvider placement, proxy description |
| `development-roadmap.md` | OUTDATED (9) | 6 screens shown "Planned" are Done; `/todo` removed; new routes missing |
| `database-schema.md` | OUTDATED (12) | 5 tables wrong name/shape; event_config is DB not env var |
| `project-changelog.md` | OUTDATED minor | 8+ commits unrecorded since 2026-08-05 |
| `code-standards.md` | OUTDATED minor | test list 5 vs 39 real; QueryProvider note stale |
| `performance-guidelines.md` | ACCURATE | "63 client comps"→71; bundle-analyzer already added |
| `getting-started-guide.html` | OUTDATED minor | port 3000→3001; shadcn/Zustand not installed; stale "only 3 pkgs" callout; TDD step |

## system-architecture.md
- A1 route map 6→11 (add /board /awards /countdown /profile /rules /secret-box /notifications; remove /todo, gone in `08788b9`)
- A2 `/` renders HomepageConnected (public, no redirect to /todo)
- A3 features map: 12 modules (only auth/kudos listed)
- A4 src/components: +page-container, site-account-menu, site-header
- A5 src/lib: +time/, +ui-state-override.ts
- A6 proxy.ts also does pre-launch gate (reads event_config DB → /countdown), 3 responsibilities
- A7 DB "not yet migrated" list fully stale — 20+ migrations applied (event_config, hearts, special_day_config, secret_box, secret_box_badges, notifications, departments + views)
- A8 QueryProvider moved page-level → root `src/app/providers.tsx` (RootProviders); Toaster too
- A9 auth callback default → `/` (sanitizeNext), not /todo
- A10 ⚠️ RLS masking "must ship before Live board" — board shipped; NEEDS targeted check (kudos sender masking / kudos_public_view) before closing

## development-roadmap.md
- B1 Phase4 Live Board = Done · B2 Phase5 Profile = Done · B3 Phase6 Homepage/Countdown/Rules/Awards = Done
- B4 remove /todo · B5 ≥8 screens Done (not 10/12 Planned) · B6 departments FK migrated · B7 notifications built · B8 add secret-box · B9 /kudos redirects to /board in prod

## database-schema.md
- D1 `secret_boxes`→`secret_box` (singular): user_id PK, unopened_box_count, updated_at; badges in `secret_box_badges`(badge_key,opened_at)
- D2 `badges` table doesn't exist — static `src/features/secret-box/badge-assets.ts`
- D3 `user_badges` doesn't exist → `secret_box_badges`
- D4 `kudos_likes`→`hearts` (user_id, kudo_id, liked_at, is_special_day); no hearts_value
- D5 `special_days`→`special_day_config` (event_date PK, hearts_multiplier default 1)
- D6 `departments`: id uuid PK, name unique (not code); profiles.department_ref uuid FK
- D7 config: `event_config.event_start_at` DB table (not EVENT_START_AT env var)
- D8 awards = static TS config (no DB table)
- D9 "chưa có migration" list stale — all migrated except kudos_mentions
- D10 no `kudos.like_count` — aggregated from hearts at query time
- D11 `kudos` +`danh_hieu text` (create_kudo now 8-arg)
- D12 kudos_mentions still no migration — keep

## Minor
- code-standards E1 test list 5→`src/**/*.test.ts(x)` (39 files); E2 QueryProvider root layout
- getting-started G1 port 3001; G2 remove shadcn/Zustand (not installed); G3 remove "only 3 pkgs" callout; G4 ≥8 Done; G5 TDD overridden by ui-first-gate (test-after)
- changelog C1 add Unreleased entries post-2026-08-05 (property-diff gate, homepage parity, /todo removal, 1920 no-break)
- performance F1 71 client comps; F2 remove bundle-analyzer open item (done)

## Overlap (no delete)
system-architecture owns route+stack+DB-summary; roadmap/guide/code-standards should link not duplicate.

## Actions (priority)
1. system-architecture.md (Update) 2. development-roadmap.md (Update) 3. database-schema.md (Update) 4. code-standards.md (minor) 5. getting-started-guide.html (minor) 6. project-changelog.md (minor) 7. performance-guidelines.md (low)

## Unresolved
- A10 masking status needs a targeted code check before editing the Known-Issues entry.
