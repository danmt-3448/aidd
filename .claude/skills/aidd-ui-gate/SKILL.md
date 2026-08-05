---
name: aidd-ui-gate
description: "Run the UI-First Gate for a screen — Playwright visual-diff vs Figma at 1440 (primary) + 1280 (secondary) + a mock-data behavior checklist — and emit a PASS/FAIL report. A screen must PASS this gate before integration (wiring real BE), before writing e2e/unit tests, and before ship. Use when user says 'chạy gate', 'kiểm UI màn X', 'ui gate', 'màn này pass design chưa', 'verify UI', or after building a screen's UI+behavior with mock data. Not for: building/coding UI (dùng momorph-implement-design) or full-project design audit (dùng check-progress --design) — skill này chỉ CHẤM một screen đã build."
argument-hint: "<screen URL | route | screenId> [--behavior-only] [--visual-only]"
metadata:
  author: aidd
  version: "2.0.0"
triggers: ["ui gate", "chạy gate", "kiểm ui", "verify ui", "pass design chưa", "ui-first gate", "màn này đúng design chưa", "gate màn"]
---

# UI-First Gate

Chốt chặn chất lượng UI theo `.claude/rules/ui-first-gate.md`. Một screen **phải PASS gate này** trước khi: integrate real BE data · viết e2e/unit · ship.

**Nguyên tắc bất di:**
- **Visual (nhóm A) = pixel-perfect ≥ 99%** — đo bằng **auto pixel-diff** (pixelmatch) giữa screenshot và ảnh Figma reference. PASS khi tỉ lệ pixel lệch **≤ 1%** ở CẢ 1440 + 1280. Bật **antialias tolerance** (font/subpixel/anti-alias không tính là lệch) + **mask vùng động** (countdown, avatar, thời gian) để không false-FAIL. Vẫn lấy số từ MoMorph MCP làm mốc — không bịa. Không còn "bỏ qua lệch nhỏ" — lệch layout/màu/size/vị trí đều vào % diff.
- **Behavior (nhóm B) = 100%, bất khả nhân nhượng.** Mỗi mục phải PASS kèm bằng chứng; nghi ngờ / chưa verify được = **FAIL**. Không làm tròn, không bỏ mục vì "khó chấm".
- **⚠️ ĐỐI CHIẾU CẢ MoMorph LẪN FIGMA TRỰC TIẾP — KHÔNG chấm chỉ theo brief cũ.** MoMorph brief/extract THIẾU nhiều thứ chỉ có trên Figma: **annotation/NOTE vẽ trên canvas** (spec behavior kiểu *"Highlight chỉ hiện 1 KUDO ở Center, 2 bên để mở"*), nhãn callout mô tả **state/dropdown** (`Dropdown Hashtag filter`, item active), tooltip, ghi chú luồng. Nếu Figma có mà MoMorph không có → **lấy Figma làm chuẩn**, đưa vào checklist. Phân biệt: annotation/callout là **chú thích để HIỂU behavior/state**, KHÔNG phải text để render (đừng render nhãn "NOTE Highlight" lên UI).

---

## Input

- **screen** — MoMorph URL (`https://momorph.ai/files/{fileKey}/screens/{screenId}`), một route local (`/board`, `/profile`…), hoặc `screenId`. `fileKey` mặc định đọc từ `CLAUDE.md`.
- `--behavior-only` — chỉ chạy nhóm B (behavior checklist), bỏ visual-diff.
- `--visual-only` — chỉ chạy nhóm A (visual fidelity), bỏ behavior.

