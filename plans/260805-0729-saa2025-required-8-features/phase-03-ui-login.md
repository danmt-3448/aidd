# Phase 03 — UI · Login (STT 6, Track A)

**Screen:** Login (Google OAuth) · **Status:** ✅ built (code + unit + e2e).
**Goal:** Google sign-in screen per Figma; redirect authed users to `/`.
**Files:** `src/features/auth/components/login-screen.tsx`, `src/app/login/page.tsx`.
**Out of scope:** email/password, dev-login (keep `/dev-login` as dev-only, not a product screen).
**Integration contract:** on success → session cookie set, proxy redirects to `/` (or `/countdown` if prelaunch).
