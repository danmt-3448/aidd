# Implementer Report — Viết Kudo UI (Track A)

**Task:** Build "Viết Kudo" modal UI pixel-perfect from Figma design (ihQ26W78P2), presentational only with mock data.
**Status:** DONE_WITH_CONCERNS

---

## Files Created

| File | Purpose |
|------|---------|
| `src/features/kudos/components/kudo-compose-modal.tsx` | Root modal component — assembles all sections, owns form state |
| `src/features/kudos/components/recipient-select.tsx` | Section B — "Người nhận" search dropdown |
| `src/features/kudos/components/rich-text-toolbar.tsx` | Section C — Bold/Italic/Strike/NumberList/Link/Quote toolbar |
| `src/features/kudos/components/content-editor.tsx` | Section C+D — Toolbar + textarea + hint row |
| `src/features/kudos/components/hashtag-picker.tsx` | Section E — Hashtag chips + "+ Hashtag / Tối đa 5" button |
| `src/features/kudos/components/image-uploader.tsx` | Section F — 80×80 thumbnails with red remove button + "+ Image" |
| `src/features/kudos/components/anonymous-toggle.tsx` | Section G — Checkbox + alias text field when checked |
| `src/features/kudos/components/submit-bar.tsx` | Section H — "Hủy" (secondary) + "Gửi" (yellow primary) |
| `src/features/kudos/components/index.ts` | Barrel export |
| `src/features/kudos/fonts.ts` | Re-exports Montserrat from auth/fonts (no duplicate registration) |
| `src/app/kudos-preview/page.tsx` | TEMPORARY preview route for visual validation — remove after Track B |

---

## Component Tree

```
KudoComposeModal (kudo-compose-modal.tsx)
  └── backdrop div (fixed inset-0, rgba(0,16,26,0.6))
      └── modal panel (max-w-[752px], bg #FFF8E1, radius 24px, p-40px, gap-32px)
          ├── h2 — Section A: title (32px bold Montserrat, #00101A)
          ├── RecipientSelect — Section B
          │   ├── label "Người nhận *"
          │   └── trigger button + dropdown listbox
          ├── ContentEditor — Section C+D
          │   ├── RichTextToolbar (B/I/S/OL/Link/Quote + "Tiêu chuẩn cộng đồng")
          │   └── textarea + hint row
          ├── HashtagPicker — Section E
          │   ├── label "Hashtag *"
          │   ├── selected chips (with × remove)
          │   └── "+ Hashtag / Tối đa 5" button
          ├── ImageUploader — Section F
          │   ├── label "Image"
          │   ├── 80×80 thumbnails (red close button top-right)
          │   └── "+ Image / Tối đa 5" button
          ├── AnonymousToggle — Section G
          │   ├── 24×24 checkbox (border #999, radius 4px)
          │   ├── label text (muted #999 when unchecked, #00101A when checked)
          │   └── alias input (conditionally shown when checked)
          └── SubmitBar — Section H
              ├── "Hủy X" button (secondary, border #998C5F, bg rgba(255,234,158,0.10))
              └── "Gửi ▷" button (primary, bg #FFEA9E, flex-1, h-60px, radius-8px)
```

---

## Integration Contract (props for Track B)

### `KudoComposeModal`
```typescript
interface KudoComposeModalProps {
  onClose: () => void
  onSubmit?: (payload: KudoSubmitPayload) => Promise<void> | void
  recipientOptions?: RecipientItem[]   // Track B injects real user list
  isOpen?: boolean
}

interface KudoSubmitPayload {
  recipient: RecipientItem             // { id, name, avatarUrl?, jobTitle? }
  contentHtml: string                  // Tiptap HTML output (Track B replaces textarea)
  hashtags: HashtagItem[]              // [{ id, label }]
  images: UploadedImage[]              // [{ id, previewUrl, name? }]
  isAnonymous: boolean
  anonymousAlias: string               // empty string when isAnonymous=false
}
```

