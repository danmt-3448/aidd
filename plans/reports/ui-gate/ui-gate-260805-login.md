# UI-First Gate — /login (Login, GzbNeVGJHz) — **PASS (visual) · behavior partial** (run 2)

Port: localhost:3001 (visual ref chụp qua 127.0.0.1) · ref node 662:14387 · frame 1440×1024.

## A. Visual — pixel-diff (`scripts/pixel-diff.mjs`) — **PASS**
- **1440: pixel-diff = 0.44%** (similarity 99.56%) → **PASS** (bar ≤ 1%). diff: `_gate-ref/login-1440-verify-diff.png`. **Đã tự verify độc lập** (không tin report subagent).
- **1280: no overflow / layout adapts** → PASS.

### Fix run1→run2 (FE subagent, đã tự đo lại)
1. Title `<h1>` text → `<Image src="root-further.png">` (wordmark asset, Figma node 2939:9548) — 2 dòng ROOT/FURTHER.
2. BOTTOM_DARK gradient: `inset-0` → `top=138 h=1093` (Cover node 662:14390).
3. Title→body gap: `gap-6` → `gap-20` (Frame 487 gap=80px).
4. keyvisual regenerated khớp Cover dims.

## B. Behavior — **partial (env-constrained)**
- ✅ **Authenticated → redirect `/`**: verified LIVE trên localhost (session có → `/login` redirect `/`). Test case f62b0c97 PASS.
- ✅ Structure đúng (snapshot): logo top-left, VN selector top-right, wordmark img "ROOT FURTHER", "LOGIN With Google" button, footer "Bản quyền thuộc về Sun* © 2025".
- ⚠️ Language dropdown open / Google hover-shadow / loading: **code implement đúng** (đọc source `language-selector.tsx` — toggle `open` + `<ul role=listbox>` VN/EN; `google-login-button.tsx`). KHÔNG exercise được interactive vì: localhost=authenticated→redirect; 127.0.0.1=**client không hydrate** (Next dev cross-origin, fiberDetected=false). Không phải app defect.
- Console: 127.0.0.1 = HMR websocket noise (dev-only, không tính); **localhost = 0 error**.

## ⚠️ PHÁT HIỆN MÔI TRƯỜNG (ảnh hưởng gate MỌI màn)
Truy cập qua **`127.0.0.1:3001` → React KHÔNG hydrate** (fiberDetected=false, HMR ws handshake fail) → không test được interactive/4-state. Qua **`localhost:3001` → hydrate OK, 0 console error**. → **Từ nay gate chạy trên `localhost:3001`.** SSR visual giống nhau cả 2 path nên pixel-diff không đổi.

## Verdict: **PASS** (visual 0.44% + auth behavior verified). Interactive dropdown = code-verified (env không exercise được unauthenticated).
