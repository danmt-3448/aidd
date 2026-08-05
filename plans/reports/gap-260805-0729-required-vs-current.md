# Gap Report — Required 8 features vs Current plan/code

Date: 2026-08-05 · Branch: develop · fileKey `9ypp4enmFmdK3YAFJLIu6C`
Scoped plan: `plans/260805-0729-saa2025-required-8-features/plan.md`
Current plan: `plans/260803-1636-saa2025-remaining-7-screens/plan.md`
No code changed — analysis only.

## TL;DR

Your instinct is right, with a nuance now confirmed against MoMorph. All 8 requested features
(STT 6–13) are built. The codebase **also** built 3 extra screens (Profile, Secret-Box, Rules) +
a Notifications service. **MoMorph check reveals:** Profile / Secret-Box / Rules are **real
spec-DONE web designs** in Figma — they're legit project screens, just outside *your* 8-item list
(the current plan scoped to "all spec-ready web screens", not your 8). **Only Notifications has
NO spec-ready web design** (web frames exist but `spec=none`) — that's the true over-build.
The one real gap inside your scope = EN translations for the Kudos screen.

**See §6 for the MoMorph-verified web-screen inventory.**

## 1. Required 8 (STT 6–13) — coverage

| STT | Feature | Built? | Where | Note |
|-----|---------|--------|-------|------|
| 6 | Login (Google) | ✅ | `src/features/auth`, `/login` | code+unit+e2e |
| 7 | Homepage SAA | ✅ | `src/features/homepage`, `/` | header carries an out-of-scope bell |
| 8 | Hệ thống giải (Awards) | ✅ | `src/features/awards`, `/awards` | static config, no CRUD |
| 9 | Countdown Prelaunch | ✅ | `src/features/countdown`, `/countdown` | gate enforced in `src/proxy.ts` |
| 10 | Đa ngôn ngữ VN/EN | ⚠️ | `src/i18n`, `messages/*.json`, `language-switcher` | **`en.json` kudos keys empty** |
| 11 | Sun* Kudos (6 sub) | ✅ | `src/features/board`, `/board` (`/kudos`→redirect) | all 6 sub-features present |
| 12 | Viết Kudos | ✅ | `src/features/kudos` | code+unit+e2e |
| 13 | Like Kudos (heart) | ✅ | `hearts` table + `heart-actions.ts` + `use-toggle-heart.ts` | 1/user, sender≠self (RLS) |

**Sun* Kudos 6 sub-features** — all found in `src/features/board/**`:
(a) highlight top-5 `board-highlight-carousel` · (b) spotlight `board-spotlight` ·
(c) recent feed `board-all-kudos-feed` · (d) hashtag+**department** filter `board-department-filter` ·
(e) stats `board-sidebar-stats` · (f) top-10 nhận quà `board-sidebar-leaderboard`.

## 2. THỪA — built but NOT in the required 8 (the drift)