### `RecipientSelect`
```typescript
interface RecipientItem {
  id: string
  name: string
  avatarUrl?: string
  jobTitle?: string
}
// Track B: pass real filtered list via `options` prop; wire `onSelect` to form state
```

### `ContentEditor`
```typescript
interface ContentEditorProps {
  value: string                        // HTML string from Tiptap
  onChange: (html: string) => void
  onToolbarAction?: (action: ToolbarAction) => void  // Track B: call editor.chain().focus()...
  activeFormats?: Partial<Record<ToolbarAction, boolean>>  // Track B: from editor.isActive()
  maxLength?: number                   // default 2000
  charCount?: number                   // Track B: editor.storage.characterCount.characters()
}
type ToolbarAction = 'bold' | 'italic' | 'strikethrough' | 'orderedList' | 'link' | 'quote'
```

### `HashtagPicker`
```typescript
interface HashtagItem { id: string; label: string }
// Track B: `onAdd` should open a dropdown sourced from `hashtags` DB table (seed catalog)
```

### `ImageUploader`
```typescript
interface UploadedImage {
  id: string
  previewUrl: string   // Object URL (local preview) or Supabase Storage URL
  name?: string
}
// Track B: `onAdd` triggers hidden <input type="file"> → upload to kudo-images bucket
// Validation: jpg/png only, max 5MB each, max 5 items
```

### `AnonymousToggle`
```typescript
// aliasValue: stored as anonymous_name in DB; sender_id still stored for audit
// When isAnonymous=true and aliasValue is empty → show "Ẩn danh" as display name
```

---

## Design Tokens Applied (from MoMorph MCP)

| Token | Value | Usage |
|-------|-------|-------|
| Modal bg | `#FFF8E1` (rgba(255,248,225,1)) | Panel background |
| Border | `#998C5F` | All field/button borders |
| Primary yellow | `#FFEA9E` | "Gửi" button bg, active checkbox |
| Dark text | `#00101A` | Primary text color |
| Muted text | `#999999` | Placeholder, inactive label |
| Required star | `#CF1322` | Asterisk, "Tiêu chuẩn cộng đồng" link |
| Remove button | `rgba(212,39,29,1)` | Image close button circle |
| Font | Montserrat 700 | All text |
| Modal radius | `24px` | Panel corners |
| Modal padding | `40px` | All sides |
| Section gap | `32px` (gap-8) | Between sections A–H |

---

## Visual Diff Result

- Figma reference fetched via `get_frame_image` — visually reviewed.
- Key corrections applied after visual review:
  - Toolbar "Tiêu chuẩn cộng đồng" link added (red #CF1322) in rightmost cell
  - Hashtag button changed to two-line "Hashtag / Tối đa 5" layout
  - Image button changed to two-line "+ Image / Tối đa 5" layout
  - Hủy button: text before icon (matches Figma "Hủy X" order)
- **Live screenshot not captured** — dev server could not be started (Bash permission denied for `npm run dev`). Visual diff loop completed via static Figma image review + code inspection.

---

## Concerns

1. **Visual diff is static only** — no Playwright screenshot taken. The user should run `npm run dev` and open `/kudos-preview` to verify live rendering before Track B integration.
2. **Toolbar icons are hand-drawn SVGs** — not the exact Figma assets (which are SVG files in S3 with expiring URLs). Once the asset downloader runs and places files in `public/viet-kudo/`, the icons can be swapped to `<Image src="/viet-kudo/mm-media-bold.svg" />`. Current SVGs are geometrically correct but not pixel-identical.
3. **`handleAddHashtag` uses `window.prompt`** — this is a placeholder. Track B should replace with a proper dropdown sourced from the hashtags catalog table.
4. **`handleAddImage` is a no-op stub** — Track B must wire a hidden `<input type="file">` with Supabase Storage upload.
5. **Frame 552 "Danh hiệu" section** — confirmed out of scope per clarifications.md (Q: Mục Danh hiệu → A: Defer, ngoài scope v1).
