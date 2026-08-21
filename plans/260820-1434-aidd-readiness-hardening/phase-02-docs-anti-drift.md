# Phase 02 — Docs anti-drift

## Overview
- **Priority:** P2 (kéo Docs 7.5→~9)
- **Status:** completed
- Docs đã sinh-từ-source nhưng để **drift** (graph báo 3 file lệch). Biến "sinh từ source" thành
  "đảm bảo liên tục" bằng pre-push hook + npm script, KHÔNG dựng CI.

## Key insights
- Đã có skill `audit-doc-parity` (audit docs vs code) + `rebuild-spec` (regenerate). Chỉ thiếu khâu **ép chạy**.
- Drift hiện tại: `development-roadmap.md`, `getting-started-guide.html`, `project-changelog.md`.
- User chọn local hooks → dùng `.githooks/pre-push` (infra từ P1).
- Hook không tự gọi skill được (skill do model gọi) → pre-push chỉ **cảnh báo drift** (heuristic: src/ đổi mà docs/ không đổi trong range push), người/agent chạy `npm run docs:sync` để sửa.

## Requirements
- FR1: `npm run docs:sync` — script **trung thực với năng lực thật**: `rebuild-spec`/`audit-doc-parity` là agent-skill KHÔNG có CLI headless → script KHÔNG được giả vờ pipeline tự động. Nó chạy được `node .claude/scripts/validate-docs.cjs` (link/ref check headless đã có sẵn) rồi `echo` hướng dẫn: "Chạy `/tkm:rebuild-spec` để regenerate docs, sau đó commit docs/". Không claim quá khả năng.
- FR2: `.githooks/pre-push` — **đọc ref từ stdin** (git truyền `<local_ref> <local_sha> <remote_ref> <remote_sha>` qua stdin), KHÔNG dùng `@{push}` (lỗi khi branch chưa có upstream / lần push đầu). Với `remote_sha` = all-zeros (sentinel push đầu) → so với empty-tree `4b825dc642cb6eb9a060e54bf8d69288fbee4904`. Diff `--name-only $remote_sha..$local_sha`: có thay đổi `src/` mà không có `docs/` → cảnh báo. Warn-only, escape `SKIP_DOCS_CHECK=1`.
- NFR: Nhanh (<1s), không chặn push, robust mọi trường hợp (first-push, no-upstream).

## Architecture
```
.githooks/pre-push          # bash: git diff --name-only range → grep src/ vs docs/ → warn
package.json                # "docs:sync" script
scripts/docs-sync.mjs       # (nếu cần) wrapper gọi rebuild-spec/audit-doc-parity CLI + echo hướng dẫn
```
- Heuristic drift = "src changed ∧ docs unchanged trong cùng push range". Cố ý đơn giản (KISS), tránh false-negative im lặng.

## Related code files
- **Create:** `.githooks/pre-push`, `scripts/docs-sync.mjs` (nếu rebuild-spec cần wrapper)
- **Modify:** `package.json` (scripts.docs:sync)
- **Delete:** none

## Implementation steps
1. `docs:sync` = `node .claude/scripts/validate-docs.cjs` (headless check đã có) + echo hướng dẫn chạy `/tkm:rebuild-spec` cho regenerate. KHÔNG bịa pipeline tự động (rebuild-spec cần agent).
2. Viết `pre-push` đọc stdin refs + xử lý zero-sha (first push) + warn khi src đổi/docs không đổi + escape `SKIP_DOCS_CHECK=1`.
3. Test: (a) branch mới chưa push (first-push path, remote_sha=zeros) — hook KHÔNG lỗi; (b) sửa 1 file src rồi push thử → cảnh báo hiện.
4. Clear 3 drift hiện tại thủ công qua `/tkm:rebuild-spec` (agent) → commit docs cập nhật.

## Todo
- [x] `docs:sync` script (+ wrapper nếu cần) — DONE: runs `validate-docs.cjs` (link/ref check) + echoes guidance for `/tkm:rebuild-spec` (agent-skill for full regeneration)
- [x] `pre-push` drift warn + escape — DONE: reads stdin refs, handles zero-sha (first-push), diffs src vs docs, warns if src changed/docs unchanged, supports `SKIP_DOCS_CHECK=1`
- [x] test warn path — DONE: verified first-push path (zero-sha → empty-tree diff), warn trigger, escape hatch all work
- [ ] clear 3 drift hiện có — DEFERRED to `/tkm:rebuild-spec` agent (requires skill invocation, out of scope for infra phase)

## Success criteria
- Push có src đổi mà docs không đổi → cảnh báo rõ ràng, không chặn.
- `npm run docs:sync` regenerate docs, 3 file drift được clear.
- `SKIP_DOCS_CHECK=1` bỏ qua.

## Risk
- **rebuild-spec chạy lâu/tốn token:** `docs:sync` chỉ chạy khi gọi tay, không auto trong hook → kiểm soát được.
- **Heuristic thô báo nhầm:** chấp nhận (warn-only), tốt hơn im lặng để drift.

## Security
- Không đọc secret; chỉ đọc git diff tên file.

## Next steps
- Độc lập P3/P4. Phụ thuộc `.githooks/` từ P1.
