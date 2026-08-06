# UI-First Gate

> **OVERRIDE — cao hơn `momorph/momorph-development.md`, `primary-workflow.md`, mục Testing của `CLAUDE.md`.**
> Khi có xung đột về **thứ tự** (test-first, hay integration/ship trước khi UI verify), file này thắng.

Thực trạng: UI + behavior FE lỗi nhiều, chưa xét tới BE/API. Nguyên nhân workflow: build UI ∥ BE + wiring + viết test **cùng lúc** → bug UI trôi xuống hạ nguồn, test viết trên UI chưa đúng → phải sửa lại nhiều lần, tốn token.

**Nguyên tắc:** mỗi screen phải **qua UI-First Gate** trước khi được integrate (wire real data), test (e2e/unit), hoặc ship. UI đúng design + behavior đúng với mock data là **ưu tiên số 1**.

---

## Gate criteria — screen chỉ PASS khi đủ cả 2 nhóm

**A. Visual fidelity (vs Figma) — PROPERTY-DIFF (SỐ) là CỔNG CỨNG**
- [ ] **Property-diff PASS ở 1440 + 1280** — `getComputedStyle` code khớp `get_node` design cho element gắn `data-fig`: màu **rgba (cả alpha)** · font-weight · font-size · padding/gap (rowGap/columnGap) · w/h · radius · border · section-height (±2px). Đo bằng `scripts/style-assert.mjs` (exit 0=PASS, 1=FAIL localize element/prop, 2=coverage). Màu KHÔNG guess — lấy `get_node`.
- [ ] **Asset/icon**: logo/wordmark/artwork là `<img>/<svg>` thật (không `<h1>`/CSS); icon custom là SVG export, fill khớp node.
- [ ] **Nets @1280**: không overflow ngang / đè-cắt chữ; density (số item) khớp Figma (`get_frame_node_tree`).
- [ ] **Pixel/band-diff = overlay tham khảo** (soi bố cục bằng mắt) — KHÔNG quyết verdict.
- [ ] Không guess visual value — vẫn lấy màu/spacing/size/font từ MoMorph MCP làm mốc (không bịa)
- [ ] **Chỉ chấm 1440 + 1280** — BỎ 768/375.

**B. Behavior / logic với MOCK DATA — BẤT KHẢ NHÂN NHƯỢNG (sai 1 mục = FAIL)**
- [ ] Validation form (client-side) chạy đúng
- [ ] Navigation / redirect đúng luồng
- [ ] **4 state qua `?ui_state=`**: `full` / `empty` / `error` / `loading` đều render đúng (xem convention dưới)
- [ ] Interactive elements hoạt động (click, hover, keyboard nav)
- [ ] Không console error/warning

> **A (visual) = property-diff SỐ khớp `get_node` (cổng cứng) + asset/icon thật + nets. B (behavior) là 100% — không nhân nhượng.** Chỉ khi A `style-assert` exit 0 ở cả 1440+1280 VÀ B đúng hết → screen mới "qua gate". Đo bằng `.claude/skills/aidd-ui-gate/scripts/style-assert.mjs`; pixel/band (`pixel-diff.mjs`) chỉ là overlay tham khảo.

### Mock fixtures convention (để gate ép được state — deterministic)

Không dùng skill riêng — chỉ 1 quy ước file + 1 query param:
- Mỗi màn: `src/features/{feature}/mocks/{screen}.mock.ts` export `mockFull` / `mockEmpty` / `mockError`. Content `mockFull` lấy từ Figma, không bịa.
- Mock hook đọc **`?ui_state=full|empty|error|loading`** (chỉ khi `NODE_ENV !== 'production'`, mặc định `full`) → trả fixture tương ứng (`loading` = giả delay).
- Gate navigate route với từng `?ui_state=` → chấm từng state. Không có toggle → empty/error không kiểm được ⇒ FE chưa hoàn tất nhóm B ⇒ FAIL.

