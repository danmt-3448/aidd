# Phase 05 — Board hydration (Suspense widget nặng)

**Priority:** P3 · **Risk:** TB · **Status:** pending · **Depends:** Phase 02 (dedupe), Phase 01 (loading)

## Context
`/board` là màn nặng nhất: swiper + react-zoom-pan-pinch + một loạt query hook fire cùng lúc lúc mount (feed, spotlight, leaderboards, highlights, department, hashtag, user-stats). Query đã có `staleTime` hợp lý (lần sau nhanh) — vấn đề là *lần đầu* hydrate: nhiều query song song + component nặng → TBT cao, "behavior chậm".

## Goal
Giảm blocking lúc hydrate: nội dung chính (feed) hiện trước; widget phụ (leaderboards, spotlight, highlights) stream/Suspense sau, không chặn tương tác.

## Requirements
- Bọc `<Suspense>` quanh các widget sidebar/phụ với fallback skeleton → chúng không chặn feed chính.
- KHÔNG đổi query logic/staleTime/queryKey (đã tối ưu). Chỉ đổi thứ tự render/boundary.
- Cân nhắc `useSuspenseQuery` cho widget đã bọc Suspense (nếu phù hợp pattern hiện có) — nhưng KHÔNG bắt buộc; ưu tiên ít thay đổi nhất đạt mục tiêu.
- Giữ mật độ/nội dung board đúng Figma (không giảm data để "nhẹ").

## Related Code Files
- **Read:** `src/features/board/components/board-connected.tsx` + các widget con + `use-*.ts` hooks.
- **Modify:** board layout component — thêm Suspense boundaries + skeleton fallback cho widget phụ.

## Steps
1. Đọc board-connected: map widget nào là core (feed) vs phụ (leaderboards/spotlight/highlights).
2. Bọc Suspense + skeleton cho widget phụ; feed render sớm.
3. Đo TBT before/after (Lighthouse mobile) — chỉ giữ thay đổi nếu TBT giảm thật.
4. `tsc --noEmit`.

## Success Criteria
- Feed board tương tác được sớm hơn (TBT giảm, đo được).
- Không đổi nội dung/mật độ hiển thị; **`/aidd-ui-gate` /board PASS** (property-diff 1440+1280 + behavior real data).
- Không console error.

## Risk & Mitigation
- Suspense boundary sai chỗ → layout nhảy hoặc mất data. → skeleton khớp kích thước; gate + screenshot đủ state.
- Nếu đo TBT không cải thiện → **bỏ phase này** (YAGNI), ghi lý do.

## Out of scope
Không đổi query hooks, không lazy-load swiper (audit trước đã DROP — above-fold LCP).
