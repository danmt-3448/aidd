---
title: "UI Parity Fix — property-diff gate (số) + band overlay + 11 màn"
description: "Đổi cây thước gate: property-diff (getComputedStyle vs get_node) làm CỔNG CỨNG, band-diff hạ xuống overlay. Ép build gắn data-fig + export asset thật. Rồi fix UI 11 màn theo chuẩn mới."
work_type: feature
spec_waived: "UI-parity FIX + tooling gate trên màn đã build; design source = MoMorph frames + Figma nodes (đã có). Không author spec feature mới."
status: pending
priority: P1
branch: develop
created: 2026-08-06
blockedBy: []
blocks:
  - 260804-1452-ui-parity-fixes
  - 260805-1353-home-ui-parity-check-fix
  - 260805-1117-board-highlight-spotlight-rework
---

# UI Parity Fix — property-diff gate + 11 màn

**Đích:** `/aidd-ui-gate` bắt được đúng lớp lỗi đang lọt — **sai icon / màu icon / màu chữ / font-weight / image dựng-tay / mock thưa** — thứ pixel-diff toàn trang + nhìn mắt bỏ sót. Mọi màn có Figma reference PASS gate mới → được integrate/test/ship.

## Gốc vấn đề (chốt session 2026-08-06)

Cả **build** (momorph-implement-design / fe-developer) lẫn **gate** dựa vào **nguồn xấp xỉ** (ảnh render + mắt) thay vì **data chính xác MoMorph đã có** (`get_node`). Hệ quả: build đoán màu từ ảnh nén, thay icon thật bằng lucide "gần giống", dựng wordmark bằng `<h1>`; gate chỉ có 1 dụng cụ khách quan là pixel-diff toàn trang — mà nó **vỡ** (MoMorph `get_frame_image` trả **1512px** ≠ build 1440; height ref/actual lệch hàng trăm–1178px → neo top-left → cascade → đỏ toàn trang). Hỏng dụng cụ → gate rơi về nhìn mắt, mà mắt **không phân giải** `#E30613` vs `#E4002B`, weight 600 vs 700, lucide vs SVG thật → quét bao lần vẫn không thấy.

**figma MCP KHÔNG dùng được** (danmt seat "View" trên org Sun* → hết quota MCP ngay call nội dung đầu). **MoMorph MCP chạy full, không throttle** — `get_node` (style thật), `get_frame_node_tree`, `list_file_variables`, `get_media_files` đều đọc được → đây là nguồn chân lý cho số.

## Cây thước mới — định nghĩa PASS gate

| Nhóm | Vai | Tiêu chí |
|---|---|---|
| **A. Property-diff (số)** | **CỔNG CỨNG** | `getComputedStyle` code **khớp** `get_node` MoMorph cho từng element trọng yếu: fill hex · font-weight · font-size · padding/gap · w/h · radius · border. Sai 1 prop = FAIL, **localize đúng element/prop**. + asset element phải `<img>/<svg>` (không `<h1>/<div>`) + icon fill/stroke khớp node. |
| **B. Band-diff (ảnh)** | **overlay dev opt-in — KHÔNG quyết verdict** | Soi bố cục/tỉ lệ bằng mắt. Lỗi **tỉ lệ section** đã do property-diff gánh (`kind:'section'` so `offsetHeight` vs node height). Band không exit-fail gate. |
| **C. Behavior mock** | **CỔNG CỨNG 100%** | 4 state `?ui_state=` + interactive + 0 console error (giữ nguyên nhóm B cũ). |
| **Lưới phụ** | phụ trợ | overflow/overlap @1280 · density (DOM count vs `get_frame_node_tree`). font-loaded = **pre-check bắt buộc** trước đo. ~~hex-lint~~ bỏ khỏi gate (nhiễu, → `npm run lint:colors` tuỳ chọn). |

> PASS = **A đúng** **và** **C 100%** (band + nets chỉ phụ trợ). Sai A hoặc C = FAIL kể cả ảnh đẹp. Map rỗng/thiếu tag = **exit2 coverage**, KHÔNG PASS câm.

## Trạng thái xuất phát (từ `plans/reports/ui-gate/`)

