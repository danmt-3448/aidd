# Phase 01B — Property-diff hard gate + `style-assert.mjs`

**Track:** Tooling · **Priority:** CRITICAL (cổng cứng mới của gate) · **Status:** pending · **blockedBy:** — (∥ 01/01C/02; chủ `SKILL.md`)

> **Red-team fixes áp 2026-08-06** — xem `## Red Team Review` trong `plan.md`. Các điểm chống false-PASS + xử màu/compositing/font/icon nằm ngay trong Thiết kế + Steps dưới.

## Vì sao

Pixel-diff/band-diff so **ảnh** → mù với `#E30613` vs `#E4002B`, weight 600 vs 700, lucide vs SVG thật, wordmark `<h1>` vs `<img>`. Phải so **số**. MoMorph `get_node` có số chính xác, không rate-limit → dựng cổng cứng bằng đối chiếu số.

## Thiết kế

### Thứ tự build (fix RT-12: script chạy được TRƯỚC, rewrite doc SAU)

1. Viết `style-assert.mjs` + self-test (Steps 1–2).
2. Nghiệm thu e2e trên `/countdown` (Step 5) — script ra verdict per-prop có nghĩa.
3. **Chỉ khi script xanh** → rewrite SKILL.md / ui-first-gate.md / CLAUDE.md (Steps 3–4).
→ Tránh gate cũ (pixel-diff) clear nhầm màn khi doc chưa cập nhật.

### Node-map committed per màn (fix RT-2: bớt model ghép tay)

Mỗi màn 1 file `plans/reports/_gate-ref/nodemap/{screen}.nodemap.json`:
```json
{ "2167:9091": { "selector": "[data-fig='2167:9091']", "kind": "style" },
  "313:8459":  { "selector": "[data-fig-asset='kudos-wordmark']", "kind": "asset" } }
```
- `nodeId` ↔ `selector` cố định, review được, không phụ thuộc trí nhớ model.
- Gate: với mỗi entry → `get_node(screenId,nodeId)` lấy **design**, `browser_evaluate(selector)` lấy **code** → `style-assert.mjs` so. Model chỉ điền giá trị vào khung có sẵn, không tự nghĩ ra cặp.

### Cross-check tag đúng node (fix RT-3)

Trước khi tin `data-fig`: crop bbox của node (`get_node` → absoluteBoundingBox) từ `get_frame_image`, đặt cạnh screenshot element (`browser_take_screenshot` theo selector). Người/model xác nhận **cùng element** rồi mới tính số. 1 get_node + 1 crop/element — rẻ, chặn "gắn nhầm node → verdict coincidental".

### Đọc code value (fix RT-8 gap, RT-9 font+state)

- **Pin state:** navigate `{route}?ui_state=full` **trước** khi đo (không đo trên skeleton `loading`/empty).
- **Font trước:** `await document.fonts.ready` + `document.fonts.check('700 16px Inter')` = true. False → **dừng, không kết luận weight** (không phải "net" chạy sau).
- `browser_evaluate` quét mọi selector trong nodemap:
  ```js
  () => MAP.map(({sel,key,kind}) => { const el=document.querySelector(sel); if(!el) return {key,missing:true};
    const s=getComputedStyle(el); const p = kind==='icon'? el.querySelector('path,svg'):null;
    return { key, kind, tag: el.tagName,
      color:s.color, bg:s.backgroundColor, opacity:s.opacity,
      fontWeight:s.fontWeight, fontSize:s.fontSize,
      paddingTop:s.paddingTop, paddingLeft:s.paddingLeft, rowGap:s.rowGap, columnGap:s.columnGap,
      width:s.width, height:s.height, offsetHeight:el.offsetHeight,
      borderRadius:s.borderTopLeftRadius, borderTop:s.borderTopWidth+' '+s.borderTopColor,
      src: el.getAttribute('src'), iconFill: p? (p.getAttribute('fill')||getComputedStyle(p).fill):null }; })
  ```
  `gap` → đọc `rowGap`/`columnGap` riêng (fix RT-8: `s.gap` trả `""`).

