---
title: "Kudo + Like API hardening (Track B — backend only)"
work_type: feature
spec_waived: "Hardening APIs đã build cho 2 màn có sẵn spec MoMorph (Viết Kudo ihQ26W78P2 · Live Board MaZUn5xHXZ). Nguồn chân lý = MoMorph test-cases + implementation hiện tại. Không author feature spec mới."
status: pending
priority: P1
branch: develop
created: 2026-08-11
blockedBy: []
blocks: []
origin: "Hardens backend built by 260731-0836-viet-kudo (create_kudo) + 260803-1636-saa2025-remaining-7-screens (hearts, board-queries) — both those phases completed."
---

# Plan: Kudo + Like API hardening (Track B only)

API cũ đã có nhưng "ko ổn". Audit + spec MoMorph đã xác định lỗ thật. **CHỈ backend/API — UI đã build + PASS UI-First Gate, plan này KHÔNG đụng layout.** Approach: **targeted hardening**, không rebuild (kiến trúc đang đúng).

- **fileKey:** `9ypp4enmFmdK3YAFJLIu6C` · Viết Kudo `ihQ26W78P2` · Live Board (Like) `MaZUn5xHXZ`
- **Diagnosis:** `plans/reports/` (audit 2026-08-11) — race double-click, không realtime, config multiplier trùng, receiver-FK leak, ảnh mồ côi.

## Business rules cứng (từ MoMorph test-cases)
- Sender **không** like được kudo của chính mình (63645b03).
- **1 like / user / kudo** (91e102ba) — double-click phải resolve về toggle, không lỗi.
- Like ngày special-day → tính **multiplier×** cho RANKING (highlight top-5 + leaderboard); **count trên card vẫn raw** (31936b72).
- Viết Kudo: receiver required + tồn tại; hashtag 1–5; image 0–5; anonymous → mask sender.

## Phases (đã hiệu chỉnh sau verify correctness — xem `reports/predict-risks-*`)

| # | Phase | Track | Scope | Status | blockedBy |
|---|-------|-------|-------|--------|-----------|
| 01 | [toggle_heart RPC (atomic idempotent)](phase-01-toggle-heart-rpc.md) | B·Like | **core — bug thật (race)** | pending | — |
| 02 | [Special-day weighted `hearts_received` (REAL FIX)](phase-02-special-day-multiplier.md) | B·Like | **core — bug thật (đếm phẳng)** | pending | 01 |
| 03 | [`liked_by_me`/count server-side (privacy+perf)](phase-03-realtime-hearts-count.md) | B·Like | core (SHRUNK — realtime đã đúng) | pending | 01 |
| 04 | [create_kudo: receiver check + orphan-image cleanup](phase-04-create-kudo-hardening.md) | B·Viết | **core — gap thật** | pending | — |
| 05 | [get_kudo_detail RPC + /kudos/[id]](phase-05-kudo-detail.md) | B·adjacent | **OPTIONAL** | pending | 03 |
| 06 | [Feed filter: hashtag + phòng ban (VERIFY-only)](phase-06-feed-filter.md) | B·adjacent | **VERIFY (đã wire) → likely CUT** | pending | 03 |
| 07 | [Integration + tests (unit + e2e)](phase-07-integration-tests.md) | test | core | pending | 01–04 |

## Correctness verify — "đã có" KHÔNG có nghĩa "đúng" (bằng chứng)
| Mảnh đã có | Đúng? |
|---|---|
| feed realtime (INSERT+DELETE), highlight weighted formula | ✅ đúng → **giữ, không rebuild** |
| leaderboard by kudo-count | ✅ đúng (star-tier hoa-thị 10/20/50, không phải hearts) |
| filter hashtag/phòng ban | ✅ đã wire → chỉ verify (P06) |
| **toggle_heart** | ❌ race double-click (P01) |
| **special-day → hearts_received** | ❌ đếm phẳng, bỏ ×2 (P02) |
| **liked_by_me feed** | ⚠️ rò user_id liker + O(N) (P03) |
| **create_kudo** | ❌ receiver-FK leak + ảnh mồ côi (P04) |

## Song song / phụ thuộc
- **04 (Viết) ∥ 01–03 (Like)** — khác file, song song.
- 02, 03 `blockedBy: 01` (đụng hearts stamp/count).
- **05 OPTIONAL · 06 VERIFY-only** — user cắt/giữ khi duyệt.
- 07 integration+tests ở cuối (UI đã qua gate → integrate + test ngay).

## Definition of Done
- toggle_heart: double-click không lỗi · self-like báo P-code thân thiện · 1 round-trip · count đúng.
- Special-day: 1 nguồn multiplier · unlike trừ đúng weight (ranking query-time).
- Realtime: user khác like → count cập nhật live (không cần reload).
- create_kudo: receiver không tồn tại → P0007 thân thiện (không rò FK thô) · ảnh fail → cleanup.
- Không rò lỗi Postgres thô · sender masking giữ nguyên · Unit + E2E pass.

## Handoff
Validate: Plan Reviewer (`/tkm:predict-risks`). Execute: `/tkm:takumi plans/260811-0806-kudo-like-api-hardening/plan.md`.
