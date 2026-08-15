# Phase 08 — UI · Viết Kudos (STT 12, Track A)

**Screen:** Viết Kudo (ihQ26W78P2) · **Status:** ✅ built (code + unit + e2e).
**Goal:** compose modal — Tiptap rich text (bold/italic/link/quote + @mention → HTML), recipient, hashtags (1–5), images (≤5), anonymous toggle → `create_kudo` RPC.
**Files:** `src/features/kudos/**` (compose modal, `kudo-actions.ts`, `use-create-kudo.ts`).
**Constraints:** content_html ≤ 2000; anonymous kudo masks sender in others' feeds (server-enforced).
**Integration contract:** launched from Homepage/Kudos-board/Awards promo; on submit → feed refresh.
