# Check-Progress Report — AIDD (SAA 2025 Internal)

Date: 2026-08-03 · Branch: develop · fileKey: `9ypp4enmFmdK3YAFJLIu6C`

## Scope
174 frames → 17 web pages (38 iOS + 18 components + 101 no-spec excluded).
9 web pages spec=done · 8 web pages spec=in_progress (design not ready — skip).

## Status table (web pages, spec=done)

| # | Screen | screenId | Specs | Tests | Built |
|---|--------|----------|-------|-------|-------|
| 1 | Login | GzbNeVGJHz | — | — | DONE (code+unit+e2e) |
| 2 | Viết Kudo | ihQ26W78P2 | — | — | DONE (code+unit+e2e) |
| 3 | Countdown – Prelaunch | 8PJQswPZmU | 5 | 17 | ❌ |
| 4 | Hệ thống giải (Prize) | zFYDgyj_pD | 23 | 15 | ❌ |
| 5 | Thể lệ UPDATE (Rules) | b1Filzi9i6 | 4 | 9 | ❌ |
| 6 | Homepage SAA | i87tDx10uM | 46 | 62 | ❌ |
| 7 | Open Secret Box (chưa mở) | J3-4YFIpMM | 4 | 19 | ❌ |
| 8 | Sun* Kudos – Live board | MaZUn5xHXZ | 64 | 41 | ❌ |
| 9 | Profile bản thân | 3FoIx6ALVb | 28 | 30 | ❌ |

spec=in_progress (NOT ready): Error 403 (T3e_iS9PCL), Error 404 (p0yJ89B-9_), KUDO spam (JYHZJyOwT-), Open secret box action/standby variants (K-LuEblC08, p0qHd6DJ6A, m0zV-VstXX, VsjjEDVgEx, P5b2MJQoW6).

## Existing reusable foundations
- Auth guard + Login (`src/features/auth/`).
- Kudo data model: `supabase/migrations/20260731000000_create_kudos.sql`, `src/features/kudos/kudo-actions.ts`, `use-create-kudo`. Fields: receiver_id, content_html (≤2000), hashtag_ids (1–5), image_paths (≤5), is_anonymous, anonymous_name.

## Per-screen recon (for the 7 unbuilt)

### 3. Countdown – Prelaunch (8PJQswPZmU) — 5 specs / 17 tests — LIGHT
Standalone dark full-screen page: title + 3 LED blocks (Days 00–99 / Hours 00–23 / Minutes 00–59), per-second update, nav locked until 00:00:00.
Backend: event-start datetime source (ISO-8601, TZ Asia/Ho_Chi_Minh); client per-second tick; nav gating; i18n labels; graceful invalid-datetime fallback; responsive.

### 4. Hệ thống giải / Prize (zFYDgyj_pD) — 23 specs / 15 tests — MOSTLY STATIC
Awards showcase: hero banner + left-nav (6 categories) + right award cards (icon/title/qty/prize) + Kudos promo footer.
Backend: 6 award definitions (static/config); smooth-scroll + active-state menu; auth check → redirect login. No CRUD.

### 5. Thể lệ UPDATE / Rules (b1Filzi9i6) — 4 specs / 9 tests — STATIC/LIGHT
Modal panel: scrollable rules text + 6 badges + 2 buttons ("Đóng" / "Viết KUDOS").
Backend: rules content (static/CMS); scroll-overflow detection; button enable/disable; "Viết KUDOS" → opens kudo compose modal. No persistence.

### 6. Homepage SAA (i87tDx10uM) — 46 specs / 62 tests — HEAVY UI
Sticky header (logo, nav About/Awards/Kudos, notif bell, lang switch VN/EN, account menu w/ admin-only dashboard), hero "ROOT FURTHER" + countdown + event details, 6-award card grid (click → Awards page + hashtag anchor), Kudos promo block, fixed widget button, footer.
Backend: countdown (shared source); auth-gated account menu + role (admin); i18n; active-nav state; notification bell badge (needs notification service — MAY be out of scope/stub); responsive 3→2→1 col.

