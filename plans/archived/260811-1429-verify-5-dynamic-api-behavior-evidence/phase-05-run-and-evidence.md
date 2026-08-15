# Phase 05 — Run tests + evidence + gate confirm

**Priority:** High · **Owner:** test-runner · **Depends:** 04 · **Blocks:** 06

## Goal
Chạy toàn bộ unit + E2E trên DB seed thật, thu evidence cụ thể (output + screenshot), fix theo DEV↔QA loop, và confirm UI-gate 5 màn.

## Steps
1. Đảm bảo env: colima+supabase up (phase-01), `npm run db:reset && npm run seed:demo`, dev/prod server chạy.
2. `npm run test` (Vitest) → thu exact output.
3. `npm run test:e2e` theo project: `--project=public|authed|admin` → thu output + Playwright screenshots/trace (`playwright-report/`).
4. **DEV↔QA loop** (primary-workflow Step 2, max 3 vòng): test fail → feedback cụ thể (file+line+error) → DEV (fe/be-developer) fix implementation (KHÔNG sửa test cho pass) → re-run. Vòng 3 vẫn fail → escalate user.
   - Nếu fix làm ĐỔI UI màn nào → chạy `/aidd-ui-gate <route>` màn đó TRƯỚC khi tiếp (UI-First rule).
5. **UI-gate confirm** 5 màn: `/aidd-ui-gate` board/profile/kudos/secret-box/homepage (1440+1280 property-diff + behavior mock). Các màn đã build → kỳ vọng PASS; FAIL → fix + re-gate.
6. Gom evidence vào `plans/.../evidence/`: test output (unit+e2e), screenshots, gate reports. Bảng tổng `evidence/summary.md`: Screen | unit | e2e | gate | verdict.

## Success criteria
- [ ] Unit + E2E **xanh thật** (không skip/force/mock-bypass), output lưu evidence.
- [ ] 5 màn UI-gate PASS (report trong evidence).
- [ ] `evidence/summary.md` đủ 5 màn, mỗi màn có link output + screenshot.

## Risk
E2E flaky (realtime/timing) → retmđịnh, không giấu fail. Session injection authed/admin lỗi → sửa global-setup. Prod build cần cho hydration-sensitive test.
