# Board (Live Kudos) — Figma Spec Brief (CORRECTED)

> ⚠️ Bản cũ SAI (card dark, tier sao, KUDOS text). Bản này **chuẩn theo ẢNH frame** `get_frame_image(MaZUn5xHXZ)` — ảnh render là nguồn chân lý, KHÔNG dùng token extract khi mâu thuẫn.
> screenId `MaZUn5xHXZ` · fileKey `9ypp4enmFmdK3YAFJLIu6C`

## Global
Nền `#00101A` · font Montserrat · accent vàng `#FFEA9E` · card KEM `#FFF8E1` chữ tối.

## Assets đã export sẵn (public/images/board/)
- `kudos-logo.svg` (wordmark KUDOS — ĐÃ wire banner)
- `kv-background.png` (artwork feather 1440×512 — ĐÃ wire banner)
- `sample-kudo-image.png` (64×64) — image thumbnail trong card
- `sample-avatar.png` (64×64) — avatar sender/receiver
- `icon-send.png`

## Từng section (top→bottom)
1. **Header** — OK.
2. **KV banner** — OK (KUDOS svg + artwork + eyebrow "SAA 2025·KUDOS" + subtitle).
3. **Search row** — compose field trái (rộng) + "Tìm kiếm profile Sunner" phải. OK.
4. **Eyebrow** "Sun* Annual Awards 2025" (vàng nhỏ) trên MỖI section. OK.
5. **HIGHLIGHT KUDOS** — title vàng + dropdown "Hashtag ▾" + "Phòng ban ▾" góc phải. **Carousel ngang peek ~2.5 card** + arrow + pagination "2/5". Card kem.
6. **SPOTLIGHT BOARD** — title vàng. **Box tối bo góc có viền**: "388 KUDOS" giữa trên · **word-cloud DÀY ~45-50 tên** size ∝ kudoCount (vài lớn, nhiều nhỏ, 1 tên đỏ nổi bật) · **artwork màu tràn mép TRÁI** · **activity log** góc dưới trái ("HH:MM {tên} đã nhận được một Kudos mới") · **icon mở rộng** góc dưới phải · nền tối texture.
7. **ALL KUDOS** — title vàng. **1 CỘT card kem lớn** (KHÔNG grid 2 cột), mỗi card có **hàng ảnh thumbnail**. Bên phải **sidebar sticky**.
8. **SIDEBAR** — box tối: dòng "Số Kudos bạn nhận được: N" / "…đã gửi: N" / "Số tim bạn nhận được: N" / "Số Secret Box đã mở: N" / "…chưa mở: N" + nút vàng "Mở Secret Box". Rồi **"10 SUNNER NHẬN QUÀ MỚI NHẤT"**: 10 dòng avatar + tên + "Nhận được 1 áo phông SAA". (CHỈ 1 list — không "THĂNG HẠNG".)

## Card spec (kem `#FFF8E1`, chữ tối)
- Hàng trên: avatar sender (ảnh) + tên + **role/dept** (CEVC10) + **tier pill chữ** (New/Rising/Legend Hero, có màu) — [icon **play**] — avatar receiver + tên + role + tier pill.
- **Tiêu đề kudo** "IDOL GIỚI TRẺ".
- Nội dung.
- **Hàng ảnh thumbnail** (tối đa 5, ~80×80 bo góc, dùng sample-kudo-image.png).
- Hashtags (chip).
- Footer: **"1.000 ❤"** (số lớn vi-VN) + "Copy Link" + "Xem chi tiết"(highlight)/bút chì(all-kudos).

## Mock density BẮT BUỘC (giống Figma mới giống)
- Feed: 10–12 card, mỗi card đủ kudoTitle + dept + tier + **3–5 imageUrls** + avatars + hashtags + heartCount lớn.
- Highlight: 5 card (carousel).
- Spotlight: **~45–50 node**, kudoCount đa dạng → cloud dày.
- Leaderboard nhận quà: **10 entry** + prize.
- Stats: số thực tế (vd 25).

## Nguồn màu/spacing chính xác
`get_node`/`query_component` — KHÔNG dùng `list_design_items` extract cũ (đã sai). Ảnh frame là chuẩn cuối.