### 7. Open Secret Box – chưa mở (J3-4YFIpMM) — 4 specs / 19 tests — LOGIC + SECURITY
Success modal: title + conditional guidance (only if unopened>0) + box image w/ random badge + unopened counter. Box clickable if unopened>0 → open next, refresh badge, decrement.
Weighted badge: Stay Gold 30% · Touch of Light 20% · Flow to Horizon 25% · Beyond the Boundary 10% · Revival 10% · Root Further 5%.
Backend: entitlement + `unopened_box_count` (server source of truth); weighted-random server-side; decrement on open; VALIDATE server-side (block client manipulation); sanitize badge image URLs.

### 8. Sun* Kudos – Live board (MaZUn5xHXZ) — 64 specs / 41 tests — HEAVIEST
KV banner → write-kudo input → highlight carousel (top-5 by hearts) → all-kudos infinite feed + spotlight word-cloud (recipient nodes) → sidebar user stats & leaderboards. Filters hashtag/dept; heart toggle; copy-link; click avatar → profile.
Reuse: kudo model, create/fetch actions, auth guard, use-create-kudo.
Net-new: `hearts` table (user × kudo, 1/user, sender≠self); highlight ranking query; infinite-scroll feed; recipient aggregation for spotlight; sidebar stats; filter state sync carousel↔feed; special-day heart multiplier (admin config); badge tiers (10/20/50 → 1/2/3 stars); realtime/polling for live updates.

### 9. Profile bản thân (3FoIx6ALVb) — 28 specs / 30 tests — HEAVY
Dual-mode: SELF (`/profile`) = hero (avatar/name/dept/tier/stars) + 6 greyed badge slots + stats card (received/sent/hearts/boxes opened+unopened) + direction dropdown (received/sent) + infinite feed. OTHER (`/profile?id={uuid}`) = same hero+badges + write-kudo bar (prefill recipient) + received-only feed (sent hidden to prevent anon leak).
Reuse: kudo model, infinite-scroll keyset, heart/copy actions, kudo modal, hashtag filter nav, auth guard.
Net-new: `profile_stats` caller-scoped query (hide other's sent); badge slots (greyed, no unlock logic); direction dropdown w/ counts; write-bar prefill; UUID route shape validation (reject malformed pre-DB, 404 unknown); anon sender masking on received feed; sparse-profile null-checks; tier/stars only if received≥10.
Security: sent-list never crosses users; anon-kudo masking; no email/auth-id leak.

## Data model delta (net-new)
```
hearts (user_id, kudo_id, liked_at, is_special_day)         -- board + profile
special_day_config (date, hearts_multiplier)                -- admin
profile_stats (view: caller-scoped: user_id, received, sent, hearts, boxes_opened, boxes_remaining)
secret_box (user_id, unopened_box_count, opened badges...)  -- box + profile counter
event_config (countdown target datetime)                    -- countdown + homepage
```

## Recommended waves (Track A UI ∥ Track B backend — no cross-track block)
- Wave 0 — Shared backend: hearts + toggle, profile_stats view, event countdown source, secret-box entitlement + weighted badge.
- Wave 1 — Independent screens (full parallel): Countdown · Prize · Rules · Homepage.
- Wave 2 — Interactive core (needs Wave 0): Live board · Profile · Secret box.
- Integration phase near end; then test + review per screen.

## Open questions (for create-plan clarification)
- Notification bell (Homepage): full notification service in scope, or stub/hide for now?
- Live board realtime: WebSocket / SSE / polling interval?
- Spotlight word-cloud: server-side layout or client-side SVG over flat list?
- Secret box on Profile: stub greyed vs full unlock logic this round?
- Anonymous kudos: included in "sent" count denominator? (test implies yes)