| Màn | screenId | Figma node | Artboard | Gate (thước cũ) | Supabase files |
|---|---|---|---|---|---|
| countdown | `8PJQswPZmU` | 2268:35127 | 1512×1077 | PASS 0.39% | 0 |
| login | `GzbNeVGJHz` | 662:14387 | 1440×1024 | PASS 0.44% | — |
| secret-box | `J3-4YFIpMM` | — | modal mobile | PASS | 1 |
| awards | `zFYDgyj_pD` | 313:8436 | 1440×6410 | FAIL 14.96% | 0 |
| kudos | `ihQ26W78P2` | 520:11602 | 1440×1024 | FAIL 15.4% | 7 |
| homepage | `i87tDx10uM` | 2167:9026 | 1512×4480 | FAIL 22.6% | 1 |
| board | `MaZUn5xHXZ` | 2940:13431 | 1440×5862 | FAIL 23.33% (×4) | 10 |
| profile | `3FoIx6ALVb` | 362:5037 | 1440×4660 | FAIL (app 1104px — thiếu data) | 2 |
| rules | `b1Filzi9i6` | 3204:6051 | 1440×1796 | FAIL — modal vs full-page, cần user quyết | 0 |
| notifications (dropdown) | `gWBVcaSVIf` | 589:9152 | — | chưa chấm | 3 |
| notifications (page) | `6-1LRz3vqr` | 589:9132 | — | chưa chấm | 3 |

## Phases

| # | Phase | Track | blockedBy |
|---|---|---|---|
| 01 | [Band-diff mode (overlay lưới phụ)](phase-01-band-diff-tooling.md) | Tooling | — |
| 01B | [Property-diff hard gate + style-assert.mjs](phase-01b-property-diff-gate.md) | Tooling | — |
| 01C | [Build convention: data-fig + export asset thật](phase-01c-build-convention-data-fig.md) | Convention | — |
| 02 | [Mock-fixture infra dùng chung](phase-02-mock-fixture-infra.md) | Infra | — |
| 03 | [/awards — bàn hiệu chỉnh gate mới](phase-03-awards.md) | A | 01, 01B, 01C |
| 04 | [Shared chrome (header/footer/card/tokens)](phase-04-shared-chrome.md) | A | 03 |
| 05 | [/homepage](phase-05-homepage.md) | A | 02, 04 |
| 06 | [/profile](phase-06-profile.md) | A | 02, 04 |
| 07 | [/board](phase-07-board.md) | A | 02, 04 |
| 08 | [/kudos](phase-08-kudos.md) | A | 02, 07 |
| 09 | [/rules + /notifications — gỡ chặn](phase-09-rules-notifications.md) | A | 02, quyết định user |
| 10 | [Re-gate toàn bộ + đóng](phase-10-final-sweep.md) | Verify | 03–09 |

**Song song:** 01 ∥ 01B ∥ 01C ∥ 02 (khác file — xem ownership dưới). Sau 04: 05 ∥ 06 ∥ 07 ∥ 09. 08 sau 07.

**File ownership (tránh đụng nhau):**
- 01 sở hữu `pixel-diff.mjs` (thêm band mode). Nội dung band-mode cho SKILL.md giao dạng patch cho 01B ghép.
- **01B là chủ `SKILL.md`** (viết lại trọn Step 3 + verdict) + tạo `style-assert.mjs` mới + `ui-first-gate.md` + `CLAUDE.md`.
- 01C chỉ sửa `fe-developer.md` (+ ghi chú momorph-implement-design là global, không sửa được cho team).
→ 01B chạy sau/ghép cùng 01 ở phần SKILL.md; các file còn lại rời nhau, chạy song song thật.

## Chuẩn mới áp cho MỌI per-screen phase (03–09) — addendum

Các phase 03–09 giữ nguyên mục tiêu, **thêm** acceptance chung (khỏi sửa 8 file phase):
1. **Gắn `data-fig="{nodeId}"`** vào **~5–8 element rủi ro cao** (root/section-height, text chính, card, CTA) + `data-fig-asset` cho logo/wordmark + `data-fig-icon`+`data-fig-icon-exported` cho icon custom — nodemap per-screen ở phase-01B (cap để không phình chi phí get_node).
2. **Property-diff PASS** (phase-01B) cho các element đã gắn `data-fig` — số khớp `get_node` trong tolerance.
3. **Asset/icon**: logo/wordmark render `<Image>` từ file `get_media_files` (không `<h1>`/CSS); icon Figma custom dùng SVG export thật; fill/stroke khớp node.
4. Band-diff (phase-01) + behavior mock (phase-02) như cũ.

