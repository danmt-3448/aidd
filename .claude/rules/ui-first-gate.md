# UI-First Gate

> **OVERRIDE — cao hơn `momorph/momorph-development.md`, `primary-workflow.md`, mục Testing của `CLAUDE.md`.**
> Khi có xung đột về **thứ tự** (test-first, hay integration/ship trước khi UI verify), file này thắng.

Thực trạng: UI + behavior FE lỗi nhiều, chưa xét tới BE/API. Nguyên nhân workflow: build UI ∥ BE + wiring + viết test **cùng lúc** → bug UI trôi xuống hạ nguồn, test viết trên UI chưa đúng → phải sửa lại nhiều lần, tốn token.

**Nguyên tắc:** mỗi screen phải **qua UI-First Gate** trước khi được integrate (wire real data), test (e2e/unit), hoặc ship. UI đúng design + behavior đúng với data thật (seeded, authed) là **ưu tiên số 1**.

---

## Gate criteria — screen chỉ PASS khi đủ cả 2 nhóm

**A. Visual fidelity (vs Figma) — PROPERTY-DIFF (SỐ) là CỔNG CỨNG**
- [ ] **Property-diff PASS ở 1440 + 1280** — `getComputedStyle` code khớp `get_node` design cho element gắn `data-fig`: màu **rgba (cả alpha)** · font-weight · font-size · padding/gap (rowGap/columnGap) · w/h · radius · border · section-height (±2px). Đo bằng `scripts/style-assert.mjs` (exit 0=PASS, 1=FAIL localize element/prop, 2=coverage). Màu KHÔNG guess — lấy `get_node`.
- [ ] **Asset/icon**: logo/wordmark/artwork là `<img>/<svg>` thật (không `<h1>`/CSS); icon custom là SVG export, fill khớp node.
- [ ] **Nets @1280**: không overflow ngang / đè-cắt chữ; density (số item) khớp Figma (`get_frame_node_tree`).
- [ ] **Pixel/band-diff = overlay tham khảo** (soi bố cục bằng mắt) — KHÔNG quyết verdict.
- [ ] Không guess visual value — vẫn lấy màu/spacing/size/font từ MoMorph MCP làm mốc (không bịa)
- [ ] **Property-diff chấm 1440 + 1280** — BỎ 768/375.
- [ ] **1920 no-break** — chụp thêm ở 1920, assert KHÔNG vỡ (no overflow ngang, section không zoom/lệch, không đè-cắt chữ). KHÔNG so property-diff ở 1920.

**B. Behavior / logic trên REAL SEEDED DATA (authed session) — BẤT KHẢ NHÂN NHƯỢNG (sai 1 mục = FAIL)**
- [ ] Validation form (client-side) chạy đúng
- [ ] Navigation / redirect đúng luồng
- [ ] **Verify behavior trên data thật** (`npm run db:reset` + seed, authed session via `e2e/.auth/user.json`): screen hiển thị đúng với data thật (full content, đúng mật độ Figma).
- [ ] **Empty / error / loading** (best-effort): verify nếu có thể ép bằng real scenario (vd user thật không có data, forced network error, seeded edge case). Nếu không thể ép mà không có mock → ghi rõ "not verifiable without scenario" — **KHÔNG là hard-fail** miễn là có lý do rõ ràng.
- [ ] Interactive elements hoạt động (click, hover, keyboard nav)
- [ ] Không console error/warning

> **A (visual) = property-diff SỐ khớp `get_node` (cổng cứng) + asset/icon thật + nets. B (behavior) là 100% — không nhân nhượng.** Chỉ khi A `style-assert` exit 0 ở cả 1440+1280 VÀ B đúng hết → screen mới "qua gate". Đo bằng `.claude/skills/aidd-ui-gate/scripts/style-assert.mjs`; pixel/band (`pixel-diff.mjs`) chỉ là overlay tham khảo.

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
6. **BUILD component = enumerate FULL node tree TRƯỚC.** Trước khi code 1 card/component: `get_frame_node_tree` → liệt kê **mọi child element** (vd card: avatar+tên+**dept+tier badge** · **danh-hiệu row+pencil** · content · gallery · **hashtag** · footer heart+copy+xem-chi-tiết) → build + **wire data thật cho TỪNG cái**. property-diff MÙ với element THIẾU HẲN (không tag thì không diff) → element vắng lọt gate. (Bug 2026-08-11: card thiếu tier/dept/danh-hiệu nhiều vòng vì build từ spec một phần, data không nối.)
7. **"Component có" ≠ "data có".** Element render rỗng vì query BE chưa trả field (tier/dept/danh_hieu). Luôn verify 1 lượt trên **data thật** (seeded + authed) — real data phơi ra field chưa wire, không như mock tự set field che lỗ hổng.
8. **Content-HUG mặc định; chỉ FIXED khi node thật sự fixed.** `get_node` height của card RICH (đủ gallery) KHÔNG phải height cứng cho mọi card — card thưa phải hug (thấp hơn). Ép fixed + `justify-between` → giãn rỗng. "Cùng height" thường do **cùng content**, không phải force-stretch.
9. **ĐỪNG hoãn gate.** Sửa UI xong → chạy `/aidd-ui-gate` NGAY, không skip "để sau". Eyeball screenshot KHÔNG thay gate — drift sẽ lọt tới mắt user (đã lặp 5+ vòng).

