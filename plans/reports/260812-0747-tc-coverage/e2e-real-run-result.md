# E2E Real-Browser Run — AIDD SAA 2025

Date: 2026-08-12 · Branch: develop · Chromium headless · real seeded data (`db:reset`: 30 users, 71 kudos, 4 kudos-with-images) · authed storageState.

## Đã chạy THẬT 2 lần

| Run | Server | Passed | Failed | Skipped | Did-not-run | Ghi chú |
|-----|--------|:---:|:---:|:---:|:---:|---|
| Prod build (`next start`) | prod | 51 | 42 | 4 | 44 | **Sai môi trường**: prod redirect `/kudos`→`/board` (page.tsx) làm ~34 viet-kudo test fail ở `openModal` |
| **Dev server (`next dev`)** | **dev** | **77** | **16** | 4 | 44 | **Đúng môi trường** — số đáng tin |

> `/kudos?modal=compose` mở modal **chỉ ở dev** (`NODE_ENV!=='production'`); prod luôn `redirect('/board')`. Suite viet-kudo thiết kế cho dev.

## 16 fail (dev) — phân loại: KHÔNG có cái nào do session này / do app-regression

| Fail | Loại | Nguyên nhân |
|------|------|-------------|
| viet-kudo ID-15/34/35/36/49/46/47 (7) | Test-helper brittle | `addHashtag` locator `getByRole('option',/TeamWork/)` bắt nhầm `<option>` native ẩn → cascade qua `fillMinimumValidForm` |
| viet-kudo ID-25 (1) | Test drift | selectRecipient trigger name-match |
| profile SELF-04/SELF-05/OTHER-05 (3) | Text drift | dropdown label "Nhận được"/"Đã gửi" locator |
| board TC-BOARD-02 (1) | **Known debt** | KV banner key-visual (đã ghi nhận từ 2026-08-11) |
| board TC-BOARD-07 (1) | Flaky/debt | kudo card content message |
| homepage ID-0 (1) | Serial-cascade | test đầu (`serial`) fail → skip ~40 test còn lại → "did-not-run" |
| countdown CD-E2E-01 (1) | Env/serial | unauth `/countdown`→`/login` redirect assert |
| login sticky header (1) | Flaky CSS | sticky-on-scroll |

## "44 did not run" — giải thích
`homepage.spec.ts` + `countdown.spec.ts` dùng `test.describe.configure({ mode: 'serial' })`. Test đầu block fail → toàn bộ test sau trong block **không chạy** (~40 homepage + vài countdown). KHÔNG phải app treo.

## Image-orphan fix (session này) — e2e xác nhận SẠCH
- ID-37 (upload JPG), ID-39 (PDF error), ID-55 (>5MB), ID-24 (remove image), **ID-45 (Hủy đóng modal + discard)**: **PASS toàn bộ** trên dev.
- Load `/kudos?modal=compose` authed: **0 console error**.
- Unit `use-kudo-image-cleanup.test.ts`: 7/7 pass.

## Kết luận
- **App khỏe**: 77/93-chạy pass. 16 fail = **test-maintenance debt** (stale locator/label, serial-cascade, known KV-banner), KHÔNG phải product regression, KHÔNG do fix session này.
- E2E **đã chạy thật trên browser** — không còn là "file tồn tại".

## Unresolved / cần quyết
1. Sửa test-debt để e2e xanh 100%: (a) `addHashtag` helper (dùng custom `role=listbox` picker, tránh `<option>` native ẩn), (b) profile dropdown label locator, (c) board KV-banner + content, (d) homepage/countdown serial-first-test.
2. Suite viet-kudo phụ thuộc dev server (`/kudos?modal=compose`) — cân nhắc đổi entry sang `/board?modal=compose` để chạy được cả trên prod build.
