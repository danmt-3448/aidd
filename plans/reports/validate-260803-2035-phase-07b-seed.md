# Validate gate — phase-07b Seed demo data

Date: 2026-08-03 · Branch: develop · Target: `plans/260803-1636-saa2025-remaining-7-screens/phase-07b-seed-demo-data.md`
Gates: `/tkm:predict-risks` (5-voice) + `/tkm:review-code` (plan-artifact validate).

## Predict-risks verdict: CAUTION → GO (sau 3 fix)
Xương sống an toàn đúng (insert-only + demo-UUID namespace + on-conflict-do-nothing; JS service-role đúng vì FK ordering; perf trivial; no auth-bypass). 3 fault line:
1. `seed:demo:clean` + `hearts.kudo_id ON DELETE CASCADE` → xoá demo kudo cascade xoá heart THẬT (High).
2. `badge_key` drift với phase-06 (chưa build) (Med).
3. Demo trỏ vào user thật → phồng aggregate (Med).

## Review-code verdict: APPROVED_WITH_CONDITIONS
Schema references chuẩn (kudos.id no-default, hearts PK(user,kudo), secret_box count check≥0, notifications/event_config). Graph nhất quán (07b không phá blockedBy của phase-15).

| # | Grade | Finding | Fix | Áp? |
|---|-------|---------|-----|-----|
| 1 | CRITICAL | `seed:demo:clean` cascade xoá heart thật (mâu thuẫn invariant của chính phase) | Bỏ hẳn clean; reset demo = `db:reset` | ✅ |
| 2 | WARNING | `badge_key` chung nguồn phase-06 nhưng `blockedBy` thiếu 06 | `blockedBy: [01, 06]` + dùng chung `badgeAsset` allowlist | ✅ |
| 3 | WARNING | Chưa ràng demo↔demo; `kudo_hashtags` thiếu on-conflict target | Scope cứng 10 user + resolve runtime; `on conflict (kudo_id,hashtag_id)` | ✅ |

## Kết quả sau fix
Phase cập nhật: `blockedBy: [01, 06]`, bỏ `seed:demo:clean`, thêm scope demo↔demo + resolve runtime, on-conflict targets rõ, thêm 2 success-criteria (no-delete-path, chỉ 10 seeded user). `plan.md` đồng bộ.

→ **Phase 07b READY để forge** khi user duyệt.

## Re-review (delta: Countdown demo command — thêm sau gate)
User yêu cầu thêm lệnh chỉnh countdown, tách rời. Focused adversarial pass trên delta:
- 🟡 WARNING — "reversible bằng `db:reset`" misleading (reset wipe toàn DB → không phải revert an toàn khi có data thật). FIX: revert = chạy lại với datetime thật; cảnh báo không dùng reset để revert.
- 🟡 NOTE — `event_config` dùng chung → đổi cả Homepage; nav-lock toàn cục. FIX: cảnh báo chỉ chạy DB dev/throwaway, không shared/staging/prod.
- Cả 2 đã sửa trong phase. Lệnh `demo-countdown-soon.mjs` tách hẳn (không vào `seed:demo`/`db:reset`), config-only singleton `id=1`.
→ Delta **APPROVED**.

## Unresolved
- (none) — phase-07b READY để forge; countdown demo là lệnh opt-in tách rời, chạy tay.