### Mock phải đủ DENSITY như Figma (BẮT BUỘC)
"Data không đủ sao giống được." `mockFull` phải tái tạo **đúng mật độ/nội dung** design, không chỉ vài item mẫu: list dày như Figma (vd word-cloud ~45–50 tên), card có đủ ảnh gallery, bảng đủ số dòng. Content lấy từ Figma (get_frame_image + node), không bịa. Thưa data → gate FAIL visual (nhìn không giống).

## ⛔ CẤM TỰ CHẾ VISUAL VALUE (BẮT BUỘC — áp cho cả agent lẫn subagent)

**MỌI giá trị visual phải lấy từ Figma/MoMorph MCP — TUYỆT ĐỐI không tự nghĩ/ước lượng.**
- Áp cho: màu (hex/rgba), spacing/padding/gap, size (w/h/font-size), **font-weight**, radius, **box-shadow / text-shadow**, **gradient**, opacity, border, **icon** (fill/stroke/loại icon), z-index layout.
- Nguồn hợp lệ: `mcp__figma__get_design_context` / `get_node` / `query_component` / `get_screenshot`, hoặc ảnh Figma user gửi. Icon/asset ảnh → **export file thật** (`get_media_files`), KHÔNG thay bằng icon "tương đương" tự chọn (vd lucide) trừ khi Figma đúng là icon phổ thông đó.
- **Figma không có giá trị** cho một hiệu ứng (vd shadow) → **HỎI user hoặc lấy từ node/style gần nhất**, KHÔNG bịa con số.
- Subagent prompt **BẮT BUỘC** nhắc lại điều này. Vi phạm (dùng giá trị không truy được về Figma) = **FAIL gate**, phải sửa lại theo node thật.
- Khi build xong: mỗi giá trị visual phải trả lời được "lấy từ Figma node nào?". Không trả lời được = tự chế = sai.

## Nguyên tắc chấm & build UI (đúc kết thực chiến — áp cho `momorph-implement-design` + `aidd-ui-gate`)

1. **Ảnh frame Figma là CHÂN LÝ**, không phải token extract. `list_design_items`/brief có thể SAI (đã sai card bg, tier style) — khi mâu thuẫn ảnh render thì **ảnh thắng**; số chính xác lấy `get_node`/`query_component`. Brief là gợi ý, sai thì **sửa lại brief sau khi hoàn thành**.
   - **⚠️ Đối chiếu CẢ MoMorph LẪN Figma trực tiếp — KHÔNG chỉ brief cũ.** MoMorph frame image crop mất **annotation/NOTE/callout** vẽ ngoài viền artboard (Figma canvas rộng hơn frame): spec behavior kiểu *"Highlight chỉ hiện 1 KUDO ở Center, 2 bên để mở"*, nhãn state `Dropdown Hashtag filter`, `Avatar info user`, tooltip, ghi chú luồng. Xem Figma trực tiếp (figma MCP / link / screenshot user gửi). Figma có mà MoMorph không có → **Figma thắng**, mỗi NOTE thành 1 mục behavior/state phải build + đưa vào checklist gate. Annotation là **chú thích để hiểu**, KHÔNG render nhãn đó lên UI.
2. **Logo/wordmark/artwork = asset ẢNH** → export file thật (`get_media_files`/`get_figma_image`), verify là PNG/SVG thật (không phải XML AccessDenied), render `<Image>`. **CẤM** dựng lại bằng text/CSS/font.
3. **Layout composition** phải khớp: section nào full-width, section nào chia 2-cột (feed+sidebar) — nhóm sai = sai.
4. **Kích thước/tỉ lệ** element theo Figma; **không đè/cắt** chữ; chấm **cả trang tới footer**.
5. **Verdict bằng screenshot thật** (fullPage), không tin report "DONE" của subagent.

## Breakpoint policy (BẮT BUỘC — chỉ chấm desktop 1440 + 1280)

Chỉ chấm 2 viewport desktop, theo thứ tự ưu tiên. **BỎ 768/375** (không còn là checkpoint gate).

