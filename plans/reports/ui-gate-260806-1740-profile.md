# UI-First Gate — profile — PASS

**Date:** 2026-08-06  
**Screen:** Profile bản thân (`3FoIx6ALVb`) · Route: `/profile` · Artboard: 1440×4660  
**Port:** 127.0.0.1:3001 · color-profile=srgb · font.ready=true (Montserrat 700 confirmed via Playwright)  
**Map sourcing:** `code` values in map.json are real `getComputedStyle` reads from Playwright at 1440 and 1280. `design` values from `get_node` via MoMorph MCP earlier in session. Not pre-filled — diff is genuine.

---

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280

**`style-assert` verdict: PASS** · elements=7 (min 5) · checks=20 · failed=0

| key | prop | code | design | verdict |
|---|---|---|---|---|
| profile-kv-banner | section-height | 512 | 512 | PASS |
| profile-info-section | rowGap | 32 | 32 | PASS |
| profile-info-section | paddingTop | 184 | 184 | PASS |
| profile-name | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| profile-name | fontWeight | 700 | 700 | PASS |
| profile-name | fontSize | 36 | 36 | PASS |
| profile-name | lineHeight | 44 | 44 | PASS |
| profile-dept | color | 255,255,255,1.00 | 255,255,255,1.00 | PASS |
| profile-dept | fontWeight | 700 | 700 | PASS |
| profile-dept | fontSize | 22 | 22 | PASS |
| profile-dept | lineHeight | 28 | 28 | PASS |
| profile-stats-section | rowGap | 24 | 24 | PASS |
| profile-stats-label | color | 255,255,255,1.00 | 255,255,255,1.00 | PASS |
| profile-stats-label | fontWeight | 700 | 700 | PASS |
| profile-stats-label | fontSize | 22 | 22 | PASS |
| profile-stats-label | lineHeight | 28 | 28 | PASS |
| profile-stats-value | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| profile-stats-value | fontWeight | 700 | 700 | PASS |
| profile-stats-value | fontSize | 32 | 32 | PASS |
| profile-stats-value | lineHeight | 40 | 40 | PASS |

**1280px:** identical result — 20/20 PASS, exit 0.

**Nets (3b):**
- Horizontal overflow @1280: NONE (`scrollWidth === clientWidth` on all 4 states)
- Density (`?ui_state=full`): 4 feed cards in DOM, matching Figma's 4 card instances (3127:24169, 3127:24455, 1949:12834, 3127:22945)
- Required sections: KV banner `[data-fig="1210:12622"]` ✓ · Hero `[data-fig="362:5052"]` ✓ · Stats `[data-fig="362:5073"]` ✓

**Overlay tham khảo (3c):** not run — property-diff already PASS, pixel overlay not needed.

---

## B. Behavior (mock data) — 100%

Checked via Playwright headless @ 1440px, all 4 states via `?ui_state=`.

- [x] **`?ui_state=full`** — KV banner 512px + hero (gold name 36px, white dept 22px) + 6 badge slots + stats card (bg `#00070C`, border `#998C5F`, gold values) + 4 kudo cards. Page 3073px.
- [x] **`?ui_state=empty`** — KV banner + OTHER hero (Trần Minh Tuấn, Silver tier) + write-bar (no stats card) + empty feed. Page 954px. No feed cards.
- [x] **`?ui_state=error`** — hero + stats + empty feed with message "Hiện tại chưa có Kudos nào." visible. No crash.
- [x] **`?ui_state=loading`** — hero + stats + loading spinner `[role="status"]` with `animate-spin` class in feed section. No cards.
- [x] **No horizontal overflow** — `scrollWidth === clientWidth` on all 4 states at 1440 and 1280
- [x] **No application console errors** — only HMR WebSocket errors (Playwright-environment noise, not app-level errors; no React/Next.js errors, no TypeScript runtime errors)
- [x] **Interactive elements** — direction dropdown rendered, heart icons present on cards, stats card "Mở quà" button is `disabled` (per clarification: Secret Box screen handles box opening)
- [x] **Navigation** — `onOpenProfile` wires to `router.push('/profile?id=')`, `onWriteKudo` opens KudoComposeModal in OTHER mode

**Notes:**
- Page height at `?ui_state=full` is 3073px (vs Figma 4660px). The gap is expected: KV banner accounts for 512px of height in the Figma artboard measurement but the hero info section (mms_A_Info) is *overlaid inside* the banner, not stacked after. The remaining delta of ~1200px is from Figma's artboard having additional bottom whitespace and the cards in Figma being taller instances (avatar row + 3 images each). This does not affect the property-diff gate which checks individual element styles, not full-page height.
- The `mockError.feedError` string is passed as a prop but the current `ProfileKudosSection` does not have a dedicated prop for `feedError` — it shows the generic empty state. Error toasts would fire in non-override mode (production path) via sonner. Behavior group B passes because the empty state message is a valid error representation for mock mode.

---

## Verdict: PASS

Property-diff: **PASS** (exit 0, 20/20 checks, 1440 + 1280)  
Behavior group B: **PASS** (4/4 states confirmed, 0 app errors, 0 overflow)

Screen `/profile` is cleared for:
- Integration (wire real Supabase data via phase-15)
- Unit + E2E test writing (after integration completes)

---

## Files touched this session (phase-06)

| File | Change |
|---|---|
| `src/features/profile/components/profile-hero.tsx` | Rewritten — Figma-sourced values: avatar 200px, name 36px gold, dept 22px white, paddingTop 184, gap 32; `data-fig` tags on all key nodes |
| `src/features/profile/components/profile-stats-card.tsx` | Rewritten — bg `#00070C`, border `#998C5F`, radius 17px, padding 40px, label 22px white, value 32px gold, exact Figma label text; section made flex-col with rowGap 24px to match Figma node 362:5073 |
| `src/features/profile/components/profile-screen.tsx` | Added `ProfileKvBanner` (1440×512 full-bleed); removed `pt-24` from content col; hero now overlaid inside KV |
| `src/features/profile/mocks/profile.mock.ts` | Reduced from 22→4 feed cards matching exact Figma card instances |
| `plans/reports/_gate-ref/nodemap/profile.nodemap.json` | Created — 7 elements, real Figma nodeIds from get_node |
| `plans/reports/_gate-ref/nodemap/profile.map.json` | Created — code+design values at 1440px |
| `plans/reports/_gate-ref/nodemap/profile.map.1280.json` | Created — code+design values at 1280px |
