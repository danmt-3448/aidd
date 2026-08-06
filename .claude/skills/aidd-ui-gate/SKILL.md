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
**Runtime guard (RT-12):** nếu thiếu `.claude/skills/aidd-ui-gate/scripts/style-assert.mjs` → **BLOCKED** "tooling property-diff chưa cài", KHÔNG rơi về pixel-diff cũ làm cổng. (Chống gate cũ clear nhầm lúc rollout.)

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

### 3. Visual + property gate (nhóm A) — CỔNG CHÍNH = PROPERTY-DIFF (SỐ)

> **Đổi 2026-08-06 (plan `260806-0711`, red-team-hardened):** cổng cứng nhóm A là **property-diff số** (`getComputedStyle` code vs `get_node` design), KHÔNG phải pixel-diff toàn trang. Pixel/band-diff hạ xuống **overlay tham khảo** (không quyết verdict). Lý do: pixel-diff toàn trang mù với sai màu/weight/icon/asset và vỡ vì ref 1512≠1440 + height cascade.

**Tiền đề:** mỗi màn có `plans/reports/_gate-ref/nodemap/{screen}.nodemap.json` map `nodeId ↔ selector ↔ kind` (build gắn `data-fig`/`data-fig-asset`/`data-fig-icon` — xem `.claude/roles/fe-developer.md`). **Không có nodemap / 0 tag → BLOCKED**, KHÔNG chấm bằng mắt.

**3a. Property-diff (CỔNG CỨNG):**
1. **Pin state + font:** `browser_navigate {route}?ui_state=full`, chờ `document.fonts.ready` rồi `document.fonts.check('700 16px Inter')` — false → **dừng, không kết luận** (font chưa load ⇒ mọi weight/size giả). Chụp/eval với `--force-color-profile=srgb` (màu xác định, chống lệch P3/sRGB).
2. **Cross-check tag đúng node** (chống gắn nhầm nodeId): mỗi entry crop bbox node (`get_node.absoluteBoundingBox` trên `get_frame_image`) đặt cạnh `browser_take_screenshot` theo selector → xác nhận **cùng element** rồi mới tính số.
3. **Đọc code — 1 lần `browser_evaluate`** quét mọi selector trong nodemap, trả `getComputedStyle`: `color, backgroundColor, opacity, fontWeight, fontSize, lineHeight, letterSpacing, paddingTop, paddingLeft, rowGap, columnGap, width, height, offsetHeight, borderTopLeftRadius, borderTopWidth+color` + `src`/`iconFill` cho asset/icon. **Dùng `rowGap`/`columnGap`, KHÔNG `gap`** (getComputedStyle trả `""`).
4. **Đọc design:** `get_node(screenId, nodeId)` mỗi entry → fill (rgba), fontWeight, fontSize, padding, w/h, cornerRadius, border, opacity.
5. **So số:** ghép `{key:{kind,code,design}}` → JSON, chạy:
   ```bash
   node .claude/skills/aidd-ui-gate/scripts/style-assert.mjs \
     --map plans/reports/_gate-ref/nodemap/{screen}.map.json \
     --min-elements 5 --screen {screen}
   ```
   Màu so **rgba cả alpha** (opacity cha nhân vào) — KHÔNG drop-to-hex; ±1px size/spacing/line-height; weight tuyệt đối; asset phải `<img>/<svg>/<picture>`; icon fill khớp (null = FAIL, không WARN); `kind:'section'` so `offsetHeight` vs node height ±2px. **Exit 0=PASS · 1=FAIL** (localize element/prop) **· 2=coverage** (map rỗng / thiếu tag / element missing — **KHÔNG PASS câm**).

**3b. Nets phụ (cùng state `?ui_state=full`, trong `browser_evaluate`):**
- **overflow/overlap @1280:** `scrollWidth>clientWidth` = FAIL; bbox 2 item cùng nhóm giao nhau = FAIL (đè/cắt chữ).
- **density:** đếm DOM item vs số con list trong `get_frame_node_tree` — dưới ngưỡng = FAIL "mock thưa"; assert section bắt buộc tồn tại (vd `footer`).

**3c. Pixel/band overlay (OPT-IN — KHÔNG quyết verdict):** soi bố cục tổng bằng mắt. `pixel-diff.mjs [--bands manifest]`, downscale ref 1512→1440 (**không upscale actual**). In ratio/band cho người xem, KHÔNG exit-fail gate.

**Ngưỡng nhóm A:** PASS khi **property-diff (3a) exit 0** ở cả 1440 + 1280 **VÀ** nets (3b) không FAIL. `style-assert` exit 1/2 → FAIL/BLOCKED. Pixel/band (3c) chỉ ghi tham khảo. Report: bảng `key|prop|code|design|verdict` + nets + (tuỳ chọn) overlay ratio.

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

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280
- **`style-assert` verdict: {PASS|FAIL|coverage-error}** · elements={N} (min {N_min}) · checks={M} · failed={K}
- FAIL rows: {key | prop | code | design} — localize element/prop sai
- Nets (3b): overflow/overlap @1280 · density vs get_frame_node_tree · section tồn tại: {FAIL nếu có}
- Overlay tham khảo (3c, KHÔNG quyết verdict): pixel/band ratio {x.xx}% · diff: `plans/reports/_gate-ref/{screen}-*-diff.png`
- Port đã verify: {vd 127.0.0.1:3001} · color-profile=srgb · font.ready=true

## B. Behavior (mock data) — phải 100%
- [x]/[ ] từng mục checklist + note

## Verdict: PASS | FAIL | BLOCKED
## Nếu FAIL → việc cần fix (file + element + prop), gửi lại fe-developer
```

- **PASS** khi: A `style-assert` exit 0 + nets không FAIL ở cả 1440+1280 **VÀ** B đúng 100%. → screen được phép sang integration → test → review. Báo user.
- Lưu ý: B sai 1 mục → **FAIL toàn gate** kể cả A đẹp. A exit 1 (prop sai) → FAIL; exit 2 (coverage/map rỗng/thiếu tag) → **BLOCKED**, KHÔNG PASS câm. Overlay (3c) đẹp KHÔNG cứu được A FAIL.
- **FAIL** → liệt kê cụ thể file + element + prop cần fix, KHÔNG cho đi tiếp. Loop: fe-developer fix → chạy `/aidd-ui-gate` lại.

**Ghi verdict cho hook (RT-4):** cuối Step 5, ghi `lastVerdict` + `lastVerdictAt` vào session state (`.claude/hooks/.logs/ui-gate-<session>.json` qua `lib/ui-gate-state.cjs`). Enforcer chỉ clear khi `lastVerdict==='PASS'` — run BLOCKED/FAIL KHÔNG mở được Stop.

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
