# Phase 00 — Foundation: split message catalog + rewire request.ts

**Priority:** Critical · **Status:** pending · **Blocks:** all feature phases (01–12)
**Role:** be-developer (infra) · **subagent:** implementer

## Goal
Chuyển catalog monolith → per-feature files và pre-wire loader, để 01–12 chạy song song không đụng file chung.

## Owns (file ownership — chỉ phase này chạm)
- `src/i18n/request.ts` (rewire merge loader)
- `messages/vi/**`, `messages/en/**` (tạo mới scaffolding + migrate)
- `messages/vi.json`, `messages/en.json` (xóa sau khi migrate)
- `scripts/i18n-key-parity.mjs` (tạo mới — dùng ở Phase 13)

## Steps
1. Tạo thư mục `messages/vi/` + `messages/en/`.
2. **Migrate** nội dung monolith hiện có sang file đúng feature, giữ VN verbatim:
   - `login` → `auth.json` (namespace `auth`; đổi tên namespace `login`→`auth`, cập nhật `login-screen.tsx` + `countdown/page.tsx` dùng key mới).
   - `language` → `common.json` (namespace `language`).
   - `countdown` → `countdown.json` (namespace `countdown`).
   - `board` (copyLink/viewDetail/like/unlike) → `board.json` (namespace `board`).
   - `kudos` → `kudos.json` (namespace `kudos`).
3. Tạo **scaffolding rỗng** cho các namespace feature còn lại (file `{}` với top-key sẵn) để request.ts import không lỗi: `awards.json`, `board-spotlight.json`, `board-sidebar.json`, `errors.json`, `home.json`, `notifications.json`, `profile.json`, `rules.json`, `secret-box.json`, `event.json`. Mirror y hệt bên `en/`.
4. **Rewire `src/i18n/request.ts`** — thay `messages: (await import(...single...))` bằng merge **tất cả** file (spread), pre-wire đủ danh sách trên. Giữ nguyên logic chọn locale từ cookie.
5. Xóa `messages/vi.json` + `messages/en.json` monolith. Cập nhật `src/i18n/config.test.ts` nếu tham chiếu path cũ.
6. Viết `scripts/i18n-key-parity.mjs`: load mọi file `messages/vi/*` và `messages/en/*`, merge, so **tập key phẳng** vi vs en → in key thiếu 2 chiều; exit 1 nếu lệch, exit 0 nếu khớp.
7. `npx tsc --noEmit` PASS. Verify app vẫn chạy (vi mặc định render y như trước).

## Out of scope
- KHÔNG dịch các feature khác (01–12 làm). Scaffolding để rỗng `{}` (chỉ migrate 5 ns cũ).

## Success
- request.ts merge chạy, app render vi không đổi; tsc PASS; scaffolding + parity script sẵn sàng cho phase sau.
