# Phase 09 — Integration (Track A+B merge)

**Priority:** P1 · **Status:** ✅ done for in-scope screens.
**Goal:** wire the 6 UI screens to real backend (mock→real): countdown source, auth/admin gating,
kudos feed + heart toggle, board queries (6 sub-features), compose → create_kudo, i18n on every screen.
**Files:** `src/app/{,login,awards,countdown,board,kudos}/page.tsx` (page-level composition only).
**Out of scope wiring (do NOT integrate under these 8):** profile page, secret-box open flow,
notifications bell/panel/page, rules modal.
**Success criteria:** every in-scope screen renders real data; anon masking holds on board feed; VN+EN correct.