### `style-assert.mjs` — so số deterministic

- Input: `--map <json>` (`{key:{kind,code,design}}`), `--min-elements N`, `--screen`.
- **Empty/thiếu (fix RT-1):** `Object.keys(map).length < N` **hoặc** có entry `missing:true` → **exit 2** "coverage insufficient / element not found" (KHÔNG exit 0). Map rỗng KHÔNG bao giờ là PASS.
- **Màu (fix RT-5 rgba, RT-6 profile, RT-7 opacity):**
  - Chuẩn hoá cả 2 phía về `rgba(r,g,b,a)` số nguyên + a 2 chữ số — **so cả alpha**, KHÔNG drop-to-hex.
  - Playwright chụp/eval với `--force-color-profile=srgb` (ghi trong SKILL) → hex round-trip xác định.
  - Nếu node/parent có `opacity<1`: effective = fill.a × Π(opacity cha). Công thức ghi trong SKILL + có fixture self-test; so `effective` vs computed. KHÔNG so raw fill khi có opacity cha.
- **Số:** px→number; size/spacing/radius **±1px**; fontWeight name→number, **khớp tuyệt đối**.
- **Section height (fix RT-11, hút vai của band):** entry `kind:'section'` → so `offsetHeight` vs node height, `|Δ|≤2px`. Property-diff gánh luôn lỗi tỉ lệ section → band-manifest KHÔNG còn là verdict cứng.
- **Asset:** `kind:'asset'` → `tag∈{IMG,SVG,PICTURE}` + `src` không rỗng; `tag∈{H1..P,DIV,SPAN}` = FAIL "asset dựng bằng text".
- **Icon (fix RT-10):** `kind:'icon'` → nếu `<img src=*.svg>` thì đọc file SVG (`src`) parse `fill/stroke` so node; nếu inline `<svg>` thì so `iconFill`; **thiếu asset export thật / không truy được fill = FAIL** (không WARN). Xem thêm attestation ở phase-01C.
- Output: bảng `key|prop|code|design|verdict` + JSON + exit 0 (mọi prop PASS) / 1 (FAIL) / 2 (input/coverage lỗi).

### Enforcer đọc verdict thật (fix RT-4)

Hook hiện clear khi *gọi* skill (`ui-gate-mark-run.cjs:17` stamp `gateRunAt` ở PreToolUse) → run BLOCKED vẫn qua Stop. Sửa:
- SKILL Step 5 ghi `lastVerdict: PASS|FAIL|BLOCKED` + `lastVerdictAt` vào state (`lib/ui-gate-state.cjs`).
- `ui-gate-mark-run.cjs` → chỉ stamp `gateAttemptAt` (không đủ để clear).
- `ui-gate-enforcer.cjs` → clear khi `lastVerdict==='PASS' && lastVerdictAt>=uiTouchedAt`. (Ghi đè ràng buộc "giữ hook as-is" — cần thiết để hook không bị lừa.)

### Lưới phụ (đã tỉa — fix RT-2 scope, RT-5)

- **overflow/overlap @1280** (giữ): `scrollWidth>clientWidth` = FAIL; bbox giao nhau item cùng nhóm = FAIL.
- **density** (giữ, dedupe với phase-02): số DOM item vs `get_frame_node_tree` — dưới ngưỡng = FAIL "mock thưa". (Nếu phase-02 fixture đã đảm bảo density thì đây chỉ xác nhận.)
- **hardcoded-hex lint: BỎ khỏi gate** (333 match nhiễu, property-diff đã bắt outcome). Chuyển thành `npm run lint:colors` tuỳ chọn, không chạy trong gate.
- **font-loaded:** đã thành **pre-check bắt buộc** ở trên, không còn là "net".

## Files

**Tạo:** `.claude/skills/aidd-ui-gate/scripts/style-assert.mjs` (plain node ESM, không deps) · `plans/reports/_gate-ref/nodemap/` (per-screen node-map).

