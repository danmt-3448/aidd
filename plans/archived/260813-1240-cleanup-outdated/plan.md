---
status: completed
archived: true
reconciled: "260820 — cleanup commits landed; old plans archived"
---

# Plan — Cleanup outdated docs / plans / artifacts (NO code, NO i18n churn)

> Date: 2026-08-13 · Branch: develop · Status: DRAFT for review
> Goal: dọn docs/plans/artifact outdated — an toàn, có bằng chứng, không đụng code sản phẩm và không đụng i18n đang refactor.

## Confirmed decisions (2026-08-13)
- **Archive plans cũ** (move → `plans/archived/`) + **fix docs sai** (`?ui_state`) + **purge PNG ephemeral**.
- KHÔNG đụng code `src/**` (audit thấy **0 dead code**) và KHÔNG đụng `messages/**` / file i18n (đang refactor song song — plan `260813-1108`).

## Verified current state (audit)
- **Code `src/`**: gần như 0 dead — `use-kudo-image-cleanup` đang dùng (kudo-compose-modal), deps đều dùng, không tmp/`*-v2`/mock residue trong code.
- **Docs outdated**: 3 file còn nhắc `?ui_state=` (đã xoá): `docs/system-architecture.md` (còn nêu `src/ui-state-override.ts` không tồn tại), `docs/api-shared.md` (mô tả `?ui_state` như route param active), `docs/project-changelog.md` (mục "ui_state fixture infra").
- **Plans**: active/để-nguyên = `260812-1355-spotlight-board`, `260813-1108-i18n`, `260806-0711` (in_progress), `260803-1636` (in_progress), + 2 DRAFT mới `260811-1429`, `260813-1239-seed`, `260813-1240` (này). `plans/board-rework-pass2/` **PARTIALLY TRACKED** (review: `data/media_files.json` + `data/preview.png` đã commit) → **`git rm`, KHÔNG bare `rm`**.
- **Artifacts**: ~100MB PNG (`_gate-ref/*-actual.png|*-diff.png|*-v*.png` + `evidence/screenshots/**`) — **không git-track** (`.gitignore` chặn), regen được. Nodemap `_gate-ref/nodemap/*.map.json` **git-track + gate dùng → GIỮ**. `*.live.*.json` gitignored (bỏ qua).

## Phases

### Phase 01 — Fix docs (khớp thực tế)
- `docs/system-architecture.md`: bỏ/đánh dấu section `?ui_state=` + xoá ref `src/ui-state-override.ts`; thêm 1 dòng "mock `?ui_state` đã removed (verify trên real seeded data)".
- `docs/api-shared.md`: sửa mô tả `?ui_state` → removed.
- `docs/project-changelog.md`: đánh dấu mục "ui_state fixture infra" là removed (không xoá lịch sử, chỉ note).
- Grep `ui_state` toàn repo (trừ plans lịch sử) → 0 ref sống còn lại.
- Acceptance: 0 `?ui_state` claim sống trong `docs/`; route map + tech stack (đã đúng) giữ nguyên.

### Phase 02 — Archive plans done/superseded
- Tạo `plans/archived/`. **`git mv`** các plan **đã tracked** vào đó (giữ history):
  - Completed (confirmed): `260730-1150-login`, `260731-0836-viet-kudo`, `260811-0806-kudo-like-api`.
  - Superseded (confirmed): `260805-1117-board-highlight`, `260805-1353-home-ui-parity`.
- **⚠️ H2 — fix relative-links TRƯỚC khi `git mv`** (re-review bổ sung). Link markdown THẬT (sẽ 404 sau mv) → sửa path sang `../archived/…`:
  - `260806-0711/phase-04-shared-chrome.md:14` → `[board rework plan](../260805-1117-board-highlight-.../plan.md)` **(re-review bắt — trước sót)**
  - `260806-0711/phase-05-homepage.md:9` → `../260805-1353-home-ui-parity-.../plan.md`
  - `260806-0711/phase-07-board.md:9` → `../260805-1117-board-highlight-.../plan.md`
  - `260803-1636/phase-16-tests.md` → path `plans/260811-0806-kudo-like-api-.../reports/…` (archival prose; đổi sang `plans/archived/260811-0806…` cho khỏi lệch)
  - (Prose/không phải link, KHÔNG gãy — chỉ verify: `phase-07-board.md:31`, `phase-10-final-sweep.md:20`, YAML `blocks:` của `260806-0711` = plan-id metadata.)
  → cập nhật trong cùng commit với `git mv`.
- **⛔ KHÔNG archive `260804-1452-ui-parity-fixes`** (H1): `status: pending`, phases 01/02/03/04/12 (Track B: dicebear whitelist, awards data, secret-box counter, countdown i18n, danh_hieu migration) **CÒN active**, không được cover bởi `260806-0711`. Chỉ **sửa frontmatter note** làm rõ phase nào superseded / phase nào còn pending — **không move**.
- **In-place status edit only (M2, KHÔNG `git mv`):** `260804-1120-deploy-fe-be`, `260805-0729-saa2025-required-8` → set `status:` đúng (archived/superseded) + note.
- **Để nguyên (active/draft):** `260812-1355`, `260813-1108`, `260806-0711`, `260803-1636`, `260811-1429`, `260813-1239`, `260813-1240`.
- **Trước khi move**: `git ls-files` + grep plan-id trong `.claude/**` + plan active. (Đã verify `.claude/` không ref các id archive.)
- Acceptance: `plans/` = active/draft + `archived/`; **0 relative-link gãy** trong `260806-0711`; `260804-1452` vẫn ở chỗ cũ có note.

### Phase 03 — Xóa orphan dir + purge PNG ephemeral
- **`plans/board-rework-pass2/` PARTIALLY TRACKED** (C1): dùng **`git rm -r plans/board-rework-pass2/`** (2 file tracked) + commit — KHÔNG bare `rm` (bare rm để tracked-deletion lơ lửng, working tree dirty).
- Purge PNG ephemeral **không git-track**: `plans/reports/_gate-ref/**/*-actual.png|*-diff.png|*-v*.png` + `plans/**/evidence/screenshots/**`. `git ls-files` xác nhận KHÔNG xoá tracked. **GIỮ** `_gate-ref/nodemap/*.map.json`.
- Acceptance: sau purge — tracked deletion của `board-rework-pass2` đã commit, PNG untracked xoá, **0 tracked mất ngoài ý**; nodemaps nguyên; gate chạy được.

### Phase 04 (deferred, optional) — deep dead-code sweep
- SAU khi i18n commit xong (tránh conflict): rà orphan exports/deps sâu hơn. Chưa làm bây giờ.

## Constraints
- **Verify-before-delete**: `git ls-files`/grep ref trước mọi rm/mv. Tracked → `git mv`/commit; untracked → `rm`.
- KHÔNG đụng: `src/**` code, `messages/**`, file i18n (in-flight), `_gate-ref/nodemap/*.map.json`, active plans, hooks/gate scripts.
- Mọi thay đổi vào 1 commit `chore(cleanup): ...` (docs + plan moves) — PNG purge là local (không commit).

## Open questions
- Archive: giữ trong repo (`plans/archived/`) hay xoá hẳn plan cũ khỏi git? (mặc định: giữ, git mv.)
- ~~`260803-1636` + `260806-0711` active?~~ → RESOLVED (review): cả hai **genuinely in_progress** → **để nguyên**.

## Execution (post-approval)
Non-code (docs + file moves) → không cần UI gate. Chạy qua `doc-writer` (docs) + git-manager (mv/commit). Verify `git status` sạch + gate smoke-run.
