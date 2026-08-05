# UI-First Gate — /board (mock full data) — **FAIL (visual)**

Date: 2026-08-05 · screenId `MaZUn5xHXZ` · `/board?ui_state=full` · 1440 · authed
Figma ref: `plans/reports/ui-audit/momorph/board.png` · Actual: `plans/reports/ui-gate/board-mock-full.png` + `board-mock-top.png`

## Behavior — PASS
- **0 console error, 0 HTTP 500** (BE đã fix + mock render sạch). Avatar header load OK.
- `?ui_state=full` populated đúng: highlight, feed, spotlight 388, sidebar stats + leaderboard.

## Visual ~95% — **FAIL** (khác Figma RÕ — nhiều gap là do component build giản lược, không phải mock thiếu)

| # | Vùng | Figma | App thực tế | Nguyên nhân |
|---|---|---|---|---|
| V1 | KV banner | wordmark lớn **"KUDOS"** + artwork lông vũ **full-width** | thiếu wordmark KUDOS · artwork nhỏ góc phải | component |
| V2 | Kudo card | có **tier badge** (Legend/Rising Hero) · **role** (CEVC10) · tiêu đề **"IDOL GIỚI TRẺ"** · **ảnh đính kèm** · avatar ảnh · "1.000 ❤" | thiếu hết badge/role/title/ảnh · avatar initials · ❤ = số mock | **data-model + component** (`FeedCardProps` không có field tier/role/title/images) |
| V3 | Highlight filter | dropdown **"Hashtag ▾ / Phòng ban ▾"** | dãy **chip hashtag** (Tất cả/#ThanhOm…) | component khác pattern |
| V4 | Spotlight | **word-cloud tên** trên nền **texture/sao**, đặt **giữa trang** (sau Highlight) | **bong bóng avatar** trên nền phẳng, đặt **cuối trang** | component + vị trí layout |
| V5 | Sidebar stats | rows "Số Kudos bạn nhận được: 25…" | grid "KUDOS NHẬN 12 / GỬI 8…" | layout khác (minor) |
| V6 | Sidebar list | "10 SUNNER **NHẬN QUÀ MỚI NHẤT**" (recipients + avatar) | 2 leaderboard "THĂNG HẠNG" + "NHẬN QUÀ" (rank + score) | khác semantics section |

Màu tổng thể (navy #00101A + accent vàng) ~ khớp. Chưa soi sâu màu icon từng nút (cần khi rework).

## Verdict: **FAIL** — visual < 95%, khác design ở cấu trúc card, spotlight, KV banner, sidebar.

## Kết luận
Board được build **giản lược** so với Figma. Không phải bug mock/BE — là **UI implementation chưa bám design**. Cần FE rework để đạt ~95%:
1. [V1] KV banner: thêm wordmark KUDOS + artwork full-width.
2. [V2] Card: mở rộng `FeedCardProps` (tier/role/kudoTitle/images) + render badge/title/ảnh + avatar. (Ảnh hưởng cả contract BE — cần đồng bộ kudos_public.)
3. [V4] Spotlight: đổi sang word-cloud text + nền texture + đưa lên giữa trang.
4. [V3] filter dropdown thay chip. [V5][V6] sidebar bám Figma.

## Unresolved
- V2 đụng contract BE (thêm field) → cần đồng bộ với BE agent (kudos_public columns: tier, role, title, image_urls?).
- Chưa chấm 768/375 (dừng ở 1440 vì FAIL rõ).
- Spotlight "nền sao/texture" — cần asset/spec từ Figma (MCP get_frame node) trước khi build.

---

## Re-gate sau FE rework — 2026-08-05 (verified)
Actual: `board-rework-full.png` + `board-rework-top.png`. `/board?ui_state=full` @1440.

**Behavior: PASS** — 0 console error, tsc sạch, 111 unit test pass.
**Visual: ~PASS** — V1–V6 đóng: KV wordmark KUDOS · card có tier badge + department + "IDOL GIỚI TRẺ" + ❤ 1.000 · filter dropdown · spotlight word-cloud (size ∝ count) đưa lên giữa · sidebar rows + prize. Layout đúng thứ tự Figma. Màu verbatim (navy/gold/Montserrat) áp đúng.

**Còn treo (KHÔNG phải FE miss — phụ thuộc asset/BE):**
1. **Asset design chưa export:** spotlight texture (đang gradient placeholder) + KV right artwork (đang dùng keyvisual-bg workaround). → xin design team.
2. **BE contract:** 6 cột cần thêm vào `kudos_public` để có data thật (title, sender_department, receiver_department, sender_tier, receiver_tier, image_urls) + `prize_description` cho leaderboard. → gọi BE agent.
3. Chưa verify image gallery với data (mock có thể chưa set imageUrls) + chưa chấm 768/375.
4. `secretBoxCount` "chưa mở" hiển thị 0 — chờ BE tách field.
