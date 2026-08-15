# Spec derived from Figma images — Kudo Card + Tier + Hover (2026-08-11)

Suy ra từ 2 ảnh user gửi (danh hiệu/hover + overview). Đây là chuẩn build. Số chính xác (màu/size) lấy `get_node` MoMorph khi code (không guess).

## 1. TIER (Danh hiệu Hero) — theo SỐ NGƯỜI GỬI (distinct senders) tới bạn
| tier | Điều kiện (distinct senders → receiver) | Label | Tooltip (verbatim) |
|---|---|---|---|
| 1 | 1–4 | **New Hero** | "Có 1–4 người gửi Kudos cho bạn. Hành trình lan tỏa điều tốt đẹp bắt đầu – những lời cảm ơn và ghi nhận đầu đã tìm đến bạn." |
| 2 | 5–9 | **Rising Hero** | "Có 5-9 người gửi Kudos cho bạn. Hình ảnh bạn đang lớn dần trong trái tim đồng đội bằng sự tử tế và cống hiến của mình." |
| 3 | 10–20 | **Super Hero** | "Có 10-20 người gửi Kudos cho bạn. Bạn đã trở thành biểu tượng được tin tưởng và yêu quý, người luôn sẵn sàng hỗ trợ và được nhiều đồng đội nhớ đến." |
| 4 | > 20 | **Legend Hero** | "Có hơn 20 người gửi Kudos cho bạn. Bạn đã trở thành huyền thoại – người để lại dấu ấn khó quên trong tập thể bằng trái tim và hành động của mình." |
- 0 người gửi → **không có tier** (không render badge).
- **⚠️ Fix code**: `feed-card-tier-badge.tsx` đang map `3=Legend, 4=Super` → SAI. Đúng: `3=Super, 4=Legend`. Badge style mỗi tier khác nhau (New=xám, Rising=xanh lá, Super=cam/đỏ, Legend=vàng gold) — lấy màu từ Figma node.
- **Metric = distinct senders**, KHÁC "hearts received". Cần đếm `count(distinct sender_id) from kudos where receiver_id = X`.

## 2. Kudo Card (ALL KUDOS + Highlight) — image overview
Layout (component `board-feed-card.tsx` đã có, thiếu DATA):
- Sender block: avatar · **tên** · dòng "`{department} · [tier badge]`" (vd "CEVC10 · New Hero").
- Paper-plane icon giữa → Receiver block tương tự ("CEVC10 · Legend Hero").
- Timestamp "10:00 - 10/30/2025".
- **Danh hiệu row**: "{danh_hieu}" (vd "IDOL GIỚI TRẺ") center + **pencil edit**.
  - **Pencil CHỈ hiện khi kudo là của CHÍNH mình tạo** (`senderId === currentUserId`) — kudo người khác KHÔNG có pencil.
  - Click pencil → **mở edit mode** để sửa kudo (Figma frame `419VXmMy6I` "Màn Sửa bài viết - edit mode"). MVP: reuse KudoComposeModal ở chế độ edit (prefill content/danh_hieu/hashtag/ảnh) → gọi `update_kudo` action. Chỉ sender được sửa (enforce ở server: `sender_id = auth.uid()`).
- Content box (cream).
- **Image gallery** (tối đa 5 thumbnail).
- **Hashtags**: **text đỏ có tiền tố `#`** ("#Dedicated #Inspring …"), wrap, overflow "…". (Figma node = TEXT, KHÔNG phải pill bg — sửa `HashtagRow` từ pill → inline red text `#tag`.)
- Footer: "1.000 ❤" (heart count) trái · "Copy Link 🔗" phải.

**Data còn thiếu ở feed query** (`board-queries.ts`) → phải bổ sung + map vào `FeedCardProps`:
`senderDepartment, receiverDepartment` (profiles.department_ref → departments.name) · `senderTier, receiverTier` (distinct-sender count, mục 1) · `title` (= kudos.danh_hieu) · gallery images (đã có kudo_images) · hashtags (đã fix B2).

## 3. Hover Avatar card — image danh hiệu (hover avatar)
Popup khi hover avatar/tên (component `board-user-hover-card.tsx` — enrich):
- Avatar + **Tên** (gold).
- "**Tên đơn vị:** {full department path}" (vd "Culture & Communication Executive/C&C Line/HRD Unit/OPD Center") — dept path đầy đủ, không chỉ code.
- **Tier badge** (New/Rising/Super/Legend Hero).
- "**Số Kudos nhận được:** N" · "**Số Kudos đã gửi:** N".
- Button "**✎ Gửi KUDO**" (gold) → mở compose pre-fill người nhận (như V1).
- Card bg tối (#00101A family), radius, per Figma.

## 4. Sidebar stat + x2 campaign
- Stat "Số tim bạn nhận được: 🔥**x2** N" — icon flame x2 khi đang ngày đặc biệt.
- **Hover flame → tooltip**: "Ngày x2 tim – lan tỏa gấp đôi yêu thương! Từ XX:XX ngày XX/12 đến XX:XX ngày XX/12, tất cả tim bạn nhận được đều được nhân đôi." (lấy ngày thật từ special_day_config).

## Build phases (đề xuất)
1. **BE data**: extend feed (kudos_public view/query) + hover data với `department`(full path), `tier`(distinct-sender count 1-4/5-9/10-20/>20), `danh_hieu`, kudos received/sent counts. Fix tier badge order 3=Super/4=Legend.
2. **FE card**: hashtag → inline red `#text`; verify dept+tier+danh-hieu+gallery render khớp Figma.
3. **FE hover card**: enrich (dept path, tier, counts, Gửi KUDO) + tier tooltips (4 text) + x2 flame tooltip.
4. **Gate**: `/aidd-ui-gate /board` (1440+1280 property-diff) + screenshot đủ state.

## Decisions (user 2026-08-11) — RESOLVED
- **Dept**: dùng **tên ngắn** ("CEVC10") — KHÔNG cần full path. ✓
- **Hover "Số Kudos đã gửi"**: **hiện luôn cho mọi người** (cần SECURITY DEFINER helper đếm sent, bypass RLS). Hover **phải phân biệt self vs other** (so `profileId === currentUserId`): xem avatar của CHÍNH MÌNH → KHÔNG có nút "Gửi KUDO" (không tự gửi mình); avatar người khác → có "Gửi KUDO". User chấp nhận sent gồm cả kudo ẩn danh (override cân nhắc privacy SEC_001).
- **Pencil**: edit THẬT, chỉ trên kudo của mình → mở edit mode (`419VXmMy6I`) → `update_kudo`. ✓