**Sửa (01B là chủ, LÀM SAU khi script xanh):**
- `SKILL.md` — viết lại Step 3: **3-property (A, cổng cứng)** = pin `?ui_state=full` + fonts.ready + nodemap → get_node ↔ getComputedStyle → `style-assert.mjs` (kèm section-height, asset, icon, `--force-color-profile=srgb`); **3-band (overlay, opt-in)** ghép patch phase-01; **3-nets** = overflow/overlap + density. Step 5 verdict: PASS = A đúng + C 100% (band/nets phụ trợ). **Step 1 runtime guard:** thiếu `style-assert.mjs` → BLOCKED.
- `ui-first-gate.md` — criteria A = property-diff số (cổng cứng), band = overlay opt-in.
- `CLAUDE.md` — sửa dòng "pixel-perfect ≥99% / pixel-diff ≤1%" → "property-diff số khớp get_node (cổng cứng)".
- `lib/ui-gate-state.cjs` + `ui-gate-mark-run.cjs` + `ui-gate-enforcer.cjs` — verdict-aware (RT-4).

## Steps

1. Viết `style-assert.mjs`: parse map + `--min-elements`; normalize rgba(cả alpha)/px/weight; opacity-composite; section-height; asset/icon; exit code. `--help`.
2. **Self-test (fix RT-1/5/7):** fixture ≥5 case — sai màu opaque · sai rgba-alpha · sai weight · asset là `<div>` · **element có parent opacity 0.65 × fill trắng** (bắt lỗi composite) · map rỗng→exit2. Assert cờ đúng từng case + localize key/prop.
3. Viết lại SKILL.md Step 1/3/5 (ghép band-patch từ 01). Bảng verdict mẫu.
4. Sửa `ui-first-gate.md` + `CLAUDE.md` (`grep -n "pixel-diff ≤ 1\|pixel-perfect ≥ 99"`), + 3 hook verdict-aware.
5. **E2e trên `/countdown`:** nodemap nhỏ + `--force-color-profile=srgb` → chạy trọn get_node→evaluate→style-assert → verdict per-prop. Đổi 1 màu trong code → FAIL đúng element. Gỡ 1 tag → exit2 coverage (không PASS câm).

## Success criteria

- [ ] Self-test bắt đúng: sai-màu opaque, sai rgba-**alpha**, sai-weight, asset-là-text, **composite parent-opacity**, map-rỗng→exit2
- [ ] Màu so `rgba` cả alpha (không drop); Playwright `--force-color-profile=srgb` ghi trong SKILL
- [ ] `rowGap`/`columnGap` (không `gap`); section-height `|Δ|≤2px` thay band khỏi verdict
- [ ] Icon `<img src=svg>` không parse được fill = FAIL (không WARN); asset `<h1>`=FAIL
- [ ] `--min-elements N` + entry `missing` → exit2; map rỗng KHÔNG PASS
- [ ] font `document.fonts.ready` chạy TRƯỚC đo; đo trên `?ui_state=full`
- [ ] Enforcer clear chỉ khi `lastVerdict==='PASS'` (run BLOCKED không lừa được Stop)
- [ ] SKILL Step 1 BLOCK nếu thiếu `style-assert.mjs`
- [ ] Đổi 1 màu 1 màn thật → FAIL đúng element (không "đỏ toàn trang")

## Rủi ro

| Rủi ro | Đối phó |
|---|---|
| Công thức composite opacity phức tạp (blend mode) | v1 chỉ xử `opacity` cha (nhân alpha); blend mode hiếm → ghi WARN "cần soi tay", không tự PASS. Fixture self-test cover opacity. |
| `get_node` không trả `absoluteBoundingBox` cho mọi node | Section-height dùng node `height`; thiếu → bỏ check height element đó, ghi trong report (không đoán). |
| Parse SVG file để lấy icon fill lỡ nặng | Chỉ parse file nhỏ theo `src`; timeout → FAIL "không verify được icon", buộc dùng inline SVG. |
| nodemap lệch với DOM khi refactor | selector bám `data-fig` (ổn định hơn class); cross-check bbox bắt lệch. |

## Next

Xong → phase-03 làm bàn hiệu chỉnh; per-screen phase chạy property-diff theo addendum `plan.md`.