| Viewport | Ưu tiên | Yêu cầu |
|---|---|---|
| **1440px** | **1 (chính)** | **CHUẨN desktop — property-diff PASS** (style-assert exit 0, số khớp get_node) |
| **1280px** | **2 (phụ)** | Desktop hẹp — property-diff PASS + KHÔNG overflow ngang / vỡ layout / đè-cắt chữ. |
| ~~768 / 375~~ | — | **BỎ** — không chấm ở gate. |

## Parallel-but-gated (không chặn cứng BE)

BE build song song với UI là **được phép** (không phải nguyên nhân bug UI) và tiết kiệm token hơn so với chặn cứng. Gate chặn ở **cửa integration**, không chặn ở cửa viết code BE:

```
Track A: UI + behavior (mock data)  ─┐
Track B: BE + mock contracts        ─┤  ← 2 track CHẠY SONG SONG (không block nhau)
                                      │
                    ┌─────────── UI-First Gate ───────────┐
                    │  /aidd-ui-gate → PASS?               │  ← chốt chặn Ở ĐÂY
                    └──────────────────┬──────────────────┘
                                    PASS
                                       ↓
        Integration (wire real BE) → Test (e2e/unit) → Review → Ship
```

**Chưa PASS gate thì CẤM:**
- ❌ Wire real BE data vào UI (integration)
- ❌ Viết e2e / unit test cho screen đó
- ❌ Ship / merge

**Sau khi PASS gate:** integrate BE (BE đã build sẵn — chỉ wire + quét lại, không làm lại từ đầu) → mới viết test → review.

## Test-after (KHÔNG test-first cho tới khi qua gate)

`primary-workflow.md` Step 2 và mục Testing của `CLAUDE.md` yêu cầu TDD (test viết trước). **Với screen chưa qua gate, KHÔNG viết e2e/unit test** — vì UI/logic còn thay đổi, test sẽ phải viết lại.
- Test cases từ MoMorph vẫn được **generate làm checklist behavior** cho gate (mục B) — nhưng **chưa viết code test**.
- Viết e2e/unit **chỉ sau** khi screen qua gate + integrate xong.

## Enforcement

- Skill **`/aidd-ui-gate <screen URL|route>`** chạy gate tự động: Playwright chụp **1440 (ưu tiên 1) + 1280 (ưu tiên 2)** → diff vs Figma reference (momorph MCP) + walk checklist behavior mock → xuất report PASS/FAIL vào `plans/reports/`.
- Reviewer role dùng để verify gate: `.claude/roles/code-reviewer.md` (không tạo role mới).
- FE Developer chịu trách nhiệm đưa screen qua gate trước khi handoff (xem `fe-developer.md`).
- BE Developer KHÔNG integrate screen chưa qua gate (xem `be-developer.md`).

### Auto-enforcement bằng hooks (không phụ thuộc model nhớ)

3 hook (đăng ký ở `.claude/settings.json`, script commit theo skill ở `.claude/skills/aidd-ui-gate/scripts/`):
- **`ui-gate-track.cjs`** (PostToolUse Edit|Write|MultiEdit): fire khi **file UI thật bị sửa** (`.tsx/.jsx/.css` dưới `src/`, trừ test) — không phụ thuộc từ khoá prompt. Đánh dấu `uiTouchedAt` + nhắc mạnh.
- **`ui-gate-mark-run.cjs`** (PreToolUse Skill): khi `/aidd-ui-gate` chạy → đánh dấu `gateRunAt`.
- **`ui-gate-enforcer.cjs`** (Stop): **CHẶN kết thúc turn** nếu `uiTouchedAt > gateRunAt` (đã sửa UI mà chưa chạy gate sau đó). Session không đụng UI → không ảnh hưởng.
- **Escape hatch** (khi gate thật sự không chạy được): `export TKM_SKIP_UI_GATE=1`, hoặc tạo `.claude/hooks/.logs/ui-gate-skip` (bỏ qua 1 lần). State per-session ở `.claude/hooks/.logs/ui-gate-<session>.json`.
- Giới hạn: hook **không tự gọi được skill** (skill do model gọi) — nó chỉ ép bằng cách chặn Stop tới khi model chạy gate. Subagent tự sửa UI (Track A) dùng session riêng → orchestrator vẫn phải chủ động chạy gate.
