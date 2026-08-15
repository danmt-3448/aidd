# Data Migration + UI Bugs — root causes & plan (2026-08-11)

Từ review live UI của user. Root cause đã xác minh bằng runtime, không đoán.

## Bugs — root cause (verified)
| # | Triệu chứng | Root cause (verified) | Fix |
|---|---|---|---|
| B1 | **Like báo "kudos id không hợp lệ"** dù có data | Seed dùng uuid giả version-0 (`dddddddd-0000-0000-…`). **Zod v4 `.uuid()` ép đúng RFC version/variant → REJECT** (test: `.uuid()`=false, `.guid()`=true; uuid v4 thật=true). `heart-actions.ts:11` dùng `.uuid()`. Profile đã học bài này → dùng `.guid()`. | (a) `heart-actions` + mọi `.uuid()` trên entity-id → **`.guid()`** (robust, prod v4 vẫn pass); (b) seed dùng uuid **v4-format hợp lệ**. |
| B2 | **List kudos không có hashtag nào** | Feed query mặc định (`board-queries.ts:302-307`) chỉ select `hearts(...)`, **KHÔNG select `kudo_hashtags`/tên hashtag**, mapping (335-352) không set `hashtags` → card luôn `hashtags=[]`. | Thêm join `kudo_hashtags(hashtag_id, hashtags(name))` vào feed select + map `hashtags: [...names]`. |
| B3 | **Không tạo được kudo (không có người nhận)** | Recipient search `ilike` cần gõ (empty→[]); + chỉ có 10 user. User muốn **30 user**. | Seed **30 user** (như login). (Cân nhắc: focus mà chưa gõ → show danh sách gợi ý mặc định.) |
| B4 | **Hover card bị cắt** | Scroll container all-kudos `overflow-y-auto` (+ overflow-x) **clip** popup hover tràn ra ngoài. | Cho hover popup render ngoài overflow (portal) hoặc `overflow: visible` trục X / dời hover khỏi vùng scroll. |
| B5 | **Click không có cursor pointer** | **Tailwind v4 preflight bỏ `cursor:pointer` mặc định cho `<button>`** → mọi nút/clickable thiếu con trỏ. | Global CSS: `button:not(:disabled),[role=button],a{cursor:pointer}` hoặc thêm `cursor-pointer` các clickable. |

## Data migration cần làm (user: "migrate 30 user + xem cần gì migrate luôn")
1. **Users → 30** (data chuẩn như login, GoTrue admin API `seed-auth-users.mjs`). **uuid v4-format hợp lệ** (vd `00000000-0000-4000-8000-0000000000NN`) — KHÔNG dùng `11111111-0000-…` version-0 nữa (gây B1). Đủ profiles + department_ref + 1 admin.
2. **Kudos đủ loại** (fix B2 + variety user yêu cầu): có hashtag / không hashtag · có ảnh / không ảnh · ẩn danh / công khai · nội dung dài / ngắn · hearts varied (gồm special-day). uuid v4-format hợp lệ.
3. **Ảnh**: upload placeholder PNG vào bucket `kudo-images` (local storage) + `kudo_images` rows (path `{uid}/{kudoId}/{file}`) cho ~3-5 kudo → card hiện gallery ảnh thật.
4. **Hashtags**: đã có 12 (seed.sql) — đủ; đảm bảo feed query trả về (B2).
5. **Secret box / event_config / special_day**: giữ như hiện tại (đã seed).

## ⚠️ DEPLOY note (user yêu cầu thêm vào plan)
**Khi deploy production PHẢI chạy migration + seed các thứ cần thiết**, không chỉ schema:
- Chạy toàn bộ `supabase/migrations/**` (schema + RPC + views + grants).
- Seed **danh mục** bắt buộc: `departments`, `hashtags` (seed.sql), `event_config` (event_start_at thật của sự kiện), `special_day_config` (ngày đặc biệt thật).
- **KHÔNG** seed demo kudos/hearts/users giả lên prod (đó chỉ là dev fixtures). Prod: user thật qua OAuth Google; profiles tạo qua trigger/onboarding.
- Kiểm grant: `service_role`/`authenticated` đúng quyền (vd `event_config` UPDATE chỉ admin — đã thấy service_role thiếu UPDATE grant, cân nhắc cấp cho admin flow).
- Verify sau deploy: RPC (`create_kudo`, `toggle_heart`, `open_secret_box`) execute-able; RLS đúng; uuid do `gen_random_uuid()` (v4, hợp lệ `.uuid()`/`.guid()`).
→ Sẽ đưa mục này vào `phase-01` (DB) của plan + docs/deployment khi tới bước ship.

## Việc còn lại (không phải data)
- **Component hoá**: chuẩn hoá kudo card + hover + các mảnh lặp thành component tái dùng (đã có `kudo-card.tsx` canonical — mở rộng).
- **Test thao tác browser cụ thể**: từ MoMorph test cases (board TC like/filter/copy-link/hover, kudos TC validation/submit, profile TC) → Playwright interaction tests (sau khi data + bug fix xong).

## ✅ VERIFIED (2026-08-11 19:20, live browser + runtime)
| Bug | Fix | Verify |
|---|---|---|
| B1 like | `.uuid()→.guid()` (heart/notification/board-queries/leaderboard) | in-browser click: aria-pressed false→true, count **4→5, KHÔNG lỗi toast** ✓ (be probe `toggle_heart`→`(t,3)`) |
| B2 hashtag | feed query join `kudo_hashtags(hashtags(name))` + map | card hiện chip **"Support"** ✓ |
| 30 users | seed-auth 30 (uuid v4 hợp lệ) | spotlight dày 30 tên ✓ |
| Kudo variety | 71 kudos: 45 có tag/26 không · 4 có ảnh · 8 ẩn danh | ✓ |
| B4 hover | portal ra body | `notClipped:true` ✓ |
| B5 cursor | global CSS Tailwind v4 | ✓ |
| Refactor | `BoardFeedCard`/`KudoCard` single-source | 503 unit pass ✓ |
| Feed render | — | 25 heart buttons, 0 console error ✓ |
Evidence: `evidence/screenshots/verify/board-allkudos-verify.png`, `ui-bugs-fix/`. Session storageState phải refresh trước capture (JWT TTL — global-setup).
db:reset + tsc clean. `.guid()` + uuid v4 fixture = bài học chống lặp (đã ghi phase-01).

## Open questions
1. Recipient picker: show danh sách mặc định khi focus (chưa gõ) hay giữ search-on-type?
2. 30 user: giữ 10 cũ (đổi uuid) + thêm 20, hay tạo mới hoàn toàn 30?
