---
title: Viết Kudo (SAA 2025)
work_type: feature
status: completed
spec_source: momorph:ihQ26W78P2
clarifications: plans/260731-0836-viet-kudo/clarifications.md
blockedBy: []
blocks: []
---

# Plan: Viết Kudo

Modal soạn lời cảm ơn — màn **WRITE** tạo data lõi cho Sun*Kudos. Data-first: build trước để có kudo thật cho các màn read (Live board, Profile) sau này.

- **MoMorph:** https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- **Context:** `CLAUDE.md`, `plans/260731-0836-viet-kudo/clarifications.md`
- **Nguồn sự thật:** Figma (UI) + MoMorph spec 26 items (A–H) + 57 test cases + `clarifications.md`
- **Phụ thuộc:** Login (auth + bảng `profiles`) — đã hoàn thành ở commit `bb3d2f5`, không block.

## Two-track structure

Track A (UI modal) và Track B (data model + logic) **chạy song song** — không block nhau. Integration ở phase 06.

## Phases

| # | Phase | Track | Status | Depends |
|---|-------|-------|--------|---------|
| 01 | [Viết Kudo modal UI](phase-01-viet-kudo-ui.md) | A · UI | todo | — |
| 02 | [Data model + Storage](phase-02-data-model.md) | B · DB | todo | — |
| 03 | [Seed profiles + hashtags](phase-03-seed-data.md) | B · DB | todo | 02 |
| 04 | [Server actions + validation](phase-04-server-actions.md) | B · logic | todo | 02 |
| 05 | [Client hooks (TanStack Query)](phase-05-client-hooks.md) | B · logic | todo | 04 |
| 06 | [Integration](phase-06-integration.md) | A+B | todo | 01, 05 |
| 07 | [Tests (Vitest + Playwright)](phase-07-tests.md) | test | todo | 06 |

## Key dependencies

- Track A (01) độc lập hoàn toàn với Track B (02–05) — parallel-runnable khi `tkm:takumi` chạy.
- Integration (06) chờ UI modal (01) + client hooks (05).
- Tests (07) chạy sau integration, drive bởi 57 MoMorph test cases.
- Reuse từ Login: `src/lib/supabase/*`, i18n next-intl, bảng `profiles`.

## Data model (mới)

- `hashtags` (catalog seed) · `kudos` (sender/receiver/content_html/is_anonymous/anonymous_name)
- `kudo_hashtags` (M-N, 1–5) · `kudo_images` (0–5, Storage path)
- Supabase Storage bucket `kudo-images` + RLS.

## Definition of Done

- UI modal pixel-perfect Figma + responsive (640/768/1024/1280), mount trên `/kudos`.
- Người nhận (autocomplete profiles), rich-text (B/I/S/number/link/quote) + @mention → HTML.
- Hashtag 1–5 từ catalog; image ≤5 (jpg/png, ≤5MB) lên Storage; ẩn danh (alias optional).
- Validate: 3 field bắt buộc (người nhận/nội dung/hashtag); Gửi disabled tới khi đủ.
- Submit → insert `kudos` + quan hệ vào Supabase; toast + reset form.
- Unit (Vitest) + E2E (Playwright) pass theo test cases.

## Out of scope (v1)

- Danh hiệu / award title (Frame 552) — defer.
- Bản dịch EN (chỉ wire i18n keys, điền VN).
- Màn read (Live board, Profile, View Kudo) — plan riêng.

## Validation Log

### Session 1 — 2026-07-31
**Trigger:** `/tkm:create-plan validate` · **Questions asked:** 4

#### Verification Results
- Claims checked: 4 · Verified: 3 · Failed: 1
- GROUNDED: `/kudos` auth-guard (proxy.ts:18) · recipient search on `profiles.full_name` (migration:9) · Storage bật (config.toml:115)
- FAILED: phase 03 seed "profiles đứng một mình" — `profiles.id` FK → `auth.users(id)`, không seed standalone được.

#### Confirmed Decisions
- Seed users: insert `auth.users` + `profiles` trong `seed.sql` (trigger `handle_new_user` tự sinh profiles) — sửa phase 03.
- createKudo atomicity: Postgres RPC `create_kudo()` (1 transaction, insert 3 bảng) — sửa phase 02 + 04.
- Image ordering: client sinh `kudoId` (uuid v4) trước → upload `{uid}/{kudoId}/` → RPC insert cùng id — sửa phase 04 + 06.
- content_html: sanitize khi write (allowlist server-side) + khi render (defense-in-depth) — sửa phase 04, note phase 06.

#### Impact on Phases
- Phase 02: thêm định nghĩa RPC `create_kudo()`.
- Phase 03: seed `auth.users` trước, không insert profiles trần.
- Phase 04: createKudo gọi RPC + client-uuid + sanitize-html on write (thêm package).
- Phase 06: image uploader dùng client-uuid; render sau (board) phải sanitize.

## Outcome (2026-07-31)

**Shipped:** cả 7 phase — modal `/kudos` (8 component), data model 4 bảng + RPC `create_kudo` (atomic) + Storage `kudo-images` + RLS, seed 10 profiles/12 hashtags, server actions + zod + sanitize-html, TanStack hooks, Tiptap (rich-text + @mention) + image upload + toast.

**Verify:** unit **64/64** pass · DB-integration **8/8** pass (RPC ghi thật vào 3 bảng, FK/CHECK, cascade, seed idempotent) · build clean · eslint 0 error.

**Review (adversarial) → APPROVE-WITH-FIXES, đã fix hết:** C1 (regex UUID v4 loại nhầm seed hashtag → nới RFC4122 + regression test) · H1 Storage DELETE policy · H2 link scheme guard · H3 friendly RPC error · M1 userId race · M2 RPC path-prefix guard · L2 bỏ email khỏi search · L3 bỏ nút no-op.

**Gaps còn lại (không giấu):**
- **E2E Playwright chưa chạy** — bỏ dev-login, chỉ còn Google OAuth; cần inject Supabase session (service-role) cho seeded user. Specs đã draft.
- **M3 (PRECONDITION cho read-screen):** `kudos_select_authenticated USING(true)` lộ `sender_id` kể cả kudo ẩn danh → **phải mask trước khi ship Live board/Profile**. Đã note trong `docs/database-schema.md`.
- 3 file hơi > 200 dòng (modal ~260, tiptap ~230, image-uploader ~210) — cân nhắc tách sau.

## Handoff

Thực thi: `/tkm:takumi plans/260731-0836-viet-kudo/plan.md`
