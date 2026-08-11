---
name: aidd-spec-verify
description: "Spec Verification Gate — verify that BUILT CODE actually does what the MoMorph spec says, adversarially (prove + refute each business/behavior rule) with hard evidence. The logic-layer sibling of aidd-ui-gate (which checks visual). Spec = truth; 'code exists' ≠ 'code correct'. Use when user says 'verify logic', 'code có đúng spec không', 'phản biện code', 'API này đúng chưa', 'kiểm business rule', 'behavior đúng spec chưa', or suspects existing backend/logic is wrong. Prefers RUNTIME proof (SQL/behavior) over static reading. Not for: visual (dùng aidd-ui-gate), docs-vs-code (dùng tkm:audit-doc-parity), building code."
argument-hint: "<screen URL | route | screenId> [--runtime] [--static-only] [--focus <area>]"
metadata:
  author: aidd
  version: "1.0.0"
triggers: ["verify logic", "verify spec", "code đúng spec chưa", "phản biện code", "kiểm business rule", "api đúng chưa", "behavior đúng spec", "spec verify", "logic gate", "verify backend"]
---

# Spec Verification Gate

Chốt chặn **correctness tầng logic/backend**: code đã build có **thực sự làm đúng như spec** không? Song song với `aidd-ui-gate` (chấm visual), skill này chấm **business rule + behavior + data** vs **MoMorph spec (chân lý)**.

## Iron Laws (BẤT DI)
1. **Spec = chân lý.** MoMorph `download_specs` (đặc biệt cột `databaseNote`, `validationNote`, `description`) + `download_test_cases` (business-logic rows) là nguồn đúng. Figma annotation nếu có → bổ sung.
2. **"Code có" ≠ "code đúng".** Sự tồn tại của file/RPC KHÔNG chứng minh nó đúng. Prior work đã sai dù code có mặt (race, đếm phẳng bỏ special-day…).
3. **Mọi verdict phải có BẰNG CHỨNG** — `file:line` + (ưu tiên) **runtime proof**. Cấm kết luận "đúng" bằng cảm giác/đọc lướt.
4. **KHÔNG tin comment.** Comment ghi "idempotent"/"atomic" mà code SELECT-rồi-INSERT là SAI — chứng minh bằng đường đi thực, không bằng lời tự nhận.
5. **Adversarial:** mỗi rule chấm 2 chiều — 1 lượt CHỨNG MINH đúng, 1 lượt CỐ PHẢN BIỆN (tìm counterexample/edge/race). Rule chỉ SATISFIED khi **refuter thất bại**. Nghi ngờ → VIOLATED/UNVERIFIED, không PASS câm.
6. **Runtime > static.** Đọc code bỏ sót race/đếm sai; nếu chạy được (SQL trên local Supabase, behavior probe) thì PHẢI chạy để chứng minh.

## Input
- **screen** — MoMorph URL / route (`/board`) / screenId. `fileKey` mặc định từ `CLAUDE.md`.
- `--runtime` (mặc định bật nếu DB reachable) — chạy SQL/behavior thật để chứng minh. `--static-only` — chỉ đọc code (khi không bật được DB).
- `--focus <area>` — giới hạn 1 cụm rule (vd `like`, `create-kudo`, `special-day`).

## Steps

### 1. Lấy spec chân lý
- `mcp__momorph__download_specs(screenId, "csv")` — quét **mọi row**, đặc biệt `databaseNote`/`validationNote`/`description` (rule ẩn hay nằm đây, vd C.4.1 Hearts: "+1 tim, ngày đặc biệt +2, unlike thu hồi đúng").
- `mcp__momorph__download_test_cases(screenId, "csv")` — lấy **business-logic + validation + access-control** rows.
- `mcp__momorph__get_frame(screenId)` — mô tả màn. (Figma annotation nếu MoMorph crop mất → xem `[[ui-gate-cross-ref-figma-direct]]`.)

