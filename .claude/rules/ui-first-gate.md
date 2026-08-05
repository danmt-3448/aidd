# UI-First Gate

> **OVERRIDE — cao hơn `momorph/momorph-development.md`, `primary-workflow.md`, mục Testing của `CLAUDE.md`.**
> Khi có xung đột về **thứ tự** (test-first, hay integration/ship trước khi UI verify), file này thắng.

Thực trạng: UI + behavior FE lỗi nhiều, chưa xét tới BE/API. Nguyên nhân workflow: build UI ∥ BE + wiring + viết test **cùng lúc** → bug UI trôi xuống hạ nguồn, test viết trên UI chưa đúng → phải sửa lại nhiều lần, tốn token.

**Nguyên tắc:** mỗi screen phải **qua UI-First Gate** trước khi được integrate (wire real data), test (e2e/unit), hoặc ship. UI đúng design + behavior đúng với mock data là **ưu tiên số 1**.

---

## Gate criteria — screen chỉ PASS khi đủ cả 2 nhóm

**A. Visual fidelity (vs Figma) — "đủ giống ~95%", KHÔNG bắt pixel-perfect**
- [ ] **1440px giống Figma ~95%** — đúng layout/cấu trúc, đúng màu, đúng font, element đủ & đúng vị trí. Lệch nhỏ vài px spacing / sắc độ màu **chấp nhận được**.
- [ ] Không guess visual value — vẫn lấy màu/spacing/size/font từ MoMorph MCP làm mốc (không bịa)
- [ ] Responsive **768 / 375** render đúng, không overflow/vỡ layout (adapt hợp lý)

**B. Behavior / logic với MOCK DATA — BẤT KHẢ NHÂN NHƯỢNG (sai 1 mục = FAIL)**
- [ ] Validation form (client-side) chạy đúng
- [ ] Navigation / redirect đúng luồng
- [ ] **4 state qua `?ui_state=`**: `full` / `empty` / `error` / `loading` đều render đúng (xem convention dưới)
- [ ] Interactive elements hoạt động (click, hover, keyboard nav)
- [ ] Không console error/warning

> **A (visual) là ~95% — nhân nhượng lệch nhỏ. B (behavior) là 100% — không nhân nhượng.** Chỉ khi A đạt ~95% VÀ B đúng hết → screen mới "qua gate".

### Mock fixtures convention (để gate ép được state — deterministic)

Không dùng skill riêng — chỉ 1 quy ước file + 1 query param:
- Mỗi màn: `src/features/{feature}/mocks/{screen}.mock.ts` export `mockFull` / `mockEmpty` / `mockError`. Content `mockFull` lấy từ Figma, không bịa.
- Mock hook đọc **`?ui_state=full|empty|error|loading`** (chỉ khi `NODE_ENV !== 'production'`, mặc định `full`) → trả fixture tương ứng (`loading` = giả delay).
- Gate navigate route với từng `?ui_state=` → chấm từng state. Không có toggle → empty/error không kiểm được ⇒ FE chưa hoàn tất nhóm B ⇒ FAIL.

### Mock phải đủ DENSITY như Figma (BẮT BUỘC)
"Data không đủ sao giống được." `mockFull` phải tái tạo **đúng mật độ/nội dung** design, không chỉ vài item mẫu: list dày như Figma (vd word-cloud ~45–50 tên), card có đủ ảnh gallery, bảng đủ số dòng. Content lấy từ Figma (get_frame_image + node), không bịa. Thưa data → gate FAIL visual (nhìn không giống).

## Nguyên tắc chấm & build UI (đúc kết thực chiến — áp cho `momorph-implement-design` + `aidd-ui-gate`)

1. **Ảnh frame Figma là CHÂN LÝ**, không phải token extract. `list_design_items`/brief có thể SAI (đã sai card bg, tier style) — khi mâu thuẫn ảnh render thì **ảnh thắng**; số chính xác lấy `get_node`/`query_component`. Brief là gợi ý, sai thì **sửa lại brief sau khi hoàn thành**.
   - **⚠️ Đối chiếu CẢ MoMorph LẪN Figma trực tiếp — KHÔNG chỉ brief cũ.** MoMorph frame image crop mất **annotation/NOTE/callout** vẽ ngoài viền artboard (Figma canvas rộng hơn frame): spec behavior kiểu *"Highlight chỉ hiện 1 KUDO ở Center, 2 bên để mở"*, nhãn state `Dropdown Hashtag filter`, `Avatar info user`, tooltip, ghi chú luồng. Xem Figma trực tiếp (figma MCP / link / screenshot user gửi). Figma có mà MoMorph không có → **Figma thắng**, mỗi NOTE thành 1 mục behavior/state phải build + đưa vào checklist gate. Annotation là **chú thích để hiểu**, KHÔNG render nhãn đó lên UI.
2. **Logo/wordmark/artwork = asset ẢNH** → export file thật (`get_media_files`/`get_figma_image`), verify là PNG/SVG thật (không phải XML AccessDenied), render `<Image>`. **CẤM** dựng lại bằng text/CSS/font.
3. **Layout composition** phải khớp: section nào full-width, section nào chia 2-cột (feed+sidebar) — nhóm sai = sai.
4. **Kích thước/tỉ lệ** element theo Figma; **không đè/cắt** chữ; chấm **cả trang tới footer**.
5. **Verdict bằng screenshot thật** (fullPage), không tin report "DONE" của subagent.

## Breakpoint policy (BẮT BUỘC — thay thế policy cũ 1280)

| Viewport | Yêu cầu |
|---|---|
| **1440px** | **CHUẨN desktop — giống Figma ~95%** (target visual; lệch nhỏ px/sắc độ OK, KHÔNG bắt pixel-perfect) |
| ~~1280px~~ | **BỎ** — không còn là checkpoint bắt buộc |
| 768px | Responsive adapt (tablet) — render đúng, không pixel-perfect |
| 375px | Responsive adapt (mobile) — render đúng, không pixel-perfect |

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

- Skill **`/aidd-ui-gate <screen URL|route>`** chạy gate tự động: Playwright chụp 1440/768/375 → diff vs Figma reference (momorph MCP) + walk checklist behavior mock → xuất report PASS/FAIL vào `plans/reports/`.
- Reviewer role dùng để verify gate: `.claude/roles/code-reviewer.md` (không tạo role mới).
- FE Developer chịu trách nhiệm đưa screen qua gate trước khi handoff (xem `fe-developer.md`).
- BE Developer KHÔNG integrate screen chưa qua gate (xem `be-developer.md`).
