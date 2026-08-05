# Phase 07 — UI · Sun* Kudos display (STT 11, Track A)

**Screen:** Sun* Kudos – Live board (MaZUn5xHXZ) · **Status:** ✅ built (served at `/board`; `/kudos` redirects here).
**Goal:** the 6 sub-features on one screen:
- (a) Highlight top-5 by hearts — `board-highlight-carousel.tsx`
- (b) Spotlight boards (recipient word-cloud) — `board-spotlight.tsx`
- (c) Recent kudos list (infinite feed) — `board-all-kudos-feed.tsx` + `use-board-feed.ts`
- (d) Filter by hashtag + department — `board-department-filter.tsx` (`?hashtag=`, `?department=`)
- (e) General stats (thống kê chung) — `board-sidebar-stats.tsx`
- (f) Top-10 sunners nhận quà mới nhất — `board-sidebar-leaderboard.tsx`
- Heart toggle per card (STT 13) — `board-feed-card.tsx`
**Files:** `src/features/board/components/**`, `src/app/board/page.tsx`.
**Out of scope:** per-user Profile deep-dive (click avatar → Profile is optional; Profile screen itself not required).
**Naming note:** consider serving this at `/kudos` to match the requirement name (currently `/board`).
**Integration contract:** all data via board queries (phase 01); realtime optional (invalidation signal only).