## Breakpoint policy (BẮT BUỘC — property-diff 1440 + 1280, no-break 1920)

Property-diff (số) chấm ở **1440 (chính) + 1280 (phụ)**. Thêm **1920 chỉ để soi "không vỡ"** (KHÔNG property-diff). **BỎ 768/375.**

| Viewport | Ưu tiên | Yêu cầu |
|---|---|---|
| **1440px** | **1 (chính)** | **CHUẨN desktop — property-diff PASS** (style-assert exit 0, số khớp get_node) |
| **1280px** | **2 (phụ)** | Desktop hẹp — property-diff PASS + KHÔNG overflow ngang / vỡ layout / đè-cắt chữ. |
| **1920px** | **3 (no-break)** | **CHỈ soi "không vỡ" — KHÔNG so property-diff.** Không overflow ngang (`scrollWidth==clientWidth`); section không zoom/giãn méo; content không lệch trục so bố cục 1440; không đè-cắt chữ. Design vẫn chuẩn 1440 (fixed-artboard → **cho phép** dark side-fill / `max-width` center trên màn to). **Vỡ = FAIL.** |
| ~~768 / 375~~ | — | **BỎ** — không chấm ở gate. |

> **Vì sao thêm 1920:** design là artboard **fixed 1440** → mọi màn có rủi ro vỡ ở màn to (artwork `object-cover` zoom, banner full-bleed lệch content đã cap 1440, element `width` cố định > viewport). Gate cũ chỉ 1440/1280 nên lớp lỗi này lọt (đã dính ở board KV banner — feathers tràn sau wordmark, mất tương phản ở >1440). 1920 CHỈ assert "không vỡ", KHÔNG so số — tránh false-FAIL vì Figma không có artboard 1920. Ưu tiên vẫn là 1440.

## Parallel-but-gated (không chặn cứng BE)

BE build song song với UI là **được phép** (không phải nguyên nhân bug UI) và tiết kiệm token hơn so với chặn cứng. Gate chặn ở **cửa integration**, không chặn ở cửa viết code BE:

```
Track A: UI + behavior (real seeded data) ─┐
Track B: BE + contracts               ─┤  ← 2 track CHẠY SONG SONG (không block nhau)
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

- Skill **`/aidd-ui-gate <screen URL|route>`** chạy gate tự động: Playwright chụp **1440 (ưu tiên 1) + 1280 (ưu tiên 2)** với authed session (real seeded data) → diff vs Figma reference (momorph MCP) + walk behavior checklist → xuất report PASS/FAIL vào `plans/reports/`.
- Reviewer role dùng để verify gate: `.claude/roles/code-reviewer.md` (không tạo role mới).
- FE Developer chịu trách nhiệm đưa screen qua gate trước khi handoff (xem `fe-developer.md`).
- BE Developer KHÔNG integrate screen chưa qua gate (xem `be-developer.md`).

### Auto-enforcement bằng hooks (không phụ thuộc model nhớ)

3 hook (đăng ký ở `.claude/settings.json`, script commit theo skill ở `.claude/skills/aidd-ui-gate/scripts/`):
- **`ui-gate-track.cjs`** (PostToolUse Edit|Write|MultiEdit): fire khi **file UI bị sửa VISUAL** (`.tsx/.jsx/.css` dưới `src/`, trừ test) — không phụ thuộc từ khoá prompt. Đánh dấu `uiTouchedAt` + nhắc mạnh.
  - **Chỉ chặn khi thật sự đụng visual** (`isVisualEdit()` trong `lib/ui-gate-state.cjs`, option A 2026-08-11): edit **provably non-visual** — chỉ đổi **text-literal / comment**, KHÔNG có token `className`/`style`, KHÔNG đổi cấu trúc (skeleton bằng nhau) — thì **KHÔNG stamp** (vd đổi label chữ, copy, comment). Vì property-diff đo *style*, không đo *nội dung chữ*.
  - **Vẫn stamp (gate) khi:** đụng `className`/`style`, thay đổi cấu trúc JSX / logic / import, hoặc whole-file `Write` (không diff được → conservative). Nghi ngờ → nghiêng gate.
  - Heuristic có selftest 11 case: `scripts/lib/ui-gate-visual-edit.selftest.cjs`.
- **`ui-gate-mark-run.cjs`** (PreToolUse Skill): khi `/aidd-ui-gate` chạy → đánh dấu `gateRunAt`.
- **`ui-gate-enforcer.cjs`** (Stop): **CHẶN kết thúc turn** nếu `uiTouchedAt > gateRunAt` (đã sửa UI mà chưa chạy gate sau đó). Session không đụng UI → không ảnh hưởng.
- **Escape hatch** (khi gate thật sự không chạy được): `export TKM_SKIP_UI_GATE=1`, hoặc tạo `.claude/hooks/.logs/ui-gate-skip` (bỏ qua 1 lần). State per-session ở `.claude/hooks/.logs/ui-gate-<session>.json`.
- Giới hạn: hook **không tự gọi được skill** (skill do model gọi) — nó chỉ ép bằng cách chặn Stop tới khi model chạy gate. Subagent tự sửa UI (Track A) dùng session riêng → orchestrator vẫn phải chủ động chạy gate.
