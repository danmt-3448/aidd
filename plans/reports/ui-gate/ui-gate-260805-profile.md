# UI-First Gate — /profile (Profile bản thân, 3FoIx6ALVb) — **FAIL** (run 1)

Port: localhost:3001 · ref node 362:5037 · artboard 1440×**4660** · app 1440×**1104** (ngắn — thiếu data).

## A. Visual — **FAIL**
- **Thiếu hero artwork banner** — Figma có banner lông vũ nhiều màu sau avatar; app nền phẳng tối (không có artwork). Gap rõ.
- **Không có mock-full** — app render empty: KUDOS NHẬN 0 / ĐÃ GỬI 0 / HEARTS 0, list "Hiện tại chưa có Kudos nào." → trang chỉ 1104px vs Figma 4660px (populated: stats 5/25/25, list card kem dài). Thiếu `?ui_state=full` mock fixtures.
- Badge: app **locked** (6 ổ khoá xám) vs Figma earned/màu.
- Stats label khác wording (app "KUDOS NHẬN" vs Figma "Số Kudos bạn nhận được") — cần đối chiếu node.
- Name: app "Nguyễn Văn An" (user đăng nhập) vs Figma "Huỳnh Dương Xuân Nhật" — data khác, OK.
- Console localhost: **0 error**.

## B. Behavior — chưa chấm (dropdown "Đã nhận", Mở quà, tab kudos).

## Verdict: **FAIL** — cần FE: (1) thêm hero artwork banner (asset Figma), (2) mock fixtures `?ui_state=full` (kudos list + stats + badges earned khớp Figma), (3) đối chiếu label stats node 362:5037.
