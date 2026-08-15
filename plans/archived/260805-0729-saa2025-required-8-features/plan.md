---
title: SAA 2025 — required 8 features (scoped rebuild plan)
work_type: feature
status: superseded
cleanup_note: "2026-08-13 — reference/comparison artifact; superseded by 260803-1636-saa2025-remaining-7-screens. Kept in place, not archived."
blockedBy: []
blocks: []
note: Clean-slate plan scoped STRICTLY to the 8 requested features (STT 6–13). Built to compare against the sprawling current plan (260803-1636). No code changes.
---

# Plan: SAA 2025 — required 8 features only

Scope = exactly the 8 requested items (STT 6–13). Anything else the current codebase built
(Profile, Secret Box open-screen, Notifications service, Rules modal) is **out of scope** here —
see the gap report: `plans/reports/gap-260805-0729-required-vs-current.md`.

- **fileKey:** `9ypp4enmFmdK3YAFJLIu6C`
- **MoMorph two-track:** Track A (UI, one phase/screen) ∥ Track B (backend/logic). Integration is the only merge.
- **Reality note:** most of this is ALREADY built. Status column = current truth, so this doubles as a "keep vs cut" map.

## Required features → phases

| STT | Feature | Phase | Track | Current status |
|-----|---------|-------|-------|----------------|
| 6  | Login (Google) | [03](phase-03-ui-login.md) | A·UI | ✅ built (code+unit+e2e) |
| 7  | Homepage SAA | [04](phase-04-ui-homepage.md) | A·UI | ✅ built |
| 8  | Hệ thống giải (Awards) | [05](phase-05-ui-awards.md) | A·UI | ✅ built |
| 9  | Countdown Prelaunch | [06](phase-06-ui-countdown.md) | A·UI | ✅ built (gate in `src/proxy.ts`) |
| 10 | Đa ngôn ngữ (VN/EN) | [02](phase-02-i18n.md) | B·x-cut | ⚠️ built but `en.json` kudos keys EMPTY |
| 11 | Sun* Kudos display (6 sub) | [07](phase-07-ui-kudos-board.md) | A·UI | ✅ built (served at `/board`) |
| 12 | Viết Kudos | [08](phase-08-ui-compose-kudos.md) | A·UI | ✅ built |
| 13 | Like Kudos (heart) | [01](phase-01-backend-foundation.md) | B·logic | ✅ built (hearts + RLS) |

Shared backend + integration + QA:

| # | Phase | Track | Status |
|---|-------|-------|--------|
| 01 | [Backend foundation](phase-01-backend-foundation.md) (auth, event_config+gate, kudos model, hearts, board queries, gift data) | B | ✅ built |
| 02 | [i18n VN/EN](phase-02-i18n.md) | B·x-cut | ⚠️ finish EN strings |
| 09 | [Integration](phase-09-integration.md) (wire UI ↔ backend, mock→real) | A+B | ✅ done for in-scope screens |
| 10 | [Tests + review](phase-10-tests-review.md) (Vitest + Playwright, scoped to 8) | test/review | ⚠️ trim to scope |

## The 6 sub-features of "Sun* Kudos" (STT 11)

(a) Highlight top-5 by hearts · (b) Spotlight boards · (c) Recent kudos list ·
(d) Filter by hashtag + department · (e) General stats (thống kê chung) ·
(f) Top-10 sunners nhận quà mới nhất — all present in `src/features/board/**`.

> Sub-feature (f) needs *gift/box-received* data → a **minimal** secret-box data model is justified
> to feed the leaderboard, but the interactive **Secret Box open-screen** (`/secret-box`) is NOT required.

## Key dependencies

- Track A (03–08) never blocks/blockedBy Track B (01–02).
- Like Kudos (13) is backend hearts (phase 01) + a toggle in the Kudos card (phase 07).
- i18n (02) is cross-cutting: every Track A screen consumes `messages/{vi,en}.json`.
- Integration (09) is the sole merge; Tests+review (10) at the tail.

## Definition of Done (scoped to 8)

- 6 UI screens pixel-accurate to Figma + responsive (375/768/1280).
- VN **and** EN complete for all in-scope screens (close the `en.json` kudos gap).
- Like Kudos: 1-heart/user, sender≠self, enforced server-side.
- Kudos display shows all 6 sub-features with real data.
- Unit + E2E present and passing, scoped to these 8 (no Profile/Secret-box/Notifications/Rules specs).

## Handoff

This is a comparison/scoping plan — no build kicked off. If you decide to trim, the gap report lists
exactly which files/features are in-scope-keep vs out-of-scope-cut-or-defer.
