# Phase 04 — UI · Homepage SAA (STT 7, Track A)

**Screen:** Homepage SAA (i87tDx10uM) · **Status:** ✅ built (mounted at `/`).
**Goal:** landing with event info + hero "ROOT FURTHER" + countdown + 6-award grid + Kudos promo + footer.
**Files:** `src/features/homepage/components/**`, `src/app/page.tsx`.
**In-scope header bits:** logo, nav (About anchor / Awards / Kudos), lang switch, account menu.
**Out of scope for THIS plan:** notification bell (belongs to Notifications feature — not required).
Keep header simple; if bell present, treat as excess (see gap report).
**Integration contract:** countdown reads shared `event_config`; account menu gated by auth; award card → `/awards`.
