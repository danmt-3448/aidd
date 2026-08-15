# Phase 13 — Integration + verify

**Priority:** Critical · **Status:** pending · **blockedBy:** [01,02,03,04,05,06,07,08,09,10,11,12]
**Role:** integration-engineer + code-reviewer · subagent: reviewer/tester

## Goal
Chốt toàn bộ i18n: key parity vi↔en, build sạch, đổi ngôn ngữ chạy đúng mọi page.

## Steps
1. **Key parity:** chạy `node scripts/i18n-key-parity.mjs` → exit 0 (vi và en cùng bộ key phẳng). Có lệch → điền key thiếu (EN dịch chuẩn / VN verbatim) rồi chạy lại.
2. **Sót hardcode:** `grep -rlE "[àáảãạăâđêôơư...]" --include='*.tsx' src/features src/app` → chỉ còn data/test/comment cố ý. Còn UI VN literal → mở lại phase feature tương ứng.
3. **`common` de-dup:** rà chuỗi chung (nút Hủy/Gửi/Đóng, "Bản quyền thuộc về Sun* © 2025", nav) — nếu nhiều feature lặp → gom về `common`, cập nhật các nơi dùng (DRY).
4. `npx tsc --noEmit` PASS. `npm run lint` PASS. `npm run build` PASS.
5. **Runtime verify** (Playwright/manual, authed session real data): đổi language-switcher vi↔en trên `/board`, `/kudos`, `/profile`, `/rules`, `/awards`, `/login`, `/notifications`, `/secret-box`:
   - vi = **y hệt chữ cũ** (không đổi visual, không vỡ layout).
   - en = hiển thị bản EN, không còn chuỗi VN sót, không thấy raw key (`board.xxx`).
6. Chạy unit test hiện có (`npm run test`) → PASS (vi verbatim nên assert VN cũ vẫn đúng). Fail vì i18n → sửa test theo key mới (không fake pass).
7. Reviewer (`/tkm:review-code`) trên toàn diff.

## Success (Definition of Done)
- parity exit 0 · 0 hardcode VN UI · tsc+lint+build PASS · switch vi/en đúng mọi page · test PASS · review APPROVED.

## Note
Đây là bước duy nhất chạm nhiều feature JSON cùng lúc (de-dup `common`) → chạy **một mình**, sau khi 01–12 xong.
