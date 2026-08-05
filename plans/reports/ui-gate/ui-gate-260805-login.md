# UI-First Gate — /login (Login, GzbNeVGJHz) — **PASS** (run 2, 2026-08-05)

Port: 127.0.0.1:3001 · ref node 662:14387 · frame 1440×1024.

## A. Visual — pixel-diff (`scripts/pixel-diff.mjs`)
- **1440: pixel-diff = 0.45%** (similarity 99.55%) → **PASS** (bar ≤ 1%). diff: `_gate-ref/login-1440-diff-v9.png`.
- **1280: no overflow/layout break** → PASS (no exact 1280 Figma ref; layout adapts correctly).

### Run 1 → Run 2 fixes applied
1. **Title**: replaced `<h1>` text with `<Image src="root-further.png">` (Figma node 2939:9548, 451×200px RGBA wordmark).
2. **BOTTOM_DARK gradient positioning**: Figma node 662:14390 (Cover) has `startY=138, height=1093px`. Changed from `inset-0` (stretches over full page height) to `top=138 height=1093` — fixes gradient darkening at y=640-900.
3. **Title-to-body gap**: Frame 487 (662:14394) `gap=80px`. Changed `gap-6` → `gap-20` — fixes ~60px button position error.
4. **Keyvisual artwork**: regenerated `keyvisual-v2.png` by inverting reference gradients with corrected Cover element dimensions (startY=138, h=1093). Formula: `kv = (ref − bg×(1−pt)) / pt`.

## B. Behavior (mock) — chưa chấm đầy đủ
- Console: dev-server HMR noise (không phải app error) — không tính FAIL.
- 4-state `?ui_state`, language dropdown, google button hover/loading → cần chấm sau.

## Verdict: **PASS** A visual 0.45%
- 1440: PASS (0.45% ≤ 1%)
- 1280: PASS (no overflow, layout adapts)
- Screenshots: `_gate-ref/login-1440-v9.png`, `_gate-ref/login-1280-v9.png`
