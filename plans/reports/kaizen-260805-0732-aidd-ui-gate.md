# Kaizen — aidd-ui-gate

Date: 2026-08-05 · Mode: improve (static analysis, benchmark skipped — checklist doc, no meaningful A/B baseline) · Delivery: in-place edit `SKILL.md` (project-owned skill, not in installer manifest → iron-law checksum concern N/A)

## Findings applied (6/6, all low-risk)

| # | Cat | Sev | Fix |
|---|---|---|---|
| F1 | Instruction ambiguity | Major | Ngưỡng visual-diff định lượng: 1440 FAIL nếu màu≠spec / spacing-size lệch >2px / sai font / sai element; 768-375 FAIL nếu overflow/chồng chữ/vỡ layout. Nêu cách chấm (model-visual + đối chiếu specs CSV + getComputedStyle). |
| F2 | Instruction ambiguity | Major | Resolve screenId có fallback cụ thể: URL parse → route grep page.tsx/phase files → check-progress → hỏi user. Không đoán. |
| F3 | Error recovery | Major | Thêm bảng Error Recovery: server down / route crash / no reference image / no screenId / no mock data → STOP/BLOCKED tương ứng, không tự chấm. |
| F4 | Instruction ambiguity | Minor | Precondition: app render được ở route với mock data + dev server sống. |
| F5 | Gate discipline | Minor | Anti-rationalization crisp: "nghi ngờ = FAIL", không làm tròn, không bỏ tiêu chí khó chấm. |
| F6 | Trigger quality | Minor | description thêm negative scope: not for building UI (momorph-implement-design) / full-project audit (check-progress --design). |

## Verify
- `git status`: chỉ new files dưới `.claude/skills/aidd-ui-gate/` — không sửa file shipped nào.
- No reference staleness: tool names (get_frame_image, get_frame_test_cases, download_specs/test_cases, browser_resize/take_screenshot/console_messages/evaluate) đều verified vs MCP list.
- No structural drift: argument-hint (`--behavior-only` / `--visual-only`) khớp Input.

## Risk
0 critical-risk findings (skill read-only verify, không đụng safety gate/destructive/output contract) → không cần benchmark. Proceed.

## Unresolved
- Chưa test chạy thực tế trên 1 màn — nên nghiệm thu bằng cách chạy `/aidd-ui-gate /board` (hoặc màn đang lỗi) khi dev server + momorph MCP sẵn sàng.
- E2E baseline snapshot còn ở 1280 (countdown-1280.png) — cần đổi sang 1440 khi vào giai đoạn test (ngoài scope skill này).
