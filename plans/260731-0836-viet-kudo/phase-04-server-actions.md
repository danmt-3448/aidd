# Phase 04 — Server actions + validation (Track B)

**Track:** B (logic) · **Depends:** 02 (03 để test)

## Context
Backend logic cho Viết Kudo. Reuse `src/lib/supabase/server.ts`. Zod cho validation dùng chung client+server.

## Requirements

### Zod schema (`src/features/kudos/kudo-schema.ts`)
- `receiverId`: uuid, required, khác sender.
- `contentHtml`: required, strip-tags text length ≥ 1, ≤ 2000 ký tự.
- `hashtagIds`: array uuid, min 1, max 5, phải tồn tại trong catalog.
- `imagePaths`: array string, 0–5 (path Storage đã upload ở client). File mime {image/jpeg,image/png} + ≤5MB validate **client-side lúc pick** (phase 06), không phải trong createKudo.
- `kudoId`: uuid v4 (client sinh, dùng cho path ảnh + RPC).
- `isAnonymous`: boolean; `anonymousName`: optional string.

### Server actions (`src/features/kudos/kudo-actions.ts`)
- `searchRecipients(query)`: profiles filter theo `full_name` ILIKE, trim query, **loại bản thân** (`id <> auth.uid()`), limit 10.
- `listHashtags(query?)`: trả catalog `hashtags` (optional filter theo name).
- `createKudo(input)`: <!-- Updated: Validation Session 1 - RPC + client-uuid + sanitize -->
  1. Auth check (session; chưa login → reject/redirect).
  2. Zod validate; fail → trả field errors.
  3. **Sanitize `contentHtml`** server-side (allowlist `sanitize-html`) TRƯỚC khi lưu — chống stored-XSS.
  4. **`kudoId` do client sinh (uuid v4)**; ảnh đã upload sẵn ở `{uid}/{kudoId}/...` (xem phase 06).
  5. Gọi **RPC `create_kudo()`** (1 transaction: kudos + kudo_hashtags + kudo_images) — KHÔNG insert rời rạc.
  6. Trả `{ ok: true, kudoId }` hoặc `{ ok:false, errors }`.

## Packages (thêm khi cần)
- `sanitize-html` (+ types) cho bước sanitize on write.

## Related files
- Create: `kudo-schema.ts`, `kudo-actions.ts` (tách file <200 dòng; nếu to → `recipient-actions.ts`/`hashtag-actions.ts`).

## Success criteria
- Validate đúng theo test cases ID-7..ID-56 (required, max hashtag, file type, empty).
- createKudo ghi đủ 3 bảng + Storage; RLS không chặn sender hợp lệ.
- Không login → createKudo bị từ chối (test ID-1).

## Todo
- [ ] Zod schema + unit-test được
- [ ] `searchRecipients` (trim, loại self, limit)
- [ ] `listHashtags`
- [ ] `createKudo` (sanitize on write + gọi RPC `create_kudo()`)
- [ ] Sanitize-html allowlist cho content_html
- [ ] Auth guard trong action
