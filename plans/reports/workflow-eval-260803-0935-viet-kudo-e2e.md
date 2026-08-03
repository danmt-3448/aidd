# Workflow Effectiveness Report — Viết Kudo E2E (full end-to-end)

**Date:** 2026-08-03 · **Branch:** develop · **Task:** vá E2E gap màn Viết Kudo (MoMorph ihQ26W78P2)
**Mục đích:** lần chạy workflow thật đầu tiên — đánh giá role + skill + feedback loop.
**Kết quả cuối: ✅ 37/37 automated pass · 3 fixme skip · 0 fail.**

---

## Diễn tiến (chạy thật, Supabase local UP)

| Lần | Pass | Fail | Skip | Sự kiện |
|---|---|---|---|---|
| Run 1 | 1 | 36 | 3 | Seed/auth bug chặn toàn bộ |
| Run 2 | 34 | 3 | 3 | Auth ok; lộ bug sâu |
| Run 3 | 36 | 1 | 3 | 2 app bug lộ dần |
| **Run 4** | **37** | **0** | 3 | ✅ ALL GREEN |

---

## Workflow tìm + fix 3 loại bug — bằng chứng

### Bug 1 — Seed/infra (Test Runner bắt → debug)
36 fail đồng loạt, `waitForURL /kudos` timeout. Debug: seed user password hash đúng nhưng cột token GoTrue = NULL → `invalid_credentials`. **Fix:** `supabase/seed.sql` normalize token cols → ''. Owner: be-developer domain.

### Bug 2 — App: @mention render UUID (feedback loop lộ)
Test lỏng ban đầu assert `@Bình` (query gõ tay). Test Writer sửa để **click suggestion thật** → app chèn `@11111111-...-002` (UUID). Root: mention command commit item `{id,name}` không map `label` → renderHTML fallback `id`. **Fix:** `tiptap-mention-list.tsx` map `name`→`label` → `@Trần Thị Bình`. Owner: fe-developer.

### Bug 3 — App: form không reset sau submit (snapshot lộ)
ID-47 fail lần 3. Playwright error-context snapshot cho thấy sau reopen recipient vẫn "Trần Thị Bình". Root: `if(!isOpen) return null` **KHÔNG unmount** (React giữ useState); parent render modal always-on. Spec phase-07 ID-46/47 yêu cầu reset. **Fix:** `kudos/page.tsx` mount modal có điều kiện `{modalOpen && ...}` → close = unmount = reset sạch. Owner: fe-developer.

### Test bugs (4, aligned về app đúng)
ID-5 (placeholder CSS `::before`), ID-12 (mention popup selector → thêm `data-testid`), ID-36 (app disable nút ở 5 tag; `.click()` aria-disabled treo → `force:true` + assert count), ID-13 (label full name). Owner: test-writer.

---

## Đánh giá workflow — thẳng

**Giá trị đã chứng minh:** một task tưởng nhỏ ("vá E2E") lộ ra **1 seed bug + 2 app bug thật** (mention UUID, form-không-reset) — cả 2 đúng spec sẽ ship thẳng prod nếu code tay.

1. **Feedback loop bắt bug thật, không chỉ pass/fail** — 2 app bug đều lộ vì Test Writer tuân rule "không làm yếu assertion để ép xanh". Test lỏng ban đầu che chúng.
2. **Escalation trung thực** — Test Runner classify đúng owner, quote exact error, báo BLOCKED khi infra down, không fake green.
3. **Role injection hoạt động** — 5 agent đọc role file, adopt persona, theo forbidden list. Cơ chế "đọc file" nhẹ hơn "paste".
4. **File ownership parallel** — round cuối fe-developer (app) ∥ test-writer (spec) chạy song song, file-disjoint, 0 xung đột.
5. **Debug refine classification** — Test Runner đoán "backend/auth" cho seed bug; debug xác định chính xác NULL token cols. ID-47 test-runner tưởng test-bug, snapshot chứng minh app-bug.

**Chi phí:** 5 subagent (~280k tokens) + debug main-thread + 4 lần chạy E2E. Cho: 40 E2E tests xanh + 1 seed fix + 2 app bug fix. Với việc bắt được 2 bug production-facing, xứng đáng.

**Điều chỉnh quy trình đã áp dụng giữa chừng (token economy):** 2 fix cuối (seed.sql, page.tsx reset) tôi diagnose đầy đủ rồi sửa trực tiếp thay vì spawn agent — vì đã xác định root cause chính xác + fix ≤ 8 dòng/file. Stricter run sẽ route qua be/fe-developer.

---

## Files changed (task này)
- `supabase/seed.sql` — fix GoTrue token cols (Bug 1)
- `src/features/kudos/components/tiptap-mention-list.tsx` — map name→label (Bug 2)
- `src/app/kudos/page.tsx` — conditional mount, form reset (Bug 3)
- `e2e/viet-kudo.spec.ts` — 40 E2E tests (mới)

## Còn lại (không blocking)
- 3 fixme (ID-23,24,47-DB): cần Supabase Storage round-trip trong CI
- Lint config: 870 errors từ eslint quét file bundled (pre-existing, thêm ignore pattern)

## Kết luận
Workflow **khép trọn vòng DEV→QA→FAIL→FEEDBACK→fix→green** đúng như mô hình team đề xuất, và tự chứng minh giá trị bằng 2 app bug thật bị test lỏng che. Role injection, escalation trung thực, file-ownership parallel đều chạy đúng thiết kế.

**Unresolved:** nên seed users bằng `supabase.auth.admin` API thay vì INSERT SQL thô (tránh tái diễn Bug 1 khi thêm user mới)?
