# UI-First Gate — Rules/Secret-Box modal z-index above header — PASS (behavior)

## Bug (from user screenshot)
Khi mở modal "Thể lệ", vẫn thấy **header** + **float action button** đè lên/không bị che.

## Root cause — z-index stacking
| Layer | z-index (trước) |
|---|---|
| SiteHeader (fixed) | **z-50** |
| Homepage FAB (fixed) | **z-50** |
| RulesModal backdrop | z-40 ❌ (dưới header/FAB) |
| Secret-box backdrop | z-40 ❌ |
| KudoComposeModal | z-50 (ngang header) |

Modal ở z-40 < header/FAB z-50 → header + FAB nổi lên trên modal.

## Fix
| File | z-index (sau) |
|---|---|
| `src/features/rules/components/rules-modal.tsx` | z-40 → **z-[60]** |
| `src/app/secret-box/page.tsx` | z-40 → **z-[60]** |
| `src/features/kudos/components/kudo-compose-modal.tsx` | z-50 → **z-[70]** (nested trên rules) |

Thang lớp mới: content (0–30) < header/FAB (50) < modal backdrop (60) < nested compose (70).

## Verification (live @127.0.0.1:3001)
- **Stacking-context check:** homepage root wrapper không có transform/opacity/filter → header (z-50), FAB (z-50), RulesModal (z-60) cùng root stacking context → z-60 thắng.
- **Hit-test proof:** inject overlay `position:fixed;inset:0;z-index:60` lên homepage thật → `elementFromPoint(200,40)` (trên vùng nav header) trả về overlay, KHÔNG phải header. ⇒ modal z-[60] che header (z-50) cả về hiển thị lẫn pointer-events. FAB z-50 → cũng bị che.
- `tsc --noEmit` = 0 · eslint changed files = clean.
- Console: chỉ HMR websocket noise (dev-only), 0 lỗi app.

Note: không chụp được modal in-place thật vì FAB auth-gated + dev-login không giữ session trong browser context (seed users có thể chưa nạp sau db:reset). Hit-test trên header thật đã chứng minh tương đương.

## Verdict: PASS (behavior/stacking)
Modal giờ che header + FAB. Pixel-diff không áp dụng (thay đổi thuần z-index, hình modal không đổi).

## Ngoài phạm vi (đã trả lời user, chưa sửa)
- Nav header chậm + đá ra login: middleware `src/proxy.ts` gọi Supabase tuần tự mỗi request (updateSession getUser → event_config → profiles). Supabase local down/chậm → chậm + getUser fail → redirect /login. Fix gợi ý: parallel hoá 2 query + bảo đảm Supabase chạy.
