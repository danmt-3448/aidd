# E2E Baseline + Screenshot Evidence — 5 dynamic screens

**Date:** 2026-08-11 · Env: colima + Supabase local (seeded) · dev `:3001` · event = LIVE (past)
Full log: `../evidence/e2e-baseline.log` · Screenshots: `../evidence/screenshots/`

## Unit — ✅ 502/502 passed (39 files, 7.4s)
Logic/validation/hooks layer fully green.

## E2E baseline — 60 passed · 77 failed · 4 skipped (20.8m, retries on)
**The 77 failures are dominated by TWO systemic causes, not 77 product bugs.** Failing-artifact counts by spec (≈ unique tests × retry):

| Spec | Fail artifacts | Root cause | Kind |
|---|---|---|---|
| viet-kudo | 70 (~35 tests) | `openModal()` clicks `button "Viết Kudo"` which doesn't exist — real trigger is the board compose input or `/kudos?modal=compose`. One helper → cascades to all viet-kudo tests | **STALE TEST** (wrong selector) |
| homepage | 62 (~31 tests) | Seed set event **live/past** → countdown shows `00:00:00`, tests assert **future/ticking** + "Coming soon" visible | **CONFIG TENSION** (seed vs test) |
| countdown | 10 (~5 tests) | Event live → pre-launch gate off → countdown-page flow differs | CONFIG TENSION |
| profile | 6 (~3 tests) | needs review — candidate real (received count / V-fixes) | **INVESTIGATE** |
| board | 2 (~1 test) | needs review | INVESTIGATE |
| login | 1 | sticky-header on scroll | flaky/minor |

**Interpretation:** excluding the stale-selector cascade (viet-kudo) + event-config tension (homepage/countdown ≈ 36 tests), the real product-bug surface is small (profile/board/login ~5 tests) + the 2 findings below. The backend was already runtime-sealed (7/7 SQL rules — see `../../reports/spec-verify-260811-1405-6-dynamic-screens.md`).

## Confirmed product findings (from screenshot + DB evidence)
**F1 — Profile-other received count shows 0 (should be 4)** · sev: High
DB `profile_stats.received` for Lê Văn Cường (user3) = **4**; UI dropdown renders "**Đã nhận (0)**" while 4 received cards display (see `05-profile-other.png`). `receivedCount = stats?.received ?? 0` (`profile-connected.tsx:225`) — `stats` is null/unresolved on other-profiles though the view returns the value. Fix: ensure `useProfileStats(profileId)` populates `received` for non-self (or read count from feed total).

**F2 — Homepage "Coming soon" never hides** · sev: Medium
`homepage-hero.tsx:119` renders the "Coming soon" label unconditionally; spec `ID-42` requires it hidden once the event has started (`countdown.done`). At live/past event it still shows with `00:00:00`. Fix: gate the label on `!done`.

## Screenshot evidence (fullPage, authed, seeded — 1440px)
| # | Screen | What it proves |
|---|---|---|
| ![board](../evidence/screenshots/02-board-full.png) | **Board** (`02-board-full.png`, 17625px) | KV banner · HIGHLIGHT carousel · All-Kudos feed (real seed) · Spotlight word-cloud · sidebar stats + filters |
| ![kudos](../evidence/screenshots/03-kudos-compose.png) | **Viết Kudo** (`03-kudos-compose.png`) | modal: recipient · danh hiệu · rich-text toolbar (B/I/S/list/link/quote + Tiêu chuẩn cộng đồng) · textarea 0/2000 + @mention · Hashtag/Image (max 5) · anonymous checkbox · Hủy/Gửi |
| ![profile-self](../evidence/screenshots/04-profile-self.png) | **Profile self** (`04-profile-self.png`, 4189px) | hero+tier · badge row · stats card (5 counters) · kudos feed |
| ![profile-other](../evidence/screenshots/05-profile-other.png) | **Profile other** (`05-profile-other.png`) | write-Kudo bar (V1) · received-only dropdown (SEC_001) · masked-sender cards + hearts/copy-link · **shows F1 bug** |
| ![homepage](../evidence/screenshots/01-homepage.png) | **Homepage** (`01-homepage.png`, 4170px) | ROOT FURTHER hero · countdown · ABOUT AWARDS/KUDOS CTAs · 6-card awards grid · Sun* Kudos section · footer · **shows F2** |
| ![secret-box](../evidence/screenshots/06-secret-box.png) | **Secret box** (`06-secret-box.png`) | open-box modal + counter + open action |
| ![notifications](../evidence/screenshots/07-notifications.png) | Notifications (`07-notifications.png`) | out-of-scope screen, empty (no seed) — captured for completeness |

Capture script: `e2e/capture-evidence.mjs`.

## Next (Phase 04/05 continuation)
1. **Fix F1 + F2** (real bugs) → DEV role.
2. **Fix stale viet-kudo `openModal()`** selector → real compose trigger (unblocks ~35 tests).
3. **Resolve event-config tension:** split homepage/countdown E2E to set a *future* event_config at test-time (they need ticking), keep the shared seed live for board/profile/kudos/secret-box.
4. Investigate the ~3 profile + ~1 board genuine failures.
5. Re-run E2E → target green; then `/aidd-ui-gate` for the 5 screens (visual).

## Open questions
- Notifications scope (C1) still pending — its screen stays empty/untested until decided.
