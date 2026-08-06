# Phase 01 — Band-diff mode cho `pixel-diff.mjs`

**Track:** Tooling · **Priority:** CRITICAL (chặn mọi phase đo đạc) · **Status:** pending · **blockedBy:** —

## Vì sao

[pixel-diff.mjs:138-141](../../.claude/skills/aidd-ui-gate/scripts/pixel-diff.mjs#L138-L141) scale ảnh app về width ref rồi diff phần chồng lấn theo `min(height)`, **neo góc trên-trái**. Trên trang 6000px, một section cao dư 40px ở y=800 đẩy toàn bộ phần dưới lệch → mọi pixel từ đó xuống đều tính mismatch. Một lỗi spacing đẻ ra 20% diff.

Hệ quả đo được: mọi màn vừa 1 viewport PASS (0.39% / 0.44%), mọi trang dài FAIL 14.96–23.33%. [board-run3](../reports/ui-gate/ui-gate-260805-board-run3.md) đã tự kết luận *"FAIL do PHƯƠNG PHÁP ĐO, không phải layout defect cụ thể"*.

Không có band-diff thì sửa UI là mò kim: không biết chỗ nào sai, sửa xong không biết tốt lên hay xấu đi.

## Thiết kế

**Band manifest** — mỗi màn 1 file `plans/reports/_gate-ref/bands/{screen}.bands.json`:
```json
[
  { "name": "kv-banner",  "refY": 0,    "refH": 512,  "appSelector": "[data-band='kv-banner']" },
  { "name": "highlight",  "refY": 512,  "refH": 980,  "appSelector": "[data-band='highlight']" }
]
```
- `refY`/`refH` — **lấy từ MoMorph `get_node`/`get_frame_node_tree`** (absolute Y trong artboard). KHÔNG ước lượng bằng mắt — vi phạm rule "cấm tự chế visual value".
- `appSelector` — bám `data-band` attribute thêm vào section root (thêm attribute là thay đổi duy nhất chạm code sản phẩm ở phase này).
- y-offset thật phía app đọc lúc chạy: `browser_evaluate` → `getBoundingClientRect().top + scrollY` + `offsetHeight`.

**Thuật toán mỗi band:**
1. Scale ảnh app về đúng width ref (giữ nguyên, dùng `resizeToWidth` sẵn có).
2. Crop ref `[refY, refY+refH]`, crop app `[appY, appY+appH]` — **mỗi bên neo theo top của chính nó** → drift tích luỹ từ band trên không tràn xuống.
3. `heightDelta = appH - refH` → **báo cáo riêng, KHÔNG normalize**. Chênh chiều cao là defect thật (section cao/thấp sai tỉ lệ), giấu đi là gian lận.
4. pixelmatch trên phần chồng lấn `min(refH, appH)` với `includeAA:false` như hiện tại.

**Verdict:** PASS khi **mọi band** có `ratio ≤ 1%` **VÀ** `|heightDelta| ≤ 2px` (khớp ngưỡng F1 trong [kaizen report](../reports/kaizen-260805-0732-aidd-ui-gate.md)). Một band fail → màn fail, nhưng report chỉ đúng band đó.

## Files

**Sửa:**
- `.claude/skills/aidd-ui-gate/scripts/pixel-diff.mjs` — thêm `--bands <manifest.json>` + `--app-offsets <json>`; giữ nguyên chế độ toàn-ảnh cho màn 1-viewport (countdown/login đang PASS bằng nó, không được phá).
- `.claude/skills/aidd-ui-gate/SKILL.md` — Step 3a: trang cao > 2000px **bắt buộc** chạy band mode; report ghi bảng per-band.
- `.claude/rules/ui-first-gate.md` — mục "Gate criteria A": bổ sung định nghĩa PASS theo band cho trang dài.

**Tạo:**
- `plans/reports/_gate-ref/bands/` — thư mục manifest.

## Steps

1. Thêm arg parse `--bands`, `--app-offsets`; không có `--bands` → chạy y hệt hôm nay (backward-compatible).
2. Tách hàm `diffRegion(ref, act, refRect, actRect)` dùng lại `cropOrPad` ([:76-81](../../.claude/skills/aidd-ui-gate/scripts/pixel-diff.mjs#L76-L81)).
3. Loop band → in bảng `name | ratio | heightDelta | verdict` + JSON tổng hợp; xuất `{screen}-{vw}-{band}-diff.png` mỗi band fail.
4. Exit code: 0 khi mọi band PASS, 1 khi có band FAIL, 2 lỗi.
5. **Nghiệm thu bằng hồi quy:** chạy lại band-mode trên `/countdown` và `/login` (đang PASS) — số phải vẫn PASS. Nếu band mode làm 2 màn này fail → thuật toán sai, sửa trước khi đi tiếp.

## Success criteria

- [ ] **[R2 — SPIKE trước khi cam kết pattern] Dựng THỬ trọn 1 band manifest cho `/awards` thuần từ MoMorph** (`get_node`/`get_frame_node_tree` ra absolute-Y cho MỌI band) — chứng minh khả thi TRƯỚC khi nhân cho 6 màn. Nếu MoMorph không cho absolute-Y ổn định → dừng, hỏi user cấp ảnh/số, KHÔNG ước lượng và KHÔNG lan pattern.
- [ ] `/countdown` + `/login` vẫn PASS ở cả 2 chế độ (chống hồi quy)
- [ ] Chạy band mode trên `/awards` ra bảng per-band, chỉ đúng section sai
- [ ] Không có band nào cần y-offset đoán bằng mắt — mọi `refY/refH` truy được về node MoMorph
- [ ] `node .claude/skills/aidd-ui-gate/scripts/pixel-diff.mjs --help` mô tả arg mới
- [ ] **[S1] Self-test cho `diffRegion`**: 1 fixture nhỏ (ref/app tự dựng, offset đã biết) verify crop/offset ra ratio đúng — chống lỗi tính offset âm thầm cho verdict sai.
- [ ] **[LAZY] Trước khi chụp: scroll hết trang + chờ mọi `<img>` complete (hoặc force `loading=eager`).** Next/Image lazy-load medallion dưới fold → không làm sẽ chụp trống ⇒ FAIL giả (đã gặp ở `/awards`: 3/6 medallion trống tới khi scroll). Áp cho mọi trang dài trong SKILL.md Step 3a.

## Rủi ro

| Rủi ro | Đối phó |
|---|---|
| Section trong Figma không map 1-1 với DOM node của app | Chọn band ở mức thô (5–8 band/trang), theo ranh giới rõ ràng (banner/feed/sidebar/footer). Không cắt nhỏ hơn mức map được. |
| `get_node` không trả absolute Y | Dùng `get_frame_node_tree` lấy cây + cộng dồn offset cha. Vẫn không ra → **hỏi user**, không ước lượng. |
| Thêm `data-band` làm bẩn markup | Attribute thuần data-*, 0 ảnh hưởng style/a11y. Chấp nhận — đây là chi phí để đo được. |

## Next

Xong → phase-03 (`/awards`) dùng ngay để hiệu chỉnh.
