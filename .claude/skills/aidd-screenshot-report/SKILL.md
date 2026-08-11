---
name: aidd-screenshot-report
description: Capture multi-state screenshot evidence for AIDD screens (empty / full / error / loading / modals / data variants) at desktop 1440 with a real authed session, then assemble a markdown report with a coverage table. Use when the user asks for "screenshot report", "ảnh bằng chứng", "chụp đủ case", or when reporting a screen's build/verify result. NOT a substitute for /aidd-ui-gate property-diff — this is image evidence across states; the gate is numeric fidelity vs Figma.
---

# AIDD Screenshot Report

Chuẩn hoá **bằng chứng ảnh đa-state** cho screen (theo `.claude/rules/screenshot-report.md`). Chụp mọi state khả dụng, fullPage, authed, data thật/mock đúng mật độ → report markdown + bảng coverage.

## Precondition (BẮT BUỘC)
1. **Dev server chạy** ở `:3001` (`npm run dev`). Nếu chưa → bảo user chạy hoặc tự start (background).
2. **Supabase local UP** + **seed data** (`npm run db:reset` đã gồm `seed:demo`) → screen có data thật.
3. **Auth session** đã tạo: `e2e/.auth/user.json` (+ `admin.json`). Nếu thiếu → chạy `npx playwright test e2e/auth-check.spec.ts` (global-setup tạo storageState) hoặc `npm run test:e2e` một lần.

## Steps
1. **Chọn scope:** screen cần chụp (mặc định tất cả trong `screens.json`). User có thể truyền tên screen (arg).
2. **Xác định outDir:** `{plan_dir}/evidence/screenshots/` (từ `## Plan Context`); không có plan → `plans/reports/evidence/screenshots/`.
3. **Chạy capture:**
   ```bash
   node .claude/skills/aidd-screenshot-report/scripts/capture.mjs <outDir> [screenNameFilter]
   ```
   Script đọc `screens.json`, loop screen × state, chụp (fullPage hoặc element cho modal), ghi `screenshot-report.md` + `manifest.json` (coverage) vào outDir.
4. **Đọc report + soi vài ảnh** (Read tool trên PNG) để xác nhận **đủ data / đủ feature / không vỡ / không trắng nền**. State nào lỗi → sửa nguyên nhân (seed/route) rồi chụp lại; KHÔNG bỏ qua im lặng.
5. **Trả về:** đường dẫn report + bảng coverage (screen × state: captured / N/A + lý do).

## Manifest (`screens.json`)
Mỗi entry: `name`, `route`, `mode` (`fixed` = route như-là · `element` = chụp 1 element locator), `states` (list — thường chỉ `["full"]`; states khác khi có real scenario), `auth` (`user|admin|none`), `fullPage`, `element` (selector khi mode=element), `waitMs`, `note` (lý do nếu state không khả thi). **Screen mới → thêm entry vào `screens.json`, KHÔNG hardcode trong script.**

## Data variety (theo rule)
`full` phải đủ mật độ Figma; ngoài ra cần biến thể: có/không ảnh, có/không hashtag, nội dung dài/ngắn, ẩn danh, tier khác nhau. Nếu data thật chưa đủ biến thể → mở rộng `supabase/seed-demo-data.sql` rồi `npm run db:reset`.

## Ranh giới
- Ảnh bằng chứng đa-state — KHÁC `/aidd-ui-gate` (property-diff số 1440+1280 vs Figma). Bổ trợ, không thay thế.
- Không sửa code sản phẩm trong skill này; chỉ chụp + report. Sửa UI → `momorph-implement-design` / `/tkm:fix-bug`, verify số → `/aidd-ui-gate`.

## Error recovery
| Tình huống | Xử lý |
|---|---|
| dev `:3001` không chạy | start `npm run dev` (background) hoặc báo user; KHÔNG chụp trên server chết |
| storageState thiếu | chạy global-setup (`npm run test:e2e` 1 lần) rồi chụp lại |
| state không ép được bằng real data | chụp state khả dụng, ghi N/A + lý do (vd empty cần seed user không có data, error cần forced network fail) |
| ảnh trắng/empty bất thường | kiểm event_config (pre-launch gate đẩy về /countdown), seed data, auth — sửa rồi chụp lại |