| Extra | Evidence | In current plan as | Verdict |
|-------|----------|--------------------|---------|
| **Profile** (self + other, `profile_stats`, direction queries) | `src/features/profile` (17 files), `/profile`, phase-05/13 | Phase 05 + 13 | **Out of scope** — cut or defer |
| **Secret Box** open-screen (entitlement, weighted-random, decrement) | `src/features/secret-box` (10 files), `/secret-box`, phase-06/14 | Phase 06 + 14 | **Out of scope** — but keep *minimal gift data* that feeds Kudos sub-(f) |
| **Notifications** service (bell + Realtime + `/notifications`) | `src/features/notifications` (9 files), phase-03 | Phase 03 | **Out of scope** — bell also leaks into Homepage header |
| **Rules / Thể lệ** modal + static content | `src/features/rules` (9 files), `/rules`, phase-07/10 | Phase 07 + 10 | **Out of scope** — cut or defer (unless it's part of Awards spec) |
| `/todo` route | `src/app/todo` | Homepage clarification | Harmless (redirects to `/`) |

**Current plan builds 7 screens; only 4 of them are in your required list.** The 3 extra screens
(Profile, Secret Box, Rules) + the Notifications service = the over-build. Roughly **45 feature files**
(`profile` 17 + `secret-box` 10 + `notifications` 9 + `rules` 9) sit outside the required 8.

### Coupling caveat (don't blind-delete)
- Kudos sub-feature **(f) "top-10 nhận quà"** reads gift/box-received data → needs a *minimal* secret-box
  data model. Keep the data + `get_gift_leaderboard`; drop the interactive open-screen (`/secret-box`).
- Kudos **(e) stats** sidebar shows a "Secret Box" counter → same minimal coupling.
- Homepage header **notification bell** depends on the Notifications service → if you cut Notifications,
  remove the bell from the Homepage header too.

## 3. THIẾU — required but missing/incomplete

| STT | Gap | Fix |
|-----|-----|-----|
| 10 | `messages/en.json` kudos keys are empty placeholders → English Kudos screen unlabeled | Populate EN strings for all in-scope screens (phase-02) |
| 11 | Screen served at `/board`; requirement names it "Sun* Kudos" (`/kudos` currently redirects) | Optional: serve at `/kudos` to match naming |
| — | Test suites include out-of-scope screens (profile/secret-box/notifications/rules) | Trim to the 8 (phase-10) |

No **required** feature is unbuilt. Scope gap is EN i18n + naming/test hygiene only.

## 4. Current plan (260803) vs scoped plan (260805) — phase diff

| Current plan phase | Keep for the 8? |
|--------------------|-----------------|
| 01 DB foundation | ✅ keep (trim profile_stats + secret-box open logic) |
| 02 Event config + countdown | ✅ keep |
| 03 Notification service | ❌ cut (out of scope) |
| 04 Hearts + board queries | ✅ keep (this is Like + Kudos sub-features) |
| 05 Profile queries | ❌ cut |
| 06 Secret-box open logic | ➖ reduce to gift-leaderboard data only |
| 07 Prize + Rules static | ⚠️ split — keep Prize (Awards), cut Rules |
| 07b Seed demo data | ✅ keep (trim to in-scope tables) |
| 08 UI Countdown | ✅ keep |
| 09 UI Prize | ✅ keep |
| 10 UI Rules | ❌ cut |
| 11 UI Homepage | ✅ keep (drop bell) |
| 12 UI Live board | ✅ keep (= Sun* Kudos) |
| 13 UI Profile | ❌ cut |
| 14 UI Secret box | ❌ cut |
| 15 Integration | ✅ keep (in-scope screens only) |
| 16 Tests | ⚠️ trim to 8 |
| 17 Review + docs | ✅ keep |

**Cut/reduce: phases 03, 05, 06(reduce), 07(split), 10, 13, 14** → 7 of 18 phases were out-of-scope work.

## 5. Recommendation

1. **Decide the true scope.** If your list of 8 is authoritative, the extras (Profile, Secret-Box screen,
   Notifications, Rules) should be **deferred to a separate plan**, not deleted blindly — they're wired into
   the header + board leaderboard.
2. **Close the one real in-scope gap:** finish `messages/en.json` (Kudos EN strings).
3. **Trim tests** to the 8 so the suite reflects scope.
4. Do NOT delete secret-box/notifications code until the Kudos board's gift-leaderboard + stats + Homepage
   header are de-coupled (else sub-features (e)/(f) and the header break).

## 6. MoMorph/Figma — verified WEB screen inventory (fileKey 9ypp4enmFmdK3YAFJLIu6C)

174 frames total. iOS frames carry `[iOS]` prefix (38 of them) — excluded. Components/dropdowns/popups
excluded. **Web screens with a real spec** below. `spec` = MoMorph spec_status.

| # | Web screen | screenId | spec | Maps to your STT | In current build? |
|---|-----------|----------|------|------------------|-------------------|
| 1 | Login | GzbNeVGJHz | done | 6 | ✅ |
| 2 | Homepage SAA | i87tDx10uM | done | 7 | ✅ |
| 3 | Hệ thống giải | zFYDgyj_pD | done | 8 | ✅ |
| 4 | Countdown – Prelaunch | 8PJQswPZmU | done | 9 | ✅ |
| 5 | Sun* Kudos – Live board | MaZUn5xHXZ | done | 11 | ✅ |
| 6 | Viết Kudo | ihQ26W78P2 | done | 12 | ✅ |
| 7 | **Profile bản thân** | 3FoIx6ALVb | done | — (not in your 8) | ✅ (extra) |
| 8 | **Thể lệ UPDATE (Rules)** | b1Filzi9i6 | done | — | ✅ (extra) |
| 9 | **Open secret box – chưa mở** | J3-4YFIpMM | done | — (feeds STT-11 sub-f) | ✅ (extra) |
| 10 | Error 403 | T3e_iS9PCL | in_progress | — | ✅ (errors feature) |
| 11 | Error 404 | p0yJ89B-9_ | in_progress | — | ✅ (errors feature) |
| 12 | KUDO spam (compose error state) | JYHZJyOwT- | in_progress | 12 (state) | partial |

Cross-cutting components (not standalone screens):
- **Dropdown-ngôn ngữ** (done, web) = STT 10 Đa ngôn ngữ ✅ · **Dropdown Phòng ban** (done) = STT-11 dept filter ✅
- Like Kudos (STT 13) = behavior on Live board, no own frame ✅

### The Notifications finding (the true "xa vời")
- Only `[iOS] Notifications` is spec **done**. Web notif frames exist — `Notification` (D_jgDqvIc8),
  `Tất cả thông báo` (6-1LRz3vqr), `View thông báo` (gWBVcaSVIf) — but all **spec = none** (not spec-ready).
- Yet the codebase shipped a full web Notifications service (bell + Realtime + `/notifications` page,
  `src/features/notifications`, 9 files). **Built ahead of / without a spec-ready web design.** This is the
  clearest scope drift — recommend defer until the web notif spec is finalized.

### Corrected "thừa" verdict
| Extra | MoMorph web spec? | Verdict |
|-------|-------------------|---------|
| Profile | ✅ done (3FoIx6ALVb) | Legit designed screen; outside *your 8* → defer, don't call it wasted |
| Rules / Thể lệ | ✅ done (b1Filzi9i6) | Same — legit; defer per your scope |
| Secret Box | ✅ done (J3-4YFIpMM) | Legit; keep gift data for STT-11(f), defer open-screen |
| Error 403/404 | 🟡 in_progress | Supporting; low cost, fine to keep |
| **Notifications (web)** | ❌ none | **True over-build — defer until spec-ready** |

**So:** current plan (260803) = "build all spec-ready web screens", which is a *broader but valid* scope
than your 8. The extras aren't invented (except Notifications) — they're the rest of the designed product.
Decision is: **do you want just the 8, or the full spec-ready web set?**

## Open questions
- **Scope decision:** just the 8 (STT 6–13), or the full spec-ready web set (adds Profile, Rules,
  Secret-Box, Error 403/404 — all real Figma designs)? This is the one call that settles everything.
- Notifications (web spec = none): confirm defer until the web notif design is spec-ready.
- Should the Kudos screen live at `/kudos` (match requirement name) or stay `/board`?
- EN Kudos strings — populate now, or intentionally deferred?