### 2. Trích RULE SET (mỗi rule = 1 assertion kiểm được)
Ưu tiên rule có tính đúng-sai rõ. Checklist loại rule (đừng sót):
- **Business logic**: tính toán, tăng/giảm, **đơn vị** (count vs weighted sum), quyền.
- **Validation**: required / min / max / type / format / exact error text.
- **State transition** + **idempotency/uniqueness** (toggle, double-submit, retry).
- **Access control**: auth-required, ai được/không được (self-action).
- **Data integrity**: mask (ẩn danh), FK tồn tại, **cascade/delete side-effect**, unlike/rollback thu hồi đúng.
- **Ordering / pagination / cursor** đúng; **empty/loading/error state**.
- **Date/time boundary**: `current_date`/timezone (vd special-day theo ngày — lệch TZ = sai ngày), TTL/expiry.
- **Rule ẩn trong `databaseNote`/`validationNote`** — quét kỹ, đây là nơi hay giấu (vd "+2 tim, thu hồi đúng").
Bỏ rule thuần visual (để `aidd-ui-gate`). Đánh số R1..Rn, ghi nguồn (TC_ID / spec itemId + cột).

### 3. Map rule → implementation
Grep code tìm nơi hiện thực từng rule: server actions (`*-actions.ts`), RPC (`supabase/migrations/**`), queries, hooks, RLS policies, triggers, views. Ghi `file:line`. Không tìm thấy → verdict `UNIMPLEMENTED` (phân biệt với VIOLATED: code VẮNG ≠ code SAI — khác hướng fix).

**Fan-out (nhiều rule / nhiều screen):** ≤ ~6 rule → verify inline main-thread. Nhiều hơn → chia cụm, mỗi cụm 1 subagent `reviewer` (role: prepend toàn bộ `.claude/roles/code-reviewer.md` theo lean CRAFT-X trong `CLAUDE.md`), prompt kèm: rule + `file:line` liên quan + MoMorph refs (screenId + clarifications path) + Work/Reports/Plans path. Subagent trả về **status format `orchestration-protocol.md`** (DONE/BLOCKED…) + bảng verdict/rule. Main-thread gộp, KHÔNG để subagent tự kết luận PASS tổng. `AskUserQuestion`/grill (nếu có) chạy main-thread, không trong subagent.

### 4. Adversarial verify từng rule
Chạy 2 vai (inline nếu ít rule; spawn subagent `reviewer`/`debugger` theo cụm nếu nhiều — theo `orchestration-protocol.md`, dùng Task/Agent, KHÔNG Workflow):
- **VERIFIER:** chứng minh code thoả rule, trích `file:line` + logic.
- **REFUTER (phản biện):** cố phá — tìm input/edge/race/concurrency/off-by-one/đơn vị sai (count vs weighted, sender vs receiver, INSERT thiếu DELETE…) làm code vi phạm rule. **Mặc định nghiêng "vi phạm" nếu chưa loại trừ được.**
- **Runtime proof (ưu tiên, khi `--runtime`):** nếu local Supabase reachable (`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`) hoặc bật được (`supabase start` / `npm run db:reset`) → chạy SQL thật chứng minh: gọi RPC, insert/delete, đọc lại số. Ví dụ mẫu:
  - double-like race → gọi toggle 2 lần liên tiếp, kỳ vọng không lỗi PK.
  - special-day weight → tạo heart `is_special_day=true`, đọc `hearts_received`, kỳ vọng +2 không +1.
  - self-like → insert heart cho kudo mình gửi, kỳ vọng bị chặn.
  - receiver FK → `create_kudo` với receiver không tồn tại, kỳ vọng P-code thân thiện không FK thô.
  Behavior (FE) cần hydrate → prod build (`ui-gate-turbopack-headless-hydration`). Mẫu SQL sẵn: `references/runtime-probes.md`.
- **Verdict/rule (4 loại + confidence):** `SATISFIED` (refuter + runtime không phá được) · `VIOLATED` (tìm được counterexample/gap — kèm bằng chứng) · `UNIMPLEMENTED` (code vắng) · `UNVERIFIED` (không kiểm được — ghi RÕ vì sao). Mỗi verdict gắn **confidence**: `[runtime]` (đã chạy chứng minh) > `[static]` (chỉ đọc code). **Rule runtime-provable (race/concurrency/aggregation/TZ) mà chỉ static → BẮT BUỘC ghi `[static]` + hạ xuống `UNVERIFIED(static)` nếu refuter không loại trừ chắc chắn** — cấm SATISFIED[static] cho lớp lỗi mà static hay bỏ sót.

