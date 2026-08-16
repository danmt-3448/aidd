# UI-First Gate — /countdown (post-launch redirect + "Vào sự kiện" CTA) — PASS

- Date: 2026-08-16 · Screen: `/countdown` (MoMorph `8PJQswPZmU`, fileKey `9ypp4enmFmdK3YAFJLIu6C`)
- Verify env: **prod build** (`next build` + `next start -p 3001`), authed session (regular user `tran.thi.binh@sun-asterisk.com`), real seeded data (`npm run db:reset` → 30 users / 71 kudos), Supabase local UP. Port `127.0.0.1:3001`.
- Reason prod build (not Turbopack dev): verification is fully interactive (live tick → done, CTA click) — Turbopack dev headless hydration is unreliable for interactive checks.

## Scope of change
Chỉ sửa **nhánh `if (countdown.done)`** (app-invented state) + proxy/logic:
- `countdown-display.tsx`: thêm CTA `<Link href="/board">` "Vào sự kiện" trong block `mm:countdown-done`. **Counting state (LED, có `data-fig`) byte-identical** — git-proven, không đụng.
- `proxy.ts` + `launch-gate.ts`: post-launch lock cho `/countdown` + helper `isPostLaunch`.

## A. Visual fidelity
- **Property-diff (hard gate A): N/A cho delta này.** Visual delta duy nhất là CTA button ở state "done" — **app-invented, KHÔNG có Figma node** để `get_node` đối chiếu (không có nodemap `/countdown`). Không tự chế giá trị: button dùng token đã tồn tại trong file (`bg #FFEA9E`, `text #00101A`, radius 12px khớp led-block).
- **Surface property-diffable (counting state) = byte-identical** với bản trước (git diff xác nhận chỉ thêm `import Link` + sửa done-branch) → không có drift để chấm.
- **Done state render** (screenshot `evidence/countdown-redirect/countdown-done-with-button-1440.png`): card gold (`rgba(255,234,158,0.08)` bg + gold border) + text "Sự kiện đã bắt đầu!" gold + CTA gold "Vào sự kiện" stack dưới, nền brand tối + artwork phải — khớp palette hiện có.
- **No-break:**
  - @1280: `scrollWidth==clientWidth` (1280), 3 LED block hiện đủ, no overflow. ✅
  - @1920: `scrollWidth==clientWidth` (1920), no horizontal overflow. ✅
  - @1440: counting + done render đúng (2 screenshot evidence). ✅

## B. Behavior (real seeded data, authed, prod) — 100%
- [x] **Counting state** render đúng pre-launch (title "Sự kiện sẽ bắt đầu sau" + LED Days/Hours/Minutes), config đọc từ `event_config` thật.
- [x] **Live tick → done**: seed `event_start_at = now()+30s` → sau ~30s trên tab đang mở, timer chạm 0 → done state hiện. **URL vẫn `/countdown`** (tab mở sẵn, proxy không re-fire) — đúng kịch bản bug gốc.
- [x] **CTA "Vào sự kiện" → `/board`**: click link → điều hướng `http://127.0.0.1:3001/board` thành công.
- [x] **Post-launch lock**: event đã start → navigate thẳng `/countdown` → **redirect `/board`** (proxy `isPostLaunch` → đá ra). ✅
- [x] **Pre-launch gate không hồi quy**: set `event_start_at = now()+5m` → navigate `/board` → **redirect `/countdown`** (gate cũ vẫn đúng). ✅
- [x] **Console**: 0 error / 0 warning ở done state.
- [x] i18n: key `countdown.enterEvent` (vi "Vào sự kiện" / en "Enter event") render đúng locale vi.

## Automated checks
- `npx tsc --noEmit` → exit 0
- `npx eslint` (proxy, launch-gate, countdown-display) → exit 0
- `npx vitest run launch-gate.test.ts` → 32 pass (thêm `isPostLaunch` suite: fail-open null/invalid, boundary now==launch, pre/post complement asymmetry)
- `npx vitest run use-countdown.test.ts` → 13 pass

## Verdict: PASS
- **B (behavior) = 100%** verified trên prod build + real seeded data + authed — đây là phần thực chất của fix (logic/behavior).
- **A (visual)**: property-diff N/A (element app-invented, no Figma node) + counting surface byte-identical + no-break 1280/1920/1440 → không có drift.
- Screen được phép sang integration/test/ship. Evidence: `plans/reports/evidence/countdown-redirect/`.
