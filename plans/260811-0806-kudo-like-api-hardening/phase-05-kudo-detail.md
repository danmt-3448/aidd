# Phase 05 — get_kudo_detail RPC + /kudos/[id] (OPTIONAL / adjacent)

**Track:** B·adjacent · **Scope:** ⚠️ OPTIONAL — user cắt/giữ khi duyệt · **blockedBy:** 03

## Why optional
Spec MoMorph có "View Details" → trang Kudo detail (test `8c0d1781`, `31693bb7`), route `/kudos/[id]` **hiện chưa có**. Không thuộc 2 ticket lõi (Viết/Like) nhưng là API liên quan. **Cắt nếu chỉ muốn đúng 2 ticket.**

## Approach
- **New RPC** `get_kudo_detail(p_id uuid)` — read one kudo sender-masked (reuse `kudos_public` masking + hearts count + `liked_by_me` + images + hashtags + receiver). `security definer`, grant authenticated.
- **New route** `src/app/kudos/[id]/page.tsx` + `kudo-detail-connected.tsx` (data only; presentational component — **cần UI-First Gate riêng nếu build UI mới**).

## Files
- **Create:** `supabase/migrations/20260811030000_get_kudo_detail_rpc.sql`
- **Create:** `src/app/kudos/[id]/page.tsx`, `src/features/kudos/kudo-detail-connected.tsx` (+ query hook)

## ⚠️ Gate note
Trang detail là **UI mới** → nếu build, phải qua `/aidd-ui-gate` (cần MoMorph screenId cho detail — hiện chưa rõ artboard). **Nếu detail chưa có design trên MoMorph → chỉ làm RPC, hoãn UI**, hoặc cắt cả phase.

## Todo
- [ ] (nếu giữ) RPC get_kudo_detail sender-masked
- [ ] (nếu giữ + có design) route /kudos/[id] + connected → UI gate
- [ ] Nếu không có design detail → chỉ RPC, đánh dấu UI hoãn

## Success Criteria
- get_kudo_detail trả đúng 1 kudo, mask sender khi ẩn danh, gồm hearts/images/hashtags.
- (nếu build UI) /kudos/[id] PASS UI-First Gate.

## Open question (cho user khi duyệt)
- Giữ hay cắt phase này? Detail page đã có artboard trên MoMorph chưa (để gate)?