### 5. Report
Ghi `plans/reports/spec-verify-{date}-{screen}.md`:
```
# Spec Verification — {screen} — {N SATISFIED · M VIOLATED · K UNVERIFIED}
| R# | Rule (spec src) | Code loc | Verdict | Bằng chứng (file:line / runtime) | Fix |
```
- Liệt kê **VIOLATED trước** (đây là "chỗ sai" cần fix). Mỗi VIOLATED → 1 dòng fix cụ thể (file + hướng).
- Ghi rõ cái nào chứng bằng **runtime** vs **static** (runtime mạnh hơn).
- Cuối: mâu thuẫn nội bộ spec (nếu có, vd sender vs receiver) → flag cho user quyết, không tự nuốt.

## Coverage hard-gate (chống PASS câm — BẮT BUỘC trước khi ra verdict)
- Trích được **0 rule đúng-sai-được** → verdict `NO-RULES` (ghi vì sao, vd màn thuần visual), **KHÔNG** PASS.
- Có rule nhưng ≥1 rule `UNIMPLEMENTED`/không map được code → **KHÔNG PASS** (ít nhất CAUTION), liệt kê rule hở.
- Report thiếu cột `Bằng chứng` cho bất kỳ SATISFIED nào → không hợp lệ, phải bổ sung `file:line`/runtime. SATISFIED không bằng chứng = coi như UNVERIFIED.

## Verdict tổng
- **PASS** = mọi rule đúng-sai-được đều SATISFIED (0 VIOLATED, 0 UNIMPLEMENTED) + UNVERIFIED có lý do chính đáng + coverage-gate qua.
- **FAIL** = ≥1 VIOLATED hoặc UNIMPLEMENTED. Không integrate/ship logic đó tới khi fix + re-verify.
- Rule quan trọng chỉ static → verdict tổng tối đa **CAUTION**, khuyến nghị `--runtime` seal.

## Error Recovery
| Tình huống | Xử lý |
|---|---|
| `download_specs`/`download_test_cases` fail / rỗng | BLOCKED — không tự bịa rule. Báo user check MoMorph connectivity / screenId. |
| Không resolve được `screenId` | Hỏi user (như `aidd-ui-gate` Step 1), KHÔNG đoán. |
| `--runtime` nhưng Docker/Supabase không bật được | Fallback `--static-only`, đánh mọi rule runtime-provable = `UNVERIFIED(static)` + ghi rõ "Docker down". KHÔNG fake SQL. |
| Không tìm thấy implementation cho rule | `UNIMPLEMENTED` (không phải SATISFIED câm). |
| Spec mâu thuẫn nội bộ (vd sender vs receiver) | Flag cho user quyết ở cuối report, chọn nhánh có nhiều tín hiệu nhất + ghi rõ giả định. KHÔNG tự nuốt. |
| Runtime SQL sửa dữ liệu thật | Chạy trong transaction rollback hoặc trên DB local seed; KHÔNG chạy destructive trên data thật. |

## Anti-patterns (đã dính trong thực chiến — CẤM lặp)
- Tin comment "idempotent/atomic" thay vì trace đường đi thật.
- Coi "đã build/đã có" là "đúng" → bỏ qua verify.
- Bỏ cột `databaseNote`/`validationNote` (rule ẩn: special-day +2, thu hồi đúng, mask…).
- Đọc static rồi kết luận đúng khi runtime khả thi mà không chạy.
- Nhầm đơn vị: `count(*)` vs weighted sum; sender vs receiver; INSERT-only quên DELETE/unlike.
- PASS câm khi map rỗng / không tìm thấy implementation.

## Liên quan (ranh giới)
- **Visual** đối chiếu: `aidd-ui-gate`. **Docs-vs-code**: `tkm:audit-doc-parity`. **Diagnose bug sâu**: `tkm:debug-code`.
- **`tkm:generate-testcases`** = *soạn* test case từ spec (chưa chạy); skill này = *verify code đã build có thoả spec chưa* (không soạn test). VIOLATED ở đây → feed cho fix, hoặc thành test case sau.
- **`tkm:review-code`** = review diff/PR tổng quát; skill này = correctness vs SPEC cụ thể (mọi verdict truy về 1 rule spec).
- Runtime SQL patterns: `references/runtime-probes.md`. Reviewer role fan-out: `.claude/roles/code-reviewer.md`.
