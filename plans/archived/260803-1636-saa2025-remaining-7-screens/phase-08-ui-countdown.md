---
title: UI · Countdown
work_type: feature
track: A
status: planned
blockedBy: []
blocks: [15]
spec_source: momorph:8PJQswPZmU
---

# Phase 08 — UI · Countdown (Track A)

**Goal:** Build the Countdown – Prelaunch screen UI from Figma via `momorph-implement-design`
(dark full-screen: title + 3 LED blocks Days/Hours/Minutes, per-second display, nav locked).

**Owns:** `src/features/countdown/components/**`, `src/app/countdown/**` (page shell + mock only).

**Out of scope (Track B / integration wires later):** real `event_config` datetime, real tick logic
(`use-countdown` phase 02), nav-gating enforcement. Do NOT write i18n message files (phase-07 owns them). Figma mock values.

**Integration contract (data the UI expects):** `{ days, hours, minutes, seconds, done, invalid }`
props on the LED display component (matches `use-countdown` return, phase 02).

## MoMorph refs:
- Countdown: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
