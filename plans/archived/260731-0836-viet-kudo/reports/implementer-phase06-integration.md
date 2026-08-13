# Phase 06 Integration — Implementation Report

**Date:** 2026-07-31  
**Status:** DONE  
**Build:** 0 TypeScript errors, 62/62 tests pass

## Files Modified

| File | Change |
|------|--------|
| `src/features/kudos/components/kudo-compose-modal.tsx` | Full rewrite — wires all Track B hooks, kudoId lifecycle, submit/cancel with Storage cleanup |
| `src/features/kudos/components/recipient-select.tsx` | Added `isLoading` + `error` props; removed hardcoded mock options |
| `src/features/kudos/components/hashtag-picker.tsx` | Full rewrite — real catalog dropdown with search, chip add/remove, limit enforcement |
| `src/features/kudos/components/image-uploader.tsx` | Full rewrite — real `<input type=file>`, validate jpg/png ≤5MB, Supabase Storage upload |
| `src/features/kudos/components/submit-bar.tsx` | Added `disabled` prop for validation-gated Gửi button |
| `src/features/kudos/components/index.ts` | Updated barrel: removed `MOCK_IMAGES`/`KudoSubmitPayload`, added Tiptap exports |
| `src/app/globals.css` | Added Tiptap ProseMirror + mention + placeholder CSS |
| `messages/vi.json` | Added `kudos.*` namespace (VN strings) |
| `messages/en.json` | Added `kudos.*` namespace (EN structure, empty values) |

## Files Created

| File | Purpose |
|------|---------|
| `src/features/kudos/components/tiptap-editor.tsx` | Tiptap rich-text editor replacing textarea — bold/italic/strike/orderedList/link/blockquote + @mention via floating portal |
| `src/features/kudos/components/tiptap-mention-list.tsx` | Keyboard-navigable mention suggestion dropdown (ReactRenderer target) |
| `src/app/kudos/page.tsx` | Host route `/kudos` — trigger button, QueryProvider, Sonner Toaster |

## Files Deleted

| File | Reason |
|------|--------|
| `src/app/kudos-preview/page.tsx` | Temp visual validation page — no longer needed |

## Packages Installed

- `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`
- `@tiptap/extension-link`, `@tiptap/extension-placeholder`
- `@tiptap/extension-character-count`, `@tiptap/extension-mention`
- `@tiptap/suggestion`
- `sonner`

## Integration Contracts Resolved

**A→B payload mapping** in `kudo-compose-modal.tsx`:
- `recipient.id` → `receiverId`
- `selectedHashtags[].id` → `hashtagIds`
- `images[].storagePath` → `imagePaths`
- `anonymousAlias` → `anonymousName` (only when `isAnonymous && alias.trim()`)
- `kudoId` — `crypto.randomUUID()` generated once on mount via `useRef`

**Storage path pattern:** `{userId}/{kudoId}/{timestamp}-{random}.{ext}` uploaded to bucket `kudo-images` from browser client before submit.

## Acceptance Criteria

- [x] `/kudos` route exists, auth-guarded by proxy, opens modal
- [x] kudoId generated client-side on modal open, used for Storage paths + createKudo call
- [x] Recipient autocomplete wired to `use-recipient-search` (debounced, excludes self via server action)
- [x] Tiptap replaces textarea — bold/italic/strike/orderedList/link/blockquote + @mention → HTML
- [x] Hashtag picker uses `use-hashtags` catalog; chip add/remove; 1–5 enforced; "Tối đa 5 hashtag" message on 6th attempt
- [x] Image uploader — hidden `<input type=file>`, jpg/png ≤5MB validation, Supabase Storage upload, thumbnails, remove (cleanup orphaned uploads on cancel)
- [x] Anonymous toggle → `isAnonymous` + `anonymousName`
- [x] Gửi disabled until recipient + non-empty content + ≥1 hashtag
- [x] Submit → `useCreateKudo` → loading → success toast "Đã gửi Kudo thành công" + close + reset
- [x] Hủy → close + discard + delete temp Storage uploads
- [x] Field errors → red border/message per `fieldErrors` from server action
- [x] i18n keys added to `vi.json` (VN filled) + `en.json` (EN structure)
- [x] `kudos-preview` page deleted
- [x] All files < 200 lines

## Left for E2E (needs logged-in session)

1. Full submit flow: fill all fields → Gửi → verify row in `kudos` table + `kudo_hashtags` + `kudo_images` + Storage file
2. Validation gates: Gửi disabled without recipient / content / hashtag
3. 6th hashtag blocked with "Tối đa 5 hashtag" message
4. Image upload rejects pdf/mp4/oversized files with correct error
5. Cancel after uploading images: verify Storage files are removed
6. @mention autocomplete appears while typing `@` in editor
7. Anonymous flow: checkbox → alias field appears → submit stores `is_anonymous=true`
