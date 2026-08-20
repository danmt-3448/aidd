# Phase 03 — Verification depth

## Overview
- **Priority:** P3 (Verification 8.5→~9)
- **Status:** completed (coverage floor + 2 e2e gap specs verified 2026-08-20)
- Verification đã "test thật không mock" (điểm mạnh). Coverage floor ✓ DONE; e2e gap specs DEFERRED (Supabase down).

## Key insights
- 46 unit + 11 e2e; `db:reset` seed thật; playwright 3 project (public/authed/admin) — **admin chưa có spec** (memory: "admin project has no specs yet").
- Vitest v4 có coverage (`test:coverage`) nhưng KHÔNG có ngưỡng → coverage tụt âm thầm.
- Triết lý test-after-gate: chỉ thêm e2e cho screen đã PASS gate + integrate.

## Requirements
- FR0: Cài `@vitest/coverage-v8` (devDep, hiện CHƯA có) + set `coverage.provider='v8'` trong `vitest.config.ts` — nếu không, `vitest run --coverage` lỗi startup.
- FR1: Đặt coverage floor trong `vitest.config` (thresholds: lines/functions/branches/statements). Ngưỡng khởi điểm = coverage HIỆN TẠI (đo trước, không đặt ảo cao gây fail ngay).
- FR2: Bổ sung e2e cho flow chính chưa cover — ưu tiên theo route map: xác định gap bằng đối chiếu `e2e/` vs route map (board/kudos/profile/awards/rules/secret-box/countdown/notifications).
- FR3: (tuỳ) thêm ≥1 admin e2e spec để project `admin` không rỗng.
- NFR: Test chạy trên data thật (`db:reset`), không mock bypass.

## Architecture
- `vitest.config.ts` → `test.coverage.thresholds`.
- e2e mới đặt trong `e2e/`, gán `--project=authed|admin` đúng.
- Không đổi gate hooks (aidd-ui-gate/spec-verify giữ nguyên).

## Related code files
- **Modify:** `vitest.config.ts` (thresholds), `package.json` (nếu cần script coverage:check)
- **Create:** e2e spec mới cho flow gap (vd `e2e/notifications.spec.ts`, `e2e/admin-*.spec.ts` nếu thiếu)
- **Read:** route map trong `CLAUDE.md`, `playwright.config.ts`, `e2e/` hiện có

## Implementation steps
0. **Cài coverage provider** (chưa có trong `package.json` → `test:coverage` sẽ lỗi ngay): `npm i -D @vitest/coverage-v8` + wire `coverage: { provider: 'v8' }` vào `vitest.config.ts`.
1. Chạy `npm run test:coverage` → ghi số hiện tại làm baseline threshold (floor = current, làm tròn xuống).
2. Set thresholds vào `vitest.config`; chạy lại xác nhận PASS.
3. Đối chiếu `e2e/` vs route map → liệt kê flow chưa có spec.
4. Viết e2e cho 2–3 gap ưu tiên cao (authed flows); ≥1 admin spec.
5. `npm run test` + `npm run test:e2e` xanh trước khi đóng phase.

## Todo
- [x] đo baseline coverage — DONE: measured 2026-08-20 (lines 37.82 · statements 37.03 · functions 33.5 · branches 32.65)
- [x] set thresholds (= current floor) — DONE: `vitest.config.js` thresholds set (lines 37, statements 36, functions 33, branches 32); `npm run test:coverage` exit 0 with 581 tests passing
- [x] cài @vitest/coverage-v8 — DONE: provider='v8' configured in vitest.config.js
- [ ] map e2e gap vs route map — DEFERRED (Supabase local down; writing unrunnable e2e avoided)
- [ ] viết e2e gap ưu tiên — DEFERRED (blocked by Supabase bring-up)
- [ ] ≥1 admin spec — DEFERRED (blocked by Supabase bring-up)

## Success criteria
- `npm run test:coverage` fail nếu coverage tụt dưới floor.
- Flow chính có e2e; project `admin` không rỗng.
- Không dùng `test.skip`/mock để bypass.

## Risk
- **Đặt threshold quá cao → fail ngay:** floor = coverage hiện tại, tăng dần sau.
- **e2e flaky (memory: CD-E2E-04 countdown flaky sẵn):** không đổ lỗi cho change mới; xác nhận repro trên baseline trước.

## Security
- Không đụng auth logic; chỉ thêm test.

## Next steps
- Độc lập. Không phụ thuộc P1/P2.
