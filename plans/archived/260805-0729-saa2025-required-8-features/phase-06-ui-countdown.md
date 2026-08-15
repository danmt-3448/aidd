# Phase 06 — UI · Countdown Prelaunch (STT 9, Track A)

**Screen:** Countdown – Prelaunch (8PJQswPZmU) · **Status:** ✅ built.
**Goal:** dark full-screen — title + LED blocks (Days/Hours/Minutes), per-second tick, nav locked until 00:00:00.
**Files:** `src/features/countdown/components/**`, `src/app/countdown/page.tsx`.
**Gate (backend, phase 01):** `src/proxy.ts` forces non-admin users here while `isPreLaunch(event_start_at)`.
**Out of scope:** admin config UI for the target datetime (seed/config manually).
**Integration contract:** target datetime from `event_config` (TZ Asia/Ho_Chi_Minh); invalid → fail-open (no gate).
