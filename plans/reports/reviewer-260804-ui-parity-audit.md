# UI Parity Audit — Source code ⇄ MoMorph

Date: 2026-08-04 · fileKey `9ypp4enmFmdK3YAFJLIu6C` · method: Playwright capture (375/768/1280, auth state) vs MoMorph frame images.

Artifacts: renders `plans/reports/ui-audit/shots/` · references `plans/reports/ui-audit/momorph/`.

## 1. Inventory — thiếu / thừa màn

MoMorph có **174 frame**, nhưng phần lớn là **component/design-system** (Button, Icon, Color, Typography, Dropdown*, Frame NNN…) và **~40 biến thể [iOS]** (app mobile riêng) — không phải màn web sản phẩm.

### Màn web đã build (9) — có route
| MoMorph screen | screenId | Route |
|---|---|---|
| Homepage SAA | i87tDx10uM | `/` |
| Countdown - Prelaunch | 8PJQswPZmU | `/countdown` |
| Login | GzbNeVGJHz | `/login` |
| Sun* Kudos - Live board | MaZUn5xHXZ | `/board` |
| Profile bản thân | 3FoIx6ALVb | `/profile` |
| Thể lệ UPDATE | b1Filzi9i6 | `/rules` |
| Hệ thống giải | zFYDgyj_pD | `/awards` |
| Open secret box | J3-4YFIpMM | `/secret-box` |
| Viết Kudo | ihQ26W78P2 | `/kudos` |

### Màn web trên MoMorph CHƯA build (thiếu)
- **Profile người khác** (w4WUvsJ9KI) — không có route `/profile/[id]`.
- **View Kudo** (onDIohs2bS) — xem chi tiết 1 kudo.
- **Tất cả thông báo** (6-1LRz3vqr) / **Notification** (D_jgDqvIc8) — có feature `notifications` (chuông) nhưng không có trang danh sách đầy đủ.
- **Màn Sửa bài viết – edit mode** (419VXmMy6I).
- **Error page 403 / 404** (T3e_iS9PCL / p0yJ89B-9_).
- **Toàn bộ khu Admin** — Overview, Review content, Setting, User, add/edit Campaign, delete popup (9 màn) → chưa có gì.

### Route trong source KHÔNG có trong MoMorph (thừa / dev-only)
- `/dev-login` — helper đăng nhập cho test (không phải màn design).
- `/todo` — trang scratch/dev.
- `/auth/callback` — route OAuth, không có UI (đúng, không tính).

## 2. Visual parity — per screen

| Màn | Verdict | Điểm chính |
|---|---|---|
| login | **MINOR** | Artwork bên phải bị tối/xỉn màu; heading "ROOT FURTHER" wrap 2 dòng (ref 1 dòng). |
| countdown | **MINOR** | Label VN "NGÀY/GIỜ/PHÚT" vs Figma "DAYS/HOURS/MINUTES"; **@375 clock tràn/clip** cụm cuối. |
| rules | **MINOR** | Fidelity cao, chỉ lệch spacing/màu nền nhẹ; responsive ok. |
| awards | **MAJOR** | Thiếu hero artwork; **card 1 cột thay vì 2 cột** (badge trái / text phải); **badge images không load** (vòng tròn rỗng); prize/counter sai số; thiếu sidebar; @375 logo clip + overflow. |
| secret-box | **MAJOR** | Thiếu subtitle "Click vào box để mở" & nút ×; **counter layout đảo** (số↔text); card hẹp (~300 vs ~420px); @375 clip mất chữ đầu title. |
| kudos | **MAJOR** | **Thiếu hẳn field "Danh hiệu *"** (required theo spec); nền modal vàng kem thay vì trắng; backdrop đen đặc thay vì overlay dim; layout label dọc thay vì inline; @375 toolbar clip. |
| homepage | **BLOCKED** | Crash — xem §3. |
| board | **BLOCKED** | Crash — xem §3. |
| profile | **BLOCKED** | Crash — xem §3. |

## 3. Bug chặn (REAL) — avatar `api.dicebear.com` không whitelist

`homepage`, `board`, `profile` **crash runtime** ở mọi breakpoint:
`Invalid src prop (https://api.dicebear.com/...) on next/image — hostname "api.dicebear.com" is not configured`.

- `dicebear` **không xuất hiện trong `src/`** → URL đến từ **seed data** trong DB (`profiles.avatar_url`).
- `next.config.ts` chỉ whitelist `lh3.googleusercontent.com` (Google OAuth).
- Hệ quả: môi trường seed/demo, mọi màn hiển thị avatar seed đều vỡ. Production (avatar Google) không dính, nhưng demo/E2E thì có.
- **Fix 1 dòng:** thêm `{ protocol: 'https', hostname: 'api.dicebear.com' }` vào `images.remotePatterns`. HOẶC sửa seed dùng nguồn avatar đã whitelist. Sau fix → cần capture lại 3 màn để hoàn tất audit.

## 3b. Wide-screen 1440px (bổ sung)

Design artboard gốc là **1280**; test 1440 để soi hành vi wide-viewport.

| Màn | @1440 | Điểm chính |
|---|---|---|
| login | 🟡 MINOR | heading vẫn wrap 2 dòng; content lệch trái, **thiếu max-width center** |
| countdown | 🟡 MINOR | content drift trái, artwork không phủ hết phần rộng thêm; label VN/EN |
| rules | 🟡 MINOR | **thiếu max-width cap** → content stretch, lề trái sát mép |
| awards | 🔴 MAJOR | badge vẫn không load, 1 cột, prize/counter sai data, **không có container center** |
| secret-box | 🔴 MAJOR | **nền xám sai** (phải là overlay tối full-bleed), thiếu ×/subtitle, counter đảo, không center dọc |
| kudos | 🔴 MAJOR | thiếu "Danh hiệu"; **modal không cap max-width** → giãn ~720px; **clip đáy** (mất nút Hủy/Gửi); backdrop đen đặc |
| homepage/board/profile | ⛔ CRASH | dicebear crash ở mọi width kể cả 1440 |

**Phát hiện hệ thống @1440:** hầu hết màn **thiếu `max-width` + `mx-auto`** cho content container → vỡ bố cục khi viewport > 1280. Cần chuẩn hoá 1 layout wrapper.

## 4. Chủ đề lặp lại (cross-screen)
- **Mobile 375 overflow/clip** ở nhiều màn (countdown, awards, secret-box, kudos) — chưa đạt yêu cầu responsive default-on của CLAUDE.md.
- **Asset không load** (badge awards, artwork) — thiếu file/public path hoặc data.
- **i18n**: countdown hiển thị VN trong khi Figma là EN — cần chốt locale nguồn.
