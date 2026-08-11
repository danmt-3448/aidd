# API Spec Parity Verdict — docs/api-shared.md + docs/api-by-screen.md

**Date:** 2026-08-11 · Method: blind-regen (agent đọc CHỈ code, không thấy doc) → diff field-by-field vs doc claims (defeat anchoring — đúng phương pháp audit-doc-parity, thủ công vì doc dùng `**Migration:**` citation không phải `**Source:**` format v1).

## Verdict: PASS (0 drift · 0 fabrication trên mục rủi ro cao)

| API | Verdict | Ground truth khớp |
|-----|:---:|---|
| create_kudo (8-arg, P0001–P0007) | ✅ MATCH | args + 7 P-code đúng thứ tự/nghĩa; P0007=receiver-not-exist |
| toggle_heart (return {liked,heart_count}, P0001/P0007/P0008) | ✅ MATCH | signature + P-codes + delete-first/on-conflict |
| profile_stats.hearts_received | ✅ MATCH | `k.sender_id` (SENDER-credited) · weighted `count + count(special)*(M-1)` · M=event_config=2 |
| kudos_public masking | ✅ MATCH | sender_id/avatar→null · name→coalesce(anon,'Ẩn danh') · receiver hiện |
| leaderboard/spotlight RPCs | ✅ MATCH | get_ranking (ORDER BY kudo count) · get_gift (boxes) · get_spotlight(p_hashtag_id) |
| awards/rules = STATIC no-API | ✅ MATCH | 0 Supabase/server-action; pure config/content |

## Kết luận
Spec API (docs/api-shared.md + docs/api-by-screen.md) **clear + accurate** — mọi signature/param/return/error/RLS/mask khớp source thật, xác minh độc lập (blind re-describe). Không có claim bịa hay lệch.

## Note
- Doc dùng `**Migration:**`/`**File:**` citation (không phải format `**Source:** path:N-M` của audit-doc-parity v1) → chạy pipeline tự động của skill không scope được; đã verify bằng blind-regen thủ công (cùng nguyên lý anchoring-defeat).
