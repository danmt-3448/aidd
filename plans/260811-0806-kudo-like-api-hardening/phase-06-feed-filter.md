# Phase 06 — Feed filter: hashtag + phòng ban (OPTIONAL / adjacent)

**Track:** B·adjacent · **Scope:** ⚠️ OPTIONAL — user cắt/giữ khi duyệt · **blockedBy:** 03

## Why optional
Spec MoMorph có filter Hashtag (`0e56cacb`) + Phòng ban (`159fed13`) + click hashtag-chip lọc feed (`d01729d4`). Là board feature, không phải 2 ticket lõi. UI filter dropdown đã có trên board (đã gate) nhưng **wiring server-side filter** có thể chưa đủ. **Cắt nếu ngoài scope.**

## Approach
- Thêm optional params vào feed query: `p_hashtag_id uuid` + `p_department text` → lọc `kudos_public` join `kudo_hashtags` / `profiles.department`. Empty → trả toàn bộ (giữ empty-state message).
- Nếu đã có filter param trong `board-queries.ts` → chỉ verify + fix; nếu chưa → thêm.

## Files
- **Modify/verify:** `src/features/board/board-queries.ts` (feed + highlight query params), filter hooks.
- **(maybe) Create:** migration nếu cần index `kudo_hashtags(hashtag_id)` / `profiles(department)` cho filter performance.

## Steps
1. Grep board-queries cho filter params hiện có (hashtag/department). Xác định thiếu gì.
2. Thêm filter vào query; đảm bảo clear-filter → toàn bộ feed + empty-state đúng.
3. Index nếu filter chậm. `npx tsc --noEmit`.

## Todo
- [ ] Verify filter param hiện trạng
- [ ] Server-side filter hashtag + department
- [ ] Clear filter → full feed + empty-state
- [ ] Index nếu cần

## Success Criteria
- Chọn hashtag/phòng ban → feed lọc đúng; clear → full; empty-state đúng message.

## Open question (cho user khi duyệt)
- Giữ hay cắt? Filter hiện đã wire server-side chưa (cần scan xác nhận trước khi ước công)?
