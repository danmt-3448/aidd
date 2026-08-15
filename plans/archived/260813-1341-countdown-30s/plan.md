# Plan — Countdown 30s "cho có lệ" + redirect-at-0 (đúng MoMorph spec)

> Date: 2026-08-13 · Branch: develop · Status: DRAFT for review
> Screen: **Countdown - Prelaunch page** — MoMorph `8PJQswPZmU` (node 2268:35127), fileKey `9ypp4enmFmdK3YAFJLIu6C`.

## Confirmed decisions (2026-08-13)
- **Đúng spec, KHÔNG đụng auth/`proxy.ts`.** Countdown = gate pre-launch sự kiện (spec item 1: *"chưa về 0 → khóa toàn bộ điều hướng; về 0 → mở khóa"*). Đã là **cửa cứng** trong `proxy.ts` (non-admin + pre-launch → `/countdown`; admin bypass).
- Set countdown **30 giây cho có lệ**. Hết 0 → redirect `/board`. Unauth vẫn → `/login` như cũ (spec countdown không nhắc auth).

## Verified current state
- `proxy.ts` **đã hard-gate đúng**: `isPreLaunch(event_start_at) && !isAdmin → /countdown`. Bypass: `/countdown,/login,/auth,/dev-login`. Fail-open nếu config lỗi.
- **Lý do giờ thấy home (không thấy countdown):** `seed-demo-data.sql:20` set `event_start_at = now() - 2 days` → event đã live → không pre-launch. KHÔNG phải bug guard.
- Countdown units (Days/Hours/Minutes) LED, TZ Asia/Ho_Chi_Minh — đã có (`src/features/event/use-countdown.ts`, `src/app/countdown/page.tsx`).
- ⚠️ **Gap:** countdown page **không tự redirect khi timer về 0** (grep 0 redirect/router). Spec đòi "về 0 → được điều hướng" → cần bổ sung.

## Phases

### Phase 01 — Set countdown 30s (data/config) — `supabase/seed-demo-data.sql`
- Đổi dòng 20: `event_start_at = now() + interval '30 seconds'` (thay `now() - 2 days`).
- Sau `db:reset`: non-admin mở app → thấy `/countdown` ~30s → hết → event live.
- **Tradeoff (ghi rõ):** mọi `db:reset` local sẽ có 30s countdown cho non-admin; **admin (user 1) bypass** nên dev vẫn vào thẳng được bằng admin. Đúng ý "cho có lệ".
- (Remote dev: `seed:dev` — nếu build sau — cũng set now+30s; countdown chỉ hiện ~30s sau seed rồi live. Chấp nhận cho demo.)

### Phase 02 — Redirect khi countdown về 0 — `src/app/countdown/page.tsx` (+ `use-countdown.ts`)
- Khi timer về 0 (`isDone`/remaining ≤ 0): `router.replace('/board')` (client). Board vào được vì event đã live → proxy cho qua.
- Guard SSR: nếu user mở `/countdown` khi event **đã live** (không còn pre-launch) → cũng redirect `/board` ngay (tránh kẹt ở countdown sau khi hết giờ). Có thể check server-side trong `countdown/page.tsx` (đọc event_config) hoặc client trên mount.
- KHÔNG đổi visual (LED/label/bg giữ nguyên theo spec) → chỉ thêm hành vi redirect.

### Phase 03 — Verify runtime
- `db:reset` → mở app bằng **non-admin** (vd `nguyen.van.an@...` — nếu không phải admin) → thấy countdown đếm ~30s → về 0 → **tự vào `/board`**. 0 console error.
- Mở bằng **admin** → vào thẳng board (bypass) — xác nhận không kẹt.
- Screenshot evidence.

## Constraints
- **KHÔNG đụng `proxy.ts`** (giữ auth flow: unauth → /login). Không đụng i18n/`messages` (song song).
- Redirect-at-0 là hành vi, không đổi property-diff của countdown → nhưng vẫn chạy `/aidd-ui-gate /countdown` (behavior checklist) trước khi done vì sửa file screen.
- Visual countdown giữ đúng spec (không tự chế).

## Open questions
- Redirect target khi về 0: `/board` (mặc định mình chọn) — hay `/` (root tự điều hướng)? (spec chỉ nói "được điều hướng", không chỉ đích.)
- 30s áp cho cả **remote dev** (`seed:dev`) không, hay chỉ local? (mặc định: cả hai, vì "cho có lệ".)

## Execution (post-approval)
Nhỏ: Track B (seed config) + 1 client redirect. Sau sửa → `/aidd-ui-gate /countdown` (behavior) + verify runtime. Chạy qua be-developer + fe-developer (redirect) + tester.
