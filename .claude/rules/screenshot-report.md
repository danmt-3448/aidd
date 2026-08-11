# Screenshot Report Rule

> Mọi report có "bằng chứng hình ảnh" cho screen PHẢI theo rule này. Đây là chuẩn cho evidence ảnh
> (bổ trợ `ui-first-gate.md` — gate chấm property-diff số; rule này chuẩn hoá **ảnh chụp làm bằng chứng**).

## Khi nào áp dụng
- Khi user yêu cầu "chụp màn", "screenshot report", "ảnh bằng chứng", hoặc khi báo cáo kết quả build/verify một screen.
- Khi kết thúc một feature/fix UI → kèm ảnh before/after.

## Nguyên tắc bắt buộc
1. **Đủ STATE, không chỉ happy path.** Mỗi screen phải chụp các state khả dụng:
   - `full` (có data, mật độ giống Figma) · `empty` (danh sách rỗng) · `error` · `loading` (nếu có) · các **modal/overlay** (compose, secret-box, dropdown mở) · các **biến thể data** (có/không ảnh, có/không hashtag, nội dung dài/ngắn, ẩn danh, tier khác nhau).
   - Dùng `?ui_state=full|empty|error|loading` (dev) cho screen có hỗ trợ; screen không có → seed data tương ứng (vd secret-box: user hết box = empty).
2. **fullPage** — chụp trọn trang tới footer, không chỉ viewport. Modal → chụp element dialog (trọn modal) + 1 ảnh có context nền.
3. **Desktop 1440** là chuẩn (thêm 1280 khi cần); authed session thật (storageState) để thấy data thật.
4. **Data thật hoặc mock đúng mật độ** — không chụp màn thưa/thiếu data rồi coi là xong. "Data không đủ sao giống được."
5. **Lưu vào** `{plan_dir}/evidence/screenshots/` (hoặc `plans/reports/evidence/` nếu không có plan). Report markdown nhúng ảnh bằng đường dẫn tương đối + **bảng coverage** (screen × state) nêu rõ state nào đã chụp / N/A.
6. **Đặt tên** self-describing: `{screen}-{state}.png` (vd `board-full.png`, `board-empty.png`, `kudos-compose.png`, `profile-other-full.png`).
7. **Verdict trung thực:** nếu một state không chụp được (screen chưa hỗ trợ), ghi rõ lý do trong bảng coverage — KHÔNG bỏ qua im lặng.

## Cách chạy
- Ưu tiên skill **`/aidd-screenshot-report`** (chuẩn hoá capture + report). Xem `.claude/skills/aidd-screenshot-report/`.
- Skill đọc manifest `screens.json` (route + states + modal selector mỗi screen) → chụp đủ state → sinh report `evidence/screenshot-report.md`.
- Screen mới → thêm entry vào `screens.json` (đừng hardcode trong script).

## Ranh giới
- Rule này = **ảnh bằng chứng**. Property-diff số vs Figma = `ui-first-gate.md` (`/aidd-ui-gate`). Hai cái bổ trợ nhau, không thay thế.
- Ảnh chụp KHÔNG thay thế gate property-diff khi cần chốt fidelity; nhưng gate cũng KHÔNG thay ảnh đa-state (gate chấm 1440/1280 full, rule này ép đủ empty/error/variants).