## Ràng buộc

- **Không guess visual value** — số lấy MoMorph `get_node`/`query_component`. Vi phạm = FAIL gate (`.claude/rules/ui-first-gate.md`).
- **figma MCP hết quota (seat View)** → annotation ngoài artboard phải nhờ user gửi ảnh. Xem `## Rủi ro` từng phase + clarifications.
- Giữ 3 hook enforcement (track/mark-run/enforcer) nguyên trạng — vẫn fire khi sửa UI.
- Gate chỉ chấm **1440 + 1280**. `pixel-diff.mjs` KHÔNG xoá — repurpose thành overlay.
- Đây là thay đổi **tooling/skill + convention**, không phải code feature sản phẩm (trừ `data-fig` attribute thuần-data thêm vào màn).
- Không đụng BE/queries/schema. Edit tại chỗ; file >200 dòng thì tách; `tsc --noEmit` sau mỗi file code.

## Red Team Review

### Session — 2026-08-06
**Findings:** 25 raised → 13 nhóm accepted (dedup, đều có `file:line`), 0 reject. **Severity:** 5 Critical · 5 High · 3 Medium.
3 reviewer: Assumption Destroyer · Failure Mode Analyst · Scope & Complexity Critic.

| # | Finding | Sev | Disposition | Applied |
|---|---|---|---|---|
| 1 | Map rỗng/thiếu tag → PASS câm (3 reviewer) | Crit | Accept | 01B: `--min-elements`+`missing`→exit2 |
| 2 | Model tự ghép JSON → verdict phi-xác định | Crit | Accept | 01B: nodemap committed per-screen |
| 3 | `data-fig` gắn sai nodeId → so nhầm | Crit | Accept | 01B: cross-check bbox crop vs element |
| 4 | Enforcer clear khi *gọi* skill, không phải *PASS* (`ui-gate-mark-run.cjs:17`) | Crit | Accept | 01B: hook verdict-aware (`lastVerdict==='PASS'`) |
| 5 | rgba drop-alpha→hex → sai 2 chiều | Crit | Accept | 01B: so rgba cả alpha |
| 6 | Color profile P3/sRGB phi-xác định | High | Accept | 01B: `--force-color-profile=srgb` |
| 7 | Opacity/blend cha ≠ raw fill | High | Accept | 01B: công thức composite + fixture |
| 8 | `getComputedStyle.gap` = `""` | High | Accept | 01B: đọc `rowGap`/`columnGap` |
| 9 | font/skeleton làm hỏng số | High | Accept | 01B: fonts.ready pre-check + pin `?ui_state=full` |
| 10 | Icon `<img src=svg>`→fill null; lucide chỉ WARN | High | Accept | 01B FAIL không WARN + 01C `-exported` attest |
| 11 | Band-manifest nặng, R2 làm blocker | High | Accept | section-height vào property-diff; band = overlay opt-in |
| 12 | 01B rewrite 3 doc trước khi script chạy | Med | Accept | 01B: script+self-test+e2e TRƯỚC, doc SAU + runtime guard |
| 13 | Plan hygiene (blockedBy 02; kudos hack; plan cũ) | Med | Accept | +02 vào 05/09; kudos dùng dev-wrapper (phase-02); 3 plan cũ → đánh `superseded` khi đóng plan này |

**Consistency sweep:** band-diff đồng bộ hạ vai ở plan.md + phase-01 + phase-01b (không còn exit-fail gate). hex-lint gỡ khỏi cả cây thước + phase-01b nets. Chưa có mâu thuẫn tồn đọng. **Còn treo:** ✅ hết — `/rules` = MODAL (chốt 2026-08-06) · annotation awards/homepage đã thu thập đủ. Mọi phase 01–10 sẵn sàng forge.
