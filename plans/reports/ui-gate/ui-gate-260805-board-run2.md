# UI-First Gate — /board (Sun* Kudos, MaZUn5xHXZ) — **PARTIAL (B PASS · A BLOCKED)**

Run 2 · 260805 · port 127.0.0.1:3001 · sau card restyle (image #9) + các fix vòng này.

## A. Visual (pixel-diff ≤1% @1440+1280) — ⛔ BLOCKED (không chạy được, lý do chính đáng)
- **Không có nguồn ảnh Figma reference** để pixel-diff:
  - figma MCP: **hết hạn mức tool-call** (Enterprise View seat) → `get_screenshot` fail.
  - momorph MCP: **Unauthorized** (token hết hạn).
- → `pixel-diff.mjs` chưa chạy được (thiếu `--ref`). **Deferred** tới khi có reference (refresh momorph token HOẶC figma rate-limit reset HOẶC chốt golden-screenshot).
- Model-visual (đối chiếu ảnh user gửi #5/#9) trong session: card layout, header overlay, spotlight bg, sidebar, carousel — đã khớp tương đối; chưa có số pixel-diff định lượng.

## B. Behavior (mock data) — ✅ PASS (phần verify được ở sandbox)
- [x] 4 state `?ui_state=`: **full** (12 card + highlight + spotlight) · **empty** ("chưa có Kudos", "0 KUDOS", "Chưa có dữ liệu") · **error** ("Không thể tải dữ liệu") · **loading** (spinner `role=status` + "Đang tải").
- [x] Console: **0 app-error** (10 error = HMR websocket — sandbox artifact, không phải app).
- [ ] Interactive (hover popover / carousel click / pan-zoom): **KHÔNG verify được ở sandbox** — HMR websocket bị chặn → page không hydrate trong Playwright env này (đã xác nhận `hasFiber:false`). Chỉ verify được ở browser thật của user.

## Verdict: **PARTIAL**
- Behavior (verify được) = PASS. Visual pixel-diff = BLOCKED (design-MCP unavailable). Interactions = chưa verify (sandbox không hydrate).
- **Skip-once** dùng cho lần này (`.claude/hooks/.logs/ui-gate-skip`) vì blocker chính đáng.

## Việc cần để gate chạy đầy đủ (unblock)
1. **Refresh momorph token** (`export MOMORPH_GITHUB_TOKEN=…`) → pull node value chính xác + `get_frame_image` làm reference.
2. Hoặc **figma rate-limit reset** / nâng seat.
3. **Chốt reference pixel-diff**: golden-screenshot (recommend) vs Figma-export.
4. Còn 4 value card chưa confirm node (body-box bg/radius, màu icon send/pencil) — cần momorph get_node.