**Precondition:** screen phải **render được ở route local với mock data** (FE đã build UI+behavior mock theo `fe-developer.md`) và **dev server sống** (`npm run dev`, http://localhost:3001). Chưa thỏa → xem Error Recovery.

---

## Steps

### 1. Resolve refs
Xác định `fileKey` + `screenId` + route local. Theo thứ tự:
1. Input là **URL** → parse thẳng `fileKey`/`screenId`.
2. Input là **route** (vd `/board`) → tìm screenId bằng, theo thứ tự: (a) grep MoMorph URL trong `src/app/{route}/page.tsx` + component của feature đó; (b) grep trong `plans/**/phase-*.md` của feature; (c) chạy `check-progress` để lấy bảng screen↔route nếu có.
3. Input là **screenId** → `fileKey` lấy từ `CLAUDE.md`; route suy từ tên screen (hỏi nếu không chắc).

Không resolve được screenId → **hỏi user**, KHÔNG đoán. Không có route chạy được → xem Error Recovery.

### 2. Lấy Figma reference (visual — bỏ nếu `--behavior-only`)
- `mcp__momorph__get_frame_image(screenId)` — ảnh reference desktop (artboard **1440**). **ĐÂY LÀ CHÂN LÝ.**
- Số liệu chính xác khi nghi ngờ: `mcp__momorph__get_node(screenId, nodeId)` / `query_component`. **KHÔNG** dựa `list_design_items`/brief extract làm nguồn màu/layout — extract từng SAI (card bg, tier style…). Khi extract mâu thuẫn ảnh render → **ảnh render thắng**.
- `mcp__momorph__get_frame_test_cases(screenId)` — spec behavior + layout (đọc để biết section nào full-width, control gì, placeholder text chính xác).
- **⚠️ BẮT BUỘC đối chiếu Figma TRỰC TIẾP — không chỉ MoMorph.** MoMorph frame image có thể crop mất **annotation/NOTE/callout** vẽ ngoài viền artboard (Figma canvas rộng hơn frame). Lấy Figma trực tiếp theo thứ tự:
  1. `mcp__figma__*` (figma MCP) hoặc link Figma user cung cấp → xem **toàn canvas** (frame + annotation xung quanh).
  2. Không có figma MCP → **hỏi user gửi screenshot/link Figma** vùng có annotation; nếu user đã đính ảnh Figma → dùng Read ảnh đó làm nguồn.
  3. `mcp__momorph__get_figma_image` / `get_frame_node_tree` để dò node annotation nếu có.
  - Quét hết **NOTE / callout / nhãn state** (vd `Dropdown Hashtag filter`, `NOTE Highlight`, `Avatar info user`) → mỗi cái là **1 mục behavior/state** phải đưa vào checklist nhóm B. Figma có mà MoMorph không có → Figma thắng.

### 3. Visual-diff (nhóm A) — AUTO PIXEL-DIFF ≥ 99%
Với mỗi viewport: `browser_resize(w, h)` → `browser_navigate` route → `browser_take_screenshot` (`fullPage:true`).
**Chụp FULL PAGE — soi TỪ HEADER TỚI FOOTER, mọi section, không chỉ vùng nhìn thấy.** (Đã từng sót hẳn footer.)

**3a. Pixel-diff định lượng (cổng chính — PASS khi ≤ 1% pixel lệch):**

1. Lưu ảnh Figma reference (Step 2 `get_frame_image`) → `plans/reports/_gate-ref/{screen}-{vw}.png`. Lưu screenshot app → `{screen}-{vw}-actual.png`.
2. **Align kích thước** (bắt buộc — 2 ảnh phải cùng W×H mới diff được): scale ảnh app về **đúng width reference** (1440/1280), rồi crop/pad chiều cao cho khớp reference height. Đặt DPR=1 khi chụp để tránh nhân đôi pixel.
3. **Mask vùng động** trước khi diff: countdown digits, avatar, timestamp, bất kỳ giá trị runtime — vẽ khối đặc lên cả 2 ảnh (chúng là behavior/data, không phải drift layout).
4. Chạy pixel-diff qua script node (pixelmatch + pngjs), ví dụ:
   ```bash
   node .claude/skills/aidd-ui-gate/scripts/pixel-diff.mjs \
     --ref plans/reports/_gate-ref/{screen}-1440.png \
     --actual plans/reports/_gate-ref/{screen}-1440-actual.png \
     --out plans/reports/_gate-ref/{screen}-1440-diff.png \
     --mask "x,y,w,h;..." --aa
   ```
   Script dùng `pixelmatch(img1, img2, diff, w, h, { threshold: 0.1, includeAA: false })` → in `mismatchedPixels` + `ratio = mismatched/(w*h)`. Chưa có tool → `npx pixelmatch` hoặc `npx odiff <ref> <actual> <diff> --antialiasing --threshold=0.1`; odiff in luôn % khác biệt.
5. **PASS pixel-gate khi `ratio ≤ 0.01` (≥ 99% giống)** ở CẢ 1440 + 1280. `> 1%` → FAIL, mở ảnh `-diff.png` khoanh vùng đỏ để biết chỗ lệch.

**3b. Model-visual (bắt lỗi pixel-diff bỏ sót — chạy sau khi 3a PASS):** đặt screenshot cạnh reference, soi từng vùng theo checklist (những lỗi này pixel-diff có thể cho ratio thấp mà vẫn sai bản chất):
   - **Layout composition** ⚠️ — section nào **full-width** vs section nào chia **2 cột (feed + sidebar)**? Nhóm sai (vd sidebar bọc nhầm cả highlight/spotlight) = FAIL. Đối chiếu cấu trúc tổng thể, không chỉ từng component.
   - **Kích thước/tỉ lệ element** — box/section có cao/rộng đúng tỉ lệ Figma? (Đã từng: spotlight box quá dài.) So chiều cao node.
   - **Màu sắc** — bg, text, border, gradient: đối chiếu **hex** (qua `get_node`, không đoán). ⚠️ card có thể là nền SÁNG/kem — đừng mặc định tối.
   - **Màu icon** ⚠️ — fill/stroke MỌI icon khớp design (dễ sai: icon đen mặc định, sai brand color, sai state active/inactive).
   - **Ảnh/logo/wordmark là ASSET ẢNH** — nếu Figma là image (logo, wordmark, artwork) thì phải render bằng `<Image>` từ file export, **KHÔNG dựng lại bằng text/CSS/font**. Kiểm: element đó là `<img>`/`<svg>` hay bị fake bằng `<h1>`/`<div>`? Fake = FAIL.
   - **Không đè/không cắt** — text/word-cloud/element không chồng lên nhau, không bị cắt.
   - font (family/weight/size) · spacing · vị trí · **control states** (nút active/disabled, carousel trang active, dropdown) theo test-cases.
   - Vùng nghi ngờ → đọc giá trị thật (`browser_evaluate` + `getComputedStyle`; icon SVG đọc `fill`/`stroke`) đối chiếu node spec.

**Ngưỡng PASS/FAIL (pixel-perfect ≥ 99% — pixel-diff ≤ 1%):**

| Viewport | Ngưỡng |
|---|---|
| **1440 (ưu tiên 1)** | **PASS khi pixel-diff ratio ≤ 1%** (sau khi mask vùng động + bật AA tolerance). > 1% → FAIL, liệt kê vùng đỏ trên `-diff.png`. Ngoài ra vẫn FAIL bất kể ratio nếu model-visual (3b) bắt: logo/wordmark/artwork **dựng bằng text/CSS thay vì asset ảnh**, **sai màu icon**, **mock data thưa hơn Figma**, thiếu section (footer), text đè/cắt. |
| **1280 (ưu tiên 2)** | Cùng ngưỡng ≤ 1% pixel-diff, **THÊM** FAIL nếu overflow ngang (scroll ngang) · đè/cắt chữ · layout vỡ khi thu về 1280. |
| ~~768 / 375~~ | **BỎ — không chấm ở gate.** |

Report ghi **ratio % từng viewport** + từng FAIL kèm bằng chứng (vùng đỏ trên diff, sai cái gì).

### 4. Behavior checklist với MOCK DATA (nhóm B — bỏ nếu `--visual-only`)
Lấy test cases làm checklist (KHÔNG viết code test):
- `mcp__momorph__get_frame_test_cases(screenId)` hoặc `download_test_cases`.
Dùng Playwright MCP thao tác trên màn với mock data, tick từng mục. **Nhóm B phải đúng 100% — sai/nghi ngờ 1 mục = cả gate FAIL:**
- [ ] Validation form client-side đúng
- [ ] Navigation / redirect đúng luồng
- [ ] **4 state qua query param** — navigate `{route}?ui_state=full` → `empty` → `error` → `loading`, mỗi lần `browser_take_screenshot` + kiểm render đúng (full: có data; empty: empty-state UI; error: thông báo lỗi; loading: skeleton/spinner)
- [ ] Interactive: click / hover / keyboard nav hoạt động
- [ ] `browser_console_messages` — 0 error/warning (kiểm ở cả 4 state)

> Route **không phản hồi `?ui_state=`** (mọi state ra như nhau) → FE chưa làm mock fixtures + toggle ⇒ **FAIL** (không kiểm được empty/error). Xem Mock fixtures convention trong `.claude/rules/ui-first-gate.md`.

### 5. Verdict + report
Ghi report vào `plans/reports/ui-gate-{date}-{screen-slug}.md`:

```
# UI-First Gate — {screen} — {PASS|FAIL}

## A. Visual pixel-perfect ≥ 99% (1440 ưu tiên 1 / 1280 ưu tiên 2) — chấm full-page
- **Pixel-diff ratio: 1440 = {x.xx}% · 1280 = {x.xx}%** (PASS khi ≤ 1%); mask vùng động: {liệt kê}
- Model-visual (3b): layout composition · màu icon · asset ảnh (không fake text) · không đè/cắt · density mock · đủ section (footer): {liệt kê FAIL nếu có}
- 1440: PASS|FAIL · 1280: PASS|FAIL · diff images: `plans/reports/_gate-ref/{screen}-*-diff.png`
- Port đã verify: {vd 127.0.0.1:3001}

## B. Behavior (mock data) — phải 100%
- [x]/[ ] từng mục checklist + note

## Verdict: PASS | FAIL
## Nếu FAIL → việc cần fix (file + mô tả), gửi lại fe-developer
```

- **PASS** khi: A đạt pixel-diff ≤ 1% (≥ 99%) ở cả 1440+1280 **VÀ** B đúng 100%. → screen được phép sang integration → test → review. Báo user.
- Lưu ý: B sai 1 mục → **FAIL toàn gate** kể cả A đẹp. A > 1% pixel-diff → FAIL kể cả B đúng.
- **FAIL** → liệt kê cụ thể file + fix cần làm, KHÔNG cho đi tiếp. Loop: fe-developer fix → chạy `/aidd-ui-gate` lại.

---

## Error Recovery

| Tình huống | Xử lý |
|---|---|
| Dev server không chạy (navigate fail / connection refused) | STOP, báo user chạy `npm run dev` rồi gọi lại. KHÔNG tự chấm. |
| Route không render / trắng / crash | BLOCKED — đây là bug FE, gửi lại fe-developer (`/tkm:fix-bug`), không tính là FAIL gate. |
| MoMorph MCP không trả reference image (nhóm A) | Không có reference desktop → **BLOCKED**, không tự chấm visual bằng trí nhớ. Gợi ý chạy `--behavior-only` để ít nhất chấm nhóm B. |
| Ảnh reference và screenshot lệch kích thước (không diff được) | Align: scale screenshot về đúng width reference, crop/pad height; chụp DPR=1. Vẫn không khớp height (fullPage dài hơn artboard) → diff theo phần chồng lấn + ghi rõ trong report. |
| pixelmatch/pngjs chưa cài | `npx pixelmatch`/`npx odiff-bin`; hoặc `npm i -D pixelmatch pngjs` (devDep). Script `scripts/pixel-diff.mjs` tự cài nếu thiếu. |
| Pixel-diff > 1% nhưng do font-AA/subpixel (không phải drift thật) | Tăng mask vùng text động + xác nhận `includeAA:false`. Nếu vẫn cao mà model-visual (3b) thấy khớp → ghi ratio + lý do AA vào report, KHÔNG tự hạ chuẩn; escalate user quyết. |
| Không resolve được `screenId` | Hỏi user (Step 1) — không đoán. |
| Không có mock data ở route (màn trống) | BLOCKED — FE chưa hoàn tất behavior-mock, gửi lại fe-developer. |

## Bài học bắt buộc (đúc từ thực chiến — đọc trước khi chấm)

1. **Ảnh frame là chân lý, không phải token extract.** `list_design_items`/brief từng ghi SAI (card nền tối trong khi Figma nền kem; tier "sao" trong khi Figma "pill chữ"). Chấm theo `get_frame_image`; số chính xác lấy `get_node`. Extract mâu thuẫn ảnh → ảnh thắng. Brief chỉ là gợi ý — **khi xong phải update brief cho đúng**.
2. **Logo/wordmark/artwork = ASSET ẢNH, export ra file thật.** Dùng `get_media_files`/`get_figma_image` → **verify `file` là PNG/SVG thật** (không phải XML "AccessDenied") → lưu `/public` → render `<Image>`. Signed URL hết hạn ~10 phút, tải ngay. **CẤM** dựng lại wordmark bằng `<h1>` text + font fallback (đã sai với "KUDOS").
3. **Mock phải ĐỦ DENSITY như Figma** — "data không đủ sao giống được". Word-cloud ~45–50 tên (không phải 12), card có đủ ảnh gallery, leaderboard đủ 10. Thưa data = FAIL visual.
4. **Chấm CẢ TRANG** — `fullPage:true`, cuộn tới footer. Từng sót hẳn footer + đánh giá thiếu section.
5. **Layout composition** — kiểm nhóm section (full-width vs 2-cột feed+sidebar), không chỉ từng component. Sidebar đặt sai chỗ = FAIL.
6. **Kích thước/tỉ lệ** — box/section cao/rộng đúng tỉ lệ Figma (spotlight từng quá dài).
7. **Không đè/cắt** — dày chữ (word-cloud) phải dùng layout không chồng.
8. **Verdict = bằng screenshot thật, KHÔNG tin report "DONE" của subagent.** Nhiều lần subagent báo xong nhưng vẫn lệch. Chạy gate thật rồi mới kết luận.
9. **Control states theo test-cases** — carousel trang active + arrow disabled ở đầu/cuối; placeholder text CHÍNH XÁC; dropdown active/inactive; hover tooltip. Lấy từ `get_frame_test_cases`.
10. **⚠️ Annotation trên Figma là spec ẨN — brief/MoMorph THIẾU.** Figma canvas hay có NOTE/callout vẽ cạnh artboard (vd *"Highlight chỉ hiện 1 KUDO ở Center, 2 bên để mở"*, `Dropdown Hashtag filter`, `Avatar info user`). MoMorph frame image crop mất → phải xem **Figma trực tiếp** (figma MCP / link / screenshot user gửi). Mỗi NOTE = 1 mục behavior/state cho nhóm B. **Nhưng đừng render nhãn annotation lên UI** — nó là chú thích, không phải nội dung.

## Rules

- Chỉ chấm **1440 (ưu tiên 1) + 1280 (ưu tiên 2)** — cả hai **pixel-perfect ≥ 99%** (pixel-diff ≤ 1%). **BỎ 768/375.**
- **Nguồn design = MoMorph + Figma trực tiếp**, KHÔNG chỉ brief cũ. Xung đột: ảnh Figma > MoMorph extract > brief. Annotation/NOTE trên Figma là spec behavior/state — đưa vào checklist nhóm B.
- Visual pixel-perfect ≥ 99% (chỉ tha AA/subpixel + vùng mask động); behavior KHÔNG nhân nhượng. Cả hai đều là cổng cứng.
- Không có Figma reference cho viewport nhỏ → chỉ chấm responsive-ok, không FAIL vì "khác design".
- Report chỉ ghi vào `plans/reports/`. Không tạo md ngoài `plans/`.
- Gate này KHÔNG chặn code BE — BE build song song vẫn ổn; gate chặn ở integration/test/ship (theo `ui-first-gate.md`).
- **Port:** dev thường ở `localhost:3001` nhưng có thể bị process khác chiếm/`::1` → dùng `127.0.0.1:{port}` hoặc port dev thực tế; ghi port đã dùng vào report.
