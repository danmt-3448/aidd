---
title: UI · Rules
work_type: feature
track: A
status: planned
blockedBy: []
blocks: [15]
spec_source: momorph:b1Filzi9i6
---

# Phase 10 — UI · Rules / Thể lệ (Track A)

**Goal:** Build the rules modal panel UI from Figma via `momorph-implement-design` (scrollable rules
text + 6 badges + 2 buttons "Đóng" / "Viết KUDOS").

**Owns:** `src/features/rules/components/**`, `src/app/rules/**` (page shell + mock only).
**Do NOT create a new kudo modal** — "Viết KUDOS" reuses existing `kudo-compose-modal` (integration wires it).

**Out of scope (Track B / integration):** real `RULES_SECTIONS`/`RULE_BADGES` source (phase 07),
scroll-overflow button enable/disable logic, "Viết KUDOS" → open compose modal. Do NOT write i18n message files (phase-07 owns them). Figma mock text.

**Integration contract:** body renders from `sections: RuleSection[]` + `badges: RuleBadge[]` props;
`onWriteKudos` + `onClose` callbacks.

## MoMorph refs:
- Thể lệ UPDATE: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/b1Filzi9i6
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
